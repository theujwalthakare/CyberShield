from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ThreatAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: int
    model_version: str
    crime_type_predicted: str
    crime_subtype_predicted: str | None = None
    confidence_score: float
    severity_score: int
    extracted_entities: str | None = None
    severity_factors: str | None = None
    guidance_text: str | None = None
    processed_at: datetime


class ThreatGuidanceRead(BaseModel):
    case_id: int
    guidance_text: str
