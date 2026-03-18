from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.risk_score import RiskScore

router = APIRouter()


@router.get("/areas")
def risk_areas(db: Session = Depends(get_db)) -> dict:
    scores = db.query(RiskScore).order_by(RiskScore.score.desc()).limit(100).all()
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "areas": [
            {
                "area_code": s.area_code,
                "score": s.score,
                "risk_level": s.risk_level,
            }
            for s in scores
        ],
    }


@router.get("/area/{area_code}")
def risk_area_detail(area_code: str, db: Session = Depends(get_db)) -> dict:
    score = db.query(RiskScore).filter(RiskScore.area_code == area_code).first()
    if not score:
        raise HTTPException(status_code=404, detail="Area not found")
    return {
        "area_code": score.area_code,
        "score": score.score,
        "risk_level": score.risk_level,
        "factors_json": score.factors_json,
        "computed_at": str(score.computed_at) if score.computed_at else None,
    }
