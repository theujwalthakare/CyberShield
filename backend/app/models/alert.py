from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)
    area_code: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(30), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
