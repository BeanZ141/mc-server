import asyncio
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.settings_manager import settings_manager
from app.helper_client import helper_client
from app.rcon_client import rcon_client
from app.config import get_minecraft_data_dir
from app.database import log_audit

router = APIRouter(prefix="/api/settings", tags=["settings"])


class DiffRequest(BaseModel):
    raw_content: str | None = None
    updates: dict[str, str] | None = None


class ApplyRequest(BaseModel):
    raw_content: str | None = None
    updates: dict[str, str] | None = None
    force: bool = False


class PropertiesPayload(BaseModel):
    max_players: int = 8
    gamemode: str = "survival"
    difficulty: str = "easy"
    whitelist: bool = False
    allow_flight: bool = False
    spawn_protection: int = 16


@router.get("")
async def get_settings(session: dict = Depends(get_current_user_and_session)):
    return await asyncio.to_thread(settings_manager.get_structured_settings)


@router.get("/properties")
async def get_server_properties(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    return {
        "max_players": int(parsed.get("MAX_PLAYERS", "8")),
        "gamemode": parsed.get("MODE", "survival").lower(),
        "difficulty": parsed.get("DIFFICULTY", "easy").lower(),
        "whitelist": parsed.get("ENABLE_WHITELIST", "false").lower() == "true",
        "allow_flight": parsed.get("ALLOW_FLIGHT", "false").lower() == "true",
        "spawn_protection": int(parsed.get("SPAWN_PROTECTION", "16"))
    }


def _sync_server_properties_file(prop_map: dict[str, str]):
    server_props = get_minecraft_data_dir() / "server.properties"
    if not server_props.exists():
        return
    try:
        content = server_props.read_text(encoding="utf-8", errors="replace")
        new_prop_lines = []
        found_keys = set()
        for line in content.splitlines():
            clean_l = line.strip()
            if "=" in clean_l and not clean_l.startswith("#"):
                k, _ = clean_l.split("=", 1)
                k = k.strip()
                if k in prop_map:
                    new_prop_lines.append(f"{k}={prop_map[k]}")
                    found_keys.add(k)
                    continue
            new_prop_lines.append(line)
        for k, v in prop_map.items():
            if k not in found_keys:
                new_prop_lines.append(f"{k}={v}")
        server_props.write_text("\n".join(new_prop_lines) + "\n", encoding="utf-8")
    except Exception:
        pass


@router.post("/properties")
async def save_server_properties(
    payload: PropertiesPayload,
    request: Request,
    session: dict = Depends(get_current_user_and_session)
):
    client_ip = request.client.host if request.client else "unknown"

    if payload.max_players < 1 or payload.max_players > 100:
        raise HTTPException(status_code=400, detail="Maximum players must be between 1 and 100.")
    if payload.gamemode.lower() not in ("survival", "creative", "adventure", "spectator"):
        raise HTTPException(status_code=400, detail="Gamemode must be survival, creative, adventure, or spectator.")
    if payload.difficulty.lower() not in ("peaceful", "easy", "normal", "hard"):
        raise HTTPException(status_code=400, detail="Difficulty must be peaceful, easy, normal, or hard.")
    if payload.spawn_protection < 0 or payload.spawn_protection > 1000:
        raise HTTPException(status_code=400, detail="Spawn protection must be between 0 and 1000.")

    updates = {
        "MAX_PLAYERS": str(payload.max_players),
        "MODE": payload.gamemode.lower(),
        "DIFFICULTY": payload.difficulty.lower(),
        "ENABLE_WHITELIST": "true" if payload.whitelist else "false",
        "ALLOW_FLIGHT": "true" if payload.allow_flight else "false",
        "SPAWN_PROTECTION": str(payload.spawn_protection)
    }

    target_content = settings_manager.build_updated_content(updates)
    backup_file = await asyncio.to_thread(settings_manager.save_with_backup, target_content)

    prop_map = {
        "max-players": str(payload.max_players),
        "gamemode": payload.gamemode.lower(),
        "difficulty": payload.difficulty.lower(),
        "white-list": "true" if payload.whitelist else "false",
        "allow-flight": "true" if payload.allow_flight else "false",
        "spawn-protection": str(payload.spawn_protection)
    }
    await asyncio.to_thread(_sync_server_properties_file, prop_map)

    try:
        await asyncio.gather(
            rcon_client.execute(f"difficulty {payload.difficulty.lower()}"),
            rcon_client.execute(f"whitelist {'on' if payload.whitelist else 'off'}"),
            return_exceptions=True
        )
    except Exception:
        pass

    log_audit(
        "admin",
        "save_properties",
        "mc.env",
        f"Saved properties: max_players={payload.max_players}, mode={payload.gamemode}, diff={payload.difficulty}, whitelist={payload.whitelist}, flight={payload.allow_flight}, spawn_prot={payload.spawn_protection}",
        "SUCCESS",
        client_ip
    )

    return {
        "success": True,
        "message": "Server properties updated and saved successfully.",
        "backup_file": backup_file,
        "properties": {
            "max_players": payload.max_players,
            "gamemode": payload.gamemode.lower(),
            "difficulty": payload.difficulty.lower(),
            "whitelist": payload.whitelist,
            "allow_flight": payload.allow_flight,
            "spawn_protection": payload.spawn_protection
        }
    }


@router.post("/diff")
async def get_settings_diff(payload: DiffRequest, session: dict = Depends(get_current_user_and_session)):
    if payload.raw_content is not None:
        valid, msg = settings_manager.validate_raw(payload.raw_content)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        new_content = payload.raw_content
    elif payload.updates is not None:
        valid, msg = settings_manager.validate_settings(payload.updates)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        new_content = settings_manager.build_updated_content(payload.updates)
    else:
        raise HTTPException(status_code=400, detail="Provide raw_content or updates dict.")

    diff_text = settings_manager.generate_diff(new_content)
    return {"diff": diff_text, "new_content": new_content}


@router.post("/apply")
async def apply_settings(payload: ApplyRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"

    players_online = []
    try:
        player_info = await rcon_client.get_online_players()
        players_online = player_info.get("players", [])
    except Exception:
        pass

    if players_online and not payload.force:
        return {
            "success": False,
            "needs_confirmation": True,
            "players": players_online,
            "message": f"There are {len(players_online)} player(s) online: {', '.join(players_online)}. Applying settings recreates the server."
        }

    if payload.raw_content is not None:
        valid, msg = settings_manager.validate_raw(payload.raw_content)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        target_content = payload.raw_content
    elif payload.updates is not None:
        valid, msg = settings_manager.validate_settings(payload.updates)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        target_content = settings_manager.build_updated_content(payload.updates)
    else:
        raise HTTPException(status_code=400, detail="No content provided to apply.")

    backup_file = await asyncio.to_thread(settings_manager.save_with_backup, target_content)
    success, output = await helper_client.execute_and_collect("recreate-mc")

    if not success:
        log_audit("admin", "apply_settings", "mc.env", f"Settings applied but recreate failed: {output}", "FAILURE", client_ip)
        return {
            "success": False,
            "backup_file": backup_file,
            "message": f"Settings saved to {backup_file}, but recreate-mc encountered an error.",
            "output": output
        }

    log_audit("admin", "apply_settings", "mc.env", f"Applied settings and recreated mc (backup: {backup_file})", "SUCCESS", client_ip)
    return {
        "success": True,
        "backup_file": backup_file,
        "message": "Settings applied successfully and server safely transitioned to asleep.",
        "output": output
    }
