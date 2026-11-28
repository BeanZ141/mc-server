import sqlite3
import datetime
from pathlib import Path
from app.config import get_data_dir


def get_db_path() -> Path:
    return get_data_dir() / "mcadmin.db"


def get_db_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    if not db_path.parent.exists():
        db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_auth (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        csrf_token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS failed_logins (
        ip_address TEXT PRIMARY KEY,
        attempt_count INTEGER DEFAULT 0,
        locked_until TEXT,
        last_attempt TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        details TEXT,
        result TEXT NOT NULL,
        ip_address TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS panel_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS server_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        state TEXT NOT NULL,
        players_count INTEGER DEFAULT 0,
        cpu_percent REAL DEFAULT 0.0,
        ram_used_mb REAL DEFAULT 0.0,
        ram_limit_mb REAL DEFAULT 0.0,
        tps REAL DEFAULT 20.0,
        mspt REAL DEFAULT 0.0
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS server_metrics_hourly (
        hour_key TEXT PRIMARY KEY,
        online_samples INTEGER DEFAULT 0,
        asleep_samples INTEGER DEFAULT 0,
        active_samples INTEGER DEFAULT 0,
        error_samples INTEGER DEFAULT 0,
        total_samples INTEGER DEFAULT 0,
        peak_players INTEGER DEFAULT 0,
        tps_sum REAL DEFAULT 0.0,
        tps_count INTEGER DEFAULT 0,
        mspt_sum REAL DEFAULT 0.0,
        mspt_count INTEGER DEFAULT 0
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_server_metrics_ts ON server_metrics(timestamp);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_action_ts ON audit_log(action, timestamp);")

    conn.commit()
    conn.close()


def cleanup_expired_sessions():
    try:
        conn = get_db_connection()
        now_iso = datetime.datetime.now().isoformat()
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now_iso,))
        conn.commit()
        conn.close()
    except Exception:
        pass


def record_server_metric(state: str, players_count: int = 0, cpu_percent: float = 0.0,
                         ram_used_mb: float = 0.0, ram_limit_mb: float = 0.0,
                         tps: float = 20.0, mspt: float = 0.0):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.datetime.now()
        now_iso = now.isoformat()
        hour_key = now.strftime("%Y-%m-%dT%H")

        cursor.execute(
            """
            INSERT INTO server_metrics (timestamp, state, players_count, cpu_percent, ram_used_mb, ram_limit_mb, tps, mspt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (now_iso, state, players_count, cpu_percent, ram_used_mb, ram_limit_mb, tps, mspt)
        )

        is_online = 1 if state == "Online" else 0
        is_asleep = 1 if state == "Asleep" else 0
        is_active = 1 if (state == "Online" and players_count > 0) else 0
        is_error = 1 if state == "Error" else 0
        valid_tps = tps if (is_online and tps and tps > 0) else 0.0
        valid_tps_cnt = 1 if (is_online and tps and tps > 0) else 0
        valid_mspt = mspt if (is_online and mspt and mspt > 0) else 0.0
        valid_mspt_cnt = 1 if (is_online and mspt and mspt > 0) else 0

        cursor.execute(
            """
            INSERT INTO server_metrics_hourly (
                hour_key, online_samples, asleep_samples, active_samples, error_samples,
                total_samples, peak_players, tps_sum, tps_count, mspt_sum, mspt_count
            )
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
            ON CONFLICT(hour_key) DO UPDATE SET
                online_samples = online_samples + excluded.online_samples,
                asleep_samples = asleep_samples + excluded.asleep_samples,
                active_samples = active_samples + excluded.active_samples,
                error_samples = error_samples + excluded.error_samples,
                total_samples = total_samples + 1,
                peak_players = MAX(peak_players, excluded.peak_players),
                tps_sum = tps_sum + excluded.tps_sum,
                tps_count = tps_count + excluded.tps_count,
                mspt_sum = mspt_sum + excluded.mspt_sum,
                mspt_count = mspt_count + excluded.mspt_count
            """,
            (hour_key, is_online, is_asleep, is_active, is_error,
             players_count, valid_tps, valid_tps_cnt, valid_mspt, valid_mspt_cnt)
        )

        # Keep last 5000 detailed 30s samples for 24h TPS/MSPT timelines, retain 95 days of hourly rollups
        cursor.execute(
            "DELETE FROM server_metrics WHERE id NOT IN (SELECT id FROM server_metrics ORDER BY id DESC LIMIT 5000)"
        )
        hourly_cutoff = (now - datetime.timedelta(days=95)).strftime("%Y-%m-%dT%H")
        cursor.execute("DELETE FROM server_metrics_hourly WHERE hour_key < ?", (hourly_cutoff,))

        conn.commit()
        conn.close()
    except Exception:
        pass


def get_analytics_data(hours: int = 24) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cutoff = (datetime.datetime.now() - datetime.timedelta(hours=hours)).isoformat()

    cursor.execute(
        "SELECT timestamp, state, players_count, tps, mspt FROM server_metrics WHERE timestamp >= ? ORDER BY id ASC",
        (cutoff,)
    )
    rows = cursor.fetchall()

    cursor.execute(
        "SELECT COUNT(*) FROM audit_log WHERE action IN ('restart_server', 'start_server', 'recreate-mc') AND timestamp >= ?",
        (cutoff,)
    )
    restarts_count = cursor.fetchone()[0]
    conn.close()

    if not rows:
        return {
            "uptime_pct_24h": 0.0,
            "uptime_pct_7d": 0.0,
            "avg_tps": 0.0,
            "avg_mspt": 0.0,
            "peak_players": 0,
            "total_restarts": restarts_count,
            "samples_count": 0,
            "hourly_blocks": [],
            "tps_timeline": [],
            "breakdown": {
                "online_pct": 0.0,
                "asleep_pct": 0.0,
                "maintenance_pct": 0.0,
                "downtime_pct": 0.0
            }
        }

    total_samples = len(rows)
    online_count = sum(1 for r in rows if r["state"] == "Online")
    asleep_count = sum(1 for r in rows if r["state"] == "Asleep")
    error_count = sum(1 for r in rows if r["state"] == "Error")

    uptime_count = online_count + asleep_count
    uptime_pct = round((uptime_count / total_samples) * 100.0, 1)
    online_pct = round((online_count / total_samples) * 100.0, 1)
    asleep_pct = round((asleep_count / total_samples) * 100.0, 1)
    downtime_pct = round((error_count / total_samples) * 100.0, 1)

    valid_tps = [r["tps"] for r in rows if r["tps"] and r["tps"] > 0]
    avg_tps = round(sum(valid_tps) / len(valid_tps), 1) if valid_tps else 0.0

    valid_mspt = [r["mspt"] for r in rows if r["mspt"] and r["mspt"] > 0]
    avg_mspt = round(sum(valid_mspt) / len(valid_mspt), 1) if valid_mspt else 0.0

    peak_players = max((r["players_count"] for r in rows), default=0)

    # Bucket rows by hour in a single O(N) pass
    buckets: dict[str, list] = {}
    for r in rows:
        h_key = r["timestamp"][:13]
        buckets.setdefault(h_key, []).append(r)

    now = datetime.datetime.now()
    hourly_blocks = []
    for i in range(24):
        slot_start = now - datetime.timedelta(hours=23 - i)
        h_key = slot_start.strftime("%Y-%m-%dT%H")
        slot_rows = buckets.get(h_key, [])
        if not slot_rows:
            hourly_blocks.append({"hour": slot_start.strftime("%H:00"), "status": "down", "uptime": 0})
        else:
            good = sum(1 for r in slot_rows if r["state"] in ("Online", "Asleep"))
            pct = round((good / len(slot_rows)) * 100.0)
            status = "online" if pct >= 80 else ("asleep" if pct >= 30 else "down")
            hourly_blocks.append({"hour": slot_start.strftime("%H:00"), "status": status, "uptime": pct})

    step = max(1, total_samples // 30)
    timeline_rows = rows[::step][-30:]
    tps_timeline = [
        {
            "time": r["timestamp"][11:16],
            "tps": round(r["tps"], 1) if r["tps"] else 20.0,
            "mspt": round(r["mspt"], 1) if r["mspt"] else 5.0,
            "players": r["players_count"] or 0
        }
        for r in timeline_rows
    ]

    return {
        "uptime_pct_24h": uptime_pct,
        "uptime_pct_7d": uptime_pct,
        "avg_tps": avg_tps,
        "avg_mspt": avg_mspt,
        "peak_players": peak_players,
        "total_restarts": restarts_count,
        "samples_count": total_samples,
        "hourly_blocks": hourly_blocks,
        "tps_timeline": tps_timeline,
        "breakdown": {
            "online_pct": online_pct,
            "asleep_pct": asleep_pct,
            "maintenance_pct": round(max(0.0, 100.0 - online_pct - asleep_pct - downtime_pct), 1),
            "downtime_pct": downtime_pct
        }
    }


def log_audit(user: str, action: str, target: str | None, details: str | None, result: str, ip_address: str | None):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now().isoformat()
    cursor.execute(
        """
        INSERT INTO audit_log (timestamp, user, action, target, details, result, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (now_iso, user, action, target, details, result, ip_address)
    )
    conn.commit()
    conn.close()


def get_panel_setting(key: str, default: str = "") -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM panel_settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default


def set_panel_setting(key: str, value: str):
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO panel_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value)
    )
    conn.commit()
    conn.close()
