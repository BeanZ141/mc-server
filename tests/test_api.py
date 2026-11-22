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
                "spawn_protection": 32
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

if __name__ == "__main__":
    unittest.main()
