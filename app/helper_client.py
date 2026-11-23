import os
import asyncio
import logging
import base64
import socket
import datetime
from pathlib import Path
from typing import AsyncGenerator
from app.config import HELPER_SOCKET_PATH, MC_ENV_PATH

logger = logging.getLogger("helper_client")

class HelperClient:
    def __init__(self, socket_path: str = str(HELPER_SOCKET_PATH)):
        self.socket_path = socket_path

    async def run_action(self, action: str, arg: str | None = None) -> AsyncGenerator[str, None]:
        """Sends an action to the root helper via Unix socket and streams output lines."""
        cmd = f"{action} {arg}".strip() if arg else action
        
        # Check if unix socket exists
        if not os.path.exists(self.socket_path):
            logger.warning(f"Helper socket {self.socket_path} not found. Running in mock/fallback mode.")
            yield f"[MOCK] Helper socket {self.socket_path} not present.\n"
            yield f"[MOCK] Executed simulated action: {cmd}\n"
            yield f"SUCCESS: simulated {action}\n"
            return

        try:
            reader, writer = await asyncio.open_unix_connection(self.socket_path)
        except Exception as e:
            logger.error(f"Failed to connect to helper socket: {e}")
            yield f"[ERROR] Failed to connect to helper socket: {e}\n"
            return

        try:
            writer.write(f"{cmd}\n".encode("utf-8"))
            await writer.drain()

            while True:
                line = await reader.readline()
                if not line:
                    break
                decoded = line.decode("utf-8", errors="replace")
                yield decoded

        except Exception as e:
            logger.error(f"Error during helper execution: {e}")
            yield f"[ERROR] Execution failed: {e}\n"
        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass

    async def execute_and_collect(self, action: str, arg: str | None = None) -> tuple[bool, str]:
        """Convenience method to run helper and return (success, full_output)"""
        output_lines = []
        success = False
        async for line in self.run_action(action, arg):
            output_lines.append(line)
            if "SUCCESS:" in line:
                success = True

        full_output = "".join(output_lines)
        return success, full_output

    async def write_env(self, content: str) -> tuple[bool, str]:
        """Encodes content to base64 and writes mc.env via helper write-env action."""
        encoded = base64.b64encode(content.encode("utf-8")).decode("ascii")
        return await self.execute_and_collect("write-env", encoded)

    def write_env_sync(self, content: str, target_path: Path | None = None) -> tuple[bool, str]:
        """Synchronously encodes content to base64 and sends write-env via helper Unix socket."""
        encoded = base64.b64encode(content.encode("utf-8")).decode("ascii")
        cmd = f"write-env {encoded}\n"

        target = Path(target_path) if target_path else MC_ENV_PATH

        if not os.path.exists(self.socket_path) or not hasattr(socket, "AF_UNIX"):
            logger.warning(f"Helper socket {self.socket_path} not found or AF_UNIX unavailable. Running in fallback mode.")
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = target.parent / f"{target.name}.bak-{timestamp}"
            try:
                if target.exists():
                    backup_path.write_text(target.read_text(encoding="utf-8"), encoding="utf-8")
                target.write_text(content, encoding="utf-8")
            except Exception as e:
                logger.error(f"Fallback write failed: {e}")
                return False, str(e)
            return True, str(backup_path)

        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
                s.settimeout(10.0)
                s.connect(self.socket_path)
                s.sendall(cmd.encode("utf-8"))
                s.shutdown(socket.SHUT_WR)
                output = ""
                while True:
                    chunk = s.recv(4096)
                    if not chunk:
                        break
                    output += chunk.decode("utf-8", errors="replace")
                success = "SUCCESS:" in output
                return success, output
        except Exception as e:
            logger.error(f"Failed to call helper write-env: {e}")
            return False, str(e)

helper_client = HelperClient()
