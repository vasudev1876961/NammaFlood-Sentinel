import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.core.config import settings

router = APIRouter(prefix="/config", tags=["Configuration & Gemini AI"])

class GeminiKeyRequest(BaseModel):
    api_key: str
    model: str = "gemini-1.5-flash"

class GeminiStatusResponse(BaseModel):
    enabled: bool
    masked_key: str
    model: str

@router.get("/gemini-status", response_model=GeminiStatusResponse)
def get_gemini_status():
    """Returns the current Gemini API integration status."""
    key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    if key and len(key) > 8:
        masked = key[:6] + "..." + key[-4:]
        enabled = True
    else:
        masked = ""
        enabled = False
        
    return GeminiStatusResponse(
        enabled=enabled,
        masked_key=masked,
        model=settings.GEMINI_MODEL or "gemini-1.5-flash"
    )

@router.post("/gemini-key")
def set_gemini_key(req: GeminiKeyRequest):
    """Validates and persists the Gemini API key."""
    clean_key = req.api_key.strip()
    if not clean_key:
        # Clear key
        settings.GEMINI_API_KEY = ""
        os.environ["GEMINI_API_KEY"] = ""
        return {"success": True, "message": "Gemini API key cleared. Using local CV engine."}

    # Validate key by connecting to Google Gemini
    try:
        import google.generativeai as genai
        genai.configure(api_key=clean_key)
        # Test call: list available models to verify credentials
        models = [m.name for m in genai.list_models()]
        if not models:
            raise ValueError("No models accessible with this API key.")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to validate Gemini API key with Google servers: {str(e)}"
        )

    # Key is valid: update settings in memory
    settings.GEMINI_API_KEY = clean_key
    settings.GEMINI_MODEL = req.model
    os.environ["GEMINI_API_KEY"] = clean_key

    # Persist to .env file in root
    try:
        env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
        lines = []
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        # Replace or append GEMINI_API_KEY
        new_lines = []
        key_found = False
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={clean_key}\n")
                key_found = True
            else:
                new_lines.append(line)
        if not key_found:
            new_lines.append(f"GEMINI_API_KEY={clean_key}\n")
            
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception:
        pass # In-memory update still succeeds

    return {
        "success": True,
        "message": f"Gemini API key successfully verified and connected! Using model: {req.model}",
        "masked_key": clean_key[:6] + "..." + clean_key[-4:]
    }
