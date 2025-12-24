from fastapi import FastAPI, HTTPException
import torch
from app.schemas import PredictRequest, PredictResponse, AppointmentDetails
from app.model import AppointmentModel
from app.settings import settings
from app.datetime_extractor import DateTimeExtractor
from typing import List
from pydantic import BaseModel

class BatchPredictRequest(BaseModel):
    texts: List[str]

class BatchPredictItem(BaseModel):
    text: str
    isAppointment: bool
    confidence: float
    details: AppointmentDetails | None = None

class BatchPredictResponse(BaseModel):
    results: List[BatchPredictItem]

app = FastAPI(
    title="Appointment Detection Service",
    version="1.0.0"
)

model: AppointmentModel | None = None
extractor: DateTimeExtractor | None = None

# -------- Startup --------
@app.on_event("startup")
def load_model():
    global model, extractor
    model = AppointmentModel()
    extractor = DateTimeExtractor()

# -------- Healthcheck --------
@app.get("/health")
def health():
    return {"status": "ok"}

# -------- Predict --------
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not model or not extractor:
        raise HTTPException(status_code=503, detail="Model not loaded")

    score = model.predict(req.text)
    is_appointment = score >= settings.THRESHOLD
    
    details = None
    if is_appointment:
        date = extractor.extract_date(req.text)
        start_time, end_time = extractor.extract_time(req.text)
        title = extractor.extract_title(req.text)
        
        details = AppointmentDetails(
            date=date,
            startTime=start_time,
            endTime=end_time,
            title=title
        )
    
    return PredictResponse(
        isAppointment=is_appointment,
        confidence=round(score, 4),
        details=details
    )

# -------- Batch Predict --------
@app.post("/predict/batch", response_model=BatchPredictResponse)
def predict_batch(request: BatchPredictRequest):
    if not model or not extractor:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    texts = request.texts

    inputs = model.tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=settings.MAX_LENGTH,
        return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        outputs = model.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)

    results = []
    for text, prob in zip(texts, probs):
        confidence = prob[1].item()
        is_appointment = confidence >= settings.THRESHOLD
        
        details = None
        if is_appointment:
            date = extractor.extract_date(text)
            start_time, end_time = extractor.extract_time(text)
            title = extractor.extract_title(text)
            
            details = AppointmentDetails(
                date=date,
                startTime=start_time,
                endTime=end_time,
                title=title
            )

        results.append(BatchPredictItem(
            text=text,
            isAppointment=is_appointment,
            confidence=round(confidence, 4),
            details=details
        ))

    return BatchPredictResponse(results=results)