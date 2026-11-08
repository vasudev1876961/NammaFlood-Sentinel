import pytest
from pathlib import Path
from backend.app.agents.vision_agent import VisionAgent
from backend.app.agents.weather_agent import WeatherAgent
from backend.app.agents.location_agent import LocationAgent
from backend.app.agents.verification_agent import VerificationAgent
from backend.app.agents.risk_agent import RiskAgent
from backend.app.agents.response_agent import ResponseAgent
from backend.app.utils.geo_utils import haversine_distance_m, validate_bengaluru_coords

def test_haversine_distance():
    # Same point should be 0
    assert haversine_distance_m(12.9716, 77.5946, 12.9716, 77.5946) == 0.0
    # Silk Board to nearby coordinate (~35m)
    d = haversine_distance_m(12.9175, 77.6238, 12.9178, 77.6240)
    assert 20.0 < d < 60.0

def test_bengaluru_coordinate_bounds():
    ok, _ = validate_bengaluru_coords(12.9716, 77.5946) # Bengaluru center
    assert ok is True
    
    ok_out, msg = validate_bengaluru_coords(28.6139, 77.2090) # New Delhi
    assert ok_out is False
    assert "outside the Bengaluru" in msg

def test_weather_agent_imd_classification():
    agent = WeatherAgent()
    assert agent._get_imd_category(0.0) == "none"
    assert agent._get_imd_category(1.5) == "light"
    assert agent._get_imd_category(10.0) == "moderate"
    assert agent._get_imd_category(35.0) == "heavy"
    assert agent._get_imd_category(75.0) == "very_heavy_torrential"

def test_location_agent_hotspot_matching():
    agent = LocationAgent()
    # Silk Board coordinates
    res = agent.run(12.9175, 77.6238)
    assert res["status"] == "completed"
    assert res["within_500m_hotspot"] is True
    assert "Silk Board" in res["nearest_hotspot"]["name"]
    assert res["nearest_hotspot"]["distance_m"] < 10.0

def test_verification_agent_deduplication():
    agent = VerificationAgent()
    prior = [{
        "report_id": "RPT-EXISTING-1",
        "incident_id": "INC-EXISTING-1",
        "latitude": 12.9175,
        "longitude": 77.6238,
        "image_hash": "d1d1d1d1d1d1d1d1"
    }]
    
    # Report within 40m
    res = agent.run(
        lat=12.9178,
        lon=77.6240,
        current_image_hash="d1d1d1d1d1d1d1d1",
        prior_reports=prior,
        vision_result={"flood_class": "flood", "water_region_detected": True},
        weather_result={"rainfall_1h_mm": 20.0}
    )
    assert res["is_duplicate"] is True
    assert res["canonical_incident_id"] == "INC-EXISTING-1"
    assert len(res["matches"]) == 1

def test_risk_agent_bounded_scoring():
    agent = RiskAgent()
    res = agent.run(
        vision={"flood_class": "flood", "confidence": 0.9, "water_region_detected": True, "water_coverage_ratio": 0.6},
        weather={"status": "completed", "rainfall_1h_mm": 35.0, "rainfall_3h_mm": 70.0, "intensity_category": "heavy"},
        location={"status": "completed", "within_500m_hotspot": True, "nearest_hotspot": {"name": "Silk Board", "vulnerability": "Severe"}},
        verification={"status": "completed", "matches": [{"report_id": "RPT-1"}]}
    )
    assert 0.0 <= res["score"] <= 100.0
    assert res["level"] == "high"
    assert len(res["reasons"]) > 0
    assert res["confidence"] > 0.5

def test_response_agent_safety_gates():
    agent = ResponseAgent()
    res = agent.run(
        risk={"level": "high", "score": 85.0},
        verification={"is_duplicate": False},
        location={"nearest_hotspot": {"name": "Ecospace"}, "ward_name": "Bellandur"}
    )
    assert res["priority"] == "high"
    assert res["human_approval_required"] is True
    assert res["external_action_taken"] is False # Never autonomous
    assert "URGENT REVIEW" in res["recommended_action"]

