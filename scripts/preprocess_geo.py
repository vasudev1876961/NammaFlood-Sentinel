import json
from pathlib import Path
from backend.app.utils.geo_utils import BENGALURU_HOTSPOTS, BENGALURU_LAKES

def export_geojson():
    out_dir = Path(__file__).resolve().parent.parent / "data" / "processed"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Export Chronic Flood Hotspots
    hotspot_features = []
    for spot in BENGALURU_HOTSPOTS:
        feat = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [spot["longitude"], spot["latitude"]] # GeoJSON format: [lon, lat]
            },
            "properties": {
                "name": spot["name"],
                "ward": spot.get("ward", ""),
                "vulnerability": spot.get("vulnerability", "Moderate"),
                "category": "chronic_flood_hotspot"
            }
        }
        hotspot_features.append(feat)
        
    hotspots_geojson = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": hotspot_features
    }
    
    with open(out_dir / "bengaluru_hotspots.geojson", "w", encoding="utf-8") as f:
        json.dump(hotspots_geojson, f, indent=2)

    # 2. Export Major Bengaluru Lakes
    lake_features = []
    for lake in BENGALURU_LAKES:
        feat = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lake["longitude"], lake["latitude"]]
            },
            "properties": {
                "name": lake["name"],
                "category": "waterbody_lake"
            }
        }
        lake_features.append(feat)

    lakes_geojson = {
        "type": "FeatureCollection",
        "features": lake_features
    }
    
    with open(out_dir / "bengaluru_lakes.geojson", "w", encoding="utf-8") as f:
        json.dump(lakes_geojson, f, indent=2)

    print(f"Successfully exported {len(hotspot_features)} hotspots and {len(lake_features)} lakes to GeoJSON.")

if __name__ == "__main__":
    export_geojson()

