from datetime import datetime
from pydantic import BaseModel, Field


class CaseCreate(BaseModel):
    title: str = Field(min_length=5, max_length=300)
    description: str = Field(min_length=10)
    crime_type: str = Field(min_length=2, max_length=100)
    incident_date: datetime | None = None
    financial_loss: float = 0
    currency: str = "INR"
    affected_platform: str | None = None
    suspect_info: str | None = None
    victim_area: str | None = None
    district: str | None = None
    state: str | None = None


class CaseRead(BaseModel):
    id: int
    case_number: str
    title: str
    description: str
    crime_type: str
    crime_subtype: str | None = None
    incident_date: datetime | None = None
    financial_loss: float
    currency: str
    affected_platform: str | None = None
    victim_area: str | None = None
    district: str | None = None
    state: str | None = None
    status: str
    severity_score: int | None = None
    ai_confidence: float | None = None
    is_escalated: bool
    reporter_id: int
    assigned_officer_id: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseUpdate(BaseModel):
    status: str | None = None
    assigned_officer_id: int | None = None
    crime_subtype: str | None = None
    severity_score: int | None = None
    is_escalated: bool | None = None


class CaseAssignRequest(BaseModel):
    assigned_officer_id: int


class CaseStatusUpdateRequest(BaseModel):
    status: str = Field(min_length=3, max_length=50)
