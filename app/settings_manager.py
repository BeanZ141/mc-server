import os
import difflib
import datetime
from pathlib import Path
from app.config import MC_ENV_PATH, get_minecraft_data_dir

class SettingsManager:
    def __init__(self, env_path: Path = MC_ENV_PATH):
        self.env_path = env_path

    def read_raw(self) -> str:
        if not self.env_path.exists():
            return ""
        return self.env_path.read_text(encoding="utf-8")

    def parse_env(self) -> dict[str, str]:
        raw = self.read_raw()
        settings = {}
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                settings[key.strip()] = val.strip()
        return settings

    def get_structured_settings(self) -> dict:
        parsed = self.parse_env()
        level_name = parsed.get("LEVEL", "BabaSquadWorld")
        world_dir = get_minecraft_data_dir() / level_name
        world_exists = world_dir.exists() and world_dir.is_dir()

        return {
            "properties": {
                "MAX_PLAYERS": int(parsed.get("MAX_PLAYERS", "8")),
                "MODE": parsed.get("MODE", "survival").lower(),
                "DIFFICULTY": parsed.get("DIFFICULTY", "easy").lower(),
                "ENABLE_WHITELIST": parsed.get("ENABLE_WHITELIST", "false").lower() == "true",
                "ALLOW_FLIGHT": parsed.get("ALLOW_FLIGHT", "false").lower() == "true",
                "SPAWN_PROTECTION": int(parsed.get("SPAWN_PROTECTION", "16")),
            },
            "world": {
                "LEVEL": parsed.get("LEVEL", "BabaSquadWorld"),
                "SEED": parsed.get("SEED", ""),
                "SEED_READ_ONLY": world_exists,
                "DIFFICULTY": parsed.get("DIFFICULTY", "easy"),
                "MODE": parsed.get("MODE", "survival"),
                "PVP": parsed.get("PVP", "true").lower() == "true",
                "HARDCORE": parsed.get("HARDCORE", "false").lower() == "true"
            },
            "players": {
                "MAX_PLAYERS": int(parsed.get("MAX_PLAYERS", "8")),
                "ENABLE_WHITELIST": parsed.get("ENABLE_WHITELIST", "false").lower() == "true",
                "ONLINE_MODE": parsed.get("ONLINE_MODE", "false").lower() == "true"
            },
            "performance": {
                "VIEW_DISTANCE": int(parsed.get("VIEW_DISTANCE", "16")),
                "SIMULATION_DISTANCE": int(parsed.get("SIMULATION_DISTANCE", "6")),
                "MEMORY": parsed.get("MEMORY", "3G")
            },
            "text": {
                "MOTD": parsed.get("MOTD", "palvi")
            },
            "system": {
                "VERSION": parsed.get("VERSION", "26.3"),
                "TYPE": parsed.get("TYPE", "FABRIC"),
                "USE_AIKAR_FLAGS": parsed.get("USE_AIKAR_FLAGS", "true"),
                "MODRINTH_PROJECTS": parsed.get("MODRINTH_PROJECTS", ""),
                "TZ": parsed.get("TZ", "Asia/Kolkata"),
                "UID": parsed.get("UID", "1000"),
                "GID": parsed.get("GID", "1000"),
                "EULA": parsed.get("EULA", "TRUE")
            },
            "world_exists": world_exists,
            "raw": self.read_raw()
        }

    def validate_settings(self, updates: dict[str, str]) -> tuple[bool, str]:
        # Validate MEMORY: max 4G
        mem = updates.get("MEMORY")
        if mem:
            mem_upper = mem.strip().upper()
            if mem_upper not in ("1G", "2G", "3G", "4G", "1024M", "2048M", "3072M", "4096M"):
                return False, f"Memory must be capped at 4G for host hardware stability (got {mem}). Allowed: 1G, 2G, 3G, 4G."

        # Validate distances
        vd = updates.get("VIEW_DISTANCE")
        if vd:
            try:
                v = int(vd)
                if v < 2 or v > 32:
                    return False, "VIEW_DISTANCE must be between 2 and 32."
            except ValueError:
                return False, "VIEW_DISTANCE must be an integer."

        sd = updates.get("SIMULATION_DISTANCE")
        if sd:
            try:
                s = int(sd)
                if s < 2 or s > 32:
                    return False, "SIMULATION_DISTANCE must be between 2 and 32."
            except ValueError:
                return False, "SIMULATION_DISTANCE must be an integer."

        mp = updates.get("MAX_PLAYERS")
        if mp:
            try:
                m = int(mp)
                if m < 1 or m > 100:
                    return False, "MAX_PLAYERS must be between 1 and 100."
            except ValueError:
                return False, "MAX_PLAYERS must be an integer."

        # Validate DIFFICULTY
        diff = updates.get("DIFFICULTY")
        if diff and diff.lower() not in ("peaceful", "easy", "normal", "hard"):
            return False, "DIFFICULTY must be peaceful, easy, normal, or hard."

        # Validate MODE
        mode = updates.get("MODE")
        if mode and mode.lower() not in ("survival", "creative", "adventure", "spectator"):
            return False, "MODE must be survival, creative, adventure, or spectator."

        # Validate SPAWN_PROTECTION
        sp = updates.get("SPAWN_PROTECTION")
        if sp is not None and sp != "":
            try:
                s_int = int(sp)
                if s_int < 0 or s_int > 1000:
                    return False, "SPAWN_PROTECTION must be between 0 and 1000."
            except ValueError:
                return False, "SPAWN_PROTECTION must be an integer."

        return True, ""

    def validate_raw(self, raw_content: str) -> tuple[bool, str]:
        for line in raw_content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                return False, f"Invalid line (must be KEY=VALUE): '{line}'"
            key, val = line.split("=", 1)
            key = key.strip()
            if not key.isidentifier():
                return False, f"Invalid variable name: '{key}'"

        return True, ""

    def generate_diff(self, new_content: str) -> str:
        current_lines = self.read_raw().splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)
        diff = difflib.unified_diff(
            current_lines,
            new_lines,
            fromfile="mc.env (current)",
            tofile="mc.env (proposed)",
            lineterm=""
        )
        return "".join(diff)

    def save_with_backup(self, new_content: str) -> str:
        """Saves new content and writes a timestamped backup copy. Returns backup path."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.env_path.parent / f"mc.env.bak-{timestamp}"

        # 1. Write backup if original exists
        if self.env_path.exists():
            backup_path.write_text(self.read_raw(), encoding="utf-8")

        # 2. Write new content
        self.env_path.write_text(new_content, encoding="utf-8")
        return str(backup_path)

    def update_mod_projects(self, slug: str, action: str) -> str:
        """Adds or removes a slug from MODRINTH_PROJECTS, writes backup, and saves mc.env"""
        parsed = self.parse_env()
        raw_mods = parsed.get("MODRINTH_PROJECTS", "")
        slugs = [s.strip() for s in raw_mods.split(",") if s.strip()]

        if action == "add":
            if slug not in slugs:
                slugs.append(slug)
        elif action == "remove":
            slugs = [s for s in slugs if s != slug]

        new_mods_str = ",".join(slugs)
        parsed["MODRINTH_PROJECTS"] = new_mods_str

        # Rebuild file preserving comments/formatting if possible or clean format
        raw = self.read_raw()
        lines = []
        updated = False
        for line in raw.splitlines():
            if line.strip().startswith("MODRINTH_PROJECTS="):
                lines.append(f"MODRINTH_PROJECTS={new_mods_str}")
                updated = True
            else:
                lines.append(line)
        if not updated:
            lines.append(f"MODRINTH_PROJECTS={new_mods_str}")

        new_content = "\n".join(lines) + "\n"
        self.save_with_backup(new_content)
        return new_mods_str

settings_manager = SettingsManager()
