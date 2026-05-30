"""
File Upload Service for HackaVerse
====================================
Handles local file uploads for project submissions (screenshots, docs, etc.).

For production, replace local storage with S3/GCS via the storage adapter
pattern already used here.

Configuration (via .env):
    UPLOAD_DIR=./data/uploads        (local storage path)
    MAX_UPLOAD_SIZE_MB=10            (max file size in MB)
    ALLOWED_EXTENSIONS=png,jpg,jpeg,gif,pdf,zip,md,txt
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from typing import Optional, List
from pathlib import Path
from uuid import uuid4
from datetime import datetime
import os
import logging
import shutil

from ..auth import get_api_key, get_current_user_id
from ..database import get_db
from ..db_models import COLLECTIONS
from ..schemas.response import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["uploads"])

# ---------- Config ----------
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./data/uploads"))
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = set(
    os.getenv("ALLOWED_EXTENSIONS", "png,jpg,jpeg,gif,pdf,zip,md,txt").split(",")
)

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _validate_extension(filename: str) -> str:
    """Return the file extension (without dot) if allowed, else raise."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return ext


# ============================================================================
# UPLOAD FILE
# ============================================================================

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    team_id: Optional[str] = Form(None),
    submission_id: Optional[str] = Form(None),
    category: Optional[str] = Form("general"),
    user_id: str = Depends(get_current_user_id),
    api_key: str = Depends(get_api_key),
):
    """Upload a file (image, PDF, zip, etc.).

    - **file**: The file to upload (max 10 MB by default)
    - **team_id**: Optional team association
    - **submission_id**: Optional submission association
    - **category**: File category (general, screenshot, document, archive)
    """
    logger.info(f"[UPLOAD] Starting - user={user_id}, filename={file.filename}")

    # Validate extension
    ext = _validate_extension(file.filename or "unknown.bin")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Generate unique filename
    file_id = f"file_{uuid4()}"
    safe_name = f"{file_id}.{ext}"
    dest_path = UPLOAD_DIR / safe_name

    # Write to disk
    try:
        with open(dest_path, "wb") as f:
            f.write(content)
        logger.info(f"[UPLOAD] Saved to {dest_path} ({len(content)} bytes)")
    except Exception as exc:
        logger.error(f"[UPLOAD] Write failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Store metadata in DB
    file_meta = {
        "file_id": file_id,
        "original_name": file.filename,
        "stored_name": safe_name,
        "extension": ext,
        "size_bytes": len(content),
        "content_type": file.content_type or "application/octet-stream",
        "category": category,
        "team_id": team_id,
        "submission_id": submission_id,
        "uploaded_by": user_id,
        "created_at": datetime.utcnow().isoformat(),
    }

    db = get_db()
    if db is not None:
        db[COLLECTIONS.get("files", "files")].insert_one(file_meta)

    return APIResponse(success=True, message="File uploaded successfully", data={
            "file_id": file_id,
            "filename": file.filename,
            "size_bytes": len(content),
            "content_type": file.content_type,
            "download_url": f"/uploads/{file_id}",
        })


# ============================================================================
# DOWNLOAD / SERVE FILE
# ============================================================================

@router.get("/{file_id}")
async def get_file(file_id: str):
    """Download a file by its ID."""
    from fastapi.responses import FileResponse

    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    file_meta = db[COLLECTIONS.get("files", "files")].find_one({"file_id": file_id})
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = UPLOAD_DIR / file_meta["stored_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        filename=file_meta.get("original_name", file_meta["stored_name"]),
        media_type=file_meta.get("content_type", "application/octet-stream"),
    )


# ============================================================================
# LIST FILES
# ============================================================================

@router.get("")
async def list_files(
    team_id: Optional[str] = None,
    submission_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    api_key: str = Depends(get_api_key),
):
    """List uploaded files, optionally filtered by team or submission."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    query = {}
    if team_id:
        query["team_id"] = team_id
    if submission_id:
        query["submission_id"] = submission_id

    files = list(
        db[COLLECTIONS.get("files", "files")]
        .find(query)
        .sort("created_at", -1)
        .limit(100)
    )

    return APIResponse(success=True, message=f"{len(files)} files found", data=[
            {
                "file_id": f.get("file_id"),
                "filename": f.get("original_name"),
                "size_bytes": f.get("size_bytes"),
                "content_type": f.get("content_type"),
                "category": f.get("category"),
                "uploaded_by": f.get("uploaded_by"),
                "created_at": f.get("created_at"),
                "download_url": f"/uploads/{f.get('file_id')}",
            }
            for f in files
        ])


# ============================================================================
# DELETE FILE
# ============================================================================

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    user_id: str = Depends(get_current_user_id),
    api_key: str = Depends(get_api_key),
):
    """Delete an uploaded file (uploader only)."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    file_meta = db[COLLECTIONS.get("files", "files")].find_one({"file_id": file_id})
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")

    if file_meta.get("uploaded_by") != user_id:
        raise HTTPException(status_code=403, detail="Only the uploader can delete this file")

    # Delete from disk
    file_path = UPLOAD_DIR / file_meta["stored_name"]
    if file_path.exists():
        file_path.unlink()

    # Delete from DB
    db[COLLECTIONS.get("files", "files")].delete_one({"file_id": file_id})

    logger.info(f"[UPLOAD] Deleted file {file_id}")

    return APIResponse(success=True, message="File deleted successfully", data={"file_id": file_id})
