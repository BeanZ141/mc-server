import os
import time
import asyncio
import logging
import datetime
import httpx
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
        self._last_state: str | None = None
        self._session_cleanup_ticks = 0
        self.cached_workload: dict[str, int] = {"entities": 0, "chunks": 0}
        self._cached_players: tuple[float, dict] | None = None
        self._pending_alert_msg: str | None = None

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

    def get_cached_workload(self) -> dict[str, int]:
        return dict(self.cached_workload)

    def update_player_cache(self, players_data: dict):
        if isinstance(players_data, dict):
            self._cached_players = (time.monotonic(), dict(players_data))

    def get_cached_players(self, max_age: float = 5.0) -> dict | None:
        if self._cached_players and (time.monotonic() - self._cached_players[0]) < max_age:
            return dict(self._cached_players[1])
        return None

    def _persist_tick_state(self, new_state: str, players_count: int = 0,
                            cpu_percent: float = 0.0, ram_used_mb: float = 0.0,
                            ram_limit_mb: float = 0.0, tps: float = 20.0, mspt: float = 0.0):
        from app.database import log_audit, record_server_metric
        if self._last_state is not None and self._last_state != new_state:
            details = f"Server state transitioned from {self._last_state} to {new_state}"
            log_audit(
                user="system",
                action="state_transition",
                target="mc",
                details=details,
                result="SUCCESS" if new_state != "Error" else "FAILURE",
                ip_address="127.0.0.1"
            )
            if new_state == "Error":
                self._pending_alert_msg = details
        self._last_state = new_state
        record_server_metric(
            state=new_state,
            players_count=players_count,
            cpu_percent=cpu_percent,
            ram_used_mb=ram_used_mb,
            ram_limit_mb=ram_limit_mb,
            tps=tps,
            mspt=mspt
        )

    async def _flush_pending_alert(self):
        msg = self._pending_alert_msg
        if not msg:
            return
        self._pending_alert_msg = None
        try:
            from app.database import get_panel_setting
            url = await asyncio.to_thread(get_panel_setting, "alert_webhook_url", "")
            if not url or not url.startswith(("https://", "http://")):
                return
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(url, json={"content": f"[PalviMC Alert] {msg}", "text": f"[PalviMC Alert] {msg}"})
        except Exception as e:
            logger.warning(f"Failed to send outage webhook alert: {e}")

    async def _loop(self):
        from app.database import cleanup_expired_sessions
        while self.is_running:
            try:
                await self._check_idle()
                await self._flush_pending_alert()
                await self._check_scheduled_backup()
                self._session_cleanup_ticks += 1
                if self._session_cleanup_ticks >= 120:
                    self._session_cleanup_ticks = 0
                    await asyncio.to_thread(cleanup_expired_sessions)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in watcher loop: {e}")

            await asyncio.sleep(30)

    async def _check_idle(self):
        mc_info = await docker_client.get_container("mc")
        if not mc_info:
            self.idle_seconds = 0
            self.cached_workload = {"entities": 0, "chunks": 0}
            await asyncio.to_thread(self._persist_tick_state, "Error")
            return

        state = mc_info.get("State", {})
        status_str = state.get("Status", "").lower()

        if status_str != "running":
            self.idle_seconds = 0
            self.cached_workload = {"entities": 0, "chunks": 0}
            await asyncio.to_thread(self._persist_tick_state, "Asleep")
            return

        cached_players = self.get_cached_players(max_age=5.0)
        if cached_players is not None:
            player_info_res = cached_players
            perf_res, stats_res, workload_res = await asyncio.gather(
                rcon_client.get_mspt_and_tps(),
                docker_client.get_container_stats("mc"),
                rcon_client.get_world_workload(),
                return_exceptions=True
            )
        else:
            player_info_res, perf_res, stats_res, workload_res = await asyncio.gather(
                rcon_client.get_online_players(),
                rcon_client.get_mspt_and_tps(),
                docker_client.get_container_stats("mc"),
                rcon_client.get_world_workload(),
                return_exceptions=True
            )
            if isinstance(player_info_res, dict):
                self.update_player_cache(player_info_res)

        player_count = player_info_res.get("count", 0) if isinstance(player_info_res, dict) else 0
        perf = perf_res if isinstance(perf_res, dict) else {"tps": 20.0, "mspt": 5.0}
        stats = stats_res if isinstance(stats_res, dict) else {}
        if isinstance(workload_res, dict):
            self.cached_workload = workload_res

        await asyncio.to_thread(
            self._persist_tick_state,
            "Online",
            player_count,
            stats.get("cpu_percent", 0.0),
            stats.get("ram_used_mb", 0.0),
            stats.get("ram_limit_mb", 0.0),
            perf.get("tps", 20.0),
            perf.get("mspt", 5.0)
        )

        enable_idle_watcher = os.environ.get("ENABLE_IDLE_WATCHER", "false").lower() in ("true", "1", "yes")

        try:
            if player_count == 0:
                self.idle_seconds += 30
                if enable_idle_watcher:
                    logger.info(f"mc empty: idle for {self.idle_seconds}s / {self.idle_timeout}s")
                    if self.idle_seconds >= self.idle_timeout:
                        logger.info("Idle timeout elapsed with 0 players! Stopping mc safely (ENABLE_IDLE_WATCHER=true)...")
                        try:
                            await rcon_client.save_all_flush()
                        except Exception as e:
                            logger.warning(f"Failed to flush save before idle stop: {e}")

                        stopped = await docker_client.stop_container("mc", timeout=60)
                        if stopped:
                            logger.info("mc container stopped due to idle timeout.")
                        else:
                            logger.error("Failed to stop mc container after idle timeout.")

                        self.idle_seconds = 0
                elif self.idle_seconds >= self.idle_timeout:
                    self.idle_seconds = self.idle_timeout
            else:
                if self.idle_seconds > 0:
                    logger.debug(f"Player activity detected ({player_count} online); resetting idle timer.")
                self.idle_seconds = 0
        except Exception as e:
            logger.debug(f"Could not reach RCON for idle check (server might still be booting): {e}")

    async def _check_scheduled_backup(self):
        now = datetime.datetime.now()
        current_date_str = now.strftime("%Y-%m-%d")

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
