from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    complaint_id: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    crime_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    victim_area: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    platform_used: Mapped[str] = mapped_column(String(120), nullable=False)
    loss_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    severity_level: Mapped[str] = mapped_column(String(30), nullable=False, default="medium")
    reported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
