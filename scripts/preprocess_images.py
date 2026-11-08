import argparse
import csv
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def generate_non_flood_samples(output_dir: Path):
    """Generates clean, synthetic dry street and non-flood baseline reference images."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Dry asphalt road scene
    im1 = Image.new("RGB", (640, 480), (130, 150, 170)) # Sky / buildings
    d1 = ImageDraw.Draw(im1)
    d1.rectangle((0, 240, 640, 480), fill=(55, 55, 60)) # Dark dry asphalt
    # Yellow dashed road center divider
    for x in range(20, 640, 60):
        d1.rectangle((x, 350, x + 30, 355), fill=(220, 200, 50))
    d1.text((30, 30), "BENCHMARK SAMPLE: DRY ASPHALT ROAD (NON-FLOOD)", fill=(255, 255, 255))
    im1.save(output_dir / "dry_street_1.jpg", quality=90)

    # 2. Suburban pavement / sidewalk scene
    im2 = Image.new("RGB", (640, 480), (160, 180, 190))
    d2 = ImageDraw.Draw(im2)
    d2.rectangle((0, 220, 640, 480), fill=(80, 80, 85)) # Pavement
    d2.rectangle((0, 400, 640, 480), fill=(95, 95, 90)) # Kerb
    d2.text((30, 30), "BENCHMARK SAMPLE: CLEAR TRAFFIC INTERSECTION", fill=(255, 255, 255))
    im2.save(output_dir / "dry_street_2.jpg", quality=90)

def create_manifest(data_dir: Path, output_csv: Path):
    """Scans image directories and generates a structured manifest."""
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    rows = []
    
    for f in data_dir.rglob("*"):
        if f.is_file() and f.suffix.lower() in extensions:
            candidate_label = "flood" if "flood" in f.parent.name.lower() else "non_flood"
            try:
                with Image.open(f) as im:
                    w, h = im.size
                    fmt = im.format
            except Exception:
                w, h, fmt = 0, 0, "corrupted"
                
            rows.append({
                "image_path": str(f.resolve()),
                "filename": f.name,
                "label": candidate_label,
                "width": w,
                "height": h,
                "format": fmt
            })

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    if rows:
        with open(output_csv, "w", newline="", encoding="utf-8") as h:
            w = csv.DictWriter(h, fieldnames=["image_path", "filename", "label", "width", "height", "format"])
            w.writeheader()
            w.writerows(rows)
        print(f"Generated manifest with {len(rows)} entries at {output_csv}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="./data/sample", help="Input samples directory")
    parser.add_argument("--manifest", default="./data/processed/image_manifest.csv", help="Output manifest CSV")
    args = parser.parse_args()
    
    sample_path = Path(args.data_dir)
    generate_non_flood_samples(sample_path / "non_flood")
    create_manifest(sample_path, Path(args.manifest))

