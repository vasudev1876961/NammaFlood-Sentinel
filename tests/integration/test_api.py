import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "NammaFlood" in data["service"]

def test_report_submission_and_incident_flow():
    # Use generated sample image
    sample_img = Path("data/sample/non_flood/dry_street_1.jpg")
    assert sample_img.exists()
    
    with open(sample_img, "rb") as f:
        files = {"image": ("dry_street_1.jpg", f, "image/jpeg")}
        data = {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "rainfall_mm_1h": 0.0,
            "rainfall_mm_3h": 0.0,
            "reporter_note": "MG Road junction clear of water."
        }
        resp = client.post("/api/v1/reports", files=files, data=data)
    
    assert resp.status_code == 201
    res_data = resp.json()
    assert "incident_id" in res_data
    assert "report_id" in res_data
    incident_id = res_data["incident_id"]

    # 2. Get Incidents List
    list_resp = client.get("/api/v1/incidents")
    assert list_resp.status_code == 200
    incidents = list_resp.json()
    assert any(i["incident_id"] == incident_id for i in incidents)

    # 3. Get Incident Detail
    detail_resp = client.get(f"/api/v1/incidents/{incident_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["incident_id"] == incident_id
    assert len(detail["reports"]) >= 1
    assert len(detail["agent_runs"]) >= 5

    # 4. Review Incident (Human-in-the-loop)
    review_resp = client.post(
        f"/api/v1/incidents/{incident_id}/review",
        json={"decision": "approve", "reviewer_note": "Verified clear road condition.", "action_dispatched": "Logged in routine log"}
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["decision"] == "approve"

    # 5. Status Update
    status_resp = client.patch(
        f"/api/v1/incidents/{incident_id}/status",
        json={"status": "resolved", "note": "Traffic flowing normally."}
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "resolved"

def test_dashboard_endpoints():
    s_resp = client.get("/api/v1/dashboard/summary")
    assert s_resp.status_code == 200
    s_data = s_resp.json()
    assert "total_incidents" in s_data
    assert "mean_agent_duration_ms" in s_data

    a_resp = client.get("/api/v1/agents/status")
    assert a_resp.status_code == 200
    a_data = a_resp.json()
    assert len(a_data) == 6 # 6 specialist agents
    agent_names = [a["agent_name"] for a in a_data]
    assert "vision" in agent_names
    assert "risk" in agent_names

    r_resp = client.get("/api/v1/analytics/risk")
    assert r_resp.status_code == 200
    r_data = r_resp.json()
    assert "risk_distribution" in r_data
    assert "zone_hotspots" in r_data

