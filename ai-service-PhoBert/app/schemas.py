from pydantic import BaseModel, Field
from typing import Optional

class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)

class AppointmentDetails(BaseModel):
    date: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    title: Optional[str] = None

class PredictResponse(BaseModel):
    isAppointment: bool
    confidence: float
    details: Optional[AppointmentDetails] = None