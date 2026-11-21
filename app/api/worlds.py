import os
import shutil
import zipfile
import tempfile
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.auth import get_current_user_and_session
from app.config import get_minecraft_data_dir
from app.settings_manager import settings_manager
from app.database import log_audit

router = APIRouter(prefix="/api/worlds", tags=["worlds"])

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

def get_dir_size(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    try:
        for entry in path.rglob("*"):
            if entry.is_file():
                total += entry.stat().st_size
    except Exception:
        pass
    return total

class GenerateWorldRequest(BaseModel):
    world_name: str
    seed: str = ""
    level_type: str = "minecraft:normal"
    generate_structures: bool = True
    confirm: bool = False

@router.get("/info")
async def get_world_info(session: dict = Depends(get_current_user_and_session)):
    """
    Returns current world name, seed, disk usage, dimensions, and components.
    """
    parsed = settings_manager.parse_env()
    world_name = parsed.get("LEVEL", "BabaSquadWorld")
    seed = parsed.get("SEED", "")
    
    world_dir = get_minecraft_data_dir() / world_name
    exists = world_dir.exists() and world_dir.is_dir()
    
    size_bytes = get_dir_size(world_dir) if exists else 0
    
    # Check dimensions
    has_overworld = (world_dir / "region").exists()
    has_nether = (world_dir / "DIM-1").exists()
    has_end = (world_dir / "DIM1").exists()
    has_level_dat = (world_dir / "level.dat").exists()
    
    # Datapacks
    datapacks_dir = world_dir / "datapacks"
    datapacks = []
    if datapacks_dir.exists():
        try:
            datapacks = [d.name for d in datapacks_dir.iterdir() if d.is_dir() or d.suffix == ".zip"]
        except Exception:
            pass

    # Count players
    playerdata_dir = world_dir / "playerdata"
    players_count = 0
    if playerdata_dir.exists():
        try:
            players_count = len([f for f in playerdata_dir.iterdir() if f.is_file() and f.suffix == ".dat"])
        except Exception:
            pass

    return {
        "world_name": world_name,
        "seed": seed,
        "exists": exists,
        "size_bytes": size_bytes,
        "size_formatted": format_size(size_bytes),
        "has_level_dat": has_level_dat,
        "has_overworld": has_overworld,
        "has_nether": has_nether,
        "has_end": has_end,
        "datapacks": datapacks,
        "player_records": players_count,
        "path": f"/{world_name}"
    }

@router.get("/download")
async def download_world(session: dict = Depends(get_current_user_and_session)):
    """
    Archives the current active world and streams it for download.
    """
    parsed = settings_manager.parse_env()
    world_name = parsed.get("LEVEL", "BabaSquadWorld")
    world_dir = get_minecraft_data_dir() / world_name

    if not world_dir.exists():
        raise HTTPException(status_code=404, detail=f"World directory '{world_name}' not found.")

    tmp_dir = tempfile.mkdtemp()
    archive_base = Path(tmp_dir) / f"{world_name}"
    zip_path = shutil.make_archive(str(archive_base), "zip", root_dir=str(world_dir))

    return FileResponse(
        path=zip_path,
        filename=f"{world_name}.zip",
        media_type="application/zip"
    )

@router.post("/upload")
async def upload_world(
    file: UploadFile = File(...),
    request: Request = None,
    session: dict = Depends(get_current_user_and_session)
):
    """
    Uploads and imports a world zip archive. Validates that level.dat is present.
    """
    client_ip = request.client.host if request and request.client else "unknown"
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip world archives are supported.")

    tmp_dir = tempfile.mkdtemp()
    zip_target = Path(tmp_dir) / "uploaded_world.zip"

    with open(zip_target, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Validate zip contents
    has_level_dat = False
    prefix_folder = None

    try:
        with zipfile.ZipFile(zip_target, "r") as z:
            namelist = z.namelist()
            for name in namelist:
                parts = Path(name).parts
                if Path(name).name == "level.dat":
                    has_level_dat = True
                    if len(parts) > 1:
                        prefix_folder = parts[0]
                    break
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Corrupt or invalid zip archive: {e}")

    if not has_level_dat:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=400,
            detail="Invalid world archive: 'level.dat' not found inside the zip. Ensure you are uploading a valid Minecraft world."
        )

    # Determine imported world name
    base_name = Path(file.filename).stem.replace(" ", "_")
    target_world_dir = get_minecraft_data_dir() / base_name

    # If it already exists, append timestamp
    if target_world_dir.exists():
        from datetime import datetime
        base_name = f"{base_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        target_world_dir = get_minecraft_data_dir() / base_name

    target_world_dir.mkdir(parents=True, exist_ok=True)

    # Extract contents safely
    try:
        with zipfile.ZipFile(zip_target, "r") as z:
            for member in z.infolist():
                # Prevent Zip Slip directory traversal
                member_path = Path(member.filename)
                if prefix_folder and member_path.parts[0] == prefix_folder:
                    rel_parts = member_path.parts[1:]
                    if not rel_parts:
                        continue
                    dest_path = target_world_dir.joinpath(*rel_parts)
                else:
                    dest_path = target_world_dir / member_path

                if not dest_path.resolve().is_relative_to(target_world_dir.resolve()):
                    continue

                if member.is_dir():
                    dest_path.mkdir(parents=True, exist_ok=True)
                else:
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(member) as src, open(dest_path, "wb") as dst:
                        shutil.copyfileobj(src, dst)
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to extract world archive: {e}")

    shutil.rmtree(tmp_dir, ignore_errors=True)

    # Update LEVEL in mc.env
    current_env = settings_manager.parse_env()
    current_env["LEVEL"] = base_name
    new_content = "\n".join(f"{k}={v}" for k, v in current_env.items()) + "\n"
    settings_manager.save_with_backup(new_content)

    log_audit("admin", "world_upload", base_name, f"Imported world '{base_name}' from {file.filename}", "SUCCESS", client_ip)

    return {
        "success": True,
        "world_name": base_name,
        "message": f"World '{base_name}' imported and set as active LEVEL in mc.env. Restart server to load."
    }

@router.post("/generate")
async def generate_world(
    payload: GenerateWorldRequest,
    request: Request,
    session: dict = Depends(get_current_user_and_session)
):
    """
    Configures new world generation settings. Requires explicit confirmation.
    """
    client_ip = request.client.host if request.client else "unknown"
    if not payload.confirm:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required. Generating a new world will change the active LEVEL in server configuration."
        )

    name = payload.world_name.strip().replace(" ", "_")
    if not name or "/" in name or "\\" in name:
        raise HTTPException(status_code=400, detail="Invalid world name.")

    current_env = settings_manager.parse_env()
    current_env["LEVEL"] = name
    if payload.seed.strip():
        current_env["SEED"] = payload.seed.strip()
    else:
        current_env.pop("SEED", None)

    new_content = "\n".join(f"{k}={v}" for k, v in current_env.items()) + "\n"
    backup = settings_manager.save_with_backup(new_content)

    log_audit("admin", "world_generate", name, f"Configured new world {name} (seed: {payload.seed})", "SUCCESS", client_ip)

    return {
        "success": True,
        "world_name": name,
        "seed": payload.seed,
        "backup": backup,
        "message": f"World '{name}' configured. The new world will generate on next server start/restart."
    }

@router.get("/files")
async def get_world_files(session: dict = Depends(get_current_user_and_session)):
    """
    Returns files and subdirectories specifically inside the active world directory.
    """
    parsed = settings_manager.parse_env()
    world_name = parsed.get("LEVEL", "BabaSquadWorld")
    world_dir = get_minecraft_data_dir() / world_name

    if not world_dir.exists():
        return {"world_name": world_name, "exists": False, "files": []}

    known_targets = ["level.dat", "session.lock", "data", "datapacks", "playerdata", "region", "poi", "DIM-1", "DIM1"]
    items = []
    
    for item_name in known_targets:
        item_path = world_dir / item_name
        if item_path.exists():
            is_dir = item_path.is_dir()
            size = get_dir_size(item_path) if is_dir else item_path.stat().st_size
            items.append({
                "name": item_name,
                "type": "directory" if is_dir else "file",
                "size_formatted": format_size(size),
                "path": f"{world_name}/{item_name}"
            })

    return {
        "world_name": world_name,
        "exists": True,
        "files": items
    }
