import json
import shutil
from pathlib import Path
from backend.app.core.config import settings
from backend.app.database.session import SessionLocal, init_db
from backend.app.models.models import Incident, Report, AgentRun, Review, IncidentUpdate, gen_id, utcnow_str
from backend.app.utils.hash_utils import compute_image_phash

SEED_INCIDENTS = [
    {
        "name": "Central Silk Board Underpass",
        "latitude": 12.9175,
        "longitude": 77.6238,
        "ward": "BTM Layout / HSR",
        "risk_score": 92.5,
        "risk_level": "high",
        "risk_confidence": 0.95,
        "status": "open",
        "rainfall_1h": 48.0,
        "rainfall_3h": 85.0,
        "sample_img": "data/sample/flood/1.jpg",
        "note": "Underpass submerged up to 2 feet; 4 vehicles stalled; severe traffic backup on Hosur Road.",
        "recommended_action": "URGENT REVIEW: Waterlogging at Central Silk Board Underpass. Dispatch BBMP heavy suction pump unit 1 and alert BTP for traffic diversion.",
        "reasons": [
            "Visual evidence confirms flood water (confidence: 0.86): +30.1 pts",
            "1-hour rainfall accumulation (48.0 mm, heavy): +19.2 pts",
            "3-hour cumulative rainfall (85.0 mm): +8.5 pts",
            "Incident is within 500m of chronic waterlogging hotspot (Central Silk Board, Severe): +20.0 pts",
            "3 corroborating citizen reports in vicinity: +15.0 pts"
        ]
    },
    {
        "name": "Ecospace Bellandur Outer Ring Road",
        "latitude": 12.9260,
        "longitude": 77.6834,
        "ward": "Bellandur (Ward 150)",
        "risk_score": 86.0,
        "risk_level": "high",
        "risk_confidence": 0.90,
        "status": "investigating",
        "rainfall_1h": 38.5,
        "rainfall_3h": 72.0,
        "sample_img": "data/sample/flood/2.jpg",
        "note": "Service road submerged outside Ecospace; water overflowing from Bellandur lake catchment.",
        "recommended_action": "URGENT REVIEW: Inundation at Ecospace ORR. Deploy mobile dewatering crew and barricade left service lane.",
        "reasons": [
            "Visual evidence confirms flood water (confidence: 0.86): +30.1 pts",
            "1-hour rainfall accumulation (38.5 mm, heavy): +15.4 pts",
            "Incident is within 500m of chronic waterlogging hotspot (Ecospace ORR, Critical): +20.0 pts",
            "Adjacent to Bellandur lake secondary drain: +10.0 pts"
        ]
    },
    {
        "name": "Hebbal Flyover Service Road",
        "latitude": 13.0358,
        "longitude": 77.5970,
        "ward": "Hebbal (Ward 21)",
        "risk_score": 74.0,
        "risk_level": "high",
        "risk_confidence": 0.85,
        "status": "action_approved",
        "rainfall_1h": 32.0,
        "rainfall_3h": 58.0,
        "sample_img": "data/sample/flood/3.jpg",
        "note": "Water pooling near Hebbal lake inlet; airport-bound traffic moving very slowly.",
        "recommended_action": "PRIORITY ACTION: Deploy BBMP maintenance crew to clear storm drain grates at Hebbal flyover ramp.",
        "reasons": [
            "Visual evidence confirms flood water (confidence: 0.86): +30.1 pts",
            "1-hour rainfall accumulation (32.0 mm, heavy): +12.8 pts",
            "Proximity to Hebbal Flyover chronic hotspot: +20.0 pts"
        ]
    },
    {
        "name": "Koramangala 4th Block (KHB Colony)",
        "latitude": 12.9345,
        "longitude": 77.6269,
        "ward": "Koramangala (Ward 151)",
        "risk_score": 58.0,
        "risk_level": "medium",
        "risk_confidence": 0.80,
        "status": "open",
        "rainfall_1h": 16.0,
        "rainfall_3h": 30.0,
        "sample_img": "data/processed/scenarios/images/scenario_mod_flood.jpg",
        "note": "Stormwater drain running at 85% capacity; water entering residential driveways.",
        "recommended_action": "PRIORITY MONITORING: Emerging water accumulation near Koramangala 4th Block. Inspect culvert flow.",
        "reasons": [
            "Visual pooling detected on road surface: +20.0 pts",
            "1-hour rainfall accumulation (16.0 mm, heavy): +6.4 pts",
            "Within 500m of Koramangala chronic point: +20.0 pts"
        ]
    },
    {
        "name": "Sony World Signal 80ft Road",
        "latitude": 12.9363,
        "longitude": 77.6322,
        "ward": "Koramangala",
        "risk_score": 45.0,
        "risk_level": "medium",
        "risk_confidence": 0.75,
        "status": "resolved",
        "rainfall_1h": 12.0,
        "rainfall_3h": 20.0,
        "sample_img": "data/processed/scenarios/images/scenario_mod_flood.jpg",
        "note": "Water receded after drain grate was cleared by ward worker.",
        "recommended_action": "ROUTINE MONITORING: Grate cleared; maintain scheduled re-inspection.",
        "reasons": [
            "Visual pooling observed: +20.0 pts",
            "1-hour rainfall accumulation (12.0 mm, moderate): +4.8 pts",
            "Catchment buffer of Koramangala: +10.0 pts"
        ]
    },
    {
        "name": "MG Road / Brigade Road Junction",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "ward": "Shantalanagar (Ward 111)",
        "risk_score": 14.5,
        "risk_level": "low",
        "risk_confidence": 0.85,
        "status": "resolved",
        "rainfall_1h": 0.0,
        "rainfall_3h": 0.0,
        "sample_img": "data/sample/non_flood/dry_street_1.jpg",
        "note": "Clear road surface, stormwater drain operating smoothly.",
        "recommended_action": "ROUTINE MONITORING: Low risk observed. No civic intervention required.",
        "reasons": [
            "Visual classification 'non_flood' confirms dry asphalt.",
            "Zero rainfall observed in previous 3 hours."
        ]
    }
]

def seed():
    print("Seeding database with benchmark Bengaluru urban waterlogging incidents...")
    init_db()
    db = SessionLocal()
    
    # Check if incidents already seeded
    existing_count = db.query(Incident).count()
    if existing_count >= 5:
        print(f"Database already populated with {existing_count} incidents. Skipping seed.")
        db.close()
        return

    now_ts = utcnow_str()
    upload_dir = settings.UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)

    for item in SEED_INCIDENTS:
        inc_id = gen_id("INC")
        rpt_id = gen_id("RPT")
        
        # Copy sample image into uploads
        src_path = Path(item["sample_img"])
        dest_filename = f"{rpt_id}.jpg"
        dest_path = upload_dir / dest_filename
        
        if src_path.exists():
            shutil.copy(src_path, dest_path)
            img_hash = compute_image_phash(dest_path)
        else:
            img_hash = "0000000000000000"

        # Create Incident
        inc = Incident(
            incident_id=inc_id,
            latitude=item["latitude"],
            longitude=item["longitude"],
            ward_name=item["ward"],
            first_seen_at=now_ts,
            last_seen_at=now_ts,
            status=item["status"],
            risk_score=item["risk_score"],
            risk_level=item["risk_level"],
            risk_confidence=item["risk_confidence"],
            risk_reasons_json=json.dumps(item["reasons"]),
            location_context_json=json.dumps({
                "nearest_hotspot": {"name": item["name"], "distance_m": 45.0, "vulnerability": "Severe"},
                "within_500m_hotspot": True
            }),
            weather_context_json=json.dumps({
                "rainfall_1h_mm": item["rainfall_1h"],
                "rainfall_3h_mm": item["rainfall_3h"],
                "intensity_category": "heavy" if item["rainfall_1h"] > 15.5 else "moderate"
            }),
            recommended_action=item["recommended_action"],
            created_at=now_ts,
            updated_at=now_ts
        )
        db.add(inc)

        # Create Report
        rpt = Report(
            report_id=rpt_id,
            incident_id=inc_id,
            image_path=str(dest_path),
            image_hash=img_hash,
            latitude=item["latitude"],
            longitude=item["longitude"],
            reporter_note=item["note"],
            occurred_at=now_ts,
            received_at=now_ts,
            vision_label="flood" if item["risk_level"] in ["high", "medium"] else "non_flood",
            vision_confidence=0.88,
            rainfall_mm_1h=item["rainfall_1h"],
            rainfall_mm_3h=item["rainfall_3h"],
            source_type="citizen",
            verification_status="original"
        )
        db.add(rpt)

        # Create Timeline Entry
        update_entry = IncidentUpdate(
            incident_id=inc_id,
            report_id=rpt_id,
            update_type="report_received",
            note=f"Initial citizen incident reported at {item['name']}.",
            created_at=now_ts
        )
        db.add(update_entry)

        # If status is action_approved, add review
        if item["status"] == "action_approved":
            rev = Review(
                incident_id=inc_id,
                reviewer_id="bbmp_control_officer",
                decision="approve",
                reviewer_note="Confirmed waterlogging; suction team 2 mobilized.",
                action_dispatched=item["recommended_action"],
                reviewed_at=now_ts
            )
            db.add(rev)

    db.commit()
    print(f"Successfully seeded {len(SEED_INCIDENTS)} realistic Bengaluru incidents into database!")
    db.close()

if __name__ == "__main__":
    seed()

