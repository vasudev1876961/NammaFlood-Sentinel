import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

def create_silk_board_flood(w=800, h=600):
    """Central Silk Board Underpass - Heavy muddy inundation under flyover."""
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)

    # Overcast monsoon sky (y: 0 to 180)
    for y in range(0, 180):
        c = int(115 + 25 * (y / 180))
        draw.line([(0, y), (w, y)], fill=(c, c + 3, c + 8))

    # Flyover bridge deck (y: 150 to 220)
    draw.rectangle([(0, 150), (w, 215)], fill=(70, 72, 75))
    draw.rectangle([(0, 145), (w, 150)], fill=(55, 58, 60)) # railing
    
    # Concrete flyover support pillars
    for px in [100, 340, 580]:
        draw.rectangle([(px, 150), (px + 65, 340)], fill=(62, 65, 68))
        draw.rectangle([(px - 8, 200), (px + 73, 215)], fill=(80, 83, 86))

    # Background distant buildings / trees (y: 180 to 250)
    draw.rectangle([(0, 220), (w, 270)], fill=(52, 58, 54))

    # Turbid silt floodwater (y: 260 to 600)
    # R - B > 7, G - B > 3, brightness > 68 and < 210
    arr = np.array(img)
    for y in range(260, h):
        depth = (y - 260) / (h - 260)
        # Muddy brownish silt water
        r = int(118 + 15 * depth)
        g = int(100 + 12 * depth)
        b = int(76 + 8 * depth)
        
        ripple = (np.sin(np.linspace(0, 50, w) + y * 0.12) * 7).astype(int)
        ripple2 = (np.cos(np.linspace(0, 25, w) * 2 - y * 0.08) * 4).astype(int)
        
        arr[y, :, 0] = np.clip(r + ripple + ripple2, 0, 255)
        arr[y, :, 1] = np.clip(g + ripple + ripple2, 0, 255)
        arr[y, :, 2] = np.clip(b + (ripple // 2), 0, 255)

    # Add yellow hazard divider / submerged lane markings
    lane_y = 350
    for lx in range(50, w, 120):
        for dy in range(-4, 5):
            arr[lane_y + dy, lx:lx + 60, 0] = np.clip(arr[lane_y + dy, lx:lx + 60, 0] * 0.6 + 180 * 0.4, 0, 255)
            arr[lane_y + dy, lx:lx + 60, 1] = np.clip(arr[lane_y + dy, lx:lx + 60, 1] * 0.6 + 150 * 0.4, 0, 255)
            arr[lane_y + dy, lx:lx + 60, 2] = np.clip(arr[lane_y + dy, lx:lx + 60, 2] * 0.6 + 50 * 0.4, 0, 255)

    res = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(radius=0.6))
    return res

def create_bellandur_flood(w=800, h=600):
    """Ecospace Bellandur Outer Ring Road - Submerged arterial road and service lane."""
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)

    # Rainy sky (y: 0 to 200)
    for y in range(0, 200):
        c = int(125 + 18 * (y / 200))
        draw.line([(0, y), (w, y)], fill=(c, c + 2, c + 6))

    # Tech park skyline / commercial facade
    for bx in range(20, w, 140):
        bh = int(120 + (bx % 70) * 1.5)
        draw.rectangle([(bx, 200 - bh), (bx + 110, 220)], fill=(70, 78, 88))
        # Windows
        for wy in range(200 - bh + 15, 200, 20):
            for wx in range(bx + 10, bx + 100, 25):
                draw.rectangle([(wx, wy), (wx + 12, wy + 10)], fill=(110, 125, 140))

    # Median barrier / trees
    draw.rectangle([(0, 215), (w, 245)], fill=(45, 52, 46))

    # Inundated asphalt & silt water (y: 245 to 600)
    arr = np.array(img)
    for y in range(245, h):
        depth = (y - 245) / (h - 245)
        # Deep turbid monsoon runoff
        r = int(112 + 18 * depth)
        g = int(96 + 14 * depth)
        b = int(74 + 10 * depth)

        ripple = (np.sin(np.linspace(0, 35, w) + y * 0.15) * 6).astype(int)
        arr[y, :, 0] = np.clip(r + ripple, 0, 255)
        arr[y, :, 1] = np.clip(g + ripple, 0, 255)
        arr[y, :, 2] = np.clip(b + ripple // 2, 0, 255)

    # Median kerb reflection (y: 245 to 275)
    for kx in range(0, w, 80):
        arr[245:265, kx:kx + 40, :] = np.clip(arr[245:265, kx:kx + 40, :] * 0.7 + 60 * 0.3, 0, 255)

    res = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(radius=0.5))
    return res

def create_hebbal_flood(w=800, h=600):
    """Hebbal Flyover Ramp - Stormwater overflow on curved interchange ramp."""
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)

    # Dark storm clouds
    for y in range(0, 190):
        c = int(105 + 20 * (y / 190))
        draw.line([(0, y), (w, y)], fill=(c, c + 4, c + 10))

    # Curved elevated ramp highway in upper-middle
    draw.arc([( -200, 80), (w + 200, 360)], start=200, end=340, fill=(65, 68, 72), width=45)
    draw.arc([( -200, 75), (w + 200, 355)], start=200, end=340, fill=(45, 48, 50), width=6) # safety barrier

    # Service road curb and drain culvert
    draw.rectangle([(0, 250), (w, 280)], fill=(58, 62, 65))

    # Murky flood water accumulation
    arr = np.array(img)
    for y in range(270, h):
        depth = (y - 270) / (h - 270)
        r = int(115 + 16 * depth)
        g = int(98 + 12 * depth)
        b = int(75 + 9 * depth)

        wave = (np.sin(np.linspace(0, 45, w) * 1.5 + y * 0.09) * 8).astype(int)
        arr[y, :, 0] = np.clip(r + wave, 0, 255)
        arr[y, :, 1] = np.clip(g + wave, 0, 255)
        arr[y, :, 2] = np.clip(b + wave // 2, 0, 255)

    res = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(radius=0.5))
    return res

def generate_all():
    root = Path(__file__).resolve().parent.parent
    sample_flood_dir = root / "data" / "sample" / "flood"
    sample_flood_dir.mkdir(parents=True, exist_ok=True)
    scenarios_img_dir = root / "data" / "processed" / "scenarios" / "images"
    scenarios_img_dir.mkdir(parents=True, exist_ok=True)
    fixtures_dir = root / "tests" / "fixtures"
    fixtures_dir.mkdir(parents=True, exist_ok=True)

    img1 = create_silk_board_flood()
    img2 = create_bellandur_flood()
    img3 = create_hebbal_flood()

    # Save to sample flood directory (replaces 1.jpg, 2.jpg, 3.jpg)
    img1.save(sample_flood_dir / "1.jpg", quality=95)
    img2.save(sample_flood_dir / "2.jpg", quality=95)
    img3.save(sample_flood_dir / "3.jpg", quality=95)
    print("Saved clean flood photos to data/sample/flood/ (1.jpg, 2.jpg, 3.jpg)")

    # Save to scenarios and fixtures
    img1.save(scenarios_img_dir / "scenario_severe_flood.jpg", quality=95)
    img1.save(scenarios_img_dir / "scenario_duplicate_rpt.jpg", quality=95)
    img1.save(fixtures_dir / "sample_flood.jpg", quality=95)
    print("Saved clean flood photos to scenarios and fixtures.")

if __name__ == "__main__":
    generate_all()
