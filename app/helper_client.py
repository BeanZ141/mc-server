import os
import asyncio
import logging
from typing import AsyncGenerator
from app.config import HELPER_SOCKET_PATH

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

helper_client = HelperClient()
