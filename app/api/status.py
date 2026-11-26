import asyncio
import datetime
from fastapi import APIRouter, Depends
from app.auth import get_current_user_and_session
from app.docker_client import docker_client
from app.rcon_client import rcon_client
from app.watcher import watcher
from app.config import get_minecraft_data_dir
from app.settings_manager import settings_manager
from app.system_metrics import get_system_analytics

router = APIRouter(prefix="/api/status", tags=["status"])


def _check_log_done() -> bool:
    log_file = get_minecraft_data_dir() / "logs" / "latest.log"
    if not log_file.exists():
        return False
    try:
        with open(log_file, "rb") as f:
            size = log_file.stat().st_size
            f.seek(max(0, size - 8192))
            chunk = f.read().decode("utf-8", errors="replace")
            return "Done (" in chunk
    except Exception:
        return False


def _calc_uptime(started_at_str: str) -> int:
    if not started_at_str:
        return 0
    try:
        clean_ts = started_at_str.split(".")[0].rstrip("Z")
        dt = datetime.datetime.fromisoformat(clean_ts).replace(tzinfo=datetime.timezone.utc)
        now = datetime.datetime.now(datetime.timezone.utc)
        return max(0, int((now - dt).total_seconds()))
    except Exception:
        return 0


@router.get("")
async def get_status(session: dict = Depends(get_current_user_and_session)):
    """
    Returns the comprehensive server status card data:
    - Status: Asleep, Starting, Online, Stopping, Error
    - Stats: CPU %, RAM MB, RAM limit
    - Players online with names
    - MSPT and TPS
    - Idle countdown
    """
    mc_info, lazymc_info, analytics = await asyncio.gather(
        docker_client.get_container("mc"),
        docker_client.get_container("lazymc"),
        asyncio.to_thread(get_system_analytics)
    )

    lazymc_state = lazymc_info.get("State", {}) if lazymc_info else {}
    lazymc_running = lazymc_state.get("Running", False)

    env_vars = settings_manager.parse_env()
    sw_type = env_vars.get("TYPE")
    sw_version = env_vars.get("VERSION")
    sw_name = sw_type.capitalize() if sw_type else None

    if not mc_info:
        return {
            "state": "Error",
            "uptime_seconds": 0,
            "lazymc_running": lazymc_running,
            "stats": {"cpu_percent": 0.0, "ram_used_mb": 0.0, "ram_limit_mb": 0.0},
            "players": {"count": 0, "max": int(env_vars.get("MAX_PLAYERS", "8")), "players": []},
            "performance": {"tps": 0.0, "mspt": 0.0},
            "idle": watcher.get_idle_status(),
            "software": sw_name,
            "version": sw_version,
            "host_analytics": analytics
        }

    state = mc_info.get("State", {})
    mc_running = state.get("Running", False)
    exit_code = state.get("ExitCode", 0)
    status_raw = state.get("Status", "").lower()

    computed_state = "Asleep"
    stats = {"cpu_percent": 0.0, "ram_used_mb": 0.0, "ram_limit_mb": 0.0}
    players = {"count": 0, "max": int(env_vars.get("MAX_PLAYERS", "8")), "players": []}
    performance = {"tps": 20.0, "mspt": 0.0}

    if status_raw in ("restarting", "removing", "paused"):
        computed_state = "Stopping"
    elif not lazymc_running:
        computed_state = "Error"
    elif not mc_running:
        computed_state = "Asleep" if exit_code == 0 else "Error"
    else:
        # mc is running: probe container stats + RCON player list concurrently
        stats_res, player_res = await asyncio.gather(
            docker_client.get_container_stats("mc"),
            rcon_client.get_online_players(raise_on_error=True),
            return_exceptions=True
        )
        if isinstance(stats_res, dict):
            stats = stats_res

        if isinstance(player_res, dict):
            computed_state = "Online"
            players = player_res
            try:
                performance = await rcon_client.get_mspt_and_tps()
            except Exception:
                pass
        else:
            done_found = await asyncio.to_thread(_check_log_done)
            computed_state = "Online" if done_found else "Starting"

    uptime_seconds = _calc_uptime(state.get("StartedAt", "")) if mc_running else 0

    return {
        "state": computed_state,
        "exit_code": exit_code,
        "lazymc_running": lazymc_running,
        "uptime_seconds": uptime_seconds,
        "stats": stats,
        "players": players,
        "performance": performance,
        "idle": watcher.get_idle_status(),
        "software": sw_name,
        "version": sw_version,
        "host_analytics": analytics
    }
