from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IncidentCreate(BaseModel):
    complaint_id: str
    crime_type: str
    victim_area: str
    district: str
    state: str
    latitude: float
    longitude: float
    platform_used: str
    loss_amount: float
    severity_level: str = "medium"


class IncidentRead(IncidentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reported_at: datetime
