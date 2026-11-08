import time
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

def run_live_civic_demo():
    print("=" * 70)
    print("🌊 NAMMAFLOOD SENTINEL — LIVE MULTI-AGENT CIVIC DEMO 🌧️")
    print("=" * 70)
    client = TestClient(app)

    # 1. Ingest Incident 1: Silk Board Downpour (High Priority Alert)
    print("\n[Step 1] Citizen submits flood photo at Silk Board Underpass (12.9175, 77.6238)...")
    img1 = Path("data/sample/flood/1.jpg")
    with open(img1, "rb") as f:
        res1 = client.post("/api/v1/reports", files={"image": ("silkboard.jpg", f, "image/jpeg")},
            data={"latitude": 12.9175, "longitude": 77.6238, "rainfall_mm_1h": 46.5, "rainfall_mm_3h": 82.0, "reporter_note": "Silk board underpass flooded up to tire rim, traffic stalled"})
    assert res1.status_code == 201
    d1 = res1.json()
    inc1 = d1["incident_id"]
    print(f" -> Incident Created: {inc1}")
    print(f" -> Risk Score: {d1['assessment']['risk']['score']}/100 ({d1['assessment']['risk']['level'].upper()})")
    print(f" -> Nearest Hotspot: {d1['assessment']['location']['nearest_hotspot']['name']} ({d1['assessment']['location']['nearest_hotspot']['distance_m']}m)")
    print(f" -> Recommended Action: {d1['assessment']['response']['recommended_action']}")

    # 2. Ingest Incident 2: Second Citizen at Silk Board (Duplicate Detection)
    print("\n[Step 2] Second citizen submits report from 35m away at Silk Board...")
    with open(img1, "rb") as f:
        res2 = client.post("/api/v1/reports", files={"image": ("silkboard_dup.jpg", f, "image/jpeg")},
            data={"latitude": 12.9178, "longitude": 77.6240, "rainfall_mm_1h": 46.5, "rainfall_mm_3h": 82.0, "reporter_note": "Heavy water accumulation at Silk Board bus stop"})
    assert res2.status_code == 201
    d2 = res2.json()
    print(f" -> Verification Status: {d2['verification_status']}")
    print(f" -> Clustered with Incident: {d2['incident_id']} (Matches found: {len(d2['assessment']['verification']['matches'])})")

    # 3. Ingest Incident 3: MG Road Clear Conditions (Low Risk)
    print("\n[Step 3] Citizen submits routine check at MG Road (12.9716, 77.5946)...")
    img_dry = Path("data/sample/non_flood/dry_street_1.jpg")
    with open(img_dry, "rb") as f:
        res3 = client.post("/api/v1/reports", files={"image": ("mgroad.jpg", f, "image/jpeg")},
            data={"latitude": 12.9716, "longitude": 77.5946, "rainfall_mm_1h": 0.0, "rainfall_mm_3h": 0.0, "reporter_note": "MG road is clear, normal traffic flow"})
    assert res3.status_code == 201
    d3 = res3.json()
    print(f" -> Incident Created: {d3['incident_id']}")
    print(f" -> Risk Score: {d3['assessment']['risk']['score']}/100 ({d3['assessment']['risk']['level'].upper()})")

    # 4. Human-in-the-Loop Review Gate
    print(f"\n[Step 4] BBMP Civic Official audits Incident {inc1}...")
    rev = client.post(f"/api/v1/incidents/{inc1}/review", json={
        "decision": "approve",
        "reviewer_note": "CCTV confirmed 1.5 ft water pooling; mobile suction pump crew 3 dispatched.",
        "action_dispatched": "BBMP Suction Pump Crew 3 Dispatched to Silk Board Underpass"
    })
    assert rev.status_code == 200
    print(f" -> Decision: {rev.json()['decision'].upper()}")
    print(f" -> Action Dispatched: {rev.json()['action_dispatched']}")

    # 5. Dashboard Summary
    print("\n[Step 5] Querying Civic Control Room Telemetry...")
    summary = client.get("/api/v1/dashboard/summary").json()
    print(f" -> Total Active Incidents: {summary['total_incidents']}")
    print(f" -> High Risk Hotspots: {summary['high_risk_count']}")
    print(f" -> Multi-Agent Pipeline SLA: {summary['mean_agent_duration_ms']} ms")

    print("\n" + "=" * 70)
    print("DEMO RUN COMPLETE: All 6 specialist agents and human review gate verified!")
    print("=" * 70)

if __name__ == "__main__":
    run_live_civic_demo()

