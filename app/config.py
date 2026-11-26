import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def get_data_dir() -> Path:
    return Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))


def get_minecraft_data_dir() -> Path:
    return Path(os.environ.get("MINECRAFT_DATA_DIR", BASE_DIR / "mock_minecraft"))


def get_mc_env_path() -> Path:
    return Path(os.environ.get("MC_ENV_PATH", BASE_DIR / "mc.env"))


def get_mc_watch_state_path() -> Path:
    return Path(os.environ.get("MC_WATCH_STATE_PATH", BASE_DIR / "mock_mc_watch" / "state.json"))


def get_backup_dir() -> Path:
    return Path(os.environ.get("BACKUP_DIR", BASE_DIR / "backups"))


def get_rcon_cli_env_file() -> Path:
    return get_minecraft_data_dir() / ".rcon-cli.env"


DATA_DIR = get_data_dir()
MINECRAFT_DATA_DIR = get_minecraft_data_dir()
STACKS_DIR = Path(os.environ.get("STACKS_DIR", BASE_DIR / "stacks"))
MC_ENV_PATH = get_mc_env_path()
MC_WATCH_STATE_PATH = get_mc_watch_state_path()
HELPER_SOCKET_PATH = Path(os.environ.get("HELPER_SOCKET_PATH", "/run/mc-admin-helper/helper.sock"))
BACKUP_DIR = get_backup_dir()

# RCON & Docker configuration
DOCKER_HOST = os.environ.get("DOCKER_HOST", "http://docker-socket-proxy:2375")
RCON_HOST = os.environ.get("RCON_HOST", "mc")
RCON_PORT = int(os.environ.get("RCON_PORT", "25575"))
RCON_CLI_ENV_FILE = get_rcon_cli_env_file()

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
