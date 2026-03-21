from fastapi import APIRouter

from app.api.v1.routes import alerts, analytics, auth, cases, evidence, incidents, risk, threats, intelligence

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["evidence"])
api_router.include_router(threats.router, prefix="/threats", tags=["threats"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
