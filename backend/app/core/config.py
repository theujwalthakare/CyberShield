from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    APP_NAME: str = "CyberShield API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] | str = ["https://fwdyudjgnroozqfobziy.supabase.co"]

    # Direct database URL (takes precedence over individual vars)
    DATABASE_URL: str = "https://fwdyudjgnroozqfobziy.supabase.co"

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "cybershield"
    POSTGRES_USER: str = "cybershield"
    POSTGRES_PASSWORD: str = "cybershield"

    # Clerk auth
    CLERK_JWKS_URL: str = ""
    CLERK_ISSUER: str = ""

    # Legacy JWT (local fallback)
    JWT_SECRET_KEY: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    FAIL_ON_DB_INIT_ERROR: bool = False

    # Evidence storage
    EVIDENCE_STORAGE_DIR: str = "./storage"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url
        return (
            f"postgresql+psycopg://{quote_plus(self.POSTGRES_USER)}:{quote_plus(self.POSTGRES_PASSWORD)}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

if isinstance(settings.BACKEND_CORS_ORIGINS, str):
    settings.BACKEND_CORS_ORIGINS = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")]
