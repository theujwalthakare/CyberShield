from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    reporter_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    crime_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    crime_subtype: Mapped[str | None] = mapped_column(String(100), nullable=True)
    incident_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    financial_loss: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    affected_platform: Mapped[str | None] = mapped_column(String(200), nullable=True)
    suspect_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    victim_area: Mapped[str | None] = mapped_column(String(200), nullable=True)
    district: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    state: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)

    # Lifecycle
    status: Mapped[str] = mapped_column(
        String(50), default="submitted", nullable=False, index=True
    )
    severity_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    assigned_officer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    is_escalated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    reporter = relationship("User", back_populates="cases", foreign_keys=[reporter_id])
    assigned_officer = relationship("User", back_populates="assigned_cases", foreign_keys=[assigned_officer_id])
    evidence_files = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    analysis = relationship("ThreatAnalysis", back_populates="case", uselist=False, cascade="all, delete-orphan")
