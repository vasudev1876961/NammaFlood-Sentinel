import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime
)
from sqlalchemy.orm import relationship

from backend.app.database.session import Base

def utcnow_str() -> str:
    return datetime.now(timezone.utc).isoformat()

def gen_id(prefix: str = "INC") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="admin") # "admin", "officer", "citizen"
    is_active = Column(Boolean, default=True)
    created_at = Column(String(50), default=utcnow_str)

class Incident(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String(50), primary_key=True, index=True, default=lambda: gen_id("INC"))
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    ward_name = Column(String(100), default="Bengaluru Urban")
    
    first_seen_at = Column(String(50), default=utcnow_str)
    last_seen_at = Column(String(50), default=utcnow_str)
    
    status = Column(String(30), default="open", index=True) # open, verified, action_approved, investigating, resolved, rejected
    
    risk_score = Column(Float, default=0.0) # 0.0 - 100.0
    risk_level = Column(String(20), default="low", index=True) # low, medium, high
    risk_confidence = Column(Float, default=0.0) # 0.0 - 1.0 (evidence completeness)
    
    risk_reasons_json = Column(Text, default="[]") # JSON list of reasons
    location_context_json = Column(Text, default="{}") # JSON nearby hotspot info
    weather_context_json = Column(Text, default="{}") # JSON weather data
    recommended_action = Column(Text, default="")
    
    created_at = Column(String(50), default=utcnow_str)
    updated_at = Column(String(50), default=utcnow_str, onupdate=utcnow_str)
    
    # Relationships
    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="incident", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="incident", cascade="all, delete-orphan")
    updates = relationship("IncidentUpdate", back_populates="incident", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    
    report_id = Column(String(50), primary_key=True, index=True, default=lambda: gen_id("RPT"))
    incident_id = Column(String(50), ForeignKey("incidents.incident_id"), nullable=False, index=True)
    
    image_path = Column(String(255), nullable=False)
    image_hash = Column(String(64), nullable=True, index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    reporter_note = Column(Text, nullable=True)
    reporter_phone_masked = Column(String(20), nullable=True)
    
    occurred_at = Column(String(50), default=utcnow_str)
    received_at = Column(String(50), default=utcnow_str)
    
    vision_label = Column(String(50), default="unclassified")
    vision_confidence = Column(Float, nullable=True)
    vision_output_json = Column(Text, default="{}")
    
    rainfall_mm_1h = Column(Float, nullable=True)
    rainfall_mm_3h = Column(Float, nullable=True)
    
    source_type = Column(String(30), default="citizen") # citizen, sensor, btp_cam, synthetic
    verification_status = Column(String(30), default="original") # original, duplicate_linked, flagged_suspicious
    
    # Relationships
    incident = relationship("Incident", back_populates="reports")
    agent_runs = relationship("AgentRun", back_populates="report")

class AgentRun(Base):
    __tablename__ = "agent_runs"
    
    run_id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.incident_id"), nullable=False, index=True)
    report_id = Column(String(50), ForeignKey("reports.report_id"), nullable=True, index=True)
    
    agent_name = Column(String(50), nullable=False, index=True) # vision, weather, location, verification, risk, response
    status = Column(String(30), nullable=False) # completed, degraded_fallback, failed
    output_json = Column(Text, default="{}")
    duration_ms = Column(Float, default=0.0)
    
    created_at = Column(String(50), default=utcnow_str)
    
    # Relationships
    incident = relationship("Incident", back_populates="agent_runs")
    report = relationship("Report", back_populates="agent_runs")

class Review(BaseModel_Review := Base):
    __tablename__ = "reviews"
    
    review_id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.incident_id"), nullable=False, index=True)
    
    reviewer_id = Column(String(50), default="bbmp_officer_1")
    decision = Column(String(30), nullable=False) # approve, reject, edit, request_verification
    reviewer_note = Column(Text, nullable=True)
    action_dispatched = Column(Text, nullable=True)
    
    reviewed_at = Column(String(50), default=utcnow_str)
    
    # Relationships
    incident = relationship("Incident", back_populates="reviews")

class IncidentUpdate(Base):
    __tablename__ = "incident_updates"
    
    update_id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), ForeignKey("incidents.incident_id"), nullable=False, index=True)
    report_id = Column(String(50), nullable=True)
    
    update_type = Column(String(50), nullable=False) # report_received, human_review, status_changed
    note = Column(Text, nullable=False)
    created_at = Column(String(50), default=utcnow_str)
    
    # Relationships
    incident = relationship("Incident", back_populates="updates")

class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(50), nullable=True)
    recipient_type = Column(String(30), default="admin_operator")
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    read_status = Column(Boolean, default=False)
    created_at = Column(String(50), default=utcnow_str)

