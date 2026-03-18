from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_role
from app.db.session import get_db
from app.models.case import Case
from app.models.threat_analysis import ThreatAnalysis
from app.models.user import User
from app.schemas.threat import ThreatAnalysisRead, ThreatGuidanceRead
from app.services.threat_engine import analyze_incident

router = APIRouter()


def _get_case_or_404(db: Session, case_id: int) -> Case:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _ensure_case_access(case: Case, user: User) -> None:
    if user.role == "citizen" and case.reporter_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/case/{case_id}", response_model=ThreatAnalysisRead)
def get_threat_analysis_by_case_id(
    case_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = _get_case_or_404(db, case_id)
    _ensure_case_access(case, user)

    analysis = db.query(ThreatAnalysis).filter(ThreatAnalysis.case_id == case.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Threat analysis not found")

    return analysis


@router.get("/case-number/{case_number}", response_model=ThreatAnalysisRead)
def get_threat_analysis_by_case_number(
    case_number: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    _ensure_case_access(case, user)

    analysis = db.query(ThreatAnalysis).filter(ThreatAnalysis.case_id == case.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Threat analysis not found")

    return analysis


@router.get("/case/{case_id}/guidance", response_model=ThreatGuidanceRead)
def get_guidance_for_case(
    case_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    case = _get_case_or_404(db, case_id)
    _ensure_case_access(case, user)

    analysis = db.query(ThreatAnalysis).filter(ThreatAnalysis.case_id == case.id).first()
    if not analysis or not analysis.guidance_text:
        raise HTTPException(status_code=404, detail="Guidance not found")

    return ThreatGuidanceRead(case_id=case.id, guidance_text=analysis.guidance_text)


@router.post("/case/{case_id}/analyze", response_model=ThreatAnalysisRead)
def analyze_case(
    case_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("officer", "analyst", "admin")),
):
    case = _get_case_or_404(db, case_id)

    result = analyze_incident(
        title=case.title,
        description=case.description,
        crime_type=case.crime_type,
        financial_loss=case.financial_loss,
        suspect_info=case.suspect_info,
    )

    analysis = db.query(ThreatAnalysis).filter(ThreatAnalysis.case_id == case.id).first()
    if not analysis:
        analysis = ThreatAnalysis(case_id=case.id)
        db.add(analysis)

    analysis.model_version = "rules-v1"
    analysis.crime_type_predicted = result.crime_type_predicted
    analysis.crime_subtype_predicted = result.crime_subtype_predicted
    analysis.confidence_score = result.confidence_score
    analysis.severity_score = result.severity_score
    analysis.extracted_entities = result.extracted_entities
    analysis.severity_factors = result.severity_factors
    analysis.guidance_text = result.guidance_text

    case.crime_subtype = result.crime_subtype_predicted
    case.severity_score = result.severity_score
    case.ai_confidence = result.confidence_score

    db.commit()
    db.refresh(analysis)
    return analysis
