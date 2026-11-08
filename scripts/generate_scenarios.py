import csv
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

def build_benchmark_scenarios():
    root = Path(__file__).resolve().parent.parent
    scenarios_dir = root / "data" / "processed" / "scenarios"
    scenarios_dir.mkdir(parents=True, exist_ok=True)
    images_dir = scenarios_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # 1. Create Scenario Images
    # Dry road image (Scenario A & G)
    img_dry = Image.new("RGB", (640, 480), (140, 160, 180))
    d_dry = ImageDraw.Draw(img_dry)
    d_dry.rectangle((0, 240, 640, 480), fill=(50, 50, 55)) # Dry tarmac
    d_dry.text((20, 20), "SCENARIO A/G: DRY SURFACE ROAD", fill=(255, 255, 255))
    path_dry = images_dir / "scenario_dry.jpg"
    img_dry.save(path_dry, quality=90)

    # Moderate flood image (Scenario B)
    img_mod = Image.new("RGB", (640, 480), (120, 130, 140))
    d_mod = ImageDraw.Draw(img_mod)
    d_mod.rectangle((0, 240, 640, 480), fill=(75, 80, 85)) # Water layer
    d_mod.text((20, 20), "SCENARIO B: MODERATE SURFACE WATERLOGGING", fill=(255, 255, 255))
    path_mod = images_dir / "scenario_mod_flood.jpg"
    img_mod.save(path_mod, quality=90)

    # Severe flood image (Scenario C & D)
    # If 1.jpg exists in data/sample/flood, copy it; else draw flood image
    src_real_flood = root / "data" / "sample" / "flood" / "1.jpg"
    path_severe = images_dir / "scenario_severe_flood.jpg"
    if src_real_flood.exists():
        img_sev = Image.open(src_real_flood)
        img_sev.save(path_severe)
    else:
        img_sev = Image.new("RGB", (640, 480), (100, 110, 120))
        d_sev = ImageDraw.Draw(img_sev)
        d_sev.rectangle((0, 200, 640, 480), fill=(60, 65, 70))
        d_sev.text((20, 20), "SCENARIO C: SEVERE INUNDATION", fill=(255, 255, 255))
        img_sev.save(path_severe)

    # Blurry / corrupted image (Scenario F)
    img_blur = Image.new("RGB", (120, 100), (20, 20, 20)) # Very low-res and dark
    d_blur = ImageDraw.Draw(img_blur)
    d_blur.text((5, 5), "DARK BLUR", fill=(40, 40, 40))
    path_blur = images_dir / "scenario_blurry.jpg"
    img_blur.save(path_blur)

    # Duplicate image for Scenario D
    path_dup = images_dir / "scenario_duplicate_rpt.jpg"
    img_sev.save(path_dup)

    # 2. Build Scenarios Metadata Table
    scenarios = [
        {
            "scenario_id": "SCENARIO_A",
            "title": "Clear Dry Road & No Rainfall",
            "image_path": str(path_dry),
            "latitude": 12.9716, # MG Road
            "longitude": 77.5946,
            "rainfall_1h": 0.0,
            "rainfall_3h": 0.0,
            "expected_risk": "low",
            "description": "Baseline clear conditions. System must not generate false flood alarm."
        },
        {
            "scenario_id": "SCENARIO_B",
            "title": "Moderate Water Accumulation with Light-Moderate Rain",
            "image_path": str(path_mod),
            "latitude": 12.9363, # Sony World Signal
            "longitude": 77.6322,
            "rainfall_1h": 12.5,
            "rainfall_3h": 22.0,
            "expected_risk": "medium",
            "description": "Moderate water accumulation in residential / commercial junction."
        },
        {
            "scenario_id": "SCENARIO_C",
            "title": "Heavy Downpour at Chronic Silk Board Hotspot",
            "image_path": str(path_severe),
            "latitude": 12.9175, # Silk Board Underpass
            "longitude": 77.6238,
            "rainfall_1h": 48.0,
            "rainfall_3h": 85.0,
            "expected_risk": "high",
            "description": "Torrential rain at critical bottleneck. High priority civic dewatering alert."
        },
        {
            "scenario_id": "SCENARIO_D",
            "title": "Duplicate Citizen Report Cluster",
            "image_path": str(path_dup),
            "latitude": 12.9178, # 35 meters from Silk Board
            "longitude": 77.6240,
            "rainfall_1h": 48.0,
            "rainfall_3h": 85.0,
            "expected_risk": "high",
            "description": "Second citizen submits near-identical photo from same intersection. Must cluster as duplicate candidate."
        },
        {
            "scenario_id": "SCENARIO_E",
            "title": "Offline / Missing Weather API Context",
            "image_path": str(path_severe),
            "latitude": 12.9260, # Ecospace Bellandur
            "longitude": 77.6834,
            "rainfall_1h": None,
            "rainfall_3h": None,
            "expected_risk": "medium",
            "description": "External weather provider is unreachable. Pipeline continues with missing evidence flag."
        },
        {
            "scenario_id": "SCENARIO_F",
            "title": "Degraded / Low-Quality Dark Image",
            "image_path": str(path_blur),
            "latitude": 12.9800,
            "longitude": 77.6000,
            "rainfall_1h": 5.0,
            "rainfall_3h": 10.0,
            "expected_risk": "low",
            "description": "Dark and low-res photo. Vision agent flags image quality as poor and escalates for review."
        },
        {
            "scenario_id": "SCENARIO_G",
            "title": "Contradictory Visual vs Rainfall Evidence",
            "image_path": str(path_dry),
            "latitude": 13.0358, # Hebbal
            "longitude": 77.5970,
            "rainfall_1h": 55.0,
            "rainfall_3h": 90.0,
            "expected_risk": "medium",
            "description": "55mm rainfall reported but visual evidence shows bone dry pavement. Verification flags contradiction."
        },
        {
            "scenario_id": "SCENARIO_H",
            "title": "Human Reviewer Rejection of Erroneous Report",
            "image_path": str(path_dry),
            "latitude": 12.9772, # Anand Rao Circle
            "longitude": 77.5714,
            "rainfall_1h": 0.0,
            "rainfall_3h": 0.0,
            "expected_risk": "low",
            "description": "Civic operator rejects false alarm report. Audit trail logs officer notes."
        }
    ]

    manifest_csv = scenarios_dir / "scenarios_manifest.csv"
    with open(manifest_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(scenarios[0].keys()))
        w.writeheader()
        w.writerows(scenarios)

    print(f"Generated {len(scenarios)} benchmark scenario datasets at {manifest_csv}")

if __name__ == "__main__":
    build_benchmark_scenarios()

