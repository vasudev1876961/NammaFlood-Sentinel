import time
from typing import TypedDict, Optional, Any
from concurrent.futures import ThreadPoolExecutor
from langgraph.graph import StateGraph, END

from backend.app.agents.vision_agent import VisionAgent
from backend.app.agents.weather_agent import WeatherAgent
from backend.app.agents.location_agent import LocationAgent
from backend.app.agents.verification_agent import VerificationAgent
from backend.app.agents.risk_agent import RiskAgent
from backend.app.agents.response_agent import ResponseAgent
from backend.app.utils.hash_utils import compute_image_phash

class IncidentState(TypedDict):
    incident_id: str
    report_id: str
    image_path: str
    image_hash: str
    latitude: float
    longitude: float
    rainfall_mm_1h: Optional[float]
    rainfall_mm_3h: Optional[float]
    reporter_note: Optional[str]
    timestamp: str
    prior_reports: list[dict[str, Any]]
    
    # Specialist Agent Outputs
    vision_result: dict[str, Any]
    weather_result: dict[str, Any]
    location_result: dict[str, Any]
    verification_result: dict[str, Any]
    risk_result: dict[str, Any]
    response_result: dict[str, Any]
    
    # Audit & Tracking
    agent_traces: list[dict[str, Any]]
    errors: list[str]
    missing_evidence: list[str]
    human_review_required: bool
    workflow_status: str
    workflow_duration_ms: float

class MultiAgentOrchestrator:
    """Stateful LangGraph Multi-Agent Coordinator for Urban Incident Intelligence."""
    
    def __init__(self):
        self.vision_agent = VisionAgent()
        self.weather_agent = WeatherAgent()
        self.location_agent = LocationAgent()
        self.verification_agent = VerificationAgent()
        self.risk_agent = RiskAgent()
        self.response_agent = ResponseAgent()
        self.graph = self._build_graph()

    def _node_validate_and_hash(self, state: IncidentState) -> dict:
        """Step 1: Compute perceptual hash and validate inputs."""
        t0 = time.perf_counter()
        img_hash = compute_image_phash(state["image_path"])
        return {
            "image_hash": img_hash,
            "workflow_status": "validated",
            "agent_traces": state.get("agent_traces", []) + [{
                "step": "validation",
                "status": "completed",
                "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
            }]
        }

    def _node_parallel_perception(self, state: IncidentState) -> dict:
        """Step 2: Concurrent execution of Vision, Weather, and Location specialist agents."""
        t0 = time.perf_counter()
        
        with ThreadPoolExecutor(max_workers=3) as executor:
            fut_vision = executor.submit(self.vision_agent.run, state["image_path"])
            fut_weather = executor.submit(
                self.weather_agent.run,
                state["latitude"],
                state["longitude"],
                state.get("rainfall_mm_1h"),
                state.get("rainfall_mm_3h")
            )
            fut_location = executor.submit(self.location_agent.run, state["latitude"], state["longitude"])
            
            vision_res = fut_vision.result()
            weather_res = fut_weather.result()
            location_res = fut_location.result()

        missing = []
        if weather_res.get("missing_evidence"):
            missing.append("weather_precipitation_grid")
        if vision_res.get("image_quality") in ["poor", "corrupted"]:
            missing.append("clear_visual_evidence")

        traces = state.get("agent_traces", [])
        traces.append({"agent": "vision", "output": vision_res, "duration_ms": vision_res.get("duration_ms")})
        traces.append({"agent": "weather", "output": weather_res, "duration_ms": weather_res.get("duration_ms")})
        traces.append({"agent": "location", "output": location_res, "duration_ms": location_res.get("duration_ms")})

        return {
            "vision_result": vision_res,
            "weather_result": weather_res,
            "location_result": location_res,
            "missing_evidence": missing,
            "agent_traces": traces,
            "workflow_status": "perception_complete"
        }

    def _node_verification(self, state: IncidentState) -> dict:
        """Step 3: Verification agent inspects spatial duplicates and perceptual hash matches."""
        verification_res = self.verification_agent.run(
            lat=state["latitude"],
            lon=state["longitude"],
            current_image_hash=state.get("image_hash", ""),
            prior_reports=state.get("prior_reports", []),
            vision_result=state["vision_result"],
            weather_result=state["weather_result"]
        )
        
        traces = state.get("agent_traces", [])
        traces.append({"agent": "verification", "output": verification_res, "duration_ms": verification_res.get("duration_ms")})
        
        return {
            "verification_result": verification_res,
            "agent_traces": traces,
            "workflow_status": "verification_complete"
        }

    def _node_risk_intelligence(self, state: IncidentState) -> dict:
        """Step 4: Multimodal Risk Intelligence fuses visual, weather, and spatial features."""
        risk_res = self.risk_agent.run(
            vision=state["vision_result"],
            weather=state["weather_result"],
            location=state["location_result"],
            verification=state["verification_result"]
        )
        
        traces = state.get("agent_traces", [])
        traces.append({"agent": "risk", "output": risk_res, "duration_ms": risk_res.get("duration_ms")})
        
        return {
            "risk_result": risk_res,
            "agent_traces": traces,
            "workflow_status": "risk_assessed"
        }

    def _node_response_coordination(self, state: IncidentState) -> dict:
        """Step 5: Response Coordinator drafts civic action recommendations and sets human review gate."""
        response_res = self.response_agent.run(
            risk=state["risk_result"],
            verification=state["verification_result"],
            location=state["location_result"]
        )
        
        traces = state.get("agent_traces", [])
        traces.append({"agent": "response", "output": response_res, "duration_ms": response_res.get("duration_ms")})
        
        return {
            "response_result": response_res,
            "human_review_required": True,
            "agent_traces": traces,
            "workflow_status": "awaiting_human_approval"
        }

    def _build_graph(self):
        """Constructs the deterministic LangGraph state machine."""
        workflow = StateGraph(IncidentState)
        
        workflow.add_node("validate", self._node_validate_and_hash)
        workflow.add_node("perception", self._node_parallel_perception)
        workflow.add_node("verification", self._node_verification)
        workflow.add_node("risk", self._node_risk_intelligence)
        workflow.add_node("response", self._node_response_coordination)
        
        workflow.set_entry_point("validate")
        workflow.add_edge("validate", "perception")
        workflow.add_edge("perception", "verification")
        workflow.add_edge("verification", "risk")
        workflow.add_edge("risk", "response")
        workflow.add_edge("response", END)
        
        return workflow.compile()

    def run(
        self,
        incident_id: str,
        report_id: str,
        image_path: str,
        latitude: float,
        longitude: float,
        rainfall_1h: Optional[float] = None,
        rainfall_3h: Optional[float] = None,
        reporter_note: Optional[str] = None,
        prior_reports: Optional[list[dict]] = None
    ) -> IncidentState:
        t0 = time.perf_counter()
        
        initial_state: IncidentState = {
            "incident_id": incident_id,
            "report_id": report_id,
            "image_path": str(image_path),
            "image_hash": "",
            "latitude": latitude,
            "longitude": longitude,
            "rainfall_mm_1h": rainfall_1h,
            "rainfall_mm_3h": rainfall_3h,
            "reporter_note": reporter_note or "",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "prior_reports": prior_reports or [],
            "vision_result": {},
            "weather_result": {},
            "location_result": {},
            "verification_result": {},
            "risk_result": {},
            "response_result": {},
            "agent_traces": [],
            "errors": [],
            "missing_evidence": [],
            "human_review_required": True,
            "workflow_status": "initiated",
            "workflow_duration_ms": 0.0
        }
        
        final_state = self.graph.invoke(initial_state)
        final_state["workflow_duration_ms"] = round((time.perf_counter() - t0) * 1000, 2)
        return final_state

