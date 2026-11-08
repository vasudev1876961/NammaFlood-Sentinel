import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.models import Incident, Report, AgentRun, Review, IncidentUpdate, utcnow_str
from backend.app.schemas.schemas import (
    IncidentSummary,
    IncidentDetail,
    ReportOut,
    AgentRunOut,
    ReviewOut,
    IncidentUpdateOut,
    ReviewCreate,
    StatusUpdate
)

router = APIRouter()

@router.get("/incidents", response_model=list[IncidentSummary])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status: open, verified, action_approved, resolved, rejected"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: low, medium, high"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if risk_level:
        query = query.filter(Incident.risk_level == risk_level)
        
    incidents = query.order_by(Incident.updated_at.desc()).limit(limit).all()
    
    results = []
    for inc in incidents:
        count = db.query(Report).filter(Report.incident_id == inc.incident_id).count()
        results.append(
            IncidentSummary(
                incident_id=inc.incident_id,
                latitude=inc.latitude,
                longitude=inc.longitude,
                ward_name=inc.ward_name,
                first_seen_at=inc.first_seen_at,
                last_seen_at=inc.last_seen_at,
                status=inc.status,
                risk_score=inc.risk_score,
                risk_level=inc.risk_level,
                risk_confidence=inc.risk_confidence,
                recommended_action=inc.recommended_action,
                reports_count=count,
                created_at=inc.created_at,
                updated_at=inc.updated_at
            )
        )
    return results

@router.get("/incidents/{incident_id}", response_model=IncidentDetail)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        
    reports = db.query(Report).filter(Report.incident_id == incident_id).order_by(Report.received_at.asc()).all()
    runs = db.query(AgentRun).filter(AgentRun.incident_id == incident_id).order_by(AgentRun.run_id.asc()).all()
    reviews = db.query(Review).filter(Review.incident_id == incident_id).order_by(Review.reviewed_at.desc()).all()
    updates = db.query(IncidentUpdate).filter(IncidentUpdate.incident_id == incident_id).order_by(IncidentUpdate.created_at.asc()).all()
    
    # Parse JSON fields safely
    reasons = json.loads(inc.risk_reasons_json) if inc.risk_reasons_json else []
    loc_ctx = json.loads(inc.location_context_json) if inc.location_context_json else {}
    weath_ctx = json.loads(inc.weather_context_json) if inc.weather_context_json else {}
    
    runs_out = [
        AgentRunOut(
            run_id=r.run_id,
            agent_name=r.agent_name,
            status=r.status,
            output=json.loads(r.output_json) if r.output_json else {},
            duration_ms=r.duration_ms,
            created_at=r.created_at
        )
        for r in runs
    ]

    return IncidentDetail(
        incident_id=inc.incident_id,
        latitude=inc.latitude,
        longitude=inc.longitude,
        ward_name=inc.ward_name,
        first_seen_at=inc.first_seen_at,
        last_seen_at=inc.last_seen_at,
        status=inc.status,
        risk_score=inc.risk_score,
        risk_level=inc.risk_level,
        risk_confidence=inc.risk_confidence,
        risk_reasons=reasons,
        location_context=loc_ctx,
        weather_context=weath_ctx,
        recommended_action=inc.recommended_action,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        reports=[ReportOut.model_validate(r) for r in reports],
        agent_runs=runs_out,
        reviews=[ReviewOut.model_validate(rev) for rev in reviews],
        updates=[IncidentUpdateOut.model_validate(u) for u in updates]
    )

@router.get("/incidents/{incident_id}/timeline", response_model=list[IncidentUpdateOut])
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        
    updates = db.query(IncidentUpdate).filter(IncidentUpdate.incident_id == incident_id).order_by(IncidentUpdate.created_at.asc()).all()
    return [IncidentUpdateOut.model_validate(u) for u in updates]

@router.post("/incidents/{incident_id}/review", response_model=ReviewOut)
def review_incident(
    incident_id: str,
    review_in: ReviewCreate,
    x_admin_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        
    if review_in.decision not in ["approve", "reject", "edit", "request_verification"]:
        raise HTTPException(status_code=400, detail="Decision must be one of: 'approve', 'reject', 'edit', 'request_verification'.")

    now_ts = utcnow_str()
    status_map = {
        "approve": "action_approved",
        "reject": "rejected",
        "edit": "investigating",
        "request_verification": "verifying"
    }
    new_status = status_map[review_in.decision]
    inc.status = new_status
    inc.updated_at = now_ts
    
    # Save review record
    review_record = Review(
        incident_id=incident_id,
        reviewer_id="bbmp_officer_control",
        decision=review_in.decision,
        reviewer_note=review_in.reviewer_note,
        action_dispatched=review_in.action_dispatched or inc.recommended_action,
        reviewed_at=now_ts
    )
    db.add(review_record)
    
    # Log timeline event
    log_entry = IncidentUpdate(
        incident_id=incident_id,
        update_type="human_review",
        note=f"Civic Officer Decision: {review_in.decision.upper()}. Note: {review_in.reviewer_note}. Action: {review_record.action_dispatched}",
        created_at=now_ts
    )
    db.add(log_entry)
    db.commit()
    db.refresh(review_record)
    
    return ReviewOut.model_validate(review_record)

@router.patch("/incidents/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    status_in: StatusUpdate,
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
        
    allowed_statuses = ["open", "investigating", "action_approved", "resolved", "rejected"]
    if status_in.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{status_in.status}'. Allowed: {allowed_statuses}")

    now_ts = utcnow_str()
    inc.status = status_in.status
    inc.updated_at = now_ts
    
    update_entry = IncidentUpdate(
        incident_id=incident_id,
        update_type="status_changed",
        note=f"Status manually updated to '{status_in.status}'. Rationale: {status_in.note}",
        created_at=now_ts
    )
    db.add(update_entry)
    db.commit()
    
    return {"incident_id": incident_id, "status": inc.status, "updated_at": now_ts}

@router.post("/incidents/{incident_id}/verify")
def human_verify_duplicate(
    incident_id: str,
    action: str = Query(..., description="'confirm_duplicate' or 'split_as_new_incident'"),
    report_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    now_ts = utcnow_str()
    if action == "confirm_duplicate":
        inc.status = "verified"
        note = "Human reviewer confirmed report duplicate clustering."
    elif action == "split_as_new_incident" and report_id:
        rpt = db.query(Report).filter(Report.report_id == report_id).first()
        if rpt:
            from backend.app.models.models import gen_id
            new_inc_id = gen_id("INC")
            new_inc = Incident(
                incident_id=new_inc_id,
                latitude=rpt.latitude,
                longitude=rpt.longitude,
                ward_name="Bengaluru Urban",
                status="open",
                created_at=now_ts,
                updated_at=now_ts
            )
            db.add(new_inc)
            rpt.incident_id = new_inc_id
            rpt.verification_status = "original"
            note = f"Report {report_id} split into separate incident {new_inc_id}."
        else:
            note = f"Report {report_id} not found."
    else:
        note = "No action taken."

    update_entry = IncidentUpdate(
        incident_id=incident_id,
        update_type="verification_override",
        note=note,
        created_at=now_ts
    )
    db.add(update_entry)
    db.commit()
    return {"incident_id": incident_id, "status": inc.status, "note": note}

