from fastapi import APIRouter, Depends
from pathlib import Path
from app.auth import get_current_user_and_session
from app.docker_client import docker_client
from app.rcon_client import rcon_client
from app.watcher import watcher
from app.config import MINECRAFT_DATA_DIR
from app.settings_manager import settings_manager
from app.system_metrics import get_system_analytics

router = APIRouter(prefix="/api/status", tags=["status"])

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
    mc_info = await docker_client.get_container("mc")
    lazymc_info = await docker_client.get_container("lazymc")

    lazymc_state = lazymc_info.get("State", {}) if lazymc_info else {}
    lazymc_running = lazymc_state.get("Running", False)

    if not mc_info:
        return {
            "state": "Error",
            "uptime_seconds": 0,
            "stats": {"cpu_percent": 0.0, "ram_used_mb": 0.0, "ram_limit_mb": 0.0},
            "players": {"count": 0, "max": 0, "players": []},
            "performance": {"tps": 0.0, "mspt": 0.0},
            "idle": watcher.get_idle_status()
        }

    state = mc_info.get("State", {})
    mc_running = state.get("Running", False)
    exit_code = state.get("ExitCode", 0)
    status_raw = state.get("Status", "").lower()

    # Determine status
    computed_state = "Asleep"

    if status_raw in ("restarting", "removing", "paused"):
        computed_state = "Stopping"
    elif not lazymc_running:
        computed_state = "Error"
    elif not mc_running:
        if exit_code == 0:
            computed_state = "Asleep"
        else:
            computed_state = "Error"
    else:
        # mc is running - test if Online or Starting
        rcon_responsive = False
        try:
            player_data = await rcon_client.get_online_players()
            # If we received players or didn't throw connection error
            rcon_responsive = True
        except Exception:
            rcon_responsive = False

        if rcon_responsive:
            computed_state = "Online"
        else:
            # Check latest.log for "Done ("
            log_file = MINECRAFT_DATA_DIR / "logs" / "latest.log"
            done_found = False
            if log_file.exists():
                try:
                    # Read last 4KB to look for Done line
                    with open(log_file, "rb") as f:
                        f.seek(max(0, log_file.stat().st_size - 8192))
                        chunk = f.read().decode("utf-8", errors="replace")
                        if "Done (" in chunk:
                            done_found = True
                except Exception:
                    pass

            if done_found:
                computed_state = "Online"
            else:
                computed_state = "Starting"

    # Metrics
    stats = await docker_client.get_container_stats("mc") if mc_running else {
        "cpu_percent": 0.0, "ram_used_mb": 0.0, "ram_limit_mb": 0.0
    }

    players = {"count": 0, "max": 8, "players": []}
    performance = {"tps": 20.0, "mspt": 0.0}

    if computed_state == "Online":
        try:
            players = await rcon_client.get_online_players()
            performance = await rcon_client.get_mspt_and_tps()
        except Exception:
            pass

    # Uptime
    uptime_seconds = 0
    if mc_running:
        started_at_str = state.get("StartedAt", "")
        # Docker started_at format: 2026-11-21T11:00:00.123456789Z
        try:
            import datetime
            clean_ts = started_at_str[:19]
            dt = datetime.datetime.fromisoformat(clean_ts)
            uptime_seconds = int((datetime.datetime.utcnow() - dt).total_seconds())
        except Exception:
            uptime_seconds = 0

    env_vars = settings_manager.parse_env()
    sw_type = env_vars.get("TYPE")
    sw_version = env_vars.get("VERSION")
    sw_name = sw_type.capitalize() if sw_type else None
    analytics = get_system_analytics()

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
