import os
from pathlib import Path

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))
MINECRAFT_DATA_DIR = Path(os.environ.get("MINECRAFT_DATA_DIR", BASE_DIR / "mock_minecraft"))
STACKS_DIR = Path(os.environ.get("STACKS_DIR", BASE_DIR / "stacks"))
MC_ENV_PATH = Path(os.environ.get("MC_ENV_PATH", BASE_DIR / "mc.env"))
MC_WATCH_STATE_PATH = Path(os.environ.get("MC_WATCH_STATE_PATH", BASE_DIR / "mock_mc_watch" / "state.json"))
HELPER_SOCKET_PATH = Path(os.environ.get("HELPER_SOCKET_PATH", "/run/mc-admin-helper/helper.sock"))
BACKUP_DIR = Path(os.environ.get("BACKUP_DIR", BASE_DIR / "backups"))

# RCON & Docker configuration
DOCKER_HOST = os.environ.get("DOCKER_HOST", "http://docker-socket-proxy:2375")
RCON_HOST = os.environ.get("RCON_HOST", "mc")
RCON_PORT = int(os.environ.get("RCON_PORT", "25575"))
RCON_CLI_ENV_FILE = MINECRAFT_DATA_DIR / ".rcon-cli.env"

# General settings
PORT = int(os.environ.get("PORT", "3555"))
IDLE_TIMEOUT_SECONDS = int(os.environ.get("IDLE_TIMEOUT_SECONDS", "300"))
SESSION_COOKIE_NAME = "mcadmin_session"
CSRF_HEADER_NAME = "X-CSRF-Token"
TIMEZONE = os.environ.get("TZ", "Asia/Kolkata")

# Media containers monitored
MEDIA_CONTAINERS = [
    "jellyseerr",
    "jellyfin",
    "sonarr",
    "radarr",
    "bazarr",
    "prowlarr",
    "flaresolverr",
    "qbittorrent"
]
