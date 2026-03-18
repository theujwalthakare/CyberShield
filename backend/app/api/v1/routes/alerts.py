from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_role
from app.db.session import get_db
from app.models.alert import Alert
from app.models.user import User

router = APIRouter()


@router.get("")
def list_alerts(
    severity: str | None = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Alert).filter(Alert.status != "closed")
    if severity:
        query = query.filter(Alert.severity == severity)
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return {"alerts": [_alert_dict(a) for a in alerts]}


@router.post("/{alert_id}/ack")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    db.commit()
    return {"id": alert_id, "status": "acknowledged"}


def _alert_dict(a: Alert) -> dict:
    return {
        "id": a.id,
        "alert_type": a.alert_type,
        "area_code": a.area_code,
        "severity": a.severity,
        "message": a.message,
        "status": a.status,
        "created_at": str(a.created_at) if a.created_at else None,
    }
