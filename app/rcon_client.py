import re
import struct
import asyncio
import logging
from pathlib import Path
from app.config import RCON_HOST, RCON_PORT, RCON_CLI_ENV_FILE

logger = logging.getLogger("rcon_client")

# Packet Types
SERVERDATA_AUTH = 3
SERVERDATA_EXECCOMMAND = 2
SERVERDATA_AUTH_RESPONSE = 2
SERVERDATA_RESPONSE_VALUE = 0

class RCONClient:
    def __init__(self, host: str = RCON_HOST, port: int = RCON_PORT):
        self.host = host
        self.port = port
        self._cached_password: str | None = None

    def get_password(self) -> str:
        if self._cached_password:
            return self._cached_password

        # Read from .rcon-cli.env
        if RCON_CLI_ENV_FILE.exists():
            try:
                content = RCON_CLI_ENV_FILE.read_text(encoding="utf-8")
                for line in content.splitlines():
                    line = line.strip()
                    if line.startswith("RCON_PASSWORD="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        self._cached_password = val
                        return val
            except Exception as e:
                logger.error(f"Failed to read RCON password from {RCON_CLI_ENV_FILE}: {e}")

        # Fallback to empty string
        return ""

    async def execute(self, command: str, timeout: float = 5.0) -> str:
        """Connects, authenticates, executes command, and returns cleaned output."""
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
            # 1. Authenticate
            auth_packet = self._encode_packet(1, SERVERDATA_AUTH, password)
            writer.write(auth_packet)
            await writer.drain()

            resp_id, resp_type, _ = await asyncio.wait_for(self._read_packet(reader), timeout=timeout)
            if resp_id == -1:
                raise PermissionError("RCON authentication failed (invalid password)")

            # In some Minecraft servers, an empty response comes before the actual auth confirmation
            if resp_type != SERVERDATA_AUTH_RESPONSE and resp_id != 1:
                resp_id, resp_type, _ = await asyncio.wait_for(self._read_packet(reader), timeout=timeout)
                if resp_id == -1:
                    raise PermissionError("RCON authentication failed")

            # 2. Execute command
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
        # Packet length = 4 (req_id) + 4 (type) + len(payload) + 2 (null pad)
        length = 10 + len(encoded_payload)
        return struct.pack("<iii", length, request_id, packet_type) + encoded_payload + b"\x00\x00"

    async def _read_packet(self, reader: asyncio.StreamReader) -> tuple[int, int, str]:
        header = await reader.readexactly(12)
        length, request_id, packet_type = struct.unpack("<iii", header)
        payload_length = length - 8  # minus req_id and packet_type
        if payload_length < 2:
            return request_id, packet_type, ""

        body = await reader.readexactly(payload_length)
        payload = body[:-2].decode("utf-8", errors="replace")
        return request_id, packet_type, payload

    @staticmethod
    def strip_minecraft_formatting(text: str) -> str:
        """Strips § formatting codes and ANSI escape codes"""
        # Strip Minecraft section symbol codes (§0 - §f, §k - §r)
        clean = re.sub(r"§[0-9a-fk-orA-FK-OR]", "", text)
        # Strip ANSI codes
        clean = re.sub(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])", "", clean)
        return clean.strip()

    async def get_online_players(self) -> dict:
        """Returns {'count': int, 'max': int, 'players': list[str]}"""
        try:
            output = await self.execute("list")
            # Example outputs:
            # "There are 0 of a max of 8 players online: "
            # "There are 2 of a max of 8 players online: Steve, Alex"
            match = re.search(r"There are (\d+) of a max of (\d+) players online:(.*)", output, re.IGNORECASE)
            if match:
                count = int(match.group(1))
                max_players = int(match.group(2))
                players_raw = match.group(3).strip()
                players = [p.strip() for p in players_raw.split(",") if p.strip()] if players_raw else []
                return {"count": count, "max": max_players, "players": players}
            return {"count": 0, "max": 0, "players": []}
        except Exception:
            return {"count": 0, "max": 0, "players": []}

    async def get_mspt_and_tps(self) -> dict:
        """Tries spark tps or vanilla tps or returns estimate"""
        try:
            # Try spark tps
            output = await self.execute("spark tps")
            # Sample: TPS from last 5s, 10s, 1m, 5m, 15m: 20.0, 20.0, 20.0, 20.0, 20.0
            # Tick durations (min/med/95%ile/max ms): 4.1/6.2/8.9/12.1 ms
            tps_match = re.search(r"TPS from last.*?:\s*([\d\.]+)", output)
            mspt_match = re.search(r"Tick durations.*?:\s*[\d\.]+/([\d\.]+)", output)
            
            tps = float(tps_match.group(1)) if tps_match else 20.0
            mspt = float(mspt_match.group(1)) if mspt_match else 5.0
            return {"tps": tps, "mspt": mspt, "source": "spark"}
        except Exception:
            pass

        return {"tps": 20.0, "mspt": 0.0, "source": "default"}

    async def save_all_flush(self) -> str:
        return await self.execute("save-all flush")

rcon_client = RCONClient()
