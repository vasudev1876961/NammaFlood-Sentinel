import time
import os
from pathlib import Path
from typing import Any, Optional

class RiskAgent:
    """Specialist AI Agent for Multimodal Evidence Fusion and Urban Flood Risk Prioritization."""
    agent_name = "risk"
    
    def __init__(self, model_path: Optional[str] = None):
        self.rf_model = None
        self._load_ml_model(model_path)

    def _load_ml_model(self, model_path: Optional[str]):
        """Attempts to load trained scikit-learn / joblib model if available."""
        target_path = model_path or Path(__file__).resolve().parent.parent.parent.parent / "ml" / "models" / "risk_rf_model.pkl"
        if os.path.exists(target_path):
            try:
                import joblib
                self.rf_model = joblib.load(target_path)
            except Exception:
                self.rf_model = None

    def extract_feature_vector(
        self,
        vision: dict[str, Any],
        weather: dict[str, Any],
        location: dict[str, Any],
        verification: dict[str, Any]
    ) -> list[float]:
        """Constructs standardized 7-dimensional numeric feature vector for ML scoring."""
        # 1. Vision flood probability / score (0.0 to 1.0)
        v_class = vision.get("flood_class", "non_flood")
        v_conf = float(vision.get("confidence") or 0.5)
        v_score = v_conf if v_class == "flood" else (1.0 - v_conf if v_class == "non_flood" else 0.2)
        
        # 2. Water surface coverage ratio (0.0 to 1.0)
        water_cov = float(vision.get("water_coverage_ratio") or 0.0)
        
        # 3. 1-hour rainfall in mm
        r1 = float(weather.get("rainfall_1h_mm") or 0.0)
        
        # 4. 3-hour rainfall in mm
        r3 = float(weather.get("rainfall_3h_mm") or (r1 * 2.0))
        
        # 5. Distance to nearest hotspot in meters (capped at 2000m)
        spot_dist = float(location.get("nearest_hotspot", {}).get("distance_m", 2000.0))
        spot_dist_clamped = min(max(spot_dist, 0.0), 2000.0)
        
        # 6. Number of nearby corroborating reports
        corroboration_count = float(len(verification.get("matches", [])))
        
        # 7. Within 500m hotspot indicator (0 or 1)
        in_500m = 1.0 if location.get("within_500m_hotspot", False) else 0.0
        
        return [v_score, water_cov, r1, r3, spot_dist_clamped, corroboration_count, in_500m]

    def compute_heuristic_score(
        self,
        vision: dict[str, Any],
        weather: dict[str, Any],
        location: dict[str, Any],
        verification: dict[str, Any]
    ) -> tuple[float, list[str]]:
        """Calculates transparent, auditable heuristic risk score (0-100) with line-item justifications."""
        score = 0.0
        reasons = []
        
        # 1. Visual Evidence (Max 35 points)
        v_class = vision.get("flood_class", "unclassified")
        v_conf = float(vision.get("confidence") or 0.0)
        water_det = vision.get("water_region_detected", False)
        
        if v_class == "flood":
            pts = 35.0 * v_conf
            score += pts
            reasons.append(f"Visual evidence confirms flood water (confidence: {v_conf:.2f}): +{pts:.1f} pts")
        elif water_det:
            score += 20.0
            reasons.append("Visual pooling detected on road surface without full flood classification: +20.0 pts")
        else:
            reasons.append(f"Visual classification '{v_class}' does not indicate major flood inundation.")

        # 2. Rainfall Context (Max 30 points)
        r1 = weather.get("rainfall_1h_mm")
        r3 = weather.get("rainfall_3h_mm")
        if r1 is not None and r1 > 0:
            # Scale up to 50mm = 20 pts
            pts1 = min(float(r1), 50.0) * 0.40
            score += pts1
            reasons.append(f"1-hour rainfall accumulation ({r1} mm, {weather.get('intensity_category')}): +{pts1:.1f} pts")
        if r3 is not None and r3 > 0:
            # Scale up to 100mm = 10 pts
            pts3 = min(float(r3), 100.0) * 0.10
            score += pts3
            reasons.append(f"3-hour cumulative rainfall ({r3} mm): +{pts3:.1f} pts")
        if r1 is None and r3 is None:
            reasons.append("Rainfall observations unavailable; weather contribution flagged missing.")

        # 3. Hotspot Geospatial Proximity (Max 20 points)
        if location.get("within_500m_hotspot"):
            spot = location.get("nearest_hotspot", {})
            score += 20.0
            reasons.append(f"Incident is within 500m of chronic waterlogging hotspot ({spot.get('name')}, {spot.get('vulnerability')} vulnerability): +20.0 pts")
        elif location.get("nearest_hotspot", {}).get("distance_m", 9999) <= 1000:
            score += 10.0
            reasons.append(f"Incident is in catchment buffer of {location.get('nearest_hotspot', {}).get('name')}: +10.0 pts")

        # 4. Social / Sensor Corroboration (Max 15 points)
        matches = verification.get("matches", [])
        if matches:
            dup_pts = min(len(matches) * 5.0, 15.0)
            score += dup_pts
            reasons.append(f"{len(matches)} corroborating citizen reports in vicinity: +{dup_pts:.1f} pts")

        score = round(min(score, 100.0), 1)
        return score, reasons

    def run(
        self,
        vision: dict[str, Any],
        weather: dict[str, Any],
        location: dict[str, Any],
        verification: dict[str, Any]
    ) -> dict[str, any]:
        t0 = time.perf_counter()
        
        # Calculate transparent heuristic baseline
        score, reasons = self.compute_heuristic_score(vision, weather, location, verification)
        
        # Categorize level
        if score >= 70.0:
            level = "high"
        elif score >= 40.0:
            level = "medium"
        else:
            level = "low"

        # Evidence completeness confidence (0.0 to 1.0)
        evidence_sources = [
            vision.get("status") == "completed",
            weather.get("status") == "completed" and not weather.get("missing_evidence", False),
            location.get("status") == "completed",
            verification.get("status") == "completed"
        ]
        confidence = round(sum(evidence_sources) / len(evidence_sources), 2)

        # ML model prediction if model weights exist
        ml_info = None
        if self.rf_model:
            try:
                features = [self.extract_feature_vector(vision, weather, location, verification)]
                probs = self.rf_model.predict_proba(features)[0]
                pred_class = self.rf_model.predict(features)[0]
                ml_info = {
                    "model": "RandomForestClassifier_v1",
                    "predicted_priority": pred_class,
                    "class_probabilities": {str(c): round(float(p), 3) for c, p in zip(self.rf_model.classes_, probs)}
                }
            except Exception as e:
                ml_info = {"model": "RandomForest_error", "note": str(e)}

        return {
            "agent": self.agent_name,
            "status": "completed",
            "score": score,
            "level": level,
            "confidence": confidence,
            "confidence_semantics": "fraction of evidence modalities available and verified",
            "reasons": reasons,
            "ml_prediction": ml_info,
            "limitations": [
                "Uncalibrated prototype heuristic decision support.",
                "Not an official BBMP warning or hydrological flood depth guarantee."
            ],
            "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
        }

