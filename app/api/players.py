import json
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from pathlib import Path
from app.auth import get_current_user_and_session
from app.rcon_client import rcon_client
from app.config import get_minecraft_data_dir
from app.database import log_audit

router = APIRouter(prefix="/api/players", tags=["players"])
logger = logging.getLogger("players_api")

class WhitelistAction(BaseModel):
    action: str = "add"  # add, remove, on, off
    player: str | None = None

class OpAction(BaseModel):
    action: str = "op"  # op, deop
    player: str

class BanAction(BaseModel):
    player: str
    reason: str = "Banned by admin"

class BanIpAction(BaseModel):
    ip: str
    reason: str = "Banned by admin"

class PardonAction(BaseModel):
    player: str

class PardonIpAction(BaseModel):
    ip: str

def _read_json_file(filename: str) -> list:
    fpath = get_minecraft_data_dir() / filename
    if not fpath.exists():
        return []
    try:
        content = fpath.read_text(encoding="utf-8")
        data = json.loads(content)
        return data if isinstance(data, list) else []
    except Exception as e:
        logger.debug(f"Failed to read {filename}: {e}")
        return []

@router.get("/all")
async def get_all_players(session: dict = Depends(get_current_user_and_session)):
    """
    Returns organized player management lists:
    - OP Players
    - Banned Players
    - Banned IPs
    - Whitelisted Players
    - Offline Players
    - Online Players
    """
    # 1. Online players via RCON
    online_data = await rcon_client.get_online_players()
    online_names = set(online_data.get("players", []))

    # 2. Ops from ops.json
    raw_ops = _read_json_file("ops.json")
    ops = [
        {"name": o.get("name", "Unknown"), "uuid": o.get("uuid", ""), "level": o.get("level", 4)}
        for o in raw_ops if o.get("name")
    ]

    # 3. Banned players from banned-players.json
    raw_banned_players = _read_json_file("banned-players.json")
    banned_players = [
        {
            "name": b.get("name", "Unknown"),
            "uuid": b.get("uuid", ""),
            "created": b.get("created", ""),
            "reason": b.get("reason", "Banned by admin"),
            "source": b.get("source", "Server")
        }
        for b in raw_banned_players if b.get("name")
    ]

    # 4. Banned IPs from banned-ips.json
    raw_banned_ips = _read_json_file("banned-ips.json")
    banned_ips = [
        {
            "ip": b.get("ip", "Unknown"),
            "created": b.get("created", ""),
            "reason": b.get("reason", "Banned by admin"),
            "source": b.get("source", "Server")
        }
        for b in raw_banned_ips if b.get("ip")
    ]

    # 5. Whitelisted players from whitelist.json
    raw_whitelist = _read_json_file("whitelist.json")
    whitelisted = [
        {"name": w.get("name", "Unknown"), "uuid": w.get("uuid", "")}
        for w in raw_whitelist if w.get("name")
    ]

    # 6. Offline players from usercache.json
    raw_usercache = _read_json_file("usercache.json")
    offline_players = []
    for u in raw_usercache:
        p_name = u.get("name")
        if p_name and p_name not in online_names:
            offline_players.append({
                "name": p_name,
                "uuid": u.get("uuid", ""),
                "expiresOn": u.get("expiresOn", "")
            })

    return {
        "online_players": list(online_names),
        "ops": ops,
        "banned_players": banned_players,
        "banned_ips": banned_ips,
        "whitelisted": whitelisted,
        "offline_players": offline_players
    }

@router.get("/online")
async def get_online_players_legacy(session: dict = Depends(get_current_user_and_session)):
    return await rcon_client.get_online_players()

@router.get("/whitelist")
async def get_whitelist(session: dict = Depends(get_current_user_and_session)):
    raw_whitelist = _read_json_file("whitelist.json")
    try:
        output = await rcon_client.execute("whitelist list")
        return {"output": output, "players": [w.get("name") for w in raw_whitelist if w.get("name")]}
    except Exception:
        names = [w.get("name") for w in raw_whitelist if w.get("name")]
        return {"output": f"Whitelisted: {', '.join(names) if names else 'None'}", "players": names}

@router.post("/whitelist")
async def modify_whitelist(payload: WhitelistAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = ""
    if payload.action in ("on", "off"):
        cmd = f"whitelist {payload.action}"
    elif payload.action in ("add", "remove") and payload.player:
        cmd = f"whitelist {payload.action} {payload.player}"
    else:
        raise HTTPException(status_code=400, detail="Invalid whitelist action or player.")

    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "whitelist", payload.player or payload.action, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        fpath = get_minecraft_data_dir() / "whitelist.json"
        try:
            wl = _read_json_file("whitelist.json")
            if payload.action == "add" and payload.player:
                if not any(w.get("name", "").lower() == payload.player.lower() for w in wl):
                    wl.append({"name": payload.player, "uuid": ""})
                    fpath.write_text(json.dumps(wl, indent=2), encoding="utf-8")
                    log_audit("admin", "whitelist", payload.player, "Added to whitelist.json directly", "SUCCESS", client_ip)
                    return {"success": True, "output": f"Added {payload.player} to whitelist.json (server offline)."}
            elif payload.action == "remove" and payload.player:
                wl = [w for w in wl if w.get("name", "").lower() != payload.player.lower()]
                fpath.write_text(json.dumps(wl, indent=2), encoding="utf-8")
                log_audit("admin", "whitelist", payload.player, "Removed from whitelist.json directly", "SUCCESS", client_ip)
                return {"success": True, "output": f"Removed {payload.player} from whitelist.json (server offline)."}
        except Exception:
            pass

        log_audit("admin", "whitelist", payload.player or payload.action, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ops")
async def modify_ops(payload: OpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    if payload.action not in ("op", "deop"):
        raise HTTPException(status_code=400, detail="Action must be 'op' or 'deop'.")

    cmd = f"{payload.action} {payload.player}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "op_management", payload.player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        fpath = get_minecraft_data_dir() / "ops.json"
        try:
            ops = _read_json_file("ops.json")
            if payload.action == "op":
                if not any(o.get("name", "").lower() == payload.player.lower() for o in ops):
                    ops.append({"name": payload.player, "uuid": "", "level": 4, "bypassesPlayerLimit": False})
                    fpath.write_text(json.dumps(ops, indent=2), encoding="utf-8")
                    log_audit("admin", "op_management", payload.player, "Added to ops.json directly", "SUCCESS", client_ip)
                    return {"success": True, "output": f"Promoted {payload.player} to OP in ops.json."}
            elif payload.action == "deop":
                ops = [o for o in ops if o.get("name", "").lower() != payload.player.lower()]
                fpath.write_text(json.dumps(ops, indent=2), encoding="utf-8")
                log_audit("admin", "op_management", payload.player, "Removed from ops.json directly", "SUCCESS", client_ip)
                return {"success": True, "output": f"Demoted {payload.player} in ops.json."}
        except Exception:
            pass

        log_audit("admin", "op_management", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/ops/{player}")
async def remove_op_delete(player: str, request: Request, session: dict = Depends(get_current_user_and_session)):
    return await modify_ops(OpAction(action="deop", player=player), request, session)

@router.delete("/whitelist/{player}")
async def remove_whitelist_delete(player: str, request: Request, session: dict = Depends(get_current_user_and_session)):
    return await modify_whitelist(WhitelistAction(action="remove", player=player), request, session)

@router.delete("/ban/{player}")
async def unban_player_delete(player: str, request: Request, session: dict = Depends(get_current_user_and_session)):
    return await unban_player(PardonAction(player=player), request, session)

@router.delete("/ban-ip/{ip}")
async def unban_ip_delete(ip: str, request: Request, session: dict = Depends(get_current_user_and_session)):
    return await unban_ip(PardonIpAction(ip=ip), request, session)

@router.post("/ban")
async def ban_player(payload: BanAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"ban {payload.player} {payload.reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "ban_player", payload.player, payload.reason, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        fpath = get_minecraft_data_dir() / "banned-players.json"
        try:
            bp = _read_json_file("banned-players.json")
            if not any(b.get("name", "").lower() == payload.player.lower() for b in bp):
                bp.append({"name": payload.player, "uuid": "", "reason": payload.reason, "source": "mcadmin"})
                fpath.write_text(json.dumps(bp, indent=2), encoding="utf-8")
                log_audit("admin", "ban_player", payload.player, "Added to banned-players.json directly", "SUCCESS", client_ip)
                return {"success": True, "output": f"Banned {payload.player} in banned-players.json."}
        except Exception:
            pass

        log_audit("admin", "ban_player", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unban")
async def unban_player(payload: PardonAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"pardon {payload.player}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "unban_player", payload.player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        fpath = get_minecraft_data_dir() / "banned-players.json"
        try:
            bp = _read_json_file("banned-players.json")
            bp = [b for b in bp if b.get("name", "").lower() != payload.player.lower()]
            fpath.write_text(json.dumps(bp, indent=2), encoding="utf-8")
            log_audit("admin", "unban_player", payload.player, "Removed from banned-players.json directly", "SUCCESS", client_ip)
            return {"success": True, "output": f"Unbanned {payload.player} in banned-players.json."}
        except Exception:
            pass

        log_audit("admin", "unban_player", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ban-ip")
async def ban_ip(payload: BanIpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"ban-ip {payload.ip} {payload.reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "ban_ip", payload.ip, payload.reason, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        fpath = get_minecraft_data_dir() / "banned-ips.json"
        try:
            bi = _read_json_file("banned-ips.json")
            if not any(b.get("ip", "") == payload.ip for b in bi):
                bi.append({"ip": payload.ip, "reason": payload.reason, "source": "mcadmin"})
                fpath.write_text(json.dumps(bi, indent=2), encoding="utf-8")
                log_audit("admin", "ban_ip", payload.ip, "Added to banned-ips.json directly", "SUCCESS", client_ip)
                return {"success": True, "output": f"Banned IP {payload.ip} in banned-ips.json."}
        except Exception:
            pass

        log_audit("admin", "ban_ip", payload.ip, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unban-ip")
async def unban_ip(payload: PardonIpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"pardon-ip {payload.ip}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "unban_ip", payload.ip, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        fpath = get_minecraft_data_dir() / "banned-ips.json"
        try:
            bi = _read_json_file("banned-ips.json")
            bi = [b for b in bi if b.get("ip", "") != payload.ip]
            fpath.write_text(json.dumps(bi, indent=2), encoding="utf-8")
            log_audit("admin", "unban_ip", payload.ip, "Removed from banned-ips.json directly", "SUCCESS", client_ip)
            return {"success": True, "output": f"Unbanned IP {payload.ip} in banned-ips.json."}
        except Exception:
            pass

        log_audit("admin", "unban_ip", payload.ip, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))
