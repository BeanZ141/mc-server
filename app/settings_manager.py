import difflib
from pathlib import Path
from app.config import MC_ENV_PATH, get_minecraft_data_dir


class SettingsManager:
    def __init__(self, env_path: Path = MC_ENV_PATH):
        self.env_path = env_path
        self._cache_key: tuple[str, int, int] | None = None
        self._cached_raw: str = ""
        self._cached_parsed: dict[str, str] = {}

    def _refresh_cache(self):
        if not self.env_path.exists():
            self._cache_key = None
            self._cached_raw = ""
            self._cached_parsed = {}
            return

        try:
            st = self.env_path.stat()
            key = (str(self.env_path), st.st_mtime_ns, st.st_size)
            if key == self._cache_key:
                return
            raw = self.env_path.read_text(encoding="utf-8")
        except OSError:
            return

        parsed: dict[str, str] = {}
        for line in raw.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            k, val = stripped.split("=", 1)
            parsed[k.strip()] = val.strip()

        self._cache_key = key
        self._cached_raw = raw
        self._cached_parsed = parsed

    def read_raw(self) -> str:
        self._refresh_cache()
        return self._cached_raw

    def parse_env(self) -> dict[str, str]:
        self._refresh_cache()
        return dict(self._cached_parsed)

    def build_updated_content(self, updates: dict[str, str], remove_keys: list[str] | None = None) -> str:
        """Builds updated mc.env text while preserving existing comments, blank lines, and ordering."""
        raw = self.read_raw()
        remove_set = set(remove_keys or [])
        seen: set[str] = set()
        lines: list[str] = []

        for line in raw.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#") and "=" in stripped:
                key, _ = stripped.split("=", 1)
                key_clean = key.strip()
                if key_clean in remove_set:
                    continue
                if key_clean in updates:
                    lines.append(f"{key_clean}={updates[key_clean]}")
                    seen.add(key_clean)
                    continue
            lines.append(line)

        for key, val in updates.items():
            if key not in seen and key not in remove_set:
                lines.append(f"{key}={val}")

        return "\n".join(lines) + ("\n" if lines else "")

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
                "LEVEL": level_name,
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
        mem = updates.get("MEMORY")
        if mem:
            mem_upper = mem.strip().upper()
            if mem_upper not in ("1G", "2G", "3G", "4G", "1024M", "2048M", "3072M", "4096M"):
                return False, f"Memory must be capped at 4G for host hardware stability (got {mem}). Allowed: 1G, 2G, 3G, 4G."

        for key in ("VIEW_DISTANCE", "SIMULATION_DISTANCE"):
            val = updates.get(key)
            if val:
                try:
                    num = int(val)
                    if num < 2 or num > 32:
                        return False, f"{key} must be between 2 and 32."
                except ValueError:
                    return False, f"{key} must be an integer."

        mp = updates.get("MAX_PLAYERS")
        if mp:
            try:
                m = int(mp)
                if m < 1 or m > 100:
                    return False, "MAX_PLAYERS must be between 1 and 100."
            except ValueError:
                return False, "MAX_PLAYERS must be an integer."

        diff = updates.get("DIFFICULTY")
        if diff and diff.lower() not in ("peaceful", "easy", "normal", "hard"):
            return False, "DIFFICULTY must be peaceful, easy, normal, or hard."

        mode = updates.get("MODE")
        if mode and mode.lower() not in ("survival", "creative", "adventure", "spectator"):
            return False, "MODE must be survival, creative, adventure, or spectator."

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
            key, _ = line.split("=", 1)
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
        """Saves new content via root helper write-env action and invalidates env cache."""
        from app.helper_client import helper_client
        success, out = helper_client.write_env_sync(new_content, target_path=self.env_path)
        if not success:
            raise RuntimeError(f"Failed to write mc.env via helper: {out}")
        self._cache_key = None
        return out.strip()

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
        new_content = self.build_updated_content({"MODRINTH_PROJECTS": new_mods_str})
        self.save_with_backup(new_content)
        return new_mods_str


settings_manager = SettingsManager()
