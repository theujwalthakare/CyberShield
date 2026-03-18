import hashlib
import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.user import User

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".txt",
    ".doc",
    ".docx",
    ".csv",
}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/csv",
}


def _sanitize_filename(filename: str) -> str:
    safe_name = os.path.basename(filename).strip()
    if not safe_name:
        return "uploaded_file"
    return safe_name.replace(" ", "_")


def _get_storage_root() -> Path:
    return Path(settings.EVIDENCE_STORAGE_DIR).resolve()


@router.post("/upload")
async def upload_evidence(
    case_number: str = Form(...),
    annotation: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Citizens can only upload to their own cases
    if user.role == "citizen" and case.reporter_id != user.id:
        raise HTTPException(status_code=403, detail="Not your case")

    safe_filename = _sanitize_filename(file.filename or "uploaded_file")
    file_ext = Path(safe_filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file is not allowed")

    sha256 = hashlib.sha256(contents).hexdigest()

    storage_key = f"evidence/{case_number}/{sha256}_{uuid4().hex}_{safe_filename}"
    storage_root = _get_storage_root()
    destination = storage_root / storage_key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(contents)

    evidence = Evidence(
        case_id=case.id,
        uploaded_by=user.id,
        original_filename=safe_filename,
        storage_key=storage_key,
        file_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(contents),
        sha256_hash=sha256,
        annotation=annotation or None,
    )
    try:
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
    except SQLAlchemyError:
        if destination.exists():
            destination.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Could not persist evidence metadata")

    return {
        "id": evidence.id,
        "case_number": case_number,
        "filename": evidence.original_filename,
        "sha256": evidence.sha256_hash,
        "size_bytes": evidence.file_size_bytes,
        "download_url": f"/api/v1/evidence/{evidence.id}/download",
    }


@router.get("/case/{case_number}")
def list_evidence_for_case(
    case_number: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if user.role == "citizen" and case.reporter_id != user.id:
        raise HTTPException(status_code=403, detail="Not your case")

    items = (
        db.query(Evidence)
        .filter(Evidence.case_id == case.id, Evidence.is_deleted == False)
        .order_by(Evidence.uploaded_at.desc())
        .all()
    )

    return {
        "case_number": case_number,
        "items": [
            {
                "id": e.id,
                "filename": e.original_filename,
                "file_type": e.file_type,
                "size_bytes": e.file_size_bytes,
                "sha256": e.sha256_hash,
                "annotation": e.annotation,
                "uploaded_at": str(e.uploaded_at) if e.uploaded_at else None,
                "download_url": f"/api/v1/evidence/{e.id}/download",
            }
            for e in items
        ],
    }


@router.get("/{evidence_id}/download")
def download_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id, Evidence.is_deleted == False).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    case = db.query(Case).filter(Case.id == evidence.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if user.role == "citizen" and case.reporter_id != user.id:
        raise HTTPException(status_code=403, detail="Not your case")

    file_path = _get_storage_root() / evidence.storage_key
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Stored file not found")

    return FileResponse(
        path=file_path,
        media_type=evidence.file_type,
        filename=evidence.original_filename,
    )
