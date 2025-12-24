# app/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MODEL_PATH: str = "./output"
    THRESHOLD: float = 0.65
    MAX_LENGTH: int = 128

settings = Settings()
