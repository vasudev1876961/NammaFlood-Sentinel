import time
from backend.app.utils.geo_utils import (
    validate_bengaluru_coords,
    find_nearest_hotspot,
    find_nearest_lake
)

class LocationAgent:
    """Specialist AI Agent for Urban Geospatial Context & Hotspot Proximity."""
    agent_name = "location"
    
    def run(self, lat: float, lon: float) -> dict[str, any]:
        t0 = time.perf_counter()
        
        is_valid_bb, bb_msg = validate_bengaluru_coords(lat, lon)
        nearest_spot = find_nearest_hotspot(lat, lon)
        nearest_lake = find_nearest_lake(lat, lon)
        
        within_500m = bool(nearest_spot and nearest_spot["distance_m"] <= 500.0)
        within_1000m = bool(nearest_spot and nearest_spot["distance_m"] <= 1000.0)
        
        ward = nearest_spot.get("ward", "Bengaluru Urban") if within_1000m else "Bengaluru Urban"
        
        evidence = []
        if within_500m:
            evidence.append(f"Located within {nearest_spot['distance_m']}m of known chronic hotspot: {nearest_spot['name']} ({nearest_spot.get('vulnerability')} vulnerability)")
        elif within_1000m:
            evidence.append(f"In catchment buffer ({nearest_spot['distance_m']}m) of {nearest_spot['name']}")
        else:
            evidence.append("Not in immediate proximity (<1000m) of primary chronic hotspots")

        if nearest_lake and nearest_lake["distance_m"] <= 1500.0:
            evidence.append(f"Proximity to water body: {nearest_lake['name']} ({nearest_lake['distance_m']}m)")

        return {
            "agent": self.agent_name,
            "status": "completed",
            "latitude": lat,
            "longitude": lon,
            "in_bengaluru_bounds": is_valid_bb,
            "boundary_note": bb_msg,
            "nearest_hotspot": nearest_spot,
            "within_500m_hotspot": within_500m,
            "nearest_lake": nearest_lake,
            "ward_name": ward,
            "evidence": evidence,
            "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
        }

