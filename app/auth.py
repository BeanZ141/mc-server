import secrets
import datetime
import secrets
import datetime
import hashlib
from fastapi import Request, HTTPException, status
from app.database import get_db_connection, log_audit
from app.config import SESSION_COOKIE_NAME, CSRF_HEADER_NAME

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _ph = PasswordHasher()
    _HAS_ARGON2 = True
except ImportError:
    _ph = None
    _HAS_ARGON2 = False

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
SESSION_LIFETIME_DAYS = 7

def hash_password(password: str) -> str:
    if _HAS_ARGON2 and _ph:
        return _ph.hash(password)
    # Secure fallback: PBKDF2-HMAC-SHA256 with 600,000 iterations
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000)
    return f"pbkdf2:sha256:600000${salt.hex()}${dk.hex()}"

def verify_password(hash_val: str, password: str) -> bool:
    try:
        if hash_val.startswith("$argon2"):
            if _HAS_ARGON2 and _ph:
                return _ph.verify(hash_val, password)
            return False
        if hash_val.startswith("pbkdf2:sha256:"):
            parts = hash_val.split("$")
            if len(parts) != 3:
                return False
            iterations = int(parts[0].split(":")[2])
            salt = bytes.fromhex(parts[1])
            expected_dk = bytes.fromhex(parts[2])
            dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
            return secrets.compare_digest(dk, expected_dk)
        return False
    except Exception:
        return False

def is_admin_set_up() -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM admin_auth WHERE id = 1 LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return row is not None

def setup_admin_password(password: str, ip_address: str | None = None) -> bool:
    if is_admin_set_up():
        return False
    
    hashed = hash_password(password)
    now_iso = datetime.datetime.now().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO admin_auth (id, password_hash, created_at, updated_at) VALUES (1, ?, ?, ?)",
        (hashed, now_iso, now_iso)
    )
    conn.commit()
    conn.close()
    log_audit("admin", "setup_password", "admin_auth", "Initial password established", "SUCCESS", ip_address)
    return True

def change_admin_password(old_password: str, new_password: str, ip_address: str | None = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM admin_auth WHERE id = 1")
    row = cursor.fetchone()
    if not row or not verify_password(row["password_hash"], old_password):
        conn.close()
        log_audit("admin", "change_password", "admin_auth", "Invalid old password", "FAILURE", ip_address)
        return False
    
    new_hashed = hash_password(new_password)
    now_iso = datetime.datetime.now().isoformat()
    cursor.execute("UPDATE admin_auth SET password_hash = ?, updated_at = ? WHERE id = 1", (new_hashed, now_iso))
    conn.commit()
    conn.close()
    log_audit("admin", "change_password", "admin_auth", "Password updated", "SUCCESS", ip_address)
    return True

def check_ip_lockout(ip_address: str) -> tuple[bool, int]:
    """Returns (is_locked, seconds_remaining)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT attempt_count, locked_until FROM failed_logins WHERE ip_address = ?", (ip_address,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return False, 0

    locked_until_str = row["locked_until"]
    if locked_until_str:
        locked_until = datetime.datetime.fromisoformat(locked_until_str)
        now = datetime.datetime.now()
        if now < locked_until:
            remaining = int((locked_until - now).total_seconds())
            return True, remaining

    return False, 0

def record_failed_login(ip_address: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.datetime.now()
    now_iso = now.isoformat()

    cursor.execute("SELECT attempt_count FROM failed_logins WHERE ip_address = ?", (ip_address,))
    row = cursor.fetchone()

    attempts = 1
    locked_until_iso = None
    if row:
        attempts = row["attempt_count"] + 1
    
    if attempts >= MAX_FAILED_ATTEMPTS:
        locked_until = now + datetime.timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        locked_until_iso = locked_until.isoformat()

    cursor.execute(
        """
        INSERT INTO failed_logins (ip_address, attempt_count, locked_until, last_attempt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(ip_address) DO UPDATE SET
            attempt_count = ?,
            locked_until = ?,
            last_attempt = ?
        """,
        (ip_address, attempts, locked_until_iso, now_iso, attempts, locked_until_iso, now_iso)
    )
    conn.commit()
    conn.close()

def reset_failed_logins(ip_address: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM failed_logins WHERE ip_address = ?", (ip_address,))
    conn.commit()
    conn.close()

def create_session(ip_address: str | None, user_agent: str | None) -> tuple[str, str]:
    session_token = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(32)
    now = datetime.datetime.now()
    expires = now + datetime.timedelta(days=SESSION_LIFETIME_DAYS)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO sessions (token, csrf_token, created_at, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (session_token, csrf_token, now.isoformat(), expires.isoformat(), ip_address, user_agent)
    )
    conn.commit()
    conn.close()
    return session_token, csrf_token

def get_session(session_token: str) -> dict | None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE token = ?", (session_token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    expires = datetime.datetime.fromisoformat(row["expires_at"])
    if datetime.datetime.now() > expires:
        destroy_session(session_token)
        return None

    return dict(row)

def destroy_session(session_token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (session_token,))
    conn.commit()
    conn.close()

def get_current_user_and_session(request: Request) -> dict:
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        # Also check Authorization header Bearer token
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr and auth_hdr.startswith("Bearer "):
            session_token = auth_hdr[7:].strip()

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    session = get_session(session_token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired"
        )

    # CSRF protection on mutating HTTP methods
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        csrf_header = request.headers.get(CSRF_HEADER_NAME)
        # Check against session CSRF token
        if not csrf_header or not secrets.compare_digest(csrf_header, session["csrf_token"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing or invalid"
            )

    return session
