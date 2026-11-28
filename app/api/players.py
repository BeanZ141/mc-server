import re
import json
import ipaddress
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.rcon_client import rcon_client
from app.config import get_minecraft_data_dir
from app.database import log_audit

router = APIRouter(prefix="/api/players", tags=["players"])
logger = logging.getLogger("players_api")

_PLAYER_RE = re.compile(r"^[a-zA-Z0-9_]{1,16}$")


def _validate_player(name: str) -> str:
    clean = (name or "").strip()
    if not _PLAYER_RE.match(clean):
        raise HTTPException(
            status_code=400,
            detail="Invalid player username. Must be 1-16 alphanumeric/underscore characters."
        )
    return clean


def _validate_ip(ip_str: str) -> str:
    clean = (ip_str or "").strip()
    try:
        return str(ipaddress.ip_address(clean))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid IP address format.")


def _sanitize_reason(reason: str, default: str = "Banned by admin") -> str:
    clean = re.sub(r"[\r\n\x00]+", " ", reason or "").strip()
    return (clean[:120] or default)


class WhitelistAction(BaseModel):
    action: str = "add"
    player: str | None = None


class OpAction(BaseModel):
    action: str = "op"
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


class KickAction(BaseModel):
    player: str
    reason: str = "Kicked by admin"


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


def _offline_json_update(filename: str, mutator) -> bool:
    fpath = get_minecraft_data_dir() / filename
    try:
        items = _read_json_file(filename)
        updated, changed = mutator(items)
        if changed:
            fpath.parent.mkdir(parents=True, exist_ok=True)
            fpath.write_text(json.dumps(updated, indent=2), encoding="utf-8")
        return True
    except Exception as e:
        logger.debug(f"Offline JSON update failed for {filename}: {e}")
        return False


@router.get("/all")
async def get_all_players(session: dict = Depends(get_current_user_and_session)):
    online_data = await rcon_client.get_online_players()
    online_names = set(online_data.get("players", []))

    ops = [
        {"name": o.get("name", "Unknown"), "uuid": o.get("uuid", ""), "level": o.get("level", 4)}
        for o in _read_json_file("ops.json") if o.get("name")
    ]
    banned_players = [
        {
            "name": b.get("name", "Unknown"),
            "uuid": b.get("uuid", ""),
            "created": b.get("created", ""),
            "reason": b.get("reason", "Banned by admin"),
            "source": b.get("source", "Server")
        }
        for b in _read_json_file("banned-players.json") if b.get("name")
    ]
    banned_ips = [
        {
            "ip": b.get("ip", "Unknown"),
            "created": b.get("created", ""),
            "reason": b.get("reason", "Banned by admin"),
            "source": b.get("source", "Server")
        }
        for b in _read_json_file("banned-ips.json") if b.get("ip")
    ]
    whitelisted = [
        {"name": w.get("name", "Unknown"), "uuid": w.get("uuid", "")}
        for w in _read_json_file("whitelist.json") if w.get("name")
    ]
    offline_players = [
        {"name": u["name"], "uuid": u.get("uuid", ""), "expiresOn": u.get("expiresOn", "")}
        for u in _read_json_file("usercache.json")
        if u.get("name") and u["name"] not in online_names
    ]

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
    names = [w.get("name") for w in raw_whitelist if w.get("name")]
    try:
        output = await rcon_client.execute("whitelist list")
        return {"output": output, "players": names}
    except Exception:
        return {"output": f"Whitelisted: {', '.join(names) if names else 'None'}", "players": names}


@router.post("/whitelist")
async def modify_whitelist(payload: WhitelistAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    action = payload.action.lower().strip()
    if action in ("on", "off"):
        cmd = f"whitelist {action}"
        player = None
    elif action in ("add", "remove") and payload.player:
        player = _validate_player(payload.player)
        cmd = f"whitelist {action} {player}"
    else:
        raise HTTPException(status_code=400, detail="Invalid whitelist action or player.")

    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "whitelist", player or action, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        if player and action in ("add", "remove"):
            def _mutate(wl: list) -> tuple[list, bool]:
                if action == "add":
                    if any(w.get("name", "").lower() == player.lower() for w in wl):
                        return wl, False
                    wl.append({"name": player, "uuid": ""})
                    return wl, True
                filtered = [w for w in wl if w.get("name", "").lower() != player.lower()]
                return filtered, len(filtered) != len(wl) or not filtered

            if _offline_json_update("whitelist.json", _mutate):
                verb = "Added" if action == "add" else "Removed"
                log_audit("admin", "whitelist", player, f"{verb} via whitelist.json directly", "SUCCESS", client_ip)
                return {"success": True, "output": f"{verb} {player} in whitelist.json (server offline)."}

        log_audit("admin", "whitelist", player or action, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ops")
async def modify_ops(payload: OpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    action = payload.action.lower().strip()
    if action not in ("op", "deop"):
        raise HTTPException(status_code=400, detail="Action must be 'op' or 'deop'.")

    player = _validate_player(payload.player)
    cmd = f"{action} {player}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "op_management", player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        def _mutate(ops: list) -> tuple[list, bool]:
            if action == "op":
                if any(o.get("name", "").lower() == player.lower() for o in ops):
                    return ops, False
                ops.append({"name": player, "uuid": "", "level": 4, "bypassesPlayerLimit": False})
                return ops, True
            filtered = [o for o in ops if o.get("name", "").lower() != player.lower()]
            return filtered, len(filtered) != len(ops) or not filtered

        if _offline_json_update("ops.json", _mutate):
            msg = f"Promoted {player} to OP in ops.json." if action == "op" else f"Demoted {player} in ops.json."
            log_audit("admin", "op_management", player, msg, "SUCCESS", client_ip)
            return {"success": True, "output": msg}

        log_audit("admin", "op_management", player, f"Error: {e}", "FAILURE", client_ip)
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
    player = _validate_player(payload.player)
    reason = _sanitize_reason(payload.reason)
    cmd = f"ban {player} {reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "ban_player", player, reason, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        def _mutate(bp: list) -> tuple[list, bool]:
            if any(b.get("name", "").lower() == player.lower() for b in bp):
                return bp, False
            bp.append({"name": player, "uuid": "", "reason": reason, "source": "mcadmin"})
            return bp, True

        if _offline_json_update("banned-players.json", _mutate):
            log_audit("admin", "ban_player", player, "Added to banned-players.json directly", "SUCCESS", client_ip)
            return {"success": True, "output": f"Banned {player} in banned-players.json."}

        log_audit("admin", "ban_player", player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unban")
async def unban_player(payload: PardonAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    player = _validate_player(payload.player)
    cmd = f"pardon {player}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "unban_player", player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        if _offline_json_update(
            "banned-players.json",
            lambda bp: ([b for b in bp if b.get("name", "").lower() != player.lower()], True)
        ):
            log_audit("admin", "unban_player", player, "Removed from banned-players.json directly", "SUCCESS", client_ip)
            return {"success": True, "output": f"Unbanned {player} in banned-players.json."}

        log_audit("admin", "unban_player", player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ban-ip")
async def ban_ip(payload: BanIpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    ip = _validate_ip(payload.ip)
    reason = _sanitize_reason(payload.reason)
    cmd = f"ban-ip {ip} {reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "ban_ip", ip, reason, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        def _mutate(bi: list) -> tuple[list, bool]:
            if any(b.get("ip", "") == ip for b in bi):
                return bi, False
            bi.append({"ip": ip, "reason": reason, "source": "mcadmin"})
            return bi, True

        if _offline_json_update("banned-ips.json", _mutate):
            log_audit("admin", "ban_ip", ip, "Added to banned-ips.json directly", "SUCCESS", client_ip)
            return {"success": True, "output": f"Banned IP {ip} in banned-ips.json."}

        log_audit("admin", "ban_ip", ip, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unban-ip")
async def unban_ip(payload: PardonIpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    ip = _validate_ip(payload.ip)
    cmd = f"pardon-ip {ip}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "unban_ip", ip, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        if _offline_json_update(
            "banned-ips.json",
            lambda bi: ([b for b in bi if b.get("ip", "") != ip], True)
        ):
            log_audit("admin", "unban_ip", ip, "Removed from banned-ips.json directly", "SUCCESS", client_ip)
            return {"success": True, "output": f"Unbanned IP {ip} in banned-ips.json."}

        log_audit("admin", "unban_ip", ip, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kick")
async def kick_player(payload: KickAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    player = _validate_player(payload.player)
    reason = _sanitize_reason(payload.reason, "Kicked by admin")
    cmd = f"kick {player} {reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "kick_player", player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "kick_player", player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))
