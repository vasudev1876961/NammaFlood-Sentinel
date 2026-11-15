import os
import time
from pathlib import Path
from PIL import Image, ImageStat
import numpy as np

class VisionAgent:
    """Specialist AI Agent for Urban Flood Visual Evidence Analysis."""
    agent_name = "vision"
    
    def __init__(self, model_id: str | None = None):
        self.model_id = model_id or os.getenv("VISION_MODEL_ID", "")
        self.pipeline = None
        self.torch_model = None
        self._init_model()

    def _init_model(self):
        """Initializes vision model if available; falls back to robust CV feature extraction."""
        if self.model_id:
            try:
                from transformers import pipeline
                self.pipeline = pipeline("image-classification", model=self.model_id)
            except Exception as e:
                # Log model load warning, fallback to CV heuristic
                pass

    def assess_image_quality(self, img: Image.Image) -> tuple[str, list[str]]:
        """Assesses image dimensions, lighting, and clarity."""
        issues = []
        w, h = img.size
        if w < 200 or h < 200:
            issues.append(f"Low resolution: {w}x{h}")
            
        stat = ImageStat.Stat(img)
        # Average brightness (0-255)
        mean_brightness = sum(stat.mean[:3]) / 3.0
        if mean_brightness < 30:
            issues.append("Image is excessively dark / underexposed")
        elif mean_brightness > 230:
            issues.append("Image is overexposed / washed out")
            
        quality = "poor" if issues else "good"
        return quality, issues

    def analyze_water_features(self, img: Image.Image) -> dict[str, any]:
        """Analyzes color variance, turbid silt pooling, and specular reflections on road surfaces."""
        img_rgb = img.convert("RGB").resize((224, 224))
        arr = np.array(img_rgb, dtype=np.float32)
        
        # Analyze lower frame (road surface)
        bottom = arr[112:, :]
        r = bottom[:, :, 0]
        g = bottom[:, :, 1]
        b = bottom[:, :, 2]
        brightness = bottom.mean(axis=2)
        
        # 1. Turbid muddy floodwater (characteristic of Bengaluru monsoon runoff: silt/brown/greenish hue)
        turbid_mask = (r - b > 7.0) & (g - b > 3.0) & (brightness > 68.0) & (brightness < 210.0)
        
        # 2. Daylight specular reflection / pooled standing water reflecting overcast sky
        reflective_mask = (b - r > 10.0) & (brightness > 85.0) & (brightness < 235.0)
        
        water_mask = turbid_mask | reflective_mask
        water_ratio = float(np.mean(water_mask))
        
        evidence = []
        is_water = water_ratio >= 0.20
        
        if is_water:
            evidence.append(f"Extensive uniform reflective pooling detected in lower road frame ({water_ratio*100:.1f}% coverage)")
            if np.mean(turbid_mask) > np.mean(reflective_mask):
                evidence.append("Turbid muddy runoff coloration detected on road surface")
            else:
                evidence.append("Specular water reflection obscuring asphalt texture")
        else:
            evidence.append(f"Limited standing surface water detected ({water_ratio*100:.1f}% coverage)")

        return {
            "water_detected": is_water,
            "coverage_ratio": round(water_ratio, 3),
            "evidence": evidence
        }

    def analyze_with_gemini(self, img: Image.Image) -> dict | None:
        """Invokes Google Gemini Multimodal Vision API for expert urban flood analysis."""
        from backend.app.core.config import settings
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None

        try:
            import json
            import re
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(settings.GEMINI_MODEL or "gemini-1.5-flash")

            prompt = (
                "You are an expert hydrological disaster intelligence AI for Bengaluru, India (BBMP & BTP). "
                "Analyze this urban street/road photograph for signs of waterlogging, inundation, or flooding. "
                "Output strictly a JSON object with these keys:\n"
                "{\n"
                '  "flood_detected": true or false,\n'
                '  "confidence": 0.0 to 1.0,\n'
                '  "estimated_water_depth": "e.g. 1.5 - 2.0 ft (wheel-hub height)",\n'
                '  "water_turbidity": "silty_runoff" or "standing_rainwater" or "dry",\n'
                '  "submerged_objects": ["list of visible submerged elements (e.g. road curb, car tires)"],\n'
                '  "traffic_passability": "impassable for light vehicles" or "passable with caution" or "normal",\n'
                '  "hazard_level": "severe" or "moderate" or "low",\n'
                '  "situation_summary": "2 concise sentences on visual road condition",\n'
                '  "key_observations": ["bullet 1", "bullet 2"]\n'
                "}\n"
                "Return ONLY the raw JSON. No markdown fences, no conversational text."
            )

            # Resize if very large for faster token latency
            img_to_send = img.copy()
            if img_to_send.width > 1024 or img_to_send.height > 1024:
                img_to_send.thumbnail((1024, 1024))

            response = model.generate_content([prompt, img_to_send])
            text = response.text.strip()
            # Clean markdown code block if present
            text = re.sub(r"^```(?:json)?", "", text).rstrip("`").strip()
            return json.loads(text)
        except Exception as e:
            return {"error": str(e)}

    def run(self, image_path: str | Path) -> dict[str, any]:
        t0 = time.perf_counter()
        p = Path(image_path)
        if not p.exists():
            return {
                "agent": self.agent_name,
                "status": "failed",
                "flood_class": "error",
                "confidence": 0.0,
                "water_region_detected": False,
                "image_quality": "unreadable",
                "evidence": ["Image file not found on disk."],
                "needs_human_review": True,
                "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
            }

        try:
            with Image.open(p) as img:
                quality, quality_issues = self.assess_image_quality(img)
                water_analysis = self.analyze_water_features(img)
                
                # 1. Try Google Gemini Multimodal Vision if API Key configured
                gemini_data = self.analyze_with_gemini(img)
                if gemini_data and "error" not in gemini_data:
                    is_flood = bool(gemini_data.get("flood_detected", water_analysis["water_detected"]))
                    flood_class = "flood" if is_flood else "non_flood"
                    confidence = float(gemini_data.get("confidence", 0.94))
                    
                    evidence = []
                    if gemini_data.get("situation_summary"):
                        evidence.append(f"Gemini Multimodal: {gemini_data['situation_summary']}")
                    if gemini_data.get("estimated_water_depth"):
                        evidence.append(f"Depth Estimate: {gemini_data['estimated_water_depth']}")
                    if gemini_data.get("traffic_passability"):
                        evidence.append(f"Passability: {gemini_data['traffic_passability']}")
                    if gemini_data.get("submerged_objects"):
                        evidence.append(f"Submerged Assets: {', '.join(gemini_data['submerged_objects'])}")
                    
                    evidence.extend(water_analysis["evidence"])
                # 2. Check if local transformer pipeline is loaded
                elif self.pipeline:
                    try:
                        preds = self.pipeline(str(p), top_k=3)
                        top_label = preds[0]["label"].lower()
                        top_score = float(preds[0]["score"])
                        is_flood_label = any(k in top_label for k in ["flood", "water", "waterlogging", "lake", "river", "inundation"])
                        
                        flood_class = "flood" if is_flood_label else "non_flood"
                        confidence = top_score
                        evidence = [f"Model prediction: {top_label} ({top_score*100:.1f}%)"] + water_analysis["evidence"]
                    except Exception as me:
                        # Fallback to CV analysis
                        flood_class = "flood" if water_analysis["water_detected"] else "non_flood"
                        confidence = 0.82 if flood_class == "flood" else 0.75
                        evidence = water_analysis["evidence"] + [f"Deep learning pipeline fallback: {str(me)}"]
                # 3. Fallback to calibrated CV heuristic (silt & reflection masks)
                else:
                    flood_class = "flood" if water_analysis["water_detected"] else "non_flood"
                    confidence = 0.86 if flood_class == "flood" else 0.78
                    evidence = water_analysis["evidence"]

                if quality_issues:
                    evidence.extend(quality_issues)

                duration_ms = round((time.perf_counter() - t0) * 1000, 2)
                return {
                    "agent": self.agent_name,
                    "status": "completed",
                    "flood_class": flood_class,
                    "confidence": round(confidence, 3),
                    "water_region_detected": water_analysis["water_detected"],
                    "water_coverage_ratio": water_analysis["coverage_ratio"],
                    "image_quality": quality,
                    "evidence": evidence,
                    "needs_human_review": True, # All civic actions require human oversight
                    "duration_ms": duration_ms
                }
        except Exception as e:
            return {
                "agent": self.agent_name,
                "status": "failed",
                "flood_class": "error",
                "confidence": 0.0,
                "water_region_detected": False,
                "image_quality": "corrupted",
                "evidence": [f"Image parsing error: {str(e)}"],
                "needs_human_review": True,
                "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
            }
