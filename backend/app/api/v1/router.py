from fastapi import APIRouter

from app.api.v1.routes import alerts, analytics, auth, incidents, risk

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
