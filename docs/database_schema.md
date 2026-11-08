# Database Schema Specification

## 1. Relational Entities Overview
NammaFlood Sentinel implements a normalized relational architecture compatible with both SQLite (for zero-friction local execution) and PostgreSQL / PostGIS (for enterprise cloud deployment).

```
+---------------+        1:N       +---------------+
|   incidents   | <---------------+    reports    |
+---------------+                  +---------------+
        | 1:N                              | 1:N
        |                                  |
        v                                  v
+---------------+                  +---------------+
|    reviews    |                  |  agent_runs   |
+---------------+                  +---------------+
        | 1:N                              | 1:N
        v                                  v
+-------------------+              +--------------------+
| incident_updates  |              |   notifications    |
+-------------------+              +--------------------+
```

## 2. Table Schemas

### `incidents`
Canonical grouped flood event representing ground reality at a specific location and timeframe.
- `incident_id` (TEXT, PK): Unique incident identifier (`INC-YYYYMMDD-XXXX`).
- `latitude` (REAL): Latitude coordinate in EPSG:4326.
- `longitude` (REAL): Longitude coordinate in EPSG:4326.
- `ward_name` (TEXT): Bengaluru ward identifier (e.g. "Ward 150 - Bellandur").
- `first_seen_at` (TEXT): ISO-8601 UTC timestamp of initial observation.
- `last_seen_at` (TEXT): ISO-8601 UTC timestamp of latest confirmed report.
- `status` (TEXT): Incident lifecycle state (`open`, `verified`, `investigating`, `action_approved`, `resolved`, `rejected`).
- `risk_score` (REAL): Fused multi-agent priority rating (0.0 to 100.0).
- `risk_level` (TEXT): Severity classification (`low`, `medium`, `high`).
- `risk_confidence` (REAL): Evidence completeness index (0.0 to 1.0).
- `risk_reasons_json` (TEXT): Structured list of explainable score components.
- `location_context_json` (TEXT): Proximity to hotspots, lakes, and drains.
- `weather_context_json` (TEXT): Real-time rainfall observations and forecasts.
- `created_at` (TEXT): Record creation timestamp.
- `updated_at` (TEXT): Record last modification timestamp.

### `reports`
Immutable raw citizen or sensor submissions.
- `report_id` (TEXT, PK): Unique report identifier (`RPT-YYYYMMDD-XXXX`).
- `incident_id` (TEXT, FK): Foreign key linking to the parent `incidents` record.
- `image_path` (TEXT): Relative filesystem path to the stored citizen photograph.
- `image_hash` (TEXT): Perceptual hash (dHash/pHash) hex string for duplicate matching.
- `latitude` (REAL): Reporter GPS latitude.
- `longitude` (REAL): Reporter GPS longitude.
- `reporter_note` (TEXT): Citizen-provided textual description.
- `reporter_phone_masked` (TEXT): Anonymized contact info for privacy protection.
- `occurred_at` (TEXT): Timestamp when photo was captured.
- `received_at` (TEXT): Timestamp when report was ingested by the API.
- `vision_label` (TEXT): Primary visual classification (`flood`, `non_flood`, `waterlogging`, `dry_street`).
- `vision_confidence` (REAL): Model prediction probability.
- `vision_output_json` (TEXT): Full vision feature inspection output.
- `rainfall_mm_1h` (REAL): 1-hour rainfall context at submission.
- `rainfall_mm_3h` (REAL): 3-hour rainfall context at submission.
- `source_type` (TEXT): Source category (`citizen`, `traffic_cam`, `civic_field_agent`, `synthetic_scenario`).
- `verification_status` (TEXT): Duplicate status (`original`, `duplicate_linked`, `flagged_suspicious`).

### `agent_runs`
Granular execution log capturing inputs, outputs, and latencies for every agent invocation.
- `run_id` (INTEGER, PK AUTO): Unique run index.
- `incident_id` (TEXT, FK): Target incident.
- `report_id` (TEXT, FK): Target report.
- `agent_name` (TEXT): Agent identifier (`vision`, `weather`, `location`, `verification`, `risk`, `response`).
- `status` (TEXT): Execution outcome (`completed`, `degraded_fallback`, `failed`).
- `output_json` (TEXT): Full agent structured output.
- `duration_ms` (REAL): Execution latency in milliseconds.
- `created_at` (TEXT): Execution timestamp.

### `reviews`
Human-in-the-loop decision audits.
- `review_id` (INTEGER, PK AUTO): Unique review index.
- `incident_id` (TEXT, FK): Incident ID being audited.
- `reviewer_id` (TEXT): Identity or role of the civic official (e.g., `officer_bbmp_control`).
- `decision` (TEXT): Formal action (`approve`, `reject`, `edit`, `request_verification`).
- `reviewer_note` (TEXT): Operational remarks explaining the decision.
- `action_dispatched` (TEXT): Civic response instructions (e.g. `Deploy pump team to Silk Board Underpass`).
- `reviewed_at` (TEXT): Audit timestamp.

### `incident_updates`
Immutable append-only audit trail tracking the chronological progression of an incident.
- `update_id` (INTEGER, PK AUTO): Unique entry index.
- `incident_id` (TEXT, FK): Parent incident.
- `report_id` (TEXT, FK): Associated report if triggered by submission.
- `update_type` (TEXT): Event category (`report_received`, `risk_elevated`, `human_review`, `status_changed`, `field_resolved`).
- `note` (TEXT): Descriptive change summary.
- `created_at` (TEXT): Event timestamp.

### `notifications`
Alerts queued for civic staff or citizen status updates.
- `notification_id` (INTEGER, PK AUTO): Unique notification index.
- `incident_id` (TEXT, FK): Associated incident.
- `recipient_type` (TEXT): Audience (`citizen`, `admin_operator`, `ward_engineer`).
- `title` (TEXT): Alert header.
- `message` (TEXT): Alert body.
- `read_status` (BOOLEAN): Read receipt.
- `created_at` (TEXT): Timestamp.

