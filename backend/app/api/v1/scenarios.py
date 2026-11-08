import csv
import io
import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

from backend.app.database.session import get_db
from backend.app.models.models import Incident, Report, AgentRun
from backend.app.orchestration.workflow import MultiAgentOrchestrator
from backend.app.core.config import settings

router = APIRouter()
orchestrator = MultiAgentOrchestrator()

@router.get("/export/csv")
def export_incidents_csv(db: Session = Depends(get_db)):
    """Exports all verified and active waterlogging incidents as official CSV for BBMP / NDRF teams."""
    incidents = db.query(Incident).order_by(Incident.updated_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Incident ID", "Latitude", "Longitude", "Ward", "Status",
        "Risk Score", "Risk Level", "Evidence Confidence",
        "Recommended Action", "First Seen At", "Last Seen At"
    ])
    
    for inc in incidents:
        writer.writerow([
            inc.incident_id,
            inc.latitude,
            inc.longitude,
            inc.ward_name,
            inc.status,
            inc.risk_score,
            inc.risk_level,
            inc.risk_confidence,
            inc.recommended_action,
            inc.first_seen_at,
            inc.last_seen_at
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nammaflood_civic_incidents_export.csv"}
    )

@router.post("/scenarios/run/{scenario_id}")
def run_benchmark_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Executes a benchmark scenario (SCENARIO_A through SCENARIO_H) through the multi-agent orchestrator."""
    scenarios_manifest = settings.BASE_DIR / "data" / "processed" / "scenarios" / "scenarios_manifest.csv"
    if not scenarios_manifest.exists():
        raise HTTPException(status_code=404, detail="Scenarios manifest not found. Run scripts/generate_scenarios.py first.")
        
    target_row = None
    with open(scenarios_manifest, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["scenario_id"].upper() == scenario_id.upper():
                target_row = row
                break
                
    if not target_row:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found. Available: SCENARIO_A through SCENARIO_H.")

    # Retrieve prior reports
    priors_db = db.query(Report).order_by(Report.received_at.desc()).limit(100).all()
    priors = [{
        "report_id": r.report_id,
        "incident_id": r.incident_id,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "image_hash": r.image_hash
    } for r in priors_db]

    from backend.app.models.models import gen_id, utcnow_str
    target_inc_id = gen_id("INC")
    report_id = gen_id("RPT")
    
    r1 = float(target_row["rainfall_1h"]) if target_row["rainfall_1h"] and target_row["rainfall_1h"] != "None" else None
    r3 = float(target_row["rainfall_3h"]) if target_row["rainfall_3h"] and target_row["rainfall_3h"] != "None" else None

    state = orchestrator.run(
        incident_id=target_inc_id,
        report_id=report_id,
        image_path=target_row["image_path"],
        latitude=float(target_row["latitude"]),
        longitude=float(target_row["longitude"]),
        rainfall_1h=r1,
        rainfall_3h=r3,
        reporter_note=f"Benchmark Test: {target_row['title']}",
        prior_reports=priors
    )
    
    # Save into DB for UI visibility
    now_ts = utcnow_str()
    risk = state["risk_result"]
    verif = state["verification_result"]
    resp = state["response_result"]
    vision = state["vision_result"]
    weather = state["weather_result"]
    location = state["location_result"]

    verif_status = "original"
    if verif.get("is_duplicate") and verif.get("canonical_incident_id"):
        target_inc_id = verif["canonical_incident_id"]
        verif_status = "duplicate_linked"
    else:
        new_inc = Incident(
            incident_id=target_inc_id,
            latitude=float(target_row["latitude"]),
            longitude=float(target_row["longitude"]),
            ward_name=location.get("ward_name", "Bengaluru Urban"),
            first_seen_at=now_ts,
            last_seen_at=now_ts,
            status="open",
            risk_score=risk["score"],
            risk_level=risk["level"],
            risk_confidence=risk["confidence"],
            risk_reasons_json=json.dumps(risk["reasons"]),
            location_context_json=json.dumps(location),
            weather_context_json=json.dumps(weather),
            recommended_action=resp["recommended_action"],
            created_at=now_ts,
            updated_at=now_ts
        )
        db.add(new_inc)

    new_report = Report(
        report_id=report_id,
        incident_id=target_inc_id,
        image_path=target_row["image_path"],
        image_hash=state.get("image_hash"),
        latitude=float(target_row["latitude"]),
        longitude=float(target_row["longitude"]),
        reporter_note=f"Triggered from Scenario Runner: {target_row['description']}",
        occurred_at=now_ts,
        received_at=now_ts,
        vision_label=vision.get("flood_class", "unclassified"),
        vision_confidence=vision.get("confidence"),
        vision_output_json=json.dumps(vision),
        rainfall_mm_1h=r1,
        rainfall_mm_3h=r3,
        source_type="synthetic_scenario",
        verification_status=verif_status
    )
    db.add(new_report)
    
    # Add timeline update
    db.add(IncidentUpdate(
        incident_id=target_inc_id,
        report_id=report_id,
        update_type="scenario_executed",
        note=f"Evaluated scenario {scenario_id}: {target_row['title']}",
        created_at=now_ts
    ))
    db.commit()

    return {
        "scenario_id": scenario_id,
        "title": target_row["title"],
        "incident_id": target_inc_id,
        "report_id": report_id,
        "assessment": {
            "vision": vision,
            "weather": weather,
            "location": location,
            "verification": verif,
            "risk": risk,
            "response": resp,
            "workflow_duration_ms": state["workflow_duration_ms"]
        }
    }

