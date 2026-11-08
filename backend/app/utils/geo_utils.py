import math
from typing import Optional, Any

# Major Bengaluru Chronic Waterlogging Hotspots (BBMP & BTP documented)
BENGALURU_HOTSPOTS = [
    {"name": "Silk Board Underpass & Junction", "latitude": 12.9175, "longitude": 77.6238, "ward": "BTM Layout / HSR", "vulnerability": "Severe"},
    {"name": "Ecospace / Bellandur ORR", "latitude": 12.9260, "longitude": 77.6834, "ward": "Bellandur (Ward 150)", "vulnerability": "Critical"},
    {"name": "Hebbal Flyover Service Road", "latitude": 13.0358, "longitude": 77.5970, "ward": "Hebbal (Ward 21)", "vulnerability": "Severe"},
    {"name": "Koramangala 4th Block (KHB)", "latitude": 12.9345, "longitude": 77.6269, "ward": "Koramangala (Ward 151)", "vulnerability": "High"},
    {"name": "Manyata Tech Park / Nagawara", "latitude": 13.0458, "longitude": 77.6206, "ward": "Nagawara (Ward 23)", "vulnerability": "High"},
    {"name": "Sony World Signal 80ft Road", "latitude": 12.9363, "longitude": 77.6322, "ward": "Koramangala", "vulnerability": "Moderate"},
    {"name": "Tin Factory / KR Puram", "latitude": 13.0006, "longitude": 77.6698, "ward": "KR Puram (Ward 52)", "vulnerability": "Severe"},
    {"name": "Bilekahalli Junction (Bannerghatta Rd)", "latitude": 12.8988, "longitude": 77.5997, "ward": "Bilekahalli (Ward 188)", "vulnerability": "Moderate"},
    {"name": "Anand Rao Circle Underpass", "latitude": 12.9772, "longitude": 77.5714, "ward": "Gandhinagar (Ward 94)", "vulnerability": "Severe"},
    {"name": "HSR Layout Sector 6 Ring Road", "latitude": 12.9121, "longitude": 77.6446, "ward": "HSR Layout (Ward 174)", "vulnerability": "High"},
    {"name": "Mahadevapura Outer Ring Road", "latitude": 12.9904, "longitude": 77.6974, "ward": "Mahadevapura (Ward 82)", "vulnerability": "High"},
    {"name": "Varthur Kodi Junction", "latitude": 12.9431, "longitude": 77.7297, "ward": "Varthur (Ward 149)", "vulnerability": "Severe"},
]

# Major Lakes and Catchments
BENGALURU_LAKES = [
    {"name": "Bellandur Lake", "latitude": 12.9352, "longitude": 77.6680},
    {"name": "Varthur Lake", "latitude": 12.9422, "longitude": 77.7188},
    {"name": "Ulsoor Lake", "latitude": 12.9829, "longitude": 77.6204},
    {"name": "Hebbal Lake", "latitude": 13.0402, "longitude": 77.5912},
    {"name": "Sankey Tank", "latitude": 13.0102, "longitude": 77.5739},
    {"name": "Madiwala Lake", "latitude": 12.9090, "longitude": 77.6186},
    {"name": "Agara Lake", "latitude": 12.9219, "longitude": 77.6433},
]

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in meters."""
    r = 6371000.0 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(dlambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

def find_nearest_hotspot(lat: float, lon: float) -> dict[str, Any]:
    """Finds the nearest known chronic waterlogging hotspot and distance."""
    nearest = None
    min_dist = float("inf")
    for spot in BENGALURU_HOTSPOTS:
        d = haversine_distance_m(lat, lon, spot["latitude"], spot["longitude"])
        if d < min_dist:
            min_dist = d
            nearest = {**spot, "distance_m": round(d, 1)}
    return nearest or {"name": "None", "distance_m": 999999.0}

def find_nearest_lake(lat: float, lon: float) -> dict[str, Any]:
    """Finds the nearest major water body/lake in Bengaluru."""
    nearest = None
    min_dist = float("inf")
    for lake in BENGALURU_LAKES:
        d = haversine_distance_m(lat, lon, lake["latitude"], lake["longitude"])
        if d < min_dist:
            min_dist = d
            nearest = {**lake, "distance_m": round(d, 1)}
    return nearest or {"name": "None", "distance_m": 999999.0}

def validate_bengaluru_coords(lat: float, lon: float) -> tuple[bool, str]:
    """Verifies that coordinates fall inside the Greater Bengaluru boundary."""
    if not (12.75 <= lat <= 13.25):
        return False, f"Latitude {lat} is outside the Bengaluru Metropolitan Region (12.75N - 13.25N)."
    if not (77.40 <= lon <= 77.85):
        return False, f"Longitude {lon} is outside the Bengaluru Metropolitan Region (77.40E - 77.85E)."
    return True, "Valid Bengaluru coordinates."

