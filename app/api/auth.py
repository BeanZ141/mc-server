import os
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from pydantic import BaseModel
from app.auth import (
    is_admin_set_up,
    setup_admin_password,
    change_admin_password,
    verify_password,
    check_ip_lockout,
    record_failed_login,
    reset_failed_logins,
    create_session,
    destroy_session,
    get_current_user_and_session
)
from app.database import get_db_connection, log_audit
from app.config import SESSION_COOKIE_NAME

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    password: str

class SetupRequest(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/me")
async def get_me(request: Request):
    setup_needed = not is_admin_set_up()
    
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        return {"authenticated": False, "setup_required": setup_needed, "csrf_token": None}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT csrf_token, expires_at FROM sessions WHERE token = ?", (session_token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"authenticated": False, "setup_required": setup_needed, "csrf_token": None}

    return {
        "authenticated": True,
        "setup_required": False,
        "csrf_token": row["csrf_token"],
        "user": "admin"
    }

@router.post("/setup")
async def setup_initial_password(payload: SetupRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    if is_admin_set_up():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin password already established.")

    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters.")

    success = setup_admin_password(payload.password, client_ip)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Setup failed.")

    secure_cookie = request.url.scheme == "https" or os.environ.get("SECURE_COOKIES", "false").lower() in ("true", "1")
    session_token, csrf_token = create_session(client_ip, request.headers.get("User-Agent"))
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=86400 * 7
    )
    return {"success": True, "csrf_token": csrf_token, "session_token": session_token}

@router.post("/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"

    # Check lockout
    is_locked, remaining = check_ip_lockout(client_ip)
    if is_locked:
        log_audit("admin", "login_locked", None, f"Locked out, {remaining}s remaining", "BLOCKED", client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Locked out for {remaining} more seconds."
        )

    # Check admin auth
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM admin_auth WHERE id = 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin setup required before login.")

    valid = verify_password(row["password_hash"], payload.password)
    if not valid:
        record_failed_login(client_ip)
        log_audit("admin", "login_failed", None, "Invalid password attempt", "FAILURE", client_ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    # Successful login
    reset_failed_logins(client_ip)
    secure_cookie = request.url.scheme == "https" or os.environ.get("SECURE_COOKIES", "false").lower() in ("true", "1")
    session_token, csrf_token = create_session(client_ip, request.headers.get("User-Agent"))
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=86400 * 7
    )
    log_audit("admin", "login_success", None, "Logged in successfully", "SUCCESS", client_ip)
    return {"success": True, "csrf_token": csrf_token, "session_token": session_token}

@router.post("/logout")
async def logout(request: Request, response: Response, session: dict = Depends(get_current_user_and_session)):
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if session_token:
        destroy_session(session_token)
    response.delete_cookie(SESSION_COOKIE_NAME)
    log_audit("admin", "logout", None, "Logged out", "SUCCESS", request.client.host if request.client else None)
    return {"success": True}

@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters.")

    success = change_admin_password(payload.old_password, payload.new_password, client_ip)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password.")

    return {"success": True, "message": "Password updated successfully."}
