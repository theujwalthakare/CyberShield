from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    APP_NAME: str = "CyberShield API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] | str = ["http://localhost:3000"]

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "cybershield"
    POSTGRES_USER: str = "cybershield"
    POSTGRES_PASSWORD: str = "cybershield"

    JWT_SECRET_KEY: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

if isinstance(settings.BACKEND_CORS_ORIGINS, str):
    settings.BACKEND_CORS_ORIGINS = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")]
