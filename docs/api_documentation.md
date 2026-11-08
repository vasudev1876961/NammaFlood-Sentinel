# NammaFlood Sentinel — REST API Documentation

The NammaFlood Sentinel Backend is implemented with FastAPI. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs` or `http://127.0.0.1:8000/redoc`.

Base path: `/api/v1`

---

## 1. Citizen & Report Endpoints

### `POST /api/v1/reports`
Ingest citizen report with multimodal photograph, GPS coordinates, and optional reporter context.
- **Request:** `multipart/form-data`
  - `image` (UploadFile, required): JPEG, PNG, or WEBP image ($\le 15\text{MB}$).
  - `latitude` (float, required): $-90.0 \le \text{lat} \le 90.0$ (Bengaluru bounding box checked).
  - `longitude` (float, required): $-180.0 \le \text{lon} \le 180.0$.
  - `rainfall_mm_1h` (float, optional): Measured 1h rainfall if citizen sensor available.
  - `rainfall_mm_3h` (float, optional): Measured 3h rainfall.
  - `reporter_note` (str, optional): Narrative context.
  - `reporter_phone` (str, optional): Anonymized for callback.
- **Response (201 Created):**
```json
{
  "incident_id": "INC-20261108-A4F1",
  "report_id": "RPT-20261108-9C21",
  "verification_status": "original",
  "assessment": {
    "risk": {
      "score": 78.5,
      "level": "high",
      "confidence": 0.88,
      "reasons": ["Visible flood inundation detected (confidence 0.92)", "1h precipitation of 34mm exceeds heavy rain threshold", "Within 180m of Silk Board Underpass hotspot"]
    },
    "response": {
      "recommended_action": "Urgent human review; dispatch BBMP suction pump team.",
      "priority": "high",
      "human_approval_required": true
    }
  },
  "message": "Report received and analyzed by specialist agents. Pending civic officer review."
}
```

---

## 2. Incident Intelligence Endpoints

### `GET /api/v1/incidents`
Retrieve incident feed with optional query filters.
- **Query Parameters:**
  - `status` (optional): Filter by lifecycle state (`open`, `verified`, `resolved`, `rejected`).
  - `risk_level` (optional): Filter by severity (`high`, `medium`, `low`).
  - `limit` (default: 50, max: 200).
- **Response (200 OK):** Array of Incident objects including risk scores, timestamps, and locations.

### `GET /api/v1/incidents/{incident_id}`
Retrieve full granular details for a single incident including:
- Canonical incident record
- Linked citizen reports (original + duplicates)
- Execution logs and traces for all 6 agents
- Human review history
- Timeline events

### `GET /api/v1/incidents/{incident_id}/timeline`
Retrieve chronological audit events for the incident.

---

## 3. Human-in-the-Loop Review Endpoints

### `POST /api/v1/incidents/{incident_id}/verify`
Civic officer confirms or overrides duplicate clustering.

### `POST /api/v1/incidents/{incident_id}/review`
Authorized civic officer formal review.
- **Header:** `X-Admin-Key: <ADMIN_API_KEY>`
- **Request Body (JSON):**
```json
{
  "decision": "approve", // "approve" | "reject" | "edit"
  "reviewer_note": "Confirmed waterlogging at Ecospace service road; pump team 4 alerted.",
  "action_dispatched": "BBMP Suction Team 4 dispatched"
}
```
- **Response (200 OK):** Updated incident status and review confirmation.

### `PATCH /api/v1/incidents/{incident_id}/status`
Update resolution status (`open`, `investigating`, `resolved`).

---

## 4. Monitoring & Analytics Endpoints

### `GET /api/v1/dashboard/summary`
Civic control room statistics: total incidents, active waterlogged hotspots, pending human reviews, and agent SLA latencies.

### `GET /api/v1/agents/status`
Health status, average latency, and success rates for each of the 6 specialist agents.

### `GET /api/v1/analytics/risk`
Spatial and categorical risk breakdown across Bengaluru zones (East, South, Mahadevapura, Bommanahalli).

