from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import create_all_tables


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        description="CyberShield Nexus backend API",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup_event() -> None:
        create_all_tables()

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_application()
