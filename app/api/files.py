import os
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
from app.database import log_audit
from app.utils import format_size

router = APIRouter(prefix="/api/files", tags=["files"])

EDITABLE_EXTENSIONS = {
    ".json", ".properties", ".txt", ".log",
    ".yml", ".yaml", ".toml", ".cfg", ".conf", ".ini",
    ".sh", ".md", ".csv", ".xml"
}


def is_blocked_name(name: str) -> bool:
    """Checks whether a file or directory name is a dotfile, .rcon-cli.env, or *.env file."""
    clean = name.strip()
    return clean.startswith(".") or clean.lower().endswith(".env") or clean.lower() == ".rcon-cli.env"


def check_blocked_path(target: Path, base_dir: Path):
    """Enforces blocking of dotfiles, .rcon-cli.env, and *.env files along the path."""
    if target == base_dir:
        return
    rel = target.relative_to(base_dir)
    for part in rel.parts:
        if is_blocked_name(part):
            raise HTTPException(status_code=403, detail=f"Access denied: access to '{part}' is restricted.")


def resolve_safe_path(rel_path: str = "") -> Path:
    """
    Safely resolves a relative path within server data directory.
    Enforces canonical path containment and blocks dotfiles/.env files.
    """
    base_dir = get_minecraft_data_dir().resolve()
    clean_rel = rel_path.strip().lstrip("/\\")
    target = (base_dir / clean_rel).resolve()

    if not (target == base_dir or target.is_relative_to(base_dir)):
        raise HTTPException(status_code=403, detail="Access denied: path is outside server directory.")

    check_blocked_path(target, base_dir)
    return target


class WriteFileRequest(BaseModel):
    path: str
    content: str


class CreateFolderRequest(BaseModel):
    path: str
    name: str


class DeleteRequest(BaseModel):
    path: str
    confirm: bool = False


def _scan_dir_sync(target: Path, base_dir: Path) -> list[dict]:
    items = []
    for entry in os.scandir(target):
        if is_blocked_name(entry.name):
            continue

        entry_path = Path(entry.path)
        try:
            resolved = entry_path.resolve()
            if not (resolved == base_dir or resolved.is_relative_to(base_dir)):
                continue
            if is_blocked_name(resolved.name):
                continue
            entry_rel = str(resolved.relative_to(base_dir)).replace("\\", "/")
        except (ValueError, RuntimeError, OSError):
            continue

        is_dir = entry.is_dir()
        try:
            stat = entry.stat()
            size = stat.st_size if not is_dir else 0
            mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            size = 0
            mtime = "-"

        ext = entry_path.suffix.lower()
        is_server_props = (entry.name.lower() == "server.properties")
        editable = (not is_dir) and (ext in EDITABLE_EXTENSIONS) and (not is_server_props)
        warning = "itzg overwrites server.properties from mc.env on container startup." if is_server_props else None

        items.append({
            "name": entry.name,
            "path": entry_rel,
            "type": "directory" if is_dir else "file",
            "extension": ext,
            "size": size,
            "size_formatted": format_size(size) if not is_dir else "—",
            "modified": mtime,
            "editable": editable,
            "read_only": is_server_props,
            "warning": warning
        })

    items.sort(key=lambda x: (0 if x["type"] == "directory" else 1, x["name"].lower()))
    return items


@router.get("/list")
async def list_files(path: str = "", session: dict = Depends(get_current_user_and_session)):
    base_dir = get_minecraft_data_dir().resolve()
    base_dir.mkdir(parents=True, exist_ok=True)
    target = resolve_safe_path(path)

    if not target.exists():
        raise HTTPException(status_code=404, detail="Directory not found.")
    if not target.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory.")

    rel = target.relative_to(base_dir)
    rel_str = str(rel).replace("\\", "/") if str(rel) != "." else ""

    parts = [p for p in rel_str.split("/") if p]
    breadcrumbs = [{"name": "root", "path": ""}]
    acc = []
    for p in parts:
        acc.append(p)
        breadcrumbs.append({"name": p, "path": "/".join(acc)})

    try:
        items = await asyncio.to_thread(_scan_dir_sync, target, base_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan directory: {e}")

    return {
        "current_path": rel_str,
        "breadcrumbs": breadcrumbs,
        "items": items,
        "total_items": len(items)
    }


@router.get("/read")
async def read_file_content(path: str, session: dict = Depends(get_current_user_and_session)):
    target = resolve_safe_path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Cannot read a directory as text.")

    ext = target.suffix.lower()
    is_server_props = (target.name.lower() == "server.properties")
    if ext not in EDITABLE_EXTENSIONS and not is_server_props:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not editable as text.")

    try:
        content = await asyncio.to_thread(target.read_text, encoding="utf-8", errors="replace")
        stat = target.stat()
        return {
            "path": path,
            "name": target.name,
            "content": content,
            "size": stat.st_size,
            "size_formatted": format_size(stat.st_size),
            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            "read_only": is_server_props,
            "warning": "itzg overwrites server.properties from mc.env on container startup." if is_server_props else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")


@router.post("/write")
async def write_file_content(payload: WriteFileRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    target = resolve_safe_path(payload.path)

    if target.name.lower() == "server.properties":
        raise HTTPException(
            status_code=403,
            detail="server.properties is read-only. Environment variables in mc.env overwrite this file on startup. Configure settings via the Settings or Server Properties page."
        )

    if target.is_dir():
        raise HTTPException(status_code=400, detail="Cannot write content to a directory.")

    ext = target.suffix.lower()
    if ext not in EDITABLE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not an editable text type.")

    backup_file = None
    if target.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = target.parent / f"{target.name}.bak-{timestamp}"
        try:
            await asyncio.to_thread(shutil.copy2, target, backup_file)
        except Exception:
            pass

    try:
        await asyncio.to_thread(target.write_text, payload.content, encoding="utf-8")
        log_audit("admin", "file_edit", payload.path, f"Saved file {payload.path} (backup: {backup_file.name if backup_file else 'none'})", "SUCCESS", client_ip)
        return {
            "success": True,
            "message": f"File '{target.name}' saved successfully.",
            "path": payload.path,
            "backup": backup_file.name if backup_file else None
        }
    except Exception as e:
        log_audit("admin", "file_edit", payload.path, f"Failed to save {payload.path}: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Failed to write file: {e}")


def _build_safe_zip_sync(target: Path, base_dir: Path, zip_file_path: Path):
    with zipfile.ZipFile(zip_file_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(target, followlinks=False):
            root_path = Path(root)

            pruned_dirs = []
            for d in dirs:
                if is_blocked_name(d):
                    continue
                d_path = root_path / d
                if d_path.is_symlink():
                    try:
                        resolved_d = d_path.resolve()
                        if not (resolved_d == base_dir or resolved_d.is_relative_to(base_dir)):
                            continue
                        if is_blocked_name(resolved_d.name):
                            continue
                    except (ValueError, RuntimeError, OSError):
                        continue
                pruned_dirs.append(d)
            dirs[:] = pruned_dirs

            for file in files:
                if is_blocked_name(file):
                    continue
                file_path = root_path / file
                if file_path.is_symlink():
                    try:
                        resolved_file = file_path.resolve()
                        if not (resolved_file == base_dir or resolved_file.is_relative_to(base_dir)):
                            continue
                        if is_blocked_name(resolved_file.name):
                            continue
                    except (ValueError, RuntimeError, OSError):
                        continue

                arcname = str(file_path.relative_to(target)).replace("\\", "/")
                zipf.write(file_path, arcname=arcname)


@router.get("/download")
async def download_file(path: str = "", session: dict = Depends(get_current_user_and_session)):
    target = resolve_safe_path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File or directory not found.")

    if target.is_file():
        return FileResponse(
            path=str(target),
            filename=target.name,
            media_type="application/octet-stream"
        )

    base_dir = get_minecraft_data_dir().resolve()
    tmp_dir = tempfile.mkdtemp()
    zip_name = f"{target.name}.zip" if target != base_dir else "server_files.zip"
    zip_file_path = Path(tmp_dir) / zip_name

    try:
        await asyncio.to_thread(_build_safe_zip_sync, target, base_dir, zip_file_path)
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to create zip archive: {e}")

    return FileResponse(
        path=str(zip_file_path),
        filename=zip_name,
        media_type="application/zip",
        background=BackgroundTask(shutil.rmtree, tmp_dir, ignore_errors=True)
    )


@router.delete("/delete")
async def delete_item(payload: DeleteRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    if not payload.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to delete file or folder.")

    target = resolve_safe_path(payload.path)
    base = get_minecraft_data_dir().resolve()
    if target == base:
        raise HTTPException(status_code=400, detail="Cannot delete the root server directory.")

    if target.name.lower() == "server.properties":
        raise HTTPException(status_code=403, detail="server.properties cannot be deleted as it is a required server file.")

    if not target.exists():
        raise HTTPException(status_code=404, detail="Target does not exist.")

    try:
        if target.is_dir():
            await asyncio.to_thread(shutil.rmtree, target)
            msg = f"Directory '{target.name}' and its contents deleted."
        else:
            await asyncio.to_thread(target.unlink)
            msg = f"File '{target.name}' deleted."

        log_audit("admin", "file_delete", payload.path, msg, "SUCCESS", client_ip)
        return {"success": True, "message": msg}
    except Exception as e:
        log_audit("admin", "file_delete", payload.path, f"Failed delete: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Failed to delete: {e}")


@router.post("/create-folder")
async def create_folder(payload: CreateFolderRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    folder_name = payload.name.strip()
    if not folder_name or "/" in folder_name or "\\" in folder_name or ".." in folder_name:
        raise HTTPException(status_code=400, detail="Invalid folder name.")

    if is_blocked_name(folder_name):
        raise HTTPException(status_code=403, detail="Hidden or .env folders cannot be created.")

    parent = resolve_safe_path(payload.path)
    if not parent.is_dir():
        raise HTTPException(status_code=400, detail="Target parent is not a directory.")

    new_dir = parent / folder_name
    if new_dir.exists():
        raise HTTPException(status_code=409, detail=f"Folder '{folder_name}' already exists.")

    try:
        new_dir.mkdir(parents=False, exist_ok=False)
        log_audit("admin", "create_folder", str(new_dir), f"Created folder {folder_name}", "SUCCESS", client_ip)
        return {"success": True, "message": f"Folder '{folder_name}' created."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create folder: {e}")


@router.post("/upload")
async def upload_file(request: Request, path: str = "", file: UploadFile = File(...), session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    parent = resolve_safe_path(path)
    if not parent.is_dir():
        raise HTTPException(status_code=400, detail="Upload target is not a directory.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing.")

    filename = Path(file.filename).name
    if not filename or filename in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    if is_blocked_name(filename):
        raise HTTPException(status_code=403, detail="Uploading dotfiles or .env files is forbidden.")

    if filename.lower() == "server.properties":
        raise HTTPException(status_code=403, detail="Overwriting server.properties via upload is forbidden.")

    dest = parent / filename
    if dest.is_symlink():
        log_audit("admin", "file_upload", str(dest), f"Rejected overwrite of symlink '{filename}'", "FAILURE", client_ip)
        raise HTTPException(status_code=403, detail="Overwriting symlinks is strictly forbidden.")

    try:
        def _write_upload():
            with open(dest, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        await asyncio.to_thread(_write_upload)
        log_audit("admin", "file_upload", str(dest), f"Uploaded '{filename}'", "SUCCESS", client_ip)
        return {"success": True, "message": f"Uploaded '{filename}' successfully.", "filename": filename}
    except Exception as e:
        log_audit("admin", "file_upload", str(dest), f"Failed to save uploaded file '{filename}': {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")
