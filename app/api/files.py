import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.auth import get_current_user_and_session
from app.config import get_minecraft_data_dir
from app.database import log_audit

router = APIRouter(prefix="/api/files", tags=["files"])

EDITABLE_EXTENSIONS = {
    ".json", ".properties", ".env", ".txt", ".log",
    ".yml", ".yaml", ".toml", ".cfg", ".conf", ".ini",
    ".sh", ".md", ".csv", ".xml"
}

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

def resolve_safe_path(rel_path: str = "") -> Path:
    """
    Safely resolves a relative path within server data directory.
    Prevents directory traversal attacks.
    """
    base_dir = get_minecraft_data_dir()
    clean_rel = rel_path.strip().lstrip("/\\")
    target = (base_dir / clean_rel).resolve()
    base = base_dir.resolve()
    
    if not (target == base or target.is_relative_to(base)):
        raise HTTPException(status_code=403, detail="Access denied: path is outside server directory.")
    
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

@router.get("/list")
async def list_files(path: str = "", session: dict = Depends(get_current_user_and_session)):
    """
    Lists files and directories in the requested path within MINECRAFT_DATA_DIR.
    Returns breadcrumbs and items sorted by directory first, then filename.
    """
    base_dir = get_minecraft_data_dir()
    base_dir.mkdir(parents=True, exist_ok=True)
    target = resolve_safe_path(path)
    
    if not target.exists():
        raise HTTPException(status_code=404, detail="Directory not found.")
    if not target.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory.")

    # Calculate breadcrumbs
    base = base_dir.resolve()
    rel = target.relative_to(base)
    rel_str = str(rel).replace("\\", "/") if str(rel) != "." else ""
    
    parts = [p for p in rel_str.split("/") if p]
    breadcrumbs = [{"name": "root", "path": ""}]
    acc = []
    for p in parts:
        acc.append(p)
        breadcrumbs.append({"name": p, "path": "/".join(acc)})

    items = []
    try:
        for entry in os.scandir(target):
            entry_path = Path(entry.path)
            is_dir = entry.is_dir()
            entry_rel = str(entry_path.resolve().relative_to(base)).replace("\\", "/")
            
            try:
                stat = entry.stat()
                size = stat.st_size if not is_dir else 0
                mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                size = 0
                mtime = "-"

            ext = entry_path.suffix.lower()
            editable = (not is_dir) and (ext in EDITABLE_EXTENSIONS)

            items.append({
                "name": entry.name,
                "path": entry_rel,
                "type": "directory" if is_dir else "file",
                "extension": ext,
                "size": size,
                "size_formatted": format_size(size) if not is_dir else "—",
                "modified": mtime,
                "editable": editable
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan directory: {e}")

    # Sort directories first, then alphabetical
    items.sort(key=lambda x: (0 if x["type"] == "directory" else 1, x["name"].lower()))

    return {
        "current_path": rel_str,
        "breadcrumbs": breadcrumbs,
        "items": items,
        "total_items": len(items)
    }

@router.get("/read")
async def read_file_content(path: str, session: dict = Depends(get_current_user_and_session)):
    """
    Reads text file content for viewing/editing.
    """
    target = resolve_safe_path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Cannot read a directory as text.")

    ext = target.suffix.lower()
    if ext not in EDITABLE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not editable as text.")

    try:
        content = target.read_text(encoding="utf-8", errors="replace")
        stat = target.stat()
        return {
            "path": path,
            "name": target.name,
            "content": content,
            "size": stat.st_size,
            "size_formatted": format_size(stat.st_size),
            "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {e}")

@router.post("/write")
async def write_file_content(payload: WriteFileRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    """
    Saves edited text file with automatic timestamped backup.
    """
    client_ip = request.client.host if request.client else "unknown"
    target = resolve_safe_path(payload.path)
    
    if target.is_dir():
        raise HTTPException(status_code=400, detail="Cannot write content to a directory.")

    ext = target.suffix.lower()
    if ext not in EDITABLE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not an editable text type.")

    # Create backup if original exists
    backup_file = None
    if target.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = target.parent / f"{target.name}.bak-{timestamp}"
        try:
            shutil.copy2(target, backup_file)
        except Exception:
            pass

    try:
        target.write_text(payload.content, encoding="utf-8")
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

@router.get("/download")
async def download_file(path: str, session: dict = Depends(get_current_user_and_session)):
    """
    Downloads a single file, or zips and streams a directory.
    """
    target = resolve_safe_path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="File or directory not found.")

    if target.is_file():
        return FileResponse(
            path=str(target),
            filename=target.name,
            media_type="application/octet-stream"
        )
    
    # If directory, create a zip archive
    tmp_dir = tempfile.mkdtemp()
    zip_base = Path(tmp_dir) / f"{target.name}"
    zip_path = shutil.make_archive(str(zip_base), "zip", root_dir=str(target))
    
    return FileResponse(
        path=zip_path,
        filename=f"{target.name}.zip",
        media_type="application/zip"
    )

@router.delete("/delete")
async def delete_item(payload: DeleteRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    """
    Deletes a file or directory with mandatory confirmation.
    """
    client_ip = request.client.host if request.client else "unknown"
    if not payload.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to delete file or folder.")

    target = resolve_safe_path(payload.path)
    base = get_minecraft_data_dir().resolve()
    if target == base:
        raise HTTPException(status_code=400, detail="Cannot delete the root server directory.")

    if not target.exists():
        raise HTTPException(status_code=404, detail="Target does not exist.")

    try:
        if target.is_dir():
            shutil.rmtree(target)
            msg = f"Directory '{target.name}' and its contents deleted."
        else:
            target.unlink()
            msg = f"File '{target.name}' deleted."

        log_audit("admin", "file_delete", payload.path, msg, "SUCCESS", client_ip)
        return {"success": True, "message": msg}
    except Exception as e:
        log_audit("admin", "file_delete", payload.path, f"Failed delete: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Failed to delete: {e}")

@router.post("/create-folder")
async def create_folder(payload: CreateFolderRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    """
    Creates a new folder at the specified path.
    """
    client_ip = request.client.host if request.client else "unknown"
    folder_name = payload.name.strip()
    if not folder_name or "/" in folder_name or "\\" in folder_name or ".." in folder_name:
        raise HTTPException(status_code=400, detail="Invalid folder name.")

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
async def upload_file(path: str = "", file: UploadFile = File(...), session: dict = Depends(get_current_user_and_session)):
    """
    Uploads a file to the specified directory.
    """
    parent = resolve_safe_path(path)
    if not parent.is_dir():
        raise HTTPException(status_code=400, detail="Upload target is not a directory.")

    filename = Path(file.filename).name
    if not filename or filename in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    dest = parent / filename
    try:
        with open(dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"success": True, "message": f"Uploaded '{filename}' successfully.", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")
