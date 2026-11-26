import asyncio
import logging
import httpx
from app.config import DOCKER_HOST, MEDIA_CONTAINERS

logger = logging.getLogger("docker_client")


class DockerClient:
    def __init__(self, base_url: str = DOCKER_HOST):
        self.base_url = base_url.rstrip("/")
        self._clients: dict[int, httpx.AsyncClient] = {}

    def _get_client(self) -> httpx.AsyncClient:
        loop_id = id(asyncio.get_running_loop())
        client = self._clients.get(loop_id)
        if client is None or client.is_closed:
            client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=10.0,
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
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

    async def get_container(self, name: str) -> dict | None:
        client = self._get_client()
        try:
            resp = await client.get(f"/containers/{name}/json", timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                return None
            else:
                logger.warning(f"Failed to inspect container {name}: HTTP {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error querying docker proxy for {name}: {e}")
            return None

    async def get_container_stats(self, name: str) -> dict:
        """Returns CPU % and Memory usage in MB"""
        client = self._get_client()
        try:
            resp = await client.get(f"/containers/{name}/stats", params={"stream": "false"}, timeout=5.0)
            if resp.status_code != 200:
                return {"cpu_percent": 0.0, "ram_used_mb": 0.0, "ram_limit_mb": 0.0}

            data = resp.json()

            cpu_percent = 0.0
            cpu_stats = data.get("cpu_stats", {})
            precpu_stats = data.get("precpu_stats", {})

            cpu_delta = cpu_stats.get("cpu_usage", {}).get("total_usage", 0) - precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
            system_delta = cpu_stats.get("system_cpu_usage", 0) - precpu_stats.get("system_cpu_usage", 0)
            online_cpus = cpu_stats.get("online_cpus", len(cpu_stats.get("cpu_usage", {}).get("percpu_usage", []) or [1]))

            if system_delta > 0 and cpu_delta > 0:
                cpu_percent = round((cpu_delta / system_delta) * online_cpus * 100.0, 1)

            memory_stats = data.get("memory_stats", {})
            usage = memory_stats.get("usage", 0)
            stats = memory_stats.get("stats", {})
            cache = stats.get("inactive_file", stats.get("cache", 0))
            used_bytes = max(0, usage - cache)
            limit_bytes = memory_stats.get("limit", 0)

            return {
                "cpu_percent": cpu_percent,
                "ram_used_mb": round(used_bytes / (1024 * 1024), 1),
                "ram_limit_mb": round(limit_bytes / (1024 * 1024), 1)
            }
        except Exception as e:
            logger.debug(f"Could not retrieve stats for {name}: {e}")
            return {"cpu_percent": 0.0, "ram_used_mb": 0.0, "ram_limit_mb": 0.0}

    async def start_container(self, name: str) -> bool:
        client = self._get_client()
        try:
            resp = await client.post(f"/containers/{name}/start", timeout=10.0)
            if resp.status_code in (204, 304):
                return True
            logger.error(f"Failed to start container {name}: HTTP {resp.status_code} - {resp.text}")
            return False
        except Exception as e:
            logger.error(f"Connection error starting {name}: {e}")
            return False

    async def stop_container(self, name: str, timeout: int = 60) -> bool:
        client = self._get_client()
        try:
            resp = await client.post(f"/containers/{name}/stop", params={"t": timeout}, timeout=float(timeout + 10))
            if resp.status_code in (204, 304):
                return True
            logger.error(f"Failed to stop container {name}: HTTP {resp.status_code} - {resp.text}")
            return False
        except Exception as e:
            logger.error(f"Connection error stopping {name}: {e}")
            return False

    async def restart_container(self, name: str, timeout: int = 60) -> bool:
        client = self._get_client()
        try:
            resp = await client.post(f"/containers/{name}/restart", params={"t": timeout}, timeout=float(timeout + 10))
            if resp.status_code in (204, 304):
                return True
            logger.error(f"Failed to restart container {name}: HTTP {resp.status_code} - {resp.text}")
            return False
        except Exception as e:
            logger.error(f"Connection error restarting {name}: {e}")
            return False

    async def get_all_containers_summary(self) -> dict[str, str]:
        """Returns a dict of container_name -> status (e.g. 'Up' or 'Exited')"""
        client = self._get_client()
        try:
            resp = await client.get("/containers/json", params={"all": "1"}, timeout=5.0)
            if resp.status_code != 200:
                return {}
            containers = resp.json()
            result = {}
            for c in containers:
                names = [n.lstrip("/") for n in c.get("Names", [])]
                state = c.get("State", "").lower()
                status_str = "Up" if state == "running" else "Exited"
                for n in names:
                    result[n] = status_str
            return result
        except Exception as e:
            logger.error(f"Error fetching containers summary: {e}")
            return {}

    async def get_media_status(self) -> dict[str, str]:
        all_c = await self.get_all_containers_summary()
        return {mc_name: all_c.get(mc_name, "Exited") for mc_name in MEDIA_CONTAINERS}


docker_client = DockerClient()
