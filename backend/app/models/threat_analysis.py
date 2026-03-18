from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ThreatAnalysis(Base):
    __tablename__ = "threat_analysis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), unique=True, nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0")
    crime_type_predicted: Mapped[str] = mapped_column(String(100), nullable=False)
    crime_subtype_predicted: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    severity_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    extracted_entities: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity_factors: Mapped[str | None] = mapped_column(Text, nullable=True)
    guidance_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    case = relationship("Case", back_populates="analysis")
