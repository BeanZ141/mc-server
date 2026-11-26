import shutil
import asyncio
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.config import get_backup_dir, get_minecraft_data_dir
from app.helper_client import helper_client
from app.docker_client import docker_client
from app.settings_manager import settings_manager
from app.database import log_audit
from app.utils import format_size, get_dir_size

router = APIRouter(prefix="/api/backups", tags=["backups"])


class RestoreRequest(BaseModel):
    backup_id: str


def _list_backups_sync() -> list[dict]:
    backup_dir = get_backup_dir()
    backups = []
    if backup_dir.exists():
        for f in backup_dir.iterdir():
            if f.is_file() and f.name.endswith(".tar.gz"):
                stat = f.stat()
                backups.append({
                    "id": f.name[:-7],
                    "filename": f.name,
                    "size_bytes": stat.st_size,
                    "size_human": format_size(stat.st_size),
                    "created_at": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "is_safety": "safety" in f.name
                })
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return backups


def _get_disk_usage_sync(level_name: str) -> dict:
    mc_dir = get_minecraft_data_dir()
    backup_dir = get_backup_dir()
    world_path = mc_dir / level_name

    world_size = get_dir_size(world_path)
    backups_size = get_dir_size(backup_dir)

    mc_free = mc_total = mc_used = 0
    mc_pct = 0.0
    try:
        usage = shutil.disk_usage(str(mc_dir if mc_dir.exists() else Path(".")))
        mc_free, mc_total, mc_used = usage.free, usage.total, usage.used
        mc_pct = round((mc_used / mc_total) * 100.0, 1) if mc_total > 0 else 0.0
    except Exception:
        pass

    backup_free = backup_total = backup_used = 0
    backup_pct = 0.0
    try:
        b_usage = shutil.disk_usage(str(backup_dir if backup_dir.exists() else Path(".")))
        backup_free, backup_total, backup_used = b_usage.free, b_usage.total, b_usage.used
        backup_pct = round((backup_used / backup_total) * 100.0, 1) if backup_total > 0 else 0.0
    except Exception:
        pass

    return {
        "world_size_bytes": world_size,
        "world_size_human": format_size(world_size),
        "backups_size_bytes": backups_size,
        "backups_size_human": format_size(backups_size),
        "programming_disk": {
            "used_bytes": mc_used,
            "free_bytes": mc_free,
            "free_human": format_size(mc_free),
            "total_bytes": mc_total,
            "total_human": format_size(mc_total),
            "percent_used": mc_pct
        },
        "media_disk": {
            "used_bytes": backup_used,
            "free_bytes": backup_free,
            "free_human": format_size(backup_free),
            "total_bytes": backup_total,
            "total_human": format_size(backup_total),
            "percent_used": backup_pct
        }
    }


@router.get("")
async def list_backups(session: dict = Depends(get_current_user_and_session)):
    backups = await asyncio.to_thread(_list_backups_sync)
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
    return await asyncio.to_thread(_get_disk_usage_sync, level_name)
