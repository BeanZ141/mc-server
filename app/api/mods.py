import re
import asyncio
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.modrinth import modrinth_client
from app.settings_manager import settings_manager
from app.helper_client import helper_client
from app.config import get_minecraft_data_dir
from app.database import log_audit

router = APIRouter(prefix="/api/mods", tags=["mods"])
_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9\-_]{0,63}$")
_LOADER_MAP = {"FABRIC": "fabric", "NEOFORGE": "neoforge", "FORGE": "forge"}


class ModActionRequest(BaseModel):
    slug: str


def _resolve_loader_and_version() -> tuple[str, str]:
    parsed = settings_manager.parse_env()
    sw_type = parsed.get("TYPE", "FABRIC").upper()
    loader = _LOADER_MAP.get(sw_type, "fabric")
    game_version = parsed.get("VERSION", "26.3")
    return loader, game_version


@router.get("/installed")
async def get_installed_mods(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    modrinth_projects = parsed.get("MODRINTH_PROJECTS", "")
    loader, game_version = _resolve_loader_and_version()
    res = await asyncio.to_thread(modrinth_client.scan_installed_mods, modrinth_projects)
    res["loader"] = loader
    res["game_version"] = game_version
    return res


@router.get("/search")
async def search_mods(
    q: str = "",
    limit: int = 20,
    offset: int = 0,
    sort: str = "downloads",
    category: str | None = None,
    environment: str | None = None,
    session: dict = Depends(get_current_user_and_session)
):
    loader, game_version = _resolve_loader_and_version()
    results = await modrinth_client.search_mods(
        query=q,
        limit=max(1, min(limit, 50)),
        offset=max(0, offset),
        sort=sort,
        category=category,
        environment=environment,
        game_version=game_version,
        loader=loader
    )
    results["loader"] = loader
    results["game_version"] = game_version
    return results


@router.get("/check")
async def check_mod(slug: str, session: dict = Depends(get_current_user_and_session)):
    clean_slug = slug.strip().lower()
    if not _SLUG_RE.match(clean_slug):
        raise HTTPException(status_code=400, detail="Invalid mod slug.")
    loader, game_version = _resolve_loader_and_version()
    return await modrinth_client.check_compatibility(slug_or_id=clean_slug, game_version=game_version, loader=loader)


@router.post("/add")
async def add_mod(payload: ModActionRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    slug = payload.slug.strip().lower()
    if not _SLUG_RE.match(slug):
        raise HTTPException(status_code=400, detail="Invalid mod slug.")

    loader, game_version = _resolve_loader_and_version()
    compat = await modrinth_client.check_compatibility(slug, game_version=game_version, loader=loader)
    if not compat["compatible"]:
        raise HTTPException(status_code=400, detail=f"Cannot add '{slug}': {compat['reason']}")

    await asyncio.to_thread(settings_manager.update_mod_projects, slug, "add")
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
    if not _SLUG_RE.match(slug):
        raise HTTPException(status_code=400, detail="Invalid mod slug.")

    await asyncio.to_thread(settings_manager.update_mod_projects, slug, "remove")

    mods_dir = get_minecraft_data_dir() / "mods"
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
                    except OSError:
                        pass

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

    if ".." in filename or "/" in filename or "\\" in filename or not filename.endswith(".jar"):
        raise HTTPException(status_code=400, detail="Invalid jar filename.")

    target_file = get_minecraft_data_dir() / "mods" / filename
    if not target_file.exists():
        raise HTTPException(status_code=404, detail="Jar file not found.")

    target_file.unlink()
    log_audit("admin", "delete_manual_jar", filename, f"Deleted manual jar {filename}", "SUCCESS", client_ip)
    return {"success": True, "message": f"Deleted {filename}"}
