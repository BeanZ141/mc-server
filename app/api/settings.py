import asyncio
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.settings_manager import settings_manager
from app.helper_client import helper_client
from app.rcon_client import rcon_client
from app.config import get_minecraft_data_dir
from app.database import log_audit, get_panel_setting, set_panel_setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


class PanelPrefsPayload(BaseModel):
    alert_webhook_url: str = ""


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
    pvp: bool | None = None
    hardcore: bool | None = None
    motd: str | None = None
    view_distance: int | None = None
    simulation_distance: int | None = None
    enable_command_block: bool | None = None
    allow_nether: bool | None = None
    spawn_monsters: bool | None = None
    spawn_animals: bool | None = None
    spawn_npcs: bool | None = None
    force_gamemode: bool | None = None


@router.get("")
async def get_settings(session: dict = Depends(get_current_user_and_session)):
    return await asyncio.to_thread(settings_manager.get_structured_settings)


def _safe_int(val: str | None, default: int) -> int:
    try:
        return int(str(val).strip())
    except Exception:
        return default


@router.get("/properties")
async def get_server_properties(session: dict = Depends(get_current_user_and_session)):
    parsed = settings_manager.parse_env()
    return {
        "max_players": _safe_int(parsed.get("MAX_PLAYERS"), 8),
        "gamemode": parsed.get("MODE", "survival").lower(),
        "difficulty": parsed.get("DIFFICULTY", "easy").lower(),
        "whitelist": parsed.get("ENABLE_WHITELIST", "false").lower() == "true",
        "allow_flight": parsed.get("ALLOW_FLIGHT", "false").lower() == "true",
        "spawn_protection": _safe_int(parsed.get("SPAWN_PROTECTION"), 16),
        "pvp": parsed.get("PVP", "true").lower() == "true",
        "hardcore": parsed.get("HARDCORE", "false").lower() == "true",
        "motd": parsed.get("MOTD", "palvi"),
        "view_distance": _safe_int(parsed.get("VIEW_DISTANCE"), 16),
        "simulation_distance": _safe_int(parsed.get("SIMULATION_DISTANCE"), 6),
        "enable_command_block": parsed.get("ENABLE_COMMAND_BLOCK", "false").lower() == "true",
        "allow_nether": parsed.get("ALLOW_NETHER", "true").lower() == "true",
        "spawn_monsters": parsed.get("SPAWN_MONSTERS", "true").lower() == "true",
        "spawn_animals": parsed.get("SPAWN_ANIMALS", "true").lower() == "true",
        "spawn_npcs": parsed.get("SPAWN_NPCS", "true").lower() == "true",
        "force_gamemode": parsed.get("FORCE_GAMEMODE", "false").lower() == "true"
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

    parsed = settings_manager.parse_env()
    pvp = payload.pvp if payload.pvp is not None else (parsed.get("PVP", "true").lower() == "true")
    hardcore = payload.hardcore if payload.hardcore is not None else (parsed.get("HARDCORE", "false").lower() == "true")
    motd = payload.motd if payload.motd is not None else parsed.get("MOTD", "palvi")
    motd_clean = motd.strip()
    if len(motd_clean) > 120 or any(ch in motd_clean for ch in ("\r", "\n", "\x00")):
        raise HTTPException(status_code=400, detail="MOTD must be at most 120 characters with no control characters.")

    view_distance = payload.view_distance if payload.view_distance is not None else _safe_int(parsed.get("VIEW_DISTANCE"), 16)
    sim_distance = payload.simulation_distance if payload.simulation_distance is not None else _safe_int(parsed.get("SIMULATION_DISTANCE"), 6)
    if view_distance < 2 or view_distance > 32:
        raise HTTPException(status_code=400, detail="View distance must be between 2 and 32.")
    if sim_distance < 2 or sim_distance > 32:
        raise HTTPException(status_code=400, detail="Simulation distance must be between 2 and 32.")

    enable_cmd = payload.enable_command_block if payload.enable_command_block is not None else (parsed.get("ENABLE_COMMAND_BLOCK", "false").lower() == "true")
    allow_nether = payload.allow_nether if payload.allow_nether is not None else (parsed.get("ALLOW_NETHER", "true").lower() == "true")
    spawn_monsters = payload.spawn_monsters if payload.spawn_monsters is not None else (parsed.get("SPAWN_MONSTERS", "true").lower() == "true")
    spawn_animals = payload.spawn_animals if payload.spawn_animals is not None else (parsed.get("SPAWN_ANIMALS", "true").lower() == "true")
    spawn_npcs = payload.spawn_npcs if payload.spawn_npcs is not None else (parsed.get("SPAWN_NPCS", "true").lower() == "true")
    force_gamemode = payload.force_gamemode if payload.force_gamemode is not None else (parsed.get("FORCE_GAMEMODE", "false").lower() == "true")

    updates = {
        "MAX_PLAYERS": str(payload.max_players),
        "MODE": payload.gamemode.lower(),
        "DIFFICULTY": payload.difficulty.lower(),
        "ENABLE_WHITELIST": "true" if payload.whitelist else "false",
        "ALLOW_FLIGHT": "true" if payload.allow_flight else "false",
        "SPAWN_PROTECTION": str(payload.spawn_protection),
        "PVP": "true" if pvp else "false",
        "HARDCORE": "true" if hardcore else "false",
        "MOTD": motd_clean,
        "VIEW_DISTANCE": str(view_distance),
        "SIMULATION_DISTANCE": str(sim_distance),
        "ENABLE_COMMAND_BLOCK": "true" if enable_cmd else "false",
        "ALLOW_NETHER": "true" if allow_nether else "false",
        "SPAWN_MONSTERS": "true" if spawn_monsters else "false",
        "SPAWN_ANIMALS": "true" if spawn_animals else "false",
        "SPAWN_NPCS": "true" if spawn_npcs else "false",
        "FORCE_GAMEMODE": "true" if force_gamemode else "false"
    }

    target_content = settings_manager.build_updated_content(updates)
    backup_file = await asyncio.to_thread(settings_manager.save_with_backup, target_content)

    prop_map = {
        "max-players": str(payload.max_players),
        "gamemode": payload.gamemode.lower(),
        "difficulty": payload.difficulty.lower(),
        "white-list": "true" if payload.whitelist else "false",
        "allow-flight": "true" if payload.allow_flight else "false",
        "spawn-protection": str(payload.spawn_protection),
        "pvp": "true" if pvp else "false",
        "hardcore": "true" if hardcore else "false",
        "motd": motd_clean,
        "view-distance": str(view_distance),
        "simulation-distance": str(sim_distance),
        "enable-command-block": "true" if enable_cmd else "false",
        "allow-nether": "true" if allow_nether else "false",
        "spawn-monsters": "true" if spawn_monsters else "false",
        "spawn-animals": "true" if spawn_animals else "false",
        "spawn-npcs": "true" if spawn_npcs else "false",
        "force-gamemode": "true" if force_gamemode else "false"
    }
    await asyncio.to_thread(_sync_server_properties_file, prop_map)

    try:
        await asyncio.gather(
            rcon_client.execute(f"difficulty {payload.difficulty.lower()}"),
            rcon_client.execute(f"whitelist {'on' if payload.whitelist else 'off'}"),
            rcon_client.execute(f"defaultgamemode {payload.gamemode.lower()}"),
            return_exceptions=True
        )
    except Exception:
        pass

    log_audit(
        "admin",
        "save_properties",
        "mc.env",
        f"Saved properties: max_players={payload.max_players}, mode={payload.gamemode}, diff={payload.difficulty}, whitelist={payload.whitelist}, view_dist={view_distance}, sim_dist={sim_distance}, pvp={pvp}",
        "SUCCESS",
        client_ip
    )

    return {
        "success": True,
        "message": "Server properties saved. Difficulty/Whitelist/Gamemode synced live via RCON; container flags apply on next wake/restart or Settings -> Apply & Recreate.",
        "backup_file": backup_file,
        "properties": {
            "max_players": payload.max_players,
            "gamemode": payload.gamemode.lower(),
            "difficulty": payload.difficulty.lower(),
            "whitelist": payload.whitelist,
            "allow_flight": payload.allow_flight,
            "spawn_protection": payload.spawn_protection,
            "pvp": pvp,
            "hardcore": hardcore,
            "motd": motd_clean,
            "view_distance": view_distance,
            "simulation_distance": sim_distance,
            "enable_command_block": enable_cmd,
            "allow_nether": allow_nether,
            "spawn_monsters": spawn_monsters,
            "spawn_animals": spawn_animals,
            "spawn_npcs": spawn_npcs,
            "force_gamemode": force_gamemode
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


@router.get("/panel-prefs")
async def get_panel_prefs(session: dict = Depends(get_current_user_and_session)):
    url = await asyncio.to_thread(get_panel_setting, "alert_webhook_url", "")
    return {"alert_webhook_url": url}


@router.post("/panel-prefs")
async def save_panel_prefs(
    payload: PanelPrefsPayload,
    request: Request,
    session: dict = Depends(get_current_user_and_session)
):
    client_ip = request.client.host if request.client else "unknown"
    url = (payload.alert_webhook_url or "").strip()
    if url:
        if len(url) > 500 or any(ch in url for ch in ("\r", "\n", "\x00")) or not url.startswith(("https://", "http://")):
            raise HTTPException(status_code=400, detail="Alert webhook URL must start with http:// or https://")
    await asyncio.to_thread(set_panel_setting, "alert_webhook_url", url)
    log_audit("admin", "update_panel_prefs", "panel_settings", "Updated alert webhook URL", "SUCCESS", client_ip)
    return {"success": True, "alert_webhook_url": url}
