import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_role
from app.db.session import get_db
from app.models.case import Case
from app.models.threat_analysis import ThreatAnalysis
from app.models.user import User
from app.schemas.case import CaseAssignRequest, CaseCreate, CaseRead, CaseStatusUpdateRequest, CaseUpdate
from app.services.threat_engine import analyze_incident

router = APIRouter()


def _generate_case_number() -> str:
    return f"CS-{uuid.uuid4().hex[:8].upper()}"


@router.post("/", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = analyze_incident(
        title=payload.title,
        description=payload.description,
        crime_type=payload.crime_type,
        financial_loss=payload.financial_loss,
        suspect_info=payload.suspect_info,
    )

    case = Case(
        case_number=_generate_case_number(),
        reporter_id=user.id,
        title=payload.title,
        description=payload.description,
        crime_type=payload.crime_type,
        crime_subtype=result.crime_subtype_predicted,
        incident_date=payload.incident_date,
        financial_loss=payload.financial_loss,
        currency=payload.currency,
        affected_platform=payload.affected_platform,
        suspect_info=payload.suspect_info,
        victim_area=payload.victim_area,
        district=payload.district,
        state=payload.state,
        severity_score=result.severity_score,
        ai_confidence=result.confidence_score,
    )
    db.add(case)
    db.flush()

    analysis = ThreatAnalysis(
        case_id=case.id,
        model_version="rules-v1",
        crime_type_predicted=result.crime_type_predicted,
        crime_subtype_predicted=result.crime_subtype_predicted,
        confidence_score=result.confidence_score,
        severity_score=result.severity_score,
        extracted_entities=result.extracted_entities,
        severity_factors=result.severity_factors,
        guidance_text=result.guidance_text,
    )
    db.add(analysis)

    db.commit()
    db.refresh(case)
    return case


@router.get("/", response_model=list[CaseRead])
def list_cases(
    status_filter: str | None = Query(None, alias="status"),
    crime_type: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Case)

    # Citizens see only their own cases; officers/analysts/admins see all
    if user.role == "citizen":
        query = query.filter(Case.reporter_id == user.id)

    if status_filter:
        query = query.filter(Case.status == status_filter)

    if crime_type:
        query = query.filter(Case.crime_type == crime_type)

    sort_column = Case.created_at
    if sort_by == "severity":
        sort_column = Case.severity_score

    if sort_order == "asc":
        return query.order_by(sort_column.asc(), Case.created_at.desc()).offset(offset).limit(limit).all()

    return query.order_by(sort_column.desc(), Case.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/officers")
def list_officers(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("officer", "analyst", "admin")),
):
    officers = (
        db.query(User)
        .filter(User.role == "officer", User.is_active == True)
        .order_by(User.full_name.asc())
        .all()
    )

    return {
        "items": [
            {
                "id": officer.id,
                "full_name": officer.full_name,
                "email": officer.email,
                "role": officer.role,
            }
            for officer in officers
        ]
    }


@router.get("/{case_id}", response_model=CaseRead)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Citizens can only see their own
    if user.role == "citizen" and case.reporter_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return case


@router.patch("/{case_id}", response_model=CaseRead)
def update_case(
    case_id: int,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("officer", "analyst", "admin")),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)

    db.commit()
    db.refresh(case)
    return case


@router.patch("/{case_id}/assign", response_model=CaseRead)
def assign_case(
    case_id: int,
    payload: CaseAssignRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("officer", "analyst", "admin")),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    officer = (
        db.query(User)
        .filter(User.id == payload.assigned_officer_id, User.role == "officer", User.is_active == True)
        .first()
    )
    if not officer:
        raise HTTPException(status_code=400, detail="Assigned user must be an active officer")

    case.assigned_officer_id = payload.assigned_officer_id
    if case.status in {"submitted", "reviewing"}:
        case.status = "assigned"

    db.commit()
    db.refresh(case)
    return case


@router.patch("/{case_id}/status", response_model=CaseRead)
def update_case_status(
    case_id: int,
    payload: CaseStatusUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("officer", "analyst", "admin")),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    target_status = payload.status.strip().lower().replace(" ", "_")
    allowed_statuses = {
        "submitted",
        "reviewing",
        "analysis_complete",
        "assigned",
        "investigating",
        "resolved",
        "closed",
    }
    if target_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Unsupported status")

    transitions = {
        "submitted": {"reviewing", "assigned", "analysis_complete"},
        "reviewing": {"analysis_complete", "assigned", "investigating"},
        "analysis_complete": {"assigned", "investigating"},
        "assigned": {"investigating", "resolved"},
        "investigating": {"resolved", "closed"},
        "resolved": {"closed", "investigating"},
        "closed": set(),
    }
    current = case.status
    if current != target_status and target_status not in transitions.get(current, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from '{current}' to '{target_status}'",
        )

    case.status = target_status
    db.commit()
    db.refresh(case)
    return case
