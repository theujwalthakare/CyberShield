from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area_code: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(30), nullable=False)
    factors_json: Mapped[str] = mapped_column(String(4000), nullable=False, default="{}")
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
