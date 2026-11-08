import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "NammaFlood Sentinel"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    DEBUG: bool = True
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'nammaflood.db'}")
    
    # Storage & Uploads
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    MAX_UPLOAD_MB: int = 15
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Admin Security
    ADMIN_API_KEY: str = os.getenv("ADMIN_API_KEY", "bengaluru-civic-admin-secret-2026")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-nammaflood-2026")
    
    # Bengaluru Spatial Bounds
    BENGALURU_LAT_MIN: float = 12.75
    BENGALURU_LAT_MAX: float = 13.25
    BENGALURU_LON_MIN: float = 77.40
    BENGALURU_LON_MAX: float = 77.85
    BENGALURU_CENTER_LAT: float = 12.971598
    BENGALURU_CENTER_LON: float = 77.594566
    
    # Weather
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    WEATHER_CACHE_TTL_SECONDS: int = 900
    
    # Vision
    VISION_MODEL_ID: str = os.getenv("VISION_MODEL_ID", "")

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(BASE_DIR / "data" / "processed").mkdir(parents=True, exist_ok=True)
(BASE_DIR / "data" / "raw").mkdir(parents=True, exist_ok=True)
