import os
import shutil
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.config import BACKUP_DIR, MINECRAFT_DATA_DIR
from app.helper_client import helper_client
from app.docker_client import docker_client
from app.settings_manager import settings_manager
from app.database import log_audit

router = APIRouter(prefix="/api/backups", tags=["backups"])

class RestoreRequest(BaseModel):
    backup_id: str

def get_directory_size_bytes(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    try:
        if path.is_file():
            return path.stat().st_size
        for entry in path.rglob("*"):
            if entry.is_file():
                try:
                    total += entry.stat().st_size
                except Exception:
                    pass
    except Exception:
        pass
    return total

def format_size(bytes_val: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.1f} PB"

@router.get("")
async def list_backups(session: dict = Depends(get_current_user_and_session)):
    backups = []
    if BACKUP_DIR.exists():
        for f in BACKUP_DIR.iterdir():
            if f.is_file() and f.name.endswith(".tar.gz"):
                stat = f.stat()
                backups.append({
                    "id": f.name.replace(".tar.gz", ""),
                    "filename": f.name,
                    "size_bytes": stat.st_size,
                    "size_human": format_size(stat.st_size),
                    "created_at": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "is_safety": "safety" in f.name
                })

    # Sort newest first
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return {"backups": backups}

@router.post("/create")
async def create_backup(request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    success, output = await helper_client.execute_and_collect("backup")
    if not success:
        log_audit("admin", "create_backup", "minecraft", f"Failed: {output}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Backup creation failed: {output}")

    log_audit("admin", "create_backup", "minecraft", "Manual backup completed", "SUCCESS", client_ip)
    return {"success": True, "message": "Backup created successfully.", "output": output}

@router.post("/restore")
async def restore_backup(payload: RestoreRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    
    # 1. Minecraft MUST be stopped
    mc_info = await docker_client.get_container("mc")
    if mc_info and mc_info.get("State", {}).get("Running", False):
        raise HTTPException(status_code=400, detail="Cannot restore while Minecraft is running! Stop the server first.")

    success, output = await helper_client.execute_and_collect("restore", payload.backup_id)
    if not success:
        log_audit("admin", "restore_backup", payload.backup_id, f"Failed: {output}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Restore failed: {output}")

    log_audit("admin", "restore_backup", payload.backup_id, "Restore completed", "SUCCESS", client_ip)
    return {"success": True, "message": f"Backup {payload.backup_id} restored successfully.", "output": output}

@router.get("/disk-usage")
async def get_disk_usage(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    level_name = parsed.get("LEVEL", "BabaSquadWorld")
    world_path = MINECRAFT_DATA_DIR / level_name

    world_size = get_directory_size_bytes(world_path)
    backups_size = get_directory_size_bytes(BACKUP_DIR)

    # Free space on /programming and /mnt/media
    mc_free = 0
    mc_total = 0
    try:
        usage = shutil.disk_usage(str(MINECRAFT_DATA_DIR))
        mc_free = usage.free
        mc_total = usage.total
    except Exception:
        pass

    backup_free = 0
    backup_total = 0
    try:
        b_usage = shutil.disk_usage(str(BACKUP_DIR if BACKUP_DIR.exists() else Path(".")))
        backup_free = b_usage.free
        backup_total = b_usage.total
    except Exception:
        pass

    return {
        "world_size_bytes": world_size,
        "world_size_human": format_size(world_size),
        "backups_size_bytes": backups_size,
        "backups_size_human": format_size(backups_size),
        "programming_disk": {
            "free_bytes": mc_free,
            "free_human": format_size(mc_free),
            "total_bytes": mc_total,
            "total_human": format_size(mc_total)
        },
        "media_disk": {
            "free_bytes": backup_free,
            "free_human": format_size(backup_free),
            "total_bytes": backup_total,
            "total_human": format_size(backup_total)
        }
    }
