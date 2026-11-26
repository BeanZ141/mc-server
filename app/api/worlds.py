import os
import re
import shutil
import asyncio
import zipfile
import tempfile
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from pydantic import BaseModel

from app.auth import get_current_user_and_session
from app.config import get_minecraft_data_dir
from app.settings_manager import settings_manager
from app.database import log_audit
from app.utils import format_size, get_dir_size

router = APIRouter(prefix="/api/worlds", tags=["worlds"])
_WORLD_NAME_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


class GenerateWorldRequest(BaseModel):
    world_name: str
    seed: str = ""
    level_type: str = "minecraft:normal"
    generate_structures: bool = True
    confirm: bool = False


def _is_blocked_entry(name: str) -> bool:
    clean = name.strip()
    return clean.startswith(".") or clean.lower().endswith(".env")


def _collect_world_info_sync(world_name: str, seed: str) -> dict:
    world_dir = get_minecraft_data_dir() / world_name
    exists = world_dir.exists() and world_dir.is_dir()
    size_bytes = get_dir_size(world_dir) if exists else 0

    datapacks_dir = world_dir / "datapacks"
    datapacks = []
    if datapacks_dir.exists():
        try:
            datapacks = [d.name for d in datapacks_dir.iterdir() if d.is_dir() or d.suffix == ".zip"]
        except OSError:
            pass

    playerdata_dir = world_dir / "playerdata"
    players_count = 0
    if playerdata_dir.exists():
        try:
            players_count = sum(1 for f in playerdata_dir.iterdir() if f.is_file() and f.suffix == ".dat")
        except OSError:
            pass

    return {
        "world_name": world_name,
        "seed": seed,
        "exists": exists,
        "size_bytes": size_bytes,
        "size_formatted": format_size(size_bytes),
        "has_level_dat": (world_dir / "level.dat").exists(),
        "has_overworld": (world_dir / "region").exists(),
        "has_nether": (world_dir / "DIM-1").exists(),
        "has_end": (world_dir / "DIM1").exists(),
        "datapacks": datapacks,
        "player_records": players_count,
        "path": f"/{world_name}"
    }


def _create_world_zip_sync(world_dir: Path, tmp_dir: str, world_name: str) -> str:
    base_resolved = world_dir.resolve()
    zip_path = Path(tmp_dir) / f"{world_name}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(world_dir, followlinks=False):
            root_path = Path(root)
            pruned_dirs = []
            for d in dirs:
                if _is_blocked_entry(d):
                    continue
                d_path = root_path / d
                if d_path.is_symlink():
                    try:
                        resolved_d = d_path.resolve()
                        if not (resolved_d == base_resolved or resolved_d.is_relative_to(base_resolved)):
                            continue
                    except (ValueError, RuntimeError, OSError):
                        continue
                pruned_dirs.append(d)
            dirs[:] = pruned_dirs

            for fname in files:
                if _is_blocked_entry(fname):
                    continue
                fpath = root_path / fname
                if fpath.is_symlink():
                    try:
                        resolved_f = fpath.resolve()
                        if not (resolved_f == base_resolved or resolved_f.is_relative_to(base_resolved)):
                            continue
                    except (ValueError, RuntimeError, OSError):
                        continue
                arcname = str(fpath.relative_to(world_dir)).replace("\\", "/")
                zipf.write(fpath, arcname=arcname)
    return str(zip_path)


@router.get("/info")
async def get_world_info(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    world_name = parsed.get("LEVEL", "BabaSquadWorld")
    seed = parsed.get("SEED", "")
    return await asyncio.to_thread(_collect_world_info_sync, world_name, seed)


@router.get("/download")
async def download_world(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    world_name = parsed.get("LEVEL", "BabaSquadWorld")
    if not _WORLD_NAME_RE.match(world_name):
        raise HTTPException(status_code=400, detail="Invalid active world name.")

    world_dir = get_minecraft_data_dir() / world_name
    if not world_dir.exists() or not world_dir.is_dir():
        raise HTTPException(status_code=404, detail=f"World directory '{world_name}' not found.")

    tmp_dir = tempfile.mkdtemp()
    try:
        zip_path = await asyncio.to_thread(_create_world_zip_sync, world_dir, tmp_dir, world_name)
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to package world archive: {e}")

    return FileResponse(
        path=zip_path,
        filename=f"{world_name}.zip",
        media_type="application/zip",
        background=BackgroundTask(shutil.rmtree, tmp_dir, ignore_errors=True)
    )


def _extract_world_upload_sync(zip_target: Path, target_world_dir: Path, prefix_folder: str | None):
    resolved_target = target_world_dir.resolve()
    with zipfile.ZipFile(zip_target, "r") as z:
        for member in z.infolist():
            member_path = Path(member.filename)
            if not member_path.parts:
                continue
            if prefix_folder and member_path.parts[0] == prefix_folder:
                rel_parts = member_path.parts[1:]
                if not rel_parts:
                    continue
                dest_path = target_world_dir.joinpath(*rel_parts)
            else:
                dest_path = target_world_dir / member_path

            try:
                dest_resolved = dest_path.resolve()
            except OSError:
                continue
            if not (dest_resolved == resolved_target or dest_resolved.is_relative_to(resolved_target)):
                continue

            if member.is_dir():
                dest_path.mkdir(parents=True, exist_ok=True)
            else:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                with z.open(member) as src, open(dest_path, "wb") as dst:
                    shutil.copyfileobj(src, dst)


@router.post("/upload")
async def upload_world(
    file: UploadFile = File(...),
    request: Request = None,
    session: dict = Depends(get_current_user_and_session)
):
    client_ip = request.client.host if request and request.client else "unknown"
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip world archives are supported.")

    tmp_dir = tempfile.mkdtemp()
    zip_target = Path(tmp_dir) / "uploaded_world.zip"

    try:
        with open(zip_target, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        has_level_dat = False
        prefix_folder = None
        try:
            with zipfile.ZipFile(zip_target, "r") as z:
                for name in z.namelist():
                    parts = Path(name).parts
                    if Path(name).name == "level.dat":
                        has_level_dat = True
                        if len(parts) > 1:
                            prefix_folder = parts[0]
                        break
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Corrupt or invalid zip archive: {e}")

        if not has_level_dat:
            raise HTTPException(
                status_code=400,
                detail="Invalid world archive: 'level.dat' not found inside the zip. Ensure you are uploading a valid Minecraft world."
            )

        raw_stem = re.sub(r"[^a-zA-Z0-9_-]", "_", Path(file.filename).stem).strip("_") or "UploadedWorld"
        base_name = raw_stem[:48]
        target_world_dir = get_minecraft_data_dir() / base_name

        if target_world_dir.exists():
            base_name = f"{base_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            target_world_dir = get_minecraft_data_dir() / base_name

        target_world_dir.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(_extract_world_upload_sync, zip_target, target_world_dir, prefix_folder)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    new_content = settings_manager.build_updated_content({"LEVEL": base_name})
    await asyncio.to_thread(settings_manager.save_with_backup, new_content)

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
    client_ip = request.client.host if request.client else "unknown"
    if not payload.confirm:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required. Generating a new world will change the active LEVEL in server configuration."
        )

    name = payload.world_name.strip().replace(" ", "_")
    if not _WORLD_NAME_RE.match(name):
        raise HTTPException(
            status_code=400,
            detail="Invalid world name. Use 1-64 alphanumeric, underscore, or dash characters."
        )

    updates = {"LEVEL": name}
    remove_keys: list[str] = []
    seed_val = payload.seed.strip()
    if seed_val:
        if any(c in seed_val for c in ("\r", "\n")):
            raise HTTPException(status_code=400, detail="Invalid seed format.")
        updates["SEED"] = seed_val
    else:
        remove_keys.append("SEED")

    new_content = settings_manager.build_updated_content(updates, remove_keys=remove_keys)
    backup = await asyncio.to_thread(settings_manager.save_with_backup, new_content)

    log_audit("admin", "world_generate", name, f"Configured new world {name} (seed: {seed_val})", "SUCCESS", client_ip)
    return {
        "success": True,
        "world_name": name,
        "seed": seed_val,
        "backup": backup,
        "message": f"World '{name}' configured. The new world will generate on next server start/restart."
    }


def _collect_world_files_sync(world_name: str) -> dict:
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
    return {"world_name": world_name, "exists": True, "files": items}


@router.get("/files")
async def get_world_files(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    world_name = parsed.get("LEVEL", "BabaSquadWorld")
    return await asyncio.to_thread(_collect_world_files_sync, world_name)
