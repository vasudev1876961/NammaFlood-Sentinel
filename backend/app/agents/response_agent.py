import time
from typing import Any

class ResponseAgent:
    """Specialist AI Agent for Civic Response Recommendations and Human-in-the-Loop Safeguards."""
    agent_name = "response"
    
    def run(self, risk: dict[str, Any], verification: dict[str, Any], location: dict[str, Any]) -> dict[str, any]:
        t0 = time.perf_counter()
        
        level = risk.get("level", "low")
        is_dup = verification.get("is_duplicate", False)
        hotspot_name = location.get("nearest_hotspot", {}).get("name", "Reported Coordinates")
        ward = location.get("ward_name", "Bengaluru Urban")
        
        # Recommendations tailored to civic disaster management protocols
        if level == "high":
            action = f"URGENT REVIEW: Waterlogging at {hotspot_name} ({ward}). Recommend dispatching BBMP high-capacity mobile suction pump team and alerting Bengaluru Traffic Police for vehicle diversion."
            units = ["BBMP Stormwater Drainage Quick-Response Team", "BTP Traffic Management Center", "BESCOM Substation Guard"]
            actions_list = ["Authorize Suction Pump Dispatch", "Request BTP Traffic Diversion", "Flag False Alarm / Reject"]
        elif level == "medium":
            action = f"PRIORITY MONITORING: Emerging water accumulation near {hotspot_name} ({ward}). Recommend field inspection of stormwater drain grates and culverts."
            units = ["Ward Maintenance Inspector", "Traffic Wardens"]
            actions_list = ["Dispatch Drain Clearing Crew", "Schedule 30-min Re-inspection", "Mark as Minor Puddle"]
        else:
            action = f"ROUTINE MONITORING: Low risk observed at {hotspot_name}. Continue automated rainfall monitoring; no immediate field deployment necessary."
            units = ["Civic Control Room Log"]
            actions_list = ["Acknowledge & Close", "Keep Monitoring"]

        if is_dup:
            action += " (Note: Clustered with existing verified incident; attach evidence to canonical log)."

        return {
            "agent": self.agent_name,
            "status": "completed",
            "priority": level,
            "recommended_action": action,
            "possible_duplicate": is_dup,
            "human_approval_required": True,
            "external_action_taken": False, # Strict ethical & safety gate
            "civic_units_suggested": units,
            "review_task": {
                "task_type": f"{level.upper()}_PRIORITY_DECISION",
                "suggested_actions": actions_list
            },
            "disclaimer": "NammaFlood Sentinel is an advisory decision-support system. All external operations require manual civic officer sign-off.",
            "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
        }

