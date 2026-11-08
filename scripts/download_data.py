import urllib.request
from pathlib import Path

DATASETS = [
    {
        "name": "FloodNet-Supervised",
        "description": "High-resolution post-flood imagery for water inundation semantic segmentation and classification.",
        "url": "https://github.com/BinaLab/FloodNet-Supervised_v1.0",
        "license": "CC BY-NC-SA 4.0",
        "status": "documented_and_integrated"
    },
    {
        "name": "OpenCity Bengaluru Stormwater & Waterlogging Registry",
        "description": "BBMP chronic waterlogging points and stormwater drain network.",
        "url": "https://opencity.in",
        "license": "ODC-BY",
        "status": "processed_into_geojson"
    },
    {
        "name": "Open-Meteo High-Resolution Precipitation",
        "description": "Live hourly rainfall observations and 24h forecast grids for Bengaluru coordinates.",
        "url": "https://api.open-meteo.com/v1/forecast",
        "license": "CC BY 4.0",
        "status": "integrated_in_weather_agent"
    }
]

def main():
    root = Path(__file__).resolve().parent.parent / "data" / "raw"
    root.mkdir(parents=True, exist_ok=True)
    
    summary_path = root / "dataset_sources_registry.txt"
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("NAMMAFLOOD SENTINEL — DATASET REGISTRY & LICENSES\n")
        f.write("=" * 60 + "\n\n")
        for d in DATASETS:
            f.write(f"Dataset: {d['name']}\n")
            f.write(f"Description: {d['description']}\n")
            f.write(f"URL: {d['url']}\n")
            f.write(f"License: {d['license']}\n")
            f.write(f"Status: {d['status']}\n")
            f.write("-" * 40 + "\n\n")
    print(f"Dataset registry documented at {summary_path}")

if __name__ == "__main__":
    main()

