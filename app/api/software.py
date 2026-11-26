import asyncio
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.settings_manager import settings_manager
from app.database import log_audit

router = APIRouter(prefix="/api/software", tags=["software"])

SOFTWARE_CATALOG = [
    {
        "id": "FABRIC",
        "name": "Fabric",
        "description": "Lightweight, experimental modding toolchain for Minecraft. Default and currently installed software.",
        "icon": "fabric",
        "supports_mods": True,
        "supports_plugins": False,
        "mod_loader": "fabric",
        "is_default": True
    },
    {
        "id": "VANILLA",
        "name": "Vanilla",
        "description": "The official Minecraft server by Mojang. Pure unmodified game experience without mods or plugins.",
        "icon": "vanilla",
        "supports_mods": False,
        "supports_plugins": False,
        "mod_loader": None,
        "is_default": False
    },
    {
        "id": "SNAPSHOT",
        "name": "Snapshot",
        "description": "Preview versions of upcoming Minecraft updates. For testing future features and bug reporting.",
        "icon": "snapshot",
        "supports_mods": False,
        "supports_plugins": False,
        "mod_loader": None,
        "is_default": False
    },
    {
        "id": "PAPER",
        "name": "Paper / Bukkit",
        "description": "High-performance Minecraft server software designed to eliminate lag and fix exploits, supporting Spigot and Bukkit plugins.",
        "icon": "paper",
        "supports_mods": False,
        "supports_plugins": True,
        "mod_loader": None,
        "is_default": False
    },
    {
        "id": "NEOFORGE",
        "name": "NeoForge",
        "description": "Modern fork of the Minecraft Forge mod loader for recent Minecraft versions with enhanced API support.",
        "icon": "neoforge",
        "supports_mods": True,
        "supports_plugins": False,
        "mod_loader": "neoforge",
        "is_default": False
    },
    {
        "id": "FORGE",
        "name": "Forge",
        "description": "Classic modding platform with the largest legacy ecosystem of mods for Minecraft.",
        "icon": "forge",
        "supports_mods": True,
        "supports_plugins": False,
        "mod_loader": "forge",
        "is_default": False
    }
]


class SwitchSoftwareRequest(BaseModel):
    software_id: str
    version: str | None = None
    confirm: bool = False


@router.get("")
async def get_software_info(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    current_type = parsed.get("TYPE", "FABRIC").upper()
    current_version = parsed.get("VERSION", "26.3")

    return {
        "current": {
            "type": current_type,
            "version": current_version,
            "name": "Fabric" if current_type == "FABRIC" else current_type.capitalize(),
            "is_default": (current_type == "FABRIC"),
            "status": "Installed (Active)"
        },
        "available": SOFTWARE_CATALOG
    }


@router.post("/switch")
async def switch_software(
    payload: SwitchSoftwareRequest,
    request: Request,
    session: dict = Depends(get_current_user_and_session)
):
    client_ip = request.client.host if request.client else "unknown"
    sw_id = payload.software_id.upper()

    matching = next((s for s in SOFTWARE_CATALOG if s["id"] == sw_id), None)
    if not matching:
        raise HTTPException(status_code=400, detail=f"Unknown software type: '{payload.software_id}'")

    if not payload.confirm:
        return {
            "needs_confirmation": True,
            "warning": (
                f"Switching from Fabric to {matching['name']} will disable existing Fabric mods "
                "(fabric-api, lithium, ferrite-core, etc.). Your world may require backup before switching. "
                "Confirm to proceed."
            ),
            "software": matching
        }

    updates = {"TYPE": sw_id}
    if payload.version:
        if any(c in payload.version for c in ("\r", "\n")):
            raise HTTPException(status_code=400, detail="Invalid version format.")
        updates["VERSION"] = payload.version.strip()

    new_content = settings_manager.build_updated_content(updates)
    backup = await asyncio.to_thread(settings_manager.save_with_backup, new_content)

    log_audit("admin", "switch_software", sw_id, f"Switched software to {sw_id} (backup: {backup})", "SUCCESS", client_ip)
    return {
        "success": True,
        "message": f"Server software set to {matching['name']}. Server container recreation required to install.",
        "software": matching,
        "backup": backup
    }
