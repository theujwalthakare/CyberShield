from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401
from app.core.config import settings
from app.models.base import Base

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_all_tables() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
