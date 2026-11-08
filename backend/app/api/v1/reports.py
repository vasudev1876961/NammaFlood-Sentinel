import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.models import Incident, Report, AgentRun, IncidentUpdate, gen_id, utcnow_str
from backend.app.schemas.schemas import ReportCreateResponse
from backend.app.orchestration.workflow import MultiAgentOrchestrator
from backend.app.utils.geo_utils import validate_bengaluru_coords

router = APIRouter()
orchestrator = MultiAgentOrchestrator()

@router.post("/reports", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    image: UploadFile = File(..., description="Citizen photo of waterlogging"),
    latitude: float = Form(..., description="GPS Latitude"),
    longitude: float = Form(..., description="GPS Longitude"),
    rainfall_mm_1h: Optional[float] = Form(None, description="Optional 1-hour rainfall override"),
    rainfall_mm_3h: Optional[float] = Form(None, description="Optional 3-hour rainfall override"),
    reporter_note: Optional[str] = Form("", description="Optional citizen context"),
    reporter_phone: Optional[str] = Form(None, description="Optional contact for civic follow-up"),
    db: Session = Depends(get_db)
):
    # 1. Coordinate Validation
    valid_coord, coord_msg = validate_bengaluru_coords(latitude, longitude)
    if not valid_coord:
        raise HTTPException(status_code=400, detail=coord_msg)

    # 2. Image Validation
    if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{image.content_type}'. Supported formats: JPEG, PNG, WEBP."
        )

    report_id = gen_id("RPT")
    ext = Path(image.filename or "photo.jpg").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    file_name = f"{report_id}{ext}"
    saved_path = settings.UPLOAD_DIR / file_name

    content = await image.read()
    if len(content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_MB}MB.")

    saved_path.write_bytes(content)

    # Verify PIL can open and parse image
    try:
        with Image.open(saved_path) as im:
            im.verify()
    except Exception:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is corrupted or not a valid image.")

    # 3. Retrieve Prior Reports for Duplicate Verification
    priors_db = db.query(Report).order_by(Report.received_at.desc()).limit(200).all()
    prior_reports = [
        {
            "report_id": r.report_id,
            "incident_id": r.incident_id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "image_hash": r.image_hash
        }
        for r in priors_db
    ]

    # Generate initial incident candidate ID
    target_incident_id = gen_id("INC")
    now_ts = utcnow_str()

    # 4. Execute Multi-Agent Orchestration Workflow (LangGraph)
    workflow_state = orchestrator.run(
        incident_id=target_incident_id,
        report_id=report_id,
        image_path=str(saved_path),
        latitude=latitude,
        longitude=longitude,
        rainfall_1h=rainfall_mm_1h,
        rainfall_3h=rainfall_mm_3h,
        reporter_note=reporter_note,
        prior_reports=prior_reports
    )

    verif = workflow_state["verification_result"]
    risk = workflow_state["risk_result"]
    resp = workflow_state["response_result"]
    vision = workflow_state["vision_result"]
    weather = workflow_state["weather_result"]
    location = workflow_state["location_result"]

    # 5. Handle Duplicate Linking or New Incident Creation
    verif_status = "original"
    if verif.get("is_duplicate") and verif.get("canonical_incident_id"):
        candidate_id = verif["canonical_incident_id"]
        existing_inc = db.query(Incident).filter(Incident.incident_id == candidate_id).first()
        if existing_inc:
            target_incident_id = candidate_id
            verif_status = "duplicate_linked"
            # Update incident last seen and risk
            existing_inc.last_seen_at = now_ts
            existing_inc.updated_at = now_ts
            existing_inc.risk_score = risk["score"]
            existing_inc.risk_level = risk["level"]
            existing_inc.risk_confidence = risk["confidence"]
            existing_inc.risk_reasons_json = json.dumps(risk["reasons"])
            existing_inc.recommended_action = resp["recommended_action"]

    if verif_status == "original":
        # Create new Incident record
        new_incident = Incident(
            incident_id=target_incident_id,
            latitude=latitude,
            longitude=longitude,
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
        db.add(new_incident)

    # Mask reporter phone if provided (privacy requirement)
    masked_phone = None
    if reporter_phone:
        p_str = reporter_phone.strip()
        masked_phone = f"XXXXXX{p_str[-4:]}" if len(p_str) >= 4 else "XXXX"

    # Create Report record
    new_report = Report(
        report_id=report_id,
        incident_id=target_incident_id,
        image_path=str(saved_path),
        image_hash=workflow_state.get("image_hash"),
        latitude=latitude,
        longitude=longitude,
        reporter_note=reporter_note,
        reporter_phone_masked=masked_phone,
        occurred_at=now_ts,
        received_at=now_ts,
        vision_label=vision.get("flood_class", "unclassified"),
        vision_confidence=vision.get("confidence"),
        vision_output_json=json.dumps(vision),
        rainfall_mm_1h=weather.get("rainfall_1h_mm"),
        rainfall_mm_3h=weather.get("rainfall_3h_mm"),
        source_type="citizen",
        verification_status=verif_status
    )
    db.add(new_report)

    # Record Agent Traces in agent_runs table
    for trace in workflow_state.get("agent_traces", []):
        if "agent" in trace:
            agent_run = AgentRun(
                incident_id=target_incident_id,
                report_id=report_id,
                agent_name=trace["agent"],
                status="completed",
                output_json=json.dumps(trace.get("output", {})),
                duration_ms=float(trace.get("duration_ms") or 0.0),
                created_at=now_ts
            )
            db.add(agent_run)

    # Record Timeline Event
    note_msg = "New citizen waterlogging report ingested and analyzed by 6 specialist agents."
    if verif_status == "duplicate_linked":
        note_msg = f"Corroborating citizen report added (clustered to canonical incident {target_incident_id})."

    timeline_entry = IncidentUpdate(
        incident_id=target_incident_id,
        report_id=report_id,
        update_type="report_received",
        note=note_msg,
        created_at=now_ts
    )
    db.add(timeline_entry)

    db.commit()

    return ReportCreateResponse(
        incident_id=target_incident_id,
        report_id=report_id,
        verification_status=verif_status,
        assessment={
            "vision": vision,
            "weather": weather,
            "location": location,
            "verification": verif,
            "risk": risk,
            "response": resp,
            "workflow_duration_ms": workflow_state["workflow_duration_ms"]
        },
        message="Incident advisory intelligence computed. External action pending civic officer review."
    )

