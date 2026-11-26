import json
import asyncio
import logging
import httpx
from pathlib import Path
from app.config import get_minecraft_data_dir

logger = logging.getLogger("modrinth")

MODRINTH_API_BASE = "https://api.modrinth.com/v2"


class ModrinthClient:
    def __init__(self, base_url: str = MODRINTH_API_BASE):
        self.base_url = base_url
        self._clients: dict[int, httpx.AsyncClient] = {}

    def _get_client(self) -> httpx.AsyncClient:
        loop_id = id(asyncio.get_running_loop())
        client = self._clients.get(loop_id)
        if client is None or client.is_closed:
            client = httpx.AsyncClient(
                timeout=10.0,
                headers={"User-Agent": "palvi-org/mcadmin/1.0 (admin@palvi.org)"},
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
            self._clients[loop_id] = client
        return client

    async def close(self):
        for client in list(self._clients.values()):
            if not client.is_closed:
                try:
                    await client.aclose()
                except Exception:
                    pass
        self._clients.clear()

    async def search_mods(
        self,
        query: str = "",
        limit: int = 20,
        offset: int = 0,
        sort: str = "downloads",
        category: str | None = None,
        environment: str | None = None,
        game_version: str = "26.3",
        loader: str = "fabric"
    ) -> dict:
        facet_list = [[f"categories:{loader.lower()}"], [f"versions:{game_version}"], ["project_type:mod"]]
        if category and category.lower() != "all":
            facet_list.append([f"categories:{category.lower()}"])
        if environment and environment.lower() != "all":
            env_val = environment.lower()
            if env_val == "client":
                facet_list.append(["client_side:required", "client_side:optional"])
            elif env_val == "server":
                facet_list.append(["server_side:required", "server_side:optional"])

        params = {
            "query": query,
            "limit": limit,
            "offset": offset,
            "facets": json.dumps(facet_list),
            "index": sort
        }

        client = self._get_client()
        try:
            resp = await client.get(f"{self.base_url}/search", params=params)
            if resp.status_code != 200:
                logger.error(f"Modrinth search failed: {resp.status_code}")
                return {"hits": [], "total_hits": 0}
            return resp.json()
        except Exception as e:
            logger.error(f"Modrinth search request error: {e}")
            return {"hits": [], "total_hits": 0}

    async def get_project(self, slug_or_id: str) -> dict | None:
        """Fetches full project details including client/server side requirements"""
        client = self._get_client()
        try:
            resp = await client.get(f"{self.base_url}/project/{slug_or_id}")
            if resp.status_code == 200:
                return resp.json()
            return None
        except Exception as e:
            logger.error(f"Error getting project {slug_or_id}: {e}")
            return None

    async def check_compatibility(self, slug_or_id: str, game_version: str = "26.3", loader: str = "fabric") -> dict:
        """Queries project versions in parallel to verify whether a compatible build exists."""
        client = self._get_client()
        try:
            proj_task = client.get(f"{self.base_url}/project/{slug_or_id}")
            vers_task = client.get(
                f"{self.base_url}/project/{slug_or_id}/version",
                params={"loaders": f'["{loader.lower()}"]', "game_versions": f'["{game_version}"]'}
            )
            proj_resp, vers_resp = await asyncio.gather(proj_task, vers_task)

            if proj_resp.status_code != 200:
                return {
                    "compatible": False,
                    "reason": f"Project '{slug_or_id}' not found on Modrinth",
                    "client_required": False,
                    "server_supported": False,
                    "title": slug_or_id,
                    "version_number": None
                }

            proj_data = proj_resp.json()
            title = proj_data.get("title", slug_or_id)
            client_required = (proj_data.get("client_side", "unknown") == "required")
            server_supported = (proj_data.get("server_side", "unknown") in ("required", "optional"))

            if vers_resp.status_code != 200:
                return {
                    "compatible": False,
                    "reason": f"Failed to retrieve version information for {slug_or_id}",
                    "client_required": client_required,
                    "server_supported": server_supported,
                    "title": title,
                    "version_number": None
                }

            versions = vers_resp.json()
            if not versions:
                return {
                    "compatible": False,
                    "reason": f"No build available for Minecraft {game_version} with loader {loader}",
                    "client_required": client_required,
                    "server_supported": server_supported,
                    "title": title,
                    "version_number": None
                }

            version_number = versions[0].get("version_number", "")
            return {
                "compatible": True,
                "reason": "Compatible build found",
                "client_required": client_required,
                "server_supported": server_supported,
                "title": title,
                "version_number": version_number
            }

        except Exception as e:
            logger.error(f"Error checking compatibility for {slug_or_id}: {e}")
            return {
                "compatible": False,
                "reason": f"Network error checking compatibility: {str(e)}",
                "client_required": False,
                "server_supported": False,
                "title": slug_or_id,
                "version_number": None
            }

    def scan_installed_mods(self, modrinth_projects_str: str) -> dict:
        """Parses MODRINTH_PROJECTS and cross-checks with /server-data/mods."""
        managed_slugs = [s.strip() for s in modrinth_projects_str.split(",") if s.strip()]
        mods_dir = get_minecraft_data_dir() / "mods"

        jar_files = []
        if mods_dir.exists() and mods_dir.is_dir():
            for f in mods_dir.iterdir():
                if f.is_file() and f.name.endswith(".jar"):
                    try:
                        st = f.stat()
                        jar_files.append({
                            "filename": f.name,
                            "size_bytes": st.st_size,
                            "modified_at": st.st_mtime
                        })
                    except OSError:
                        continue

        managed = []
        matched_jars = set()

        for slug in managed_slugs:
            slug_clean = slug.lower().replace("-", "").replace("_", "")
            found_jar = None
            for j in jar_files:
                name_clean = j["filename"].lower().replace("-", "").replace("_", "")
                if slug_clean in name_clean:
                    found_jar = j["filename"]
                    matched_jars.add(j["filename"])
                    break

            managed.append({
                "slug": slug,
                "installed_jar": found_jar,
                "status": "Installed" if found_jar else "Pending Download"
            })

        manual_jars = [j for j in jar_files if j["filename"] not in matched_jars]

        return {
            "managed": managed,
            "manual": manual_jars
        }


modrinth_client = ModrinthClient()
