from PIL import Image
import imagehash
from pathlib import Path

def compute_image_phash(image_path: str | Path) -> str:
    """Computes perceptual hash (dHash + pHash) of an image for visual duplicate matching."""
    try:
        with Image.open(image_path) as img:
            # Using dhash (gradient hash) as fast, robust visual fingerprint
            h = imagehash.dhash(img)
            return str(h)
    except Exception:
        return ""

def hamming_distance(hash1: str, hash2: str) -> int:
    """Computes Hamming distance between two hex hash strings. Lower distance indicates visual similarity."""
    if not hash1 or not hash2:
        return 999
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        return int(h1 - h2)
    except Exception:
        return 999

def is_visual_duplicate(hash1: str, hash2: str, threshold: int = 8) -> bool:
    """Returns True if Hamming distance <= threshold (typically 6-8 for near-identical photos)."""
    dist = hamming_distance(hash1, hash2)
    return dist <= threshold

