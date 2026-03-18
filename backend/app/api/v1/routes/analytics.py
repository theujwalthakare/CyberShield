from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.case import Case

router = APIRouter()


@router.get("/trends")
def get_trends(db: Session = Depends(get_db)) -> dict:
    total = db.query(func.count(Case.id)).scalar() or 0
    total_loss = db.query(func.coalesce(func.sum(Case.financial_loss), 0)).scalar()

    # Top crime type
    top_row = (
        db.query(Case.crime_type, func.count(Case.id).label("cnt"))
        .group_by(Case.crime_type)
        .order_by(func.count(Case.id).desc())
        .first()
    )
    top_crime = top_row[0] if top_row else "none"

    # Crime type distribution
    distribution = (
        db.query(Case.crime_type, func.count(Case.id))
        .group_by(Case.crime_type)
        .all()
    )

    return {
        "summary": {
            "total_incidents": total,
            "top_crime_type": top_crime,
            "loss_amount": float(total_loss),
        },
        "distribution": [{"crime_type": r[0], "count": r[1]} for r in distribution],
    }


@router.get("/loss-summary")
def loss_summary(db: Session = Depends(get_db)) -> dict:
    result = db.query(
        func.coalesce(func.sum(Case.financial_loss), 0),
        func.coalesce(func.avg(Case.financial_loss), 0),
        func.coalesce(func.max(Case.financial_loss), 0),
    ).first()
    return {
        "total_loss": float(result[0]),
        "avg_loss": round(float(result[1]), 2),
        "max_loss": float(result[2]),
    }
