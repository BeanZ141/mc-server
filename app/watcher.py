import asyncio
import logging
import datetime
from app.config import IDLE_TIMEOUT_SECONDS
from app.docker_client import docker_client
from app.rcon_client import rcon_client
from app.helper_client import helper_client

logger = logging.getLogger("watcher")

class IdleAndScheduleWatcher:
    def __init__(self):
        self.idle_timeout = IDLE_TIMEOUT_SECONDS
        self.idle_seconds = 0
        self.is_running = False
        self._task: asyncio.Task | None = None
        self._last_backup_date: str | None = None

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._loop())
            logger.info("Background idle watcher and backup scheduler started.")

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()

    def get_idle_status(self) -> dict:
        remaining = max(0, self.idle_timeout - self.idle_seconds)
        return {
            "idle_seconds": self.idle_seconds,
            "timeout_seconds": self.idle_timeout,
            "remaining_seconds": remaining
        }

    async def _loop(self):
        while self.is_running:
            try:
                await self._check_idle()
                await self._check_scheduled_backup()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in watcher loop: {e}")

            # Sleep 30 seconds
            await asyncio.sleep(30)

    async def _check_idle(self):
        from app.database import record_server_metric

        # 1. Check if mc is running
        mc_info = await docker_client.get_container("mc")
        if not mc_info:
            self.idle_seconds = 0
            record_server_metric(state="Error", players_count=0)
            return

        state = mc_info.get("State", {})
        status_str = state.get("Status", "").lower()

        if status_str != "running":
            # Server is asleep or exited - do NOT poll RCON
            self.idle_seconds = 0
            record_server_metric(state="Asleep", players_count=0)
            return

        # 2. Server is running - check player count and performance via RCON
        player_count = 0
        perf = {"tps": 20.0, "mspt": 5.0}
        try:
            player_info = await rcon_client.get_online_players()
            player_count = player_info.get("count", 0)
            perf = await rcon_client.get_mspt_and_tps()
        except Exception:
            pass

        try:
            stats = await docker_client.get_container_stats("mc")
            record_server_metric(
                state="Online",
                players_count=player_count,
                cpu_percent=stats.get("cpu_percent", 0.0),
                ram_used_mb=stats.get("ram_used_mb", 0.0),
                ram_limit_mb=stats.get("ram_limit_mb", 0.0),
                tps=perf.get("tps", 20.0),
                mspt=perf.get("mspt", 5.0)
            )
        except Exception:
            pass

        try:
            if player_count == 0:
                self.idle_seconds += 30
                logger.info(f"mc empty: idle for {self.idle_seconds}s / {self.idle_timeout}s")
                if self.idle_seconds >= self.idle_timeout:
                    logger.info("Idle timeout elapsed with 0 players! Stopping mc safely...")
                    try:
                        await rcon_client.save_all_flush()
                    except Exception as e:
                        logger.warning(f"Failed to flush save before idle stop: {e}")

                    # Stop container via proxy
                    stopped = await docker_client.stop_container("mc", timeout=60)
                    if stopped:
                        logger.info("mc container stopped due to idle timeout.")
                    else:
                        logger.error("Failed to stop mc container after idle timeout.")

                    self.idle_seconds = 0
            else:
                # Players are online; reset idle counter
                if self.idle_seconds > 0:
                    logger.info(f"Player activity detected ({player_count} online); resetting idle timer.")
                self.idle_seconds = 0

        except Exception as e:
            logger.debug(f"Could not reach RCON for idle check (server might still be booting): {e}")

    async def _check_scheduled_backup(self):
        # Check daily backup at 04:00 local time
        now = datetime.datetime.now()
        current_date_str = now.strftime("%Y-%m-%d")

        # Run once daily around 04:00 (between 04:00 and 04:02)
        if now.hour == 4 and now.minute < 3:
            if self._last_backup_date != current_date_str:
                logger.info(f"Triggering scheduled daily backup for {current_date_str} at 04:00")
                self._last_backup_date = current_date_str
                try:
                    success, output = await helper_client.execute_and_collect("backup")
                    logger.info(f"Scheduled backup outcome: success={success}, output={output.strip()}")
                except Exception as e:
                    logger.error(f"Failed to run scheduled backup: {e}")

watcher = IdleAndScheduleWatcher()
