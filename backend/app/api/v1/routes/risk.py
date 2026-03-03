from fastapi import APIRouter

router = APIRouter()


@router.get("/areas")
def risk_areas() -> dict:
    return {
        "generated_at": "",
        "areas": [
            {"area_code": "ZONE-A", "score": 72, "risk_level": "high"},
            {"area_code": "ZONE-B", "score": 44, "risk_level": "medium"},
        ],
    }


@router.get("/area/{area_code}")
def risk_area_detail(area_code: str) -> dict:
    return {
        "area_code": area_code,
        "score": 60,
        "risk_level": "medium",
        "factors": {
            "incident_density": 0.3,
            "avg_loss": 0.2,
            "phishing_concentration": 0.5,
        },
    }
