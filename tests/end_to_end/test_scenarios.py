import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_scenario_a_dry_no_rain():
    """Scenario A: No rainfall and no flood evidence -> Low Risk."""
    img_path = Path("data/processed/scenarios/images/scenario_dry.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("dry.jpg", f, "image/jpeg")},
            data={"latitude": 12.9716, "longitude": 77.5946, "rainfall_mm_1h": 0.0, "rainfall_mm_3h": 0.0, "reporter_note": "Clear road"})
    assert resp.status_code == 201
    assessment = resp.json()["assessment"]
    assert assessment["risk"]["level"] == "low"
    assert assessment["response"]["priority"] == "low"

def test_scenario_b_moderate_flood():
    """Scenario B: Flood-like visual evidence with moderate rainfall -> Medium Risk."""
    img_path = Path("data/processed/scenarios/images/scenario_mod_flood.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("mod.jpg", f, "image/jpeg")},
            data={"latitude": 12.9363, "longitude": 77.6322, "rainfall_mm_1h": 12.5, "rainfall_mm_3h": 22.0, "reporter_note": "Puddle forming"})
    assert resp.status_code == 201
    assessment = resp.json()["assessment"]
    assert assessment["risk"]["level"] in ["medium", "high"]

def test_scenario_c_heavy_rain_hotspot():
    """Scenario C: Heavy rainfall with nearby known flood-prone location -> High Risk."""
    img_path = Path("data/processed/scenarios/images/scenario_severe_flood.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("severe.jpg", f, "image/jpeg")},
            data={"latitude": 12.9175, "longitude": 77.6238, "rainfall_mm_1h": 48.0, "rainfall_mm_3h": 85.0, "reporter_note": "Silk Board waterlogged"})
    assert resp.status_code == 201
    res = resp.json()
    assessment = res["assessment"]
    assert assessment["risk"]["level"] == "high"
    assert assessment["location"]["within_500m_hotspot"] is True
    assert "URGENT REVIEW" in assessment["response"]["recommended_action"]
    
    # Store incident ID for duplicate test
    return res["incident_id"]

def test_scenario_d_duplicate_clustering():
    """Scenario D: Two reports from the same road segment -> Clustered Duplicate."""
    # First submit report
    img_path = Path("data/processed/scenarios/images/scenario_severe_flood.jpg")
    with open(img_path, "rb") as f:
        r1 = client.post("/api/v1/reports", files={"image": ("severe1.jpg", f, "image/jpeg")},
            data={"latitude": 12.9175, "longitude": 77.6238, "rainfall_mm_1h": 45.0, "rainfall_mm_3h": 80.0})
    inc_id = r1.json()["incident_id"]
    
    # Second submit from 35 meters away with same photo
    dup_path = Path("data/processed/scenarios/images/scenario_duplicate_rpt.jpg")
    with open(dup_path, "rb") as f:
        r2 = client.post("/api/v1/reports", files={"image": ("severe2.jpg", f, "image/jpeg")},
            data={"latitude": 12.9178, "longitude": 77.6240, "rainfall_mm_1h": 45.0, "rainfall_mm_3h": 80.0})
    
    assert r2.status_code == 201
    r2_data = r2.json()
    assert r2_data["verification_status"] == "duplicate_linked"
    assert r2_data["incident_id"] == inc_id

def test_scenario_e_missing_weather_fallback():
    """Scenario E: Missing weather information -> Degraded fallback, pipeline completes."""
    img_path = Path("data/processed/scenarios/images/scenario_severe_flood.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("sev.jpg", f, "image/jpeg")},
            data={"latitude": 12.9260, "longitude": 77.6834})
    assert resp.status_code == 201
    assessment = resp.json()["assessment"]
    assert "weather" in assessment
    assert assessment["risk"]["score"] > 0

def test_scenario_f_blurry_image():
    """Scenario F: Blurry or invalid image -> Quality poor flagged."""
    img_path = Path("data/processed/scenarios/images/scenario_blurry.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("blur.jpg", f, "image/jpeg")},
            data={"latitude": 12.9800, "longitude": 77.6000, "rainfall_mm_1h": 2.0, "rainfall_mm_3h": 5.0})
    assert resp.status_code == 201
    assessment = resp.json()["assessment"]
    assert assessment["vision"]["image_quality"] == "poor"

def test_scenario_g_contradictory_evidence():
    """Scenario G: Conflicting visual and rainfall evidence -> Contradiction flagged."""
    img_path = Path("data/processed/scenarios/images/scenario_dry.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("dry_contradict.jpg", f, "image/jpeg")},
            data={"latitude": 13.0358, "longitude": 77.5970, "rainfall_mm_1h": 55.0, "rainfall_mm_3h": 90.0})
    assert resp.status_code == 201
    assessment = resp.json()["assessment"]
    verif = assessment["verification"]
    assert verif["contradictory_flag"] is True

def test_scenario_h_human_rejection():
    """Scenario H: Human reviewer rejects an incorrect assessment -> Audit saved."""
    img_path = Path("data/processed/scenarios/images/scenario_dry.jpg")
    with open(img_path, "rb") as f:
        resp = client.post("/api/v1/reports", files={"image": ("dry_h.jpg", f, "image/jpeg")},
            data={"latitude": 12.9772, "longitude": 77.5714, "rainfall_mm_1h": 0.0, "rainfall_mm_3h": 0.0})
    inc_id = resp.json()["incident_id"]

    rev_resp = client.post(
        f"/api/v1/incidents/{inc_id}/review",
        json={"decision": "reject", "reviewer_note": "False alarm: inspected CCTV, road is completely dry."}
    )
    assert rev_resp.status_code == 200
    assert rev_resp.json()["decision"] == "reject"
    
    # Check that incident status is rejected
    detail = client.get(f"/api/v1/incidents/{inc_id}").json()
    assert detail["status"] == "rejected"

