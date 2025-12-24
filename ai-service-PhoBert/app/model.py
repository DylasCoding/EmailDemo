import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.settings import settings

class AppointmentModel:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.tokenizer = AutoTokenizer.from_pretrained(settings.MODEL_PATH)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            settings.MODEL_PATH
        )

        self.model.to(self.device)
        self.model.eval()
    
    def predict(self, text: str) -> float:
        """Dự đoán xác suất là lịch hẹn"""
        inputs = self.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=settings.MAX_LENGTH,
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            score = probs[0][1].item()  # Xác suất class 1 (là lịch hẹn)
        
        return score