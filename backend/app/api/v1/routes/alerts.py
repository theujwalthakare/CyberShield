from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_alerts() -> dict:
    return {
        "items": [
            {
                "id": 1,
                "alert_type": "spike_detection",
                "area_code": "ZONE-A",
                "severity": "high",
                "message": "Phishing incidents increased by 35% in last 48h",
                "status": "open",
            }
        ]
    }


@router.post("/{alert_id}/ack")
def acknowledge_alert(alert_id: int) -> dict:
    return {"id": alert_id, "status": "acknowledged"}
