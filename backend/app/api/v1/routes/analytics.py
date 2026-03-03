from fastapi import APIRouter

router = APIRouter()


@router.get("/trends")
def get_trends() -> dict:
    return {
        "summary": {
            "total_incidents": 0,
            "top_crime_type": "phishing",
            "loss_amount": 0,
        },
        "time_series": [],
    }


@router.get("/loss-summary")
def loss_summary() -> dict:
    return {"total_loss": 0, "avg_loss": 0, "max_loss": 0}
