import os
import httpx
import logging
from pathlib import Path
from app.config import MINECRAFT_DATA_DIR

logger = logging.getLogger("modrinth")

MODRINTH_API_BASE = "https://api.modrinth.com/v2"

class ModrinthClient:
    def __init__(self, base_url: str = MODRINTH_API_BASE):
        self.base_url = base_url

    async def search_mods(self, query: str = "", limit: int = 20, offset: int = 0, sort: str = "downloads", category: str | None = None) -> dict:
        import json
        facet_list = [["categories:fabric"], ["versions:26.3"], ["project_type:mod"]]
        if category and category.lower() != "all":
            facet_list.append([f"categories:{category.lower()}"])
        facets = json.dumps(facet_list)
        params = {
            "query": query,
            "limit": limit,
            "offset": offset,
            "facets": facets,
            "index": sort
        }

        headers = {
            "User-Agent": "palvi-org/mcadmin/1.0 (admin@palvi.org)"
        }

        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
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
        headers = {"User-Agent": "palvi-org/mcadmin/1.0 (admin@palvi.org)"}
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            try:
                resp = await client.get(f"{self.base_url}/project/{slug_or_id}")
                if resp.status_code == 200:
                    return resp.json()
                return None
            except Exception as e:
                logger.error(f"Error getting project {slug_or_id}: {e}")
                return None

    async def check_compatibility(self, slug_or_id: str, game_version: str = "26.3", loader: str = "fabric") -> dict:
        """
        Queries project versions to verify whether a compatible build exists.
        Returns {
            'compatible': bool,
            'reason': str,
            'client_required': bool,
            'server_supported': bool,
            'title': str,
            'version_number': str | None
        }
        """
        headers = {"User-Agent": "palvi-org/mcadmin/1.0 (admin@palvi.org)"}
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            try:
                # 1. Get project metadata for client/server side requirements
                proj_resp = await client.get(f"{self.base_url}/project/{slug_or_id}")
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
                client_side = proj_data.get("client_side", "unknown")
                server_side = proj_data.get("server_side", "unknown")
                client_required = (client_side == "required")
                server_supported = (server_side in ("required", "optional"))

                # 2. Get version list
                vers_resp = await client.get(
                    f"{self.base_url}/project/{slug_or_id}/version",
                    params={"loaders": f'["{loader}"]', "game_versions": f'["{game_version}"]'}
                )

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

                latest_v = versions[0]
                version_number = latest_v.get("version_number", "")

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
        """
        Parses MODRINTH_PROJECTS and cross-checks with /server-data/mods.
        Returns managed mods and manual jar files.
        """
        managed_slugs = [s.strip() for s in modrinth_projects_str.split(",") if s.strip()]
        mods_dir = MINECRAFT_DATA_DIR / "mods"
        
        jar_files = []
        if mods_dir.exists() and mods_dir.is_dir():
            for f in mods_dir.iterdir():
                if f.is_file() and f.name.endswith(".jar"):
                    jar_files.append({
                        "filename": f.name,
                        "size_bytes": f.stat().st_size,
                        "modified_at": f.stat().st_mtime
                    })

        # Match managed slugs to files (heuristic matching by slug substring)
        managed = []
        matched_jars = set()

        for slug in managed_slugs:
            # Look for a jar whose name contains slug
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
