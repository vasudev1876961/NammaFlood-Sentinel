import json
import shutil
import sys
from pathlib import Path

from backend.app.core.config import settings
from backend.app.database.session import SessionLocal, init_db
from backend.app.models.models import (
    Incident, Report, AgentRun, Review, IncidentUpdate, gen_id, utcnow_str
)
from backend.app.utils.hash_utils import compute_image_phash

BENCHMARK_INCIDENTS = [
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
        "recommended_action": "URGENT REVIEW: Waterlogging at Central Silk Board Underpass. Dispatch BBMP heavy suction pump unit 1 and alert BTP for traffic diversion.",
        "reasons": [
            "Visual evidence confirms flood water (confidence: 0.88, water coverage: 33.2%): +30.1 pts",
            "1-hour rainfall accumulation (48.0 mm, heavy): +19.2 pts",
            "3-hour cumulative rainfall (85.0 mm): +8.5 pts",
            "Incident is within 500m of chronic waterlogging hotspot (Central Silk Board, Severe): +20.0 pts",
            "3 corroborating citizen reports in vicinity: +15.0 pts"
        ],
        "reports": [
            {
                "sample_img": "data/sample/flood/1.jpg",
                "note": "Severe waterlogging under the Central Silk Board flyover; cars stranded; water above wheel level.",
                "verification_status": "original",
                "vision_label": "flood",
                "vision_confidence": 0.91,
                "water_coverage": 0.332
            },
            {
                "sample_img": "data/sample/flood/2.jpg",
                "note": "Silk Board junction completely submerged on Hosur Road ramp; bus stalled in 2 feet of water.",
                "verification_status": "duplicate_linked",
                "vision_label": "flood",
                "vision_confidence": 0.89,
                "water_coverage": 0.370
            },
            {
                "sample_img": "data/sample/flood/3.jpg",
                "note": "Water accumulating rapidly under flyover loop heading toward BTM layout. Avoid route.",
                "verification_status": "duplicate_linked",
                "vision_label": "flood",
                "vision_confidence": 0.86,
                "water_coverage": 0.269
            }
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
        "recommended_action": "URGENT REVIEW: Inundation at Ecospace ORR. Deploy mobile dewatering crew and barricade left service lane.",
        "reasons": [
            "Visual evidence confirms flood water (confidence: 0.86): +30.1 pts",
            "1-hour rainfall accumulation (38.5 mm, heavy): +15.4 pts",
            "Incident is within 500m of chronic waterlogging hotspot (Ecospace ORR, Critical): +20.0 pts",
            "Adjacent to Bellandur lake secondary drain: +10.0 pts"
        ],
        "reports": [
            {
                "sample_img": "data/sample/flood/2.jpg",
                "note": "Service road submerged outside Ecospace; water overflowing from Bellandur lake catchment.",
                "verification_status": "original",
                "vision_label": "flood",
                "vision_confidence": 0.87,
                "water_coverage": 0.370
            },
            {
                "sample_img": "data/sample/flood/1.jpg",
                "note": "Outer Ring Road tech park entrance blocked due to muddy runoff spillover.",
                "verification_status": "duplicate_linked",
                "vision_label": "flood",
                "vision_confidence": 0.85,
                "water_coverage": 0.315
            }
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
        "recommended_action": "PRIORITY ACTION: Deploy BBMP maintenance crew to clear storm drain grates at Hebbal flyover ramp.",
        "reasons": [
            "Visual evidence confirms flood water (confidence: 0.86): +30.1 pts",
            "1-hour rainfall accumulation (32.0 mm, heavy): +12.8 pts",
            "Proximity to Hebbal Flyover chronic hotspot: +20.0 pts"
        ],
        "reports": [
            {
                "sample_img": "data/sample/flood/3.jpg",
                "note": "Water pooling near Hebbal lake inlet; airport-bound traffic moving at snail's pace.",
                "verification_status": "original",
                "vision_label": "flood",
                "vision_confidence": 0.86,
                "water_coverage": 0.269
            }
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
        "recommended_action": "PRIORITY MONITORING: Emerging water accumulation near Koramangala 4th Block. Inspect culvert flow.",
        "reasons": [
            "Visual pooling detected on road surface: +20.0 pts",
            "1-hour rainfall accumulation (16.0 mm, heavy): +6.4 pts",
            "Within 500m of Koramangala chronic point: +20.0 pts"
        ],
        "reports": [
            {
                "sample_img": "data/sample/flood/1.jpg",
                "note": "Stormwater drain running at 85% capacity; water entering residential driveways on 80ft road.",
                "verification_status": "original",
                "vision_label": "flood",
                "vision_confidence": 0.84,
                "water_coverage": 0.220
            }
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
        "recommended_action": "ROUTINE MONITORING: Grate cleared; maintain scheduled re-inspection.",
        "reasons": [
            "Visual pooling observed: +20.0 pts",
            "1-hour rainfall accumulation (12.0 mm, moderate): +4.8 pts",
            "Catchment buffer of Koramangala: +10.0 pts"
        ],
        "reports": [
            {
                "sample_img": "data/sample/flood/2.jpg",
                "note": "Water receded after drain grate was cleared by ward maintenance worker.",
                "verification_status": "original",
                "vision_label": "flood",
                "vision_confidence": 0.80,
                "water_coverage": 0.180
            }
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
        "recommended_action": "ROUTINE MONITORING: Low risk observed. No civic intervention required.",
        "reasons": [
            "Visual classification 'non_flood' confirms dry asphalt.",
            "Zero rainfall observed in previous 3 hours."
        ],
        "reports": [
            {
                "sample_img": "data/sample/non_flood/dry_street_1.jpg",
                "note": "Clear road surface, stormwater drain operating smoothly under clear skies.",
                "verification_status": "original",
                "vision_label": "non_flood",
                "vision_confidence": 0.95,
                "water_coverage": 0.015
            }
        ]
    }
]

def seed(force_reset: bool = True):
    print("=" * 70)
    print("Seeding database with benchmark Bengaluru urban waterlogging incidents...")
    print("=" * 70)
    init_db()
    db = SessionLocal()
    
    if force_reset:
        db.query(AgentRun).delete()
        db.query(Review).delete()
        db.query(IncidentUpdate).delete()
        db.query(Report).delete()
        db.query(Incident).delete()
        db.commit()

        upload_dir = settings.UPLOAD_DIR
        upload_dir.mkdir(parents=True, exist_ok=True)
        for f in upload_dir.glob("*.*"):
            try:
                f.unlink()
            except Exception:
                pass

    now_ts = utcnow_str()
    upload_dir = settings.UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)

    for item in BENCHMARK_INCIDENTS:
        inc_id = gen_id("INC")
        
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

        for rpt_data in item["reports"]:
            rpt_id = gen_id("RPT")
            src_path = Path(rpt_data["sample_img"])
            dest_filename = f"{rpt_id}.jpg"
            dest_path = upload_dir / dest_filename
            
            if src_path.exists():
                shutil.copy(src_path, dest_path)
                img_hash = compute_image_phash(dest_path)
            else:
                img_hash = "0000000000000000"

            rpt = Report(
                report_id=rpt_id,
                incident_id=inc_id,
                image_path=str(dest_path),
                image_hash=img_hash,
                latitude=item["latitude"],
                longitude=item["longitude"],
                reporter_note=rpt_data["note"],
                occurred_at=now_ts,
                received_at=now_ts,
                vision_label=rpt_data["vision_label"],
                vision_confidence=rpt_data["vision_confidence"],
                vision_output_json=json.dumps({
                    "label": rpt_data["vision_label"],
                    "confidence": rpt_data["vision_confidence"],
                    "water_coverage": rpt_data.get("water_coverage", 0.3)
                }),
                rainfall_mm_1h=item["rainfall_1h"],
                rainfall_mm_3h=item["rainfall_3h"],
                source_type="citizen",
                verification_status=rpt_data["verification_status"]
            )
            db.add(rpt)

            # Timeline update
            update_entry = IncidentUpdate(
                incident_id=inc_id,
                report_id=rpt_id,
                update_type="report_received",
                note=f"Verified citizen evidence registered for {item['name']}.",
                created_at=now_ts
            )
            db.add(update_entry)

            # Multi-Agent Run log for audit dossier
            for agent_name in ["vision", "weather", "location", "verification", "risk", "response"]:
                run_entry = AgentRun(
                    incident_id=inc_id,
                    report_id=rpt_id,
                    agent_name=agent_name,
                    status="completed",
                    duration_ms=4.2,
                    output_json=json.dumps({"status": "verified", "agent": agent_name}),
                    created_at=now_ts
                )
                db.add(run_entry)

        if item["status"] == "action_approved":
            rev = Review(
                incident_id=inc_id,
                reviewer_id="bbmp_control_officer",
                decision="approve",
                reviewer_note="Confirmed severe waterlogging from multi-agent dossier; 100 HP diesel suction pump unit dispatched.",
                action_dispatched=item["recommended_action"],
                reviewed_at=now_ts
            )
            db.add(rev)

    db.commit()
    print(f"Successfully seeded {len(BENCHMARK_INCIDENTS)} realistic Bengaluru incidents into database!")
    db.close()

if __name__ == "__main__":
    seed()
