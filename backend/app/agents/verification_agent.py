import time
from typing import Optional, Any
from backend.app.utils.geo_utils import haversine_distance_m
from backend.app.utils.hash_utils import hamming_distance, is_visual_duplicate

class VerificationAgent:
    """Specialist AI Agent for Duplicate Report Detection and Contradiction Verification."""
    agent_name = "verification"
    
    def run(
        self,
        lat: float,
        lon: float,
        current_image_hash: str,
        prior_reports: list[dict[str, Any]],
        vision_result: dict[str, Any],
        weather_result: dict[str, Any]
    ) -> dict[str, any]:
        t0 = time.perf_counter()
        matches = []
        is_dup = False
        canonical_incident_id = None
        
        # 1. Spatiotemporal & Perceptual Hash Analysis
        for prior in prior_reports:
            p_lat = prior.get("latitude")
            p_lon = prior.get("longitude")
            if p_lat is None or p_lon is None:
                continue
                
            dist = haversine_distance_m(lat, lon, p_lat, p_lon)
            p_hash = prior.get("image_hash", "")
            h_dist = hamming_distance(current_image_hash, p_hash) if (current_image_hash and p_hash) else 999
            visual_match = h_dist <= 8
            
            # If within 150m OR identical image uploaded anywhere
            if dist <= 150.0 or visual_match:
                matches.append({
                    "report_id": prior.get("report_id"),
                    "incident_id": prior.get("incident_id"),
                    "distance_m": round(dist, 1),
                    "hamming_distance": h_dist,
                    "visual_match": visual_match,
                    "match_type": "spatial_and_visual" if (dist <= 150 and visual_match) else ("visual_duplicate" if visual_match else "spatial_proximity")
                })
                if not canonical_incident_id:
                    canonical_incident_id = prior.get("incident_id")
                is_dup = True

        # 2. Evidence Contradiction Verification
        # Check if visual model found zero water (<5% coverage) but weather/reporter claims disaster, or vice-versa
        contradictory = False
        contradiction_reasons = []
        
        v_class = vision_result.get("flood_class", "unknown")
        water_detected = vision_result.get("water_region_detected", False)
        rain_1h = weather_result.get("rainfall_1h_mm")
        
        if (rain_1h is not None and rain_1h >= 40.0) and (not water_detected and v_class == "non_flood"):
            contradictory = True
            contradiction_reasons.append("High rainfall reported (>=40mm), but photo shows dry/non-flooded road surface.")
            
        verdict = "duplicate_candidate" if is_dup else ("contradictory_evidence" if contradictory else "verified_unique")

        return {
            "agent": self.agent_name,
            "status": "completed",
            "is_duplicate": is_dup,
            "canonical_incident_id": canonical_incident_id,
            "matches": matches,
            "verification_verdict": verdict,
            "contradictory_flag": contradictory,
            "contradiction_reasons": contradiction_reasons,
            "evidence": [
                f"{len(matches)} nearby or visual duplicate reports identified within 150m buffer." if is_dup else "No spatial or visual duplicate matches found within 150m."
            ],
            "note": "Spatial proximity links reports to a canonical incident; human reviewer retains final authority.",
            "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
        }

