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
            "ONLINE_MODE=false\n"
            "LEVEL=BabaSquadWorld\n"
            "MODRINTH_PROJECTS=fabric-api,lithium,ferrite-core,krypton,spark,chunky\n"
        )
        os.environ["MC_ENV_PATH"] = str(self.mc_env_path)

        init_db()
        self.client = TestClient(app, base_url="https://mcadmin.palvi.org")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_healthz(self):
        resp = self.client.get("/healthz")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ok")

    def test_auth_flow_and_protection(self):
        # 1. Unauthenticated request to protected route returns 401
        resp = self.client.get("/api/status")
        self.assertEqual(resp.status_code, 401)

        # 2. Check me endpoint reports setup required
        resp = self.client.get("/api/auth/me")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["setup_required"])

        # 3. Setup initial password
        setup_resp = self.client.post("/api/auth/setup", json={"password": "PalviSecurePassword2026!"})
        self.assertEqual(setup_resp.status_code, 200)
        self.assertTrue(setup_resp.json()["success"])
        csrf_token = setup_resp.json()["csrf_token"]
        self.assertIsNotNone(csrf_token)

        # 4. Now authenticated!
        me_resp = self.client.get("/api/auth/me")
        self.assertEqual(me_resp.status_code, 200)
        self.assertTrue(me_resp.json()["authenticated"])

        # 5. Protected GET /api/status works
        status_resp = self.client.get("/api/status")
        self.assertEqual(status_resp.status_code, 200)
        data = status_resp.json()
        self.assertIn("state", data)
        self.assertIn("idle", data)

        # 6. Mutating POST requires valid CSRF token
        post_resp = self.client.post("/api/control/start")
        self.assertEqual(post_resp.status_code, 403)  # Missing CSRF token

        # With valid CSRF token header
        post_resp_csrf = self.client.post(
            "/api/control/start",
            headers={CSRF_HEADER_NAME: csrf_token}
        )
        # Even if docker-socket-proxy is not running locally, it doesn't fail on auth/csrf
        self.assertIn(post_resp_csrf.status_code, (200, 500, 503))

    def test_settings_endpoints(self):
        # Setup admin
        self.client.post("/api/auth/setup", json={"password": "PalviSecurePassword2026!"})
        me = self.client.get("/api/auth/me").json()
        csrf = me["csrf_token"]

        # GET settings
        resp = self.client.get("/api/settings")
        self.assertEqual(resp.status_code, 200)
        settings = resp.json()
        self.assertEqual(settings["world"]["LEVEL"], "BabaSquadWorld")
        self.assertEqual(settings["performance"]["MEMORY"], "3G")

        # POST diff
        diff_resp = self.client.post(
            "/api/settings/diff",
            headers={CSRF_HEADER_NAME: csrf},
            json={"updates": {"VIEW_DISTANCE": "12"}}
        )
        self.assertEqual(diff_resp.status_code, 200)
        self.assertIn("-VIEW_DISTANCE=16", diff_resp.json()["diff"])
        self.assertIn("+VIEW_DISTANCE=12", diff_resp.json()["diff"])

if __name__ == "__main__":
    unittest.main()
