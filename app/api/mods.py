from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from pathlib import Path
from app.auth import get_current_user_and_session
from app.modrinth import modrinth_client
from app.settings_manager import settings_manager
from app.helper_client import helper_client
from app.config import MINECRAFT_DATA_DIR
from app.database import log_audit

router = APIRouter(prefix="/api/mods", tags=["mods"])

class ModActionRequest(BaseModel):
    slug: str

@router.get("/installed")
async def get_installed_mods(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    modrinth_projects = parsed.get("MODRINTH_PROJECTS", "")
    return modrinth_client.scan_installed_mods(modrinth_projects)

@router.get("/search")
async def search_mods(
    q: str = "",
    limit: int = 20,
    offset: int = 0,
    sort: str = "downloads",
    category: str | None = None,
    session: dict = Depends(get_current_user_and_session)
):
    results = await modrinth_client.search_mods(query=q, limit=limit, offset=offset, sort=sort, category=category)
    return results

@router.get("/check")
async def check_mod(slug: str, session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    game_version = parsed.get("VERSION", "26.3")
    compat = await modrinth_client.check_compatibility(slug_or_id=slug, game_version=game_version, loader="fabric")
    return compat

@router.post("/add")
async def add_mod(payload: ModActionRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    slug = payload.slug.strip().lower()

    parsed = settings_manager.parse_env()
    game_version = parsed.get("VERSION", "26.3")

    # 1. Compatibility check
    compat = await modrinth_client.check_compatibility(slug, game_version=game_version, loader="fabric")
    if not compat["compatible"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot add '{slug}': {compat['reason']}"
        )

    # 2. Append to MODRINTH_PROJECTS in mc.env with backup
    settings_manager.update_mod_projects(slug, action="add")

    # 3. Trigger recreate-mc so itzg downloads it
    success, output = await helper_client.execute_and_collect("recreate-mc")

    log_audit("admin", "add_mod", slug, f"Added mod {slug} (success={success})", "SUCCESS" if success else "FAILURE", client_ip)
    return {
        "success": success,
        "slug": slug,
        "client_required": compat["client_required"],
        "message": f"Mod {slug} added. Recreating server to apply.",
        "output": output
    }

@router.post("/remove")
async def remove_mod(payload: ModActionRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    slug = payload.slug.strip().lower()

    # 1. Remove from MODRINTH_PROJECTS in mc.env
    settings_manager.update_mod_projects(slug, action="remove")

    # 2. Also check if old jar file exists in mods/ and delete it
    mods_dir = MINECRAFT_DATA_DIR / "mods"
    cleaned_files = []
    if mods_dir.exists():
        clean_slug = slug.replace("-", "").replace("_", "")
        for f in mods_dir.iterdir():
            if f.is_file() and f.name.endswith(".jar"):
                clean_name = f.name.lower().replace("-", "").replace("_", "")
                if clean_slug in clean_name:
                    try:
                        f.unlink()
                        cleaned_files.append(f.name)
                    except Exception:
                        pass

    # 3. Trigger recreate-mc
    success, output = await helper_client.execute_and_collect("recreate-mc")

    log_audit("admin", "remove_mod", slug, f"Removed mod {slug}, deleted: {cleaned_files}", "SUCCESS" if success else "FAILURE", client_ip)
    return {
        "success": success,
        "slug": slug,
        "cleaned_jars": cleaned_files,
        "message": f"Mod {slug} removed and cleaned up.",
        "output": output
    }

@router.delete("/manual/{filename}")
async def delete_manual_mod(filename: str, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    
    # Path traversal protection
    if ".." in filename or "/" in filename or "\\" in filename or not filename.endswith(".jar"):
        raise HTTPException(status_code=400, detail="Invalid jar filename.")

    target_file = MINECRAFT_DATA_DIR / "mods" / filename
    if not target_file.exists():
        raise HTTPException(status_code=404, detail="Jar file not found.")

    target_file.unlink()
    log_audit("admin", "delete_manual_jar", filename, f"Deleted manual jar {filename}", "SUCCESS", client_ip)
    return {"success": True, "message": f"Deleted {filename}"}
