import os
import unittest
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db
from app.config import SESSION_COOKIE_NAME, CSRF_HEADER_NAME

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["DATA_DIR"] = self.temp_dir.name
        os.environ["MINECRAFT_DATA_DIR"] = self.temp_dir.name
        
        # Write dummy mc.env
        self.mc_env_path = Path(self.temp_dir.name) / "mc.env"
        self.mc_env_path.write_text(
            "VERSION=26.3\n"
            "TYPE=FABRIC\n"
            "MEMORY=3G\n"
            "VIEW_DISTANCE=16\n"
            "SIMULATION_DISTANCE=6\n"
            "MAX_PLAYERS=8\n"
            "MODE=survival\n"
            "DIFFICULTY=easy\n"
            "ENABLE_WHITELIST=false\n"
            "ALLOW_FLIGHT=false\n"
            "SPAWN_PROTECTION=16\n"
            "ONLINE_MODE=false\n"
            "LEVEL=BabaSquadWorld\n"
            "SEED=1807738846518060059\n"
            "MODRINTH_PROJECTS=fabric-api,lithium,ferrite-core,krypton,spark,chunky\n"
        )
        os.environ["MC_ENV_PATH"] = str(self.mc_env_path)
        from app.settings_manager import settings_manager
        self.orig_env_path = settings_manager.env_path
        settings_manager.env_path = self.mc_env_path

        # Create dummy world structure in MINECRAFT_DATA_DIR
        world_dir = Path(self.temp_dir.name) / "BabaSquadWorld"
        world_dir.mkdir(parents=True, exist_ok=True)
        (world_dir / "level.dat").write_bytes(b"dummy_dat")
        (world_dir / "region").mkdir(parents=True, exist_ok=True)
        (world_dir / "datapacks").mkdir(parents=True, exist_ok=True)
        (world_dir / "playerdata").mkdir(parents=True, exist_ok=True)

        # Create dummy logs
        logs_dir = Path(self.temp_dir.name) / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        (logs_dir / "latest.log").write_text("[20:00:00] [Server thread/INFO]: Done (45.0s)! For help, type \"help\"\n")

        init_db()
        self.client = TestClient(app, base_url="https://mcadmin.palvi.org")

    def tearDown(self):
        from app.settings_manager import settings_manager
        settings_manager.env_path = self.orig_env_path
        os.environ.pop("MC_WATCH_STATE_PATH", None)
        self.temp_dir.cleanup()

    def _setup_and_auth(self):
        self.client.post("/api/auth/setup", json={"password": "PalviSecurePassword2026!"})
        me = self.client.get("/api/auth/me").json()
        return me["csrf_token"]

    def test_healthz(self):
        resp = self.client.get("/healthz")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ok")

    def test_auth_flow_and_protection(self):
        resp = self.client.get("/api/status")
        self.assertEqual(resp.status_code, 401)

        resp = self.client.get("/api/auth/me")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["setup_required"])

        setup_resp = self.client.post("/api/auth/setup", json={"password": "PalviSecurePassword2026!"})
        self.assertEqual(setup_resp.status_code, 200)
        self.assertTrue(setup_resp.json()["success"])
        csrf_token = setup_resp.json()["csrf_token"]

        me_resp = self.client.get("/api/auth/me")
        self.assertEqual(me_resp.status_code, 200)
        self.assertTrue(me_resp.json()["authenticated"])

        status_resp = self.client.get("/api/status")
        self.assertEqual(status_resp.status_code, 200)
        data = status_resp.json()
        self.assertIn("state", data)
        self.assertIn("idle", data)

        post_resp = self.client.post("/api/control/start")
        self.assertEqual(post_resp.status_code, 403)

        post_resp_csrf = self.client.post(
            "/api/control/start",
            headers={CSRF_HEADER_NAME: csrf_token}
        )
        self.assertIn(post_resp_csrf.status_code, (200, 500, 503))

    def test_settings_properties_endpoints(self):
        csrf = self._setup_and_auth()

        # GET /api/settings/properties
        resp = self.client.get("/api/settings/properties")
        self.assertEqual(resp.status_code, 200)
        props = resp.json()
        self.assertEqual(props["max_players"], 8)
        self.assertEqual(props["gamemode"], "survival")
        self.assertEqual(props["difficulty"], "easy")
        self.assertEqual(props["whitelist"], False)

        # POST /api/settings/properties
        save_resp = self.client.post(
            "/api/settings/properties",
            headers={CSRF_HEADER_NAME: csrf},
            json={
                "max_players": 12,
                "gamemode": "creative",
                "difficulty": "normal",
                "whitelist": True,
                "allow_flight": True,
                "spawn_protection": 32,
                "pvp": False,
                "motd": "Updated MOTD",
                "view_distance": 12,
                "simulation_distance": 8,
                "enable_command_block": True,
                "allow_nether": False,
                "spawn_monsters": False
            }
        )
        self.assertEqual(save_resp.status_code, 200)
        self.assertTrue(save_resp.json()["success"])

        # Verify updated values
        verify_resp = self.client.get("/api/settings/properties")
        new_props = verify_resp.json()
        self.assertEqual(new_props["max_players"], 12)
        self.assertEqual(new_props["gamemode"], "creative")
        self.assertEqual(new_props["difficulty"], "normal")
        self.assertEqual(new_props["whitelist"], True)
        self.assertEqual(new_props["allow_flight"], True)
        self.assertEqual(new_props["spawn_protection"], 32)
        self.assertEqual(new_props["pvp"], False)
        self.assertEqual(new_props["motd"], "Updated MOTD")
        self.assertEqual(new_props["view_distance"], 12)
        self.assertEqual(new_props["simulation_distance"], 8)
        self.assertEqual(new_props["enable_command_block"], True)
        self.assertEqual(new_props["allow_nether"], False)
        self.assertEqual(new_props["spawn_monsters"], False)

    def test_files_endpoints(self):
        csrf = self._setup_and_auth()

        # 1. List files in root
        list_resp = self.client.get("/api/files/list")
        self.assertEqual(list_resp.status_code, 200)
        items = list_resp.json()["items"]
        self.assertTrue(any(i["name"] == "BabaSquadWorld" for i in items))

        # 2. Create folder
        create_resp = self.client.post(
            "/api/files/create-folder",
            headers={CSRF_HEADER_NAME: csrf},
            json={"path": "", "name": "test_folder"}
        )
        self.assertEqual(create_resp.status_code, 200)
        self.assertTrue(create_resp.json()["success"])

        # 3. Write file
        write_resp = self.client.post(
            "/api/files/write",
            headers={CSRF_HEADER_NAME: csrf},
            json={"path": "test_folder/notes.txt", "content": "Hello Palvi Server!"}
        )
        self.assertEqual(write_resp.status_code, 200)
        self.assertTrue(write_resp.json()["success"])

        # 4. Read file
        read_resp = self.client.get("/api/files/read?path=test_folder/notes.txt")
        self.assertEqual(read_resp.status_code, 200)
        self.assertEqual(read_resp.json()["content"], "Hello Palvi Server!")

        # 5. Download file
        dl_resp = self.client.get("/api/files/download?path=test_folder/notes.txt")
        self.assertEqual(dl_resp.status_code, 200)
        self.assertIn(b"Hello Palvi Server!", dl_resp.content)

        # 6. Delete file
        del_resp = self.client.request(
            "DELETE",
            "/api/files/delete",
            headers={CSRF_HEADER_NAME: csrf},
            json={"path": "test_folder/notes.txt", "confirm": True}
        )
        self.assertEqual(del_resp.status_code, 200)

        # 7. Path traversal prevention
        traversal_resp = self.client.get("/api/files/list?path=../../etc")
        self.assertEqual(traversal_resp.status_code, 403)

    def test_files_download_zip_excludes_sensitive_files(self):
        import io
        import zipfile
        csrf = self._setup_and_auth()
        base_path = Path(self.temp_dir.name)

        # 1. Create sensitive and allowed files in root
        (base_path / ".rcon-cli.env").write_text("RCON_PASSWORD=SuperSecretPass123\n")
        (base_path / "secret.env").write_text("API_KEY=Secret12345\n")
        (base_path / ".hidden_dotfile").write_text("hidden\n")
        (base_path / "safe_notes.txt").write_text("Public server notes\n")

        # 2. Create subfolder with mixed files
        sub = base_path / "public_folder"
        sub.mkdir(parents=True, exist_ok=True)
        (sub / "nested_safe.json").write_text('{"status": "ok"}\n')
        (sub / "nested_leak.env").write_text("LEAK=true\n")
        (sub / ".nested_hidden").write_text("hidden nested\n")

        # 3. Request zip download of root
        dl_resp = self.client.get("/api/files/download?path=")
        self.assertEqual(dl_resp.status_code, 200)
        self.assertEqual(dl_resp.headers["content-type"], "application/zip")

        # 4. Inspect zip contents
        with zipfile.ZipFile(io.BytesIO(dl_resp.content)) as z:
            names = z.namelist()
            # Allowed files must be present
            self.assertIn("safe_notes.txt", names)
            self.assertIn("public_folder/nested_safe.json", names)

            # Sensitive / blocked files must NOT be present
            self.assertNotIn(".rcon-cli.env", names)
            self.assertNotIn("secret.env", names)
            self.assertNotIn(".hidden_dotfile", names)
            self.assertNotIn("public_folder/nested_leak.env", names)
            self.assertNotIn("public_folder/.nested_hidden", names)

            for name in names:
                parts = name.split("/")
                for part in parts:
                    self.assertFalse(part.startswith("."), f"Found dotfile {part} in zip archive: {name}")
                    self.assertFalse(part.lower().endswith(".env"), f"Found .env file {part} in zip archive: {name}")

    def test_worlds_endpoints(self):
        csrf = self._setup_and_auth()

        # GET /api/worlds/info
        info_resp = self.client.get("/api/worlds/info")
        self.assertEqual(info_resp.status_code, 200)
        info = info_resp.json()
        self.assertEqual(info["world_name"], "BabaSquadWorld")
        self.assertEqual(info["seed"], "1807738846518060059")
        self.assertTrue(info["has_level_dat"])

        # GET /api/worlds/files
        files_resp = self.client.get("/api/worlds/files")
        self.assertEqual(files_resp.status_code, 200)
        self.assertTrue(files_resp.json()["exists"])

        # GET /api/worlds/download
        dl_resp = self.client.get("/api/worlds/download")
        self.assertEqual(dl_resp.status_code, 200)
        self.assertTrue(len(dl_resp.content) > 0)

        # POST /api/worlds/generate (requires confirm)
        gen_resp_noconfirm = self.client.post(
            "/api/worlds/generate",
            headers={CSRF_HEADER_NAME: csrf},
            json={"world_name": "NewTestWorld", "seed": "987654", "confirm": False}
        )
        self.assertEqual(gen_resp_noconfirm.status_code, 400)

        gen_resp = self.client.post(
            "/api/worlds/generate",
            headers={CSRF_HEADER_NAME: csrf},
            json={"world_name": "NewTestWorld", "seed": "987654", "confirm": True}
        )
        self.assertEqual(gen_resp.status_code, 200)
        self.assertTrue(gen_resp.json()["success"])

    def test_software_endpoints(self):
        csrf = self._setup_and_auth()

        # GET /api/software
        resp = self.client.get("/api/software")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["current"]["type"], "FABRIC")
        self.assertEqual(data["current"]["name"], "Fabric")
        self.assertTrue(data["current"]["is_default"])
        self.assertTrue(any(s["id"] == "FABRIC" for s in data["available"]))

        # POST /api/software/switch without confirm
        switch_resp = self.client.post(
            "/api/software/switch",
            headers={CSRF_HEADER_NAME: csrf},
            json={"software_id": "PAPER", "confirm": False}
        )
        self.assertEqual(switch_resp.status_code, 200)
        self.assertTrue(switch_resp.json()["needs_confirmation"])

    def test_players_endpoints(self):
        csrf = self._setup_and_auth()

        # GET /api/players/all
        resp = self.client.get("/api/players/all")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("ops", data)
        self.assertIn("banned_players", data)
        self.assertIn("banned_ips", data)
        self.assertIn("whitelisted", data)
        self.assertIn("offline_players", data)

        # Add OP
        op_resp = self.client.post(
            "/api/players/ops",
            headers={CSRF_HEADER_NAME: csrf},
            json={"player": "testplayer"}
        )
        self.assertEqual(op_resp.status_code, 200)

        # Remove OP
        deop_resp = self.client.delete(
            "/api/players/ops/testplayer",
            headers={CSRF_HEADER_NAME: csrf}
        )
        self.assertEqual(deop_resp.status_code, 200)

        # Whitelist
        wl_resp = self.client.post(
            "/api/players/whitelist",
            headers={CSRF_HEADER_NAME: csrf},
            json={"player": "whitelisted_user"}
        )
        self.assertEqual(wl_resp.status_code, 200)

        del_wl_resp = self.client.delete(
            "/api/players/whitelist/whitelisted_user",
            headers={CSRF_HEADER_NAME: csrf}
        )
        self.assertEqual(del_wl_resp.status_code, 200)

        # Invalid player / IP rejected
        bad_player = self.client.post(
            "/api/players/ops",
            headers={CSRF_HEADER_NAME: csrf},
            json={"player": "bad player\nsay hacked"}
        )
        self.assertEqual(bad_player.status_code, 400)

        bad_ip = self.client.post(
            "/api/players/ban-ip",
            headers={CSRF_HEADER_NAME: csrf},
            json={"ip": "999.999.999.999"}
        )
        self.assertEqual(bad_ip.status_code, 400)

    def test_analytics_and_world_download_safety(self):
        import io
        import zipfile
        from app.database import record_server_metric
        csrf = self._setup_and_auth()

        # Empty analytics returns zero/empty shape
        empty_resp = self.client.get("/api/server/analytics")
        self.assertEqual(empty_resp.status_code, 200)
        self.assertEqual(empty_resp.json()["heatmap_months"], [])

        # Populate hourly rollup metric and verify heatmap & funnel populate
        record_server_metric(state="Online", players_count=2, tps=20.0, mspt=12.0)
        pop_resp = self.client.get("/api/server/analytics")
        self.assertEqual(pop_resp.status_code, 200)
        pdata = pop_resp.json()
        self.assertEqual(len(pdata["heatmap_months"]), 3)
        self.assertEqual(len(pdata["funnel_stages"]), 4)
        self.assertEqual(len(pdata["uptime_history_14d"]), 14)

        # World download excludes any blocked files placed inside world directory
        world_dir = Path(self.temp_dir.name) / "BabaSquadWorld"
        (world_dir / "leak.env").write_text("SECRET=1\n")
        dl_resp = self.client.get("/api/worlds/download")
        self.assertEqual(dl_resp.status_code, 200)
        with zipfile.ZipFile(io.BytesIO(dl_resp.content)) as z:
            self.assertNotIn("leak.env", z.namelist())
            self.assertIn("level.dat", z.namelist())

    def test_new_endpoints_media_kick_prefs_and_cookie_security(self):
        import json
        from unittest.mock import AsyncMock, patch
        from app.rcon_client import rcon_client
        from app.system_metrics import get_system_analytics

        csrf = self._setup_and_auth()

        # Verify login cookie uses SameSite=Strict and /api/auth/me clears invalid cookies
        login_resp = self.client.post("/api/auth/login", json={"password": "PalviSecurePassword2026!"})
        self.assertEqual(login_resp.status_code, 200)
        set_cookie_hdr = login_resp.headers.get("set-cookie", "")
        self.assertIn("samesite=strict", set_cookie_hdr.lower())
        csrf = login_resp.json()["csrf_token"]

        # mc-watch state JSON via dynamic MC_WATCH_STATE_PATH
        watch_file = Path(self.temp_dir.name) / "watch_state.json"
        watch_file.write_text(json.dumps({"mc": "stopped", "media": "running", "media_start_at": None, "grace": 450}))
        os.environ["MC_WATCH_STATE_PATH"] = str(watch_file)

        status_resp = self.client.get("/api/status")
        self.assertEqual(status_resp.status_code, 200)
        sdata = status_resp.json()
        self.assertEqual(sdata["watch_state"]["grace"], 450)
        self.assertIn("entities", sdata["stats"])
        self.assertIn("chunks", sdata["stats"])

        media_resp = self.client.get("/api/media/status")
        self.assertEqual(media_resp.status_code, 200)
        self.assertEqual(media_resp.json()["watch_state"]["grace"], 450)

        # Panel prefs webhook save & validate
        bad_pref = self.client.post(
            "/api/settings/panel-prefs",
            headers={CSRF_HEADER_NAME: csrf},
            json={"alert_webhook_url": "ftp://invalid"}
        )
        self.assertEqual(bad_pref.status_code, 400)

        ok_pref = self.client.post(
            "/api/settings/panel-prefs",
            headers={CSRF_HEADER_NAME: csrf},
            json={"alert_webhook_url": "https://discord.com/api/webhooks/12345"}
        )
        self.assertEqual(ok_pref.status_code, 200)
        self.assertEqual(
            self.client.get("/api/settings/panel-prefs").json()["alert_webhook_url"],
            "https://discord.com/api/webhooks/12345"
        )

        # Kick validation and RCON execution + audit visibility
        bad_kick = self.client.post(
            "/api/players/kick",
            headers={CSRF_HEADER_NAME: csrf},
            json={"player": "bad name!!"}
        )
        self.assertEqual(bad_kick.status_code, 400)

        with patch.object(rcon_client, "execute", new=AsyncMock(return_value="Kicked Steve")) as mock_exec:
            ok_kick = self.client.post(
                "/api/players/kick",
                headers={CSRF_HEADER_NAME: csrf},
                json={"player": "Steve", "reason": "AFK cleanup"}
            )
            self.assertEqual(ok_kick.status_code, 200)
            mock_exec.assert_awaited_with("kick Steve AFK cleanup")

        audit_resp = self.client.get("/api/audit?limit=10&offset=0")
        self.assertEqual(audit_resp.status_code, 200)
        actions = [e["action"] for e in audit_resp.json()["entries"]]
        self.assertIn("kick_player", actions)

        # System analytics includes disk & network throughput keys
        sys_data = get_system_analytics()
        for key in ("disk_read_mbps", "disk_write_mbps", "net_in_kbps", "net_out_kbps"):
            self.assertIn(key, sys_data)

        # Invalid session cookie cleared on /api/auth/me
        fresh_client = TestClient(app, base_url="https://mcadmin.palvi.org")
        fresh_client.cookies.set(SESSION_COOKIE_NAME, "nonexistent-stale-token")
        me_invalid = fresh_client.get("/api/auth/me")
        self.assertEqual(me_invalid.status_code, 200)
        self.assertFalse(me_invalid.json()["authenticated"])
        self.assertIn(SESSION_COOKIE_NAME, me_invalid.headers.get("set-cookie", ""))

    def test_rcon_tps_cache_and_watcher_player_cache(self):
        import asyncio
        from unittest.mock import AsyncMock, patch
        from app.rcon_client import RCONClient
        from app.watcher import watcher

        rc = RCONClient()
        with patch.object(rc, "execute", new=AsyncMock(return_value="TPS from last 5s, 10s, 1m: 20.0\nTick durations: 12.1/14.5")) as mock_exec:
            r1 = asyncio.run(rc.get_mspt_and_tps())
            r2 = asyncio.run(rc.get_mspt_and_tps())
            self.assertEqual(r1["tps"], 20.0)
            self.assertEqual(r2["mspt"], 14.5)
            self.assertEqual(mock_exec.await_count, 1)

        watcher.update_player_cache({"count": 2, "max": 8, "players": ["Alice", "Bob"]})
        cached_p = watcher.get_cached_players(max_age=5.0)
        self.assertIsNotNone(cached_p)
        self.assertEqual(cached_p["players"], ["Alice", "Bob"])

if __name__ == "__main__":
    unittest.main()
