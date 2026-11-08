from typing import Optional, Any
from pydantic import BaseModel, Field

# ----------------- Citizen & Reports -----------------

class ReportCreateResponse(BaseModel):
    incident_id: str
    report_id: str
    verification_status: str
    assessment: dict[str, Any]
    message: str

class ReportOut(BaseModel):
    report_id: str
    incident_id: str
    image_path: str
    latitude: float
    longitude: float
    reporter_note: Optional[str] = None
    occurred_at: str
    received_at: str
    vision_label: Optional[str] = None
    vision_confidence: Optional[float] = None
    rainfall_mm_1h: Optional[float] = None
    rainfall_mm_3h: Optional[float] = None
    source_type: str
    verification_status: str

    class Config:
        from_attributes = True

# ----------------- Incidents -----------------

class IncidentSummary(BaseModel):
    incident_id: str
    latitude: float
    longitude: float
    ward_name: Optional[str] = None
    first_seen_at: str
    last_seen_at: str
    status: str
    risk_score: float
    risk_level: str
    risk_confidence: float
    recommended_action: Optional[str] = None
    reports_count: int = 1
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class AgentRunOut(BaseModel):
    run_id: int
    agent_name: str
    status: str
    output: dict[str, Any]
    duration_ms: float
    created_at: str

class ReviewOut(BaseModel):
    review_id: int
    incident_id: str
    reviewer_id: str
    decision: str
    reviewer_note: Optional[str] = None
    action_dispatched: Optional[str] = None
    reviewed_at: str

    class Config:
        from_attributes = True

class IncidentUpdateOut(BaseModel):
    update_id: int
    incident_id: str
    report_id: Optional[str] = None
    update_type: str
    note: str
    created_at: str

    class Config:
        from_attributes = True

class IncidentDetail(BaseModel):
    incident_id: str
    latitude: float
    longitude: float
    ward_name: Optional[str] = None
    first_seen_at: str
    last_seen_at: str
    status: str
    risk_score: float
    risk_level: str
    risk_confidence: float
    risk_reasons: list[str]
    location_context: dict[str, Any]
    weather_context: dict[str, Any]
    recommended_action: Optional[str] = None
    created_at: str
    updated_at: str
    reports: list[ReportOut]
    agent_runs: list[AgentRunOut]
    reviews: list[ReviewOut]
    updates: list[IncidentUpdateOut]

# ----------------- Human Review -----------------

class ReviewCreate(BaseModel):
    decision: str = Field(..., description="'approve', 'reject', or 'edit'")
    reviewer_note: str = Field("", description="Civic officer rationale")
    action_dispatched: Optional[str] = Field(None, description="Dispatched civic team instructions")

class StatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: open, investigating, action_approved, resolved, rejected")
    note: Optional[str] = "Status updated by civic control operator"

# ----------------- Dashboard & Analytics -----------------

class DashboardSummary(BaseModel):
    total_incidents: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    pending_review_count: int
    resolved_count: int
    total_reports: int
    mean_agent_duration_ms: float

class AgentHealth(BaseModel):
    agent_name: str
    total_invocations: int
    success_rate: float
    avg_latency_ms: float
    status: str

class RiskAnalytics(BaseModel):
    risk_distribution: dict[str, int]
    status_distribution: dict[str, int]
    zone_hotspots: list[dict[str, Any]]

