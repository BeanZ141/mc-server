import os
import unittest
import tempfile
from pathlib import Path

from app.rcon_client import RCONClient, SERVERDATA_AUTH, SERVERDATA_EXECCOMMAND
from app.settings_manager import SettingsManager
from app.auth import (
    hash_password,
    verify_password,
    setup_admin_password,
    is_admin_set_up,
    check_ip_lockout,
    record_failed_login,
    reset_failed_logins,
    create_session,
    get_session,
    destroy_session,
    MAX_FAILED_ATTEMPTS
)
from app.database import init_db

class TestMinecraftAdminPanel(unittest.TestCase):
    def setUp(self):
        # Set up a temp directory for DB and test files
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["DATA_DIR"] = self.temp_dir.name
        os.environ["MINECRAFT_DATA_DIR"] = self.temp_dir.name
        init_db()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_rcon_packet_encoding_and_formatting_strip(self):
        client = RCONClient()
        # Test packet encode
        pkt = client._encode_packet(1234, SERVERDATA_EXECCOMMAND, "help")
        # Header should be 12 bytes: length (4), req_id (4), type (4)
        # Payload len = 4 ("help") + 2 null bytes = 6
        # Total packet length = 4 + 4 + 6 = 14. length field = 10 + 4 = 14
        import struct
        length, req_id, p_type = struct.unpack("<iii", pkt[:12])
        self.assertEqual(length, 14)
        self.assertEqual(req_id, 1234)
        self.assertEqual(p_type, SERVERDATA_EXECCOMMAND)
        self.assertTrue(pkt.endswith(b"\x00\x00"))

        # Test stripping Minecraft section symbols
        colored_text = "§aPalvi§r: §eServer online§r with §65§r players"
        cleaned = client.strip_minecraft_formatting(colored_text)
        self.assertEqual(cleaned, "Palvi: Server online with 5 players")

    def test_settings_manager_parsing_and_validation(self):
        env_file = Path(self.temp_dir.name) / "test.env"
        env_file.write_text(
            "VERSION=26.3\n"
            "MEMORY=3G\n"
            "VIEW_DISTANCE=16\n"
            "SIMULATION_DISTANCE=6\n"
            "MAX_PLAYERS=8\n"
            "ONLINE_MODE=false\n"
            "MODRINTH_PROJECTS=fabric-api,lithium,ferrite-core\n"
        )
        sm = SettingsManager(env_file)
        parsed = sm.parse_env()
        self.assertEqual(parsed["VERSION"], "26.3")
        self.assertEqual(parsed["MEMORY"], "3G")
        self.assertEqual(parsed["ONLINE_MODE"], "false")

        # Test memory limit validation (host i3-3240 max 4G)
        ok, msg = sm.validate_settings({"MEMORY": "8G"})
        self.assertFalse(ok)
        self.assertIn("capped at 4G", msg)

        ok, msg = sm.validate_settings({"MEMORY": "3G"})
        self.assertTrue(ok)

        # Test view distance validation
        ok, msg = sm.validate_settings({"VIEW_DISTANCE": "50"})
        self.assertFalse(ok)

        ok, msg = sm.validate_settings({"VIEW_DISTANCE": "12"})
        self.assertTrue(ok)

        # Test diff generation
        new_content = env_file.read_text().replace("VIEW_DISTANCE=16", "VIEW_DISTANCE=12")
        diff = sm.generate_diff(new_content)
        self.assertIn("-VIEW_DISTANCE=16", diff)
        self.assertIn("+VIEW_DISTANCE=12", diff)

        # Test backup on save
        backup_path = sm.save_with_backup(new_content)
        self.assertTrue(Path(backup_path).exists())
        self.assertEqual(sm.parse_env()["VIEW_DISTANCE"], "12")

        # Test mod projects update
        new_mods = sm.update_mod_projects("spark", "add")
        self.assertIn("spark", new_mods)
        new_mods = sm.update_mod_projects("lithium", "remove")
        self.assertNotIn("lithium", new_mods)

    def test_auth_system_and_lockout(self):
        # 1. Password hashing
        pw = "SuperSecretPalvi123!"
        h = hash_password(pw)
        self.assertTrue(verify_password(h, pw))
        self.assertFalse(verify_password(h, "WrongPassword"))

        # 2. Setup initial password
        self.assertTrue(setup_admin_password(pw, "127.0.0.1"))
        self.assertTrue(is_admin_set_up())
        # Second setup should be rejected
        self.assertFalse(setup_admin_password("AnotherPass", "127.0.0.1"))

        # 3. Lockout test
        test_ip = "192.168.0.50"
        is_locked, _ = check_ip_lockout(test_ip)
        self.assertFalse(is_locked)

        # Fail 5 times
        for _ in range(MAX_FAILED_ATTEMPTS):
            record_failed_login(test_ip)

        is_locked, remaining = check_ip_lockout(test_ip)
        self.assertTrue(is_locked)
        self.assertGreater(remaining, 0)

        # Reset lockout
        reset_failed_logins(test_ip)
        is_locked, _ = check_ip_lockout(test_ip)
        self.assertFalse(is_locked)

        # 4. Sessions
        s_token, csrf_token = create_session(test_ip, "TestAgent")
        session = get_session(s_token)
        self.assertIsNotNone(session)
        self.assertEqual(session["csrf_token"], csrf_token)

        destroy_session(s_token)
        self.assertIsNone(get_session(s_token))

    def test_settings_preserves_comments_and_hourly_rollup(self):
        from app.database import record_server_metric, get_db_connection
        env_file = Path(self.temp_dir.name) / "comments.env"
        env_file.write_text("# Header comment\nVERSION=26.3\n\n# World\nLEVEL=TestWorld\n")
        sm = SettingsManager(env_file)

        updated = sm.build_updated_content({"LEVEL": "NewWorld", "SEED": "12345"}, remove_keys=[])
        self.assertIn("# Header comment", updated)
        self.assertIn("# World", updated)
        self.assertIn("LEVEL=NewWorld", updated)
        self.assertIn("SEED=12345", updated)

        record_server_metric(state="Online", players_count=3, tps=20.0, mspt=10.0)
        record_server_metric(state="Asleep", players_count=0)
        conn = get_db_connection()
        row = conn.execute("SELECT online_samples, asleep_samples, total_samples, peak_players FROM server_metrics_hourly").fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row["online_samples"], 1)
        self.assertEqual(row["asleep_samples"], 1)
        self.assertEqual(row["total_samples"], 2)
        self.assertEqual(row["peak_players"], 3)

if __name__ == "__main__":
    unittest.main()
