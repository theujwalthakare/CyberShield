from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    crime_type: Optional[str] = None
    status: str = "open"
    severity: str = "medium"
    reporter_email: Optional[str] = None
    location: Optional[str] = None


class IncidentRead(IncidentCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
