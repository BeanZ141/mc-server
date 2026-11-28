import re
import time
import struct
import asyncio
import logging
from app.config import RCON_HOST, RCON_PORT, get_rcon_cli_env_file

logger = logging.getLogger("rcon_client")

SERVERDATA_AUTH = 3
SERVERDATA_EXECCOMMAND = 2
SERVERDATA_AUTH_RESPONSE = 2
SERVERDATA_RESPONSE_VALUE = 0


class RCONClient:
    def __init__(self, host: str = RCON_HOST, port: int = RCON_PORT):
        self.host = host
        self.port = port
        self._cached_password: str | None = None
        self._cached_env_mtime: int | None = None
        self._tps_cache: tuple[float, str, int, dict] | None = None
        self._workload_cache: tuple[float, str, int, dict] | None = None

    def get_password(self) -> str:
        env_file = get_rcon_cli_env_file()
        if env_file.exists():
            try:
                mtime = env_file.stat().st_mtime_ns
                if self._cached_password is not None and self._cached_env_mtime == mtime:
                    return self._cached_password

                content = env_file.read_text(encoding="utf-8")
                for line in content.splitlines():
                    line = line.strip()
                    if line.startswith("RCON_PASSWORD="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        self._cached_password = val
                        self._cached_env_mtime = mtime
                        return val
            except Exception as e:
                logger.error(f"Failed to read RCON password from {env_file}: {e}")

        return self._cached_password or ""

    async def execute(self, command: str, timeout: float = 5.0) -> str:
        """Connects, authenticates, executes command, and returns cleaned output."""
        if not isinstance(command, str) or any(ch in command for ch in ("\r", "\n", "\x00")):
            raise ValueError("Invalid control characters in RCON command.")

        password = self.get_password()
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=timeout
            )
        except Exception as e:
            logger.debug(f"RCON connection refused to {self.host}:{self.port}: {e}")
            raise ConnectionError(f"Cannot connect to Minecraft RCON ({self.host}:{self.port})")

        try:
            auth_packet = self._encode_packet(1, SERVERDATA_AUTH, password)
            writer.write(auth_packet)
            await writer.drain()

            resp_id, resp_type, _ = await asyncio.wait_for(self._read_packet(reader), timeout=timeout)
            if resp_id == -1:
                raise PermissionError("RCON authentication failed (invalid password)")

            if resp_type != SERVERDATA_AUTH_RESPONSE and resp_id != 1:
                resp_id, resp_type, _ = await asyncio.wait_for(self._read_packet(reader), timeout=timeout)
                if resp_id == -1:
                    raise PermissionError("RCON authentication failed")

            cmd_packet = self._encode_packet(2, SERVERDATA_EXECCOMMAND, command)
            writer.write(cmd_packet)
            await writer.drain()

            _, _, response_payload = await asyncio.wait_for(self._read_packet(reader), timeout=timeout)
            return self.strip_minecraft_formatting(response_payload)

        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass

    def _encode_packet(self, request_id: int, packet_type: int, payload: str) -> bytes:
        encoded_payload = payload.encode("utf-8")
        length = 10 + len(encoded_payload)
        return struct.pack("<iii", length, request_id, packet_type) + encoded_payload + b"\x00\x00"

    async def _read_packet(self, reader: asyncio.StreamReader) -> tuple[int, int, str]:
        header = await reader.readexactly(12)
        length, request_id, packet_type = struct.unpack("<iii", header)
        payload_length = length - 8
        if payload_length < 2:
            return request_id, packet_type, ""

        body = await reader.readexactly(payload_length)
        payload = body[:-2].decode("utf-8", errors="replace")
        return request_id, packet_type, payload

    @staticmethod
    def strip_minecraft_formatting(text: str) -> str:
        """Strips section-sign formatting codes and ANSI escape codes."""
        clean = re.sub(r"§[0-9a-fk-orA-FK-OR]", "", text)
        clean = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", clean)
        return clean.strip()

    async def get_online_players(self, raise_on_error: bool = False) -> dict:
        """Returns {'count': int, 'max': int, 'players': list[str]}"""
        try:
            output = await self.execute("list")
            match = re.search(r"There are (\d+) of a max of (\d+) players online:(.*)", output, re.IGNORECASE)
            if match:
                count = int(match.group(1))
                max_players = int(match.group(2))
                players_raw = match.group(3).strip()
                players = [p.strip() for p in players_raw.split(",") if p.strip()] if players_raw else []
                return {"count": count, "max": max_players, "players": players}
            return {"count": 0, "max": 0, "players": []}
        except Exception:
            if raise_on_error:
                raise
            return {"count": 0, "max": 0, "players": []}

    async def get_mspt_and_tps(self) -> dict:
        """Tries spark tps (cached 10s across status & watcher) or returns default estimate"""
        now = time.monotonic()
        if self._tps_cache and self._tps_cache[1] == self.host and self._tps_cache[2] == self.port and (now - self._tps_cache[0]) < 10.0:
            return dict(self._tps_cache[3])

        try:
            output = await self.execute("spark tps")
            tps_match = re.search(r"TPS from last.*?:\s*([\d\.]+)", output)
            mspt_match = re.search(r"Tick durations.*?:\s*[\d\.]+/([\d\.]+)", output)

            tps = float(tps_match.group(1)) if tps_match else 20.0
            mspt = float(mspt_match.group(1)) if mspt_match else 5.0
            res = {"tps": tps, "mspt": mspt, "source": "spark"}
            self._tps_cache = (now, self.host, self.port, dict(res))
            return res
        except Exception:
            pass

        return {"tps": 20.0, "mspt": 0.0, "source": "default"}

    async def get_world_workload(self) -> dict:
        """Fetches active entity count and loaded chunks via RCON, cached 30s."""
        now = time.monotonic()
        if self._workload_cache and self._workload_cache[1] == self.host and self._workload_cache[2] == self.port and (now - self._workload_cache[0]) < 30.0:
            return dict(self._workload_cache[3])

        entities = 0
        chunks = 0
        try:
            ent_out = await self.execute("execute if entity @e")
            ent_match = re.search(r"(?:count:\s*|found\s+)(\d+)", ent_out, re.IGNORECASE)
            if ent_match:
                entities = int(ent_match.group(1))
        except Exception:
            pass

        try:
            spark_out = await self.execute("spark health")
            chunk_match = re.search(r"chunks?\s*(?:loaded)?[:\s]+([\d,]+)", spark_out, re.IGNORECASE)
            if chunk_match:
                chunks = int(chunk_match.group(1).replace(",", ""))
        except Exception:
            pass

        res = {"entities": entities, "chunks": chunks}
        self._workload_cache = (now, self.host, self.port, dict(res))
        return res

    async def save_all_flush(self) -> str:
        return await self.execute("save-all flush")


rcon_client = RCONClient()
