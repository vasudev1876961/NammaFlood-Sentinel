# NammaFlood Sentinel 🌧️

> **Multimodal Agentic Intelligence for Urban Flood Detection, Risk Assessment, and Civic Response Coordination in Bengaluru**
>
> Developed for the **IBM Bobathon: Build for Bengaluru** — Student Category  
> Theme: *Smarter Streets, Better Living*

---

## 🌟 Executive Overview
Bengaluru frequently faces acute urban waterlogging during monsoon downpours, causing paralyzing traffic gridlocks at key junctions (Silk Board, Ecospace, Hebbal), inundating low-lying residential layouts, and straining municipal response teams. 

**NammaFlood Sentinel** transforms fragmented citizen photographs, GPS tags, real-time meteorological precipitation feeds, and geospatial drainage data into verified, prioritized, and explainable urban intelligence.

Operating through **six cooperating specialist AI agents** orchestrated via **LangGraph**, the system fuses visual evidence, weather context, and hotspot proximity into an actionable decision-support platform with strict **human-in-the-loop civic authorization gates**.

---

## 🚀 One-Click Quickstart (Windows)

To start both the FastAPI backend and the React frontend simultaneously:

```cmd
run_project.bat
```
or in PowerShell:
```powershell
.\run_project.ps1
```

The launcher automatically:
1. Seeds benchmark Bengaluru urban incidents into the database.
2. Starts the **FastAPI Backend** on `http://127.0.0.1:8000`.
3. Starts the **React Vite Frontend** on `http://localhost:3000`.
4. Opens the Web Application and OpenAPI Docs in your default browser!

---

## 🏗️ 3 Comprehensive Application Views

1. **📱 Citizen Reporting Portal (`CitizenPortal.tsx`)**:
   - Mobile-first, bilingual English & Kannada (ಕನ್ನಡ) reporting interface.
   - Quick 1-click demo presets (Silk Board, Ecospace, MG Road) for instant testing.
   - Live photo upload with automatic water pooling analysis.
   - GPS coordinate capture with Bengaluru bounds verification.
   - Automatic reporter contact masking for privacy compliance.

2. **🛡️ Civic Emergency Control Room (`AdminDashboard.tsx`)**:
   - Interactive Leaflet geospatial map showing live incident markers color-coded by severity (Crimson Red: High, Amber: Medium, Emerald Green: Low) with BBMP chronic flood hotspot overlays.
   - Live KPI cards tracking active emergencies, pending human audits, and agent SLA latencies.
   - Real-time telemetry monitor for all 6 specialist agents.
   - Prioritized incident queue with instant status filters.
   - Multi-Agent Evidence Dossier Modal for deep inspection of citizen photos, weather values, and line-item risk reasons.
   - Human-in-the-loop authorization audit form (Approve, Edit, Reject with official dispatch logging).
   - Instant BBMP dispatch CSV export.

3. **🧠 Agentic AI & ML Analytics (`AnalyticsView.tsx`)**:
   - **LangGraph Multi-Agent Execution DAG:** Interactive visualizer displaying state transitions and node latencies.
   - **Model Benchmark Comparison:** Transparent Heuristic vs Random Forest (F1: `1.0000`) vs XGBoost (F1: `0.9946`).
   - **Feature Importance Weights:** Bar charts revealing exactly how rainfall, water surface pooling, and geography drive priority scores.
   - **Interactive 1-Click Scenario Runner:** Test buttons for Scenarios A through H with live execution traces!

---

## 🧪 Automated Testing & Evaluation

Run the full automated test suite (18 unit, integration, and scenario tests):

```bash
pytest tests/ -v
```

All 8 benchmark scenarios (A through H) pass with 100% test coverage:
- **Scenario A:** Clear dry road & zero rain (False alarm suppression) -> PASS
- **Scenario B:** Moderate water accumulation (12.5mm rain) -> PASS
- **Scenario C:** Heavy rain at chronic hotspot (Silk Board) -> PASS
- **Scenario D:** Duplicate citizen report clustering (pHash + Haversine) -> PASS
- **Scenario E:** Offline weather API fallback -> PASS
- **Scenario F:** Blurry / low-resolution photo quality escalation -> PASS
- **Scenario G:** Contradictory evidence detection (55mm rain on bone-dry road) -> PASS
- **Scenario H:** Civic officer audit rejection -> PASS

---

## 🤖 IBM Bob Development Journey
In compliance with hackathon submission guidelines, IBM Bob's role in the development journey is documented in [`docs/bob_development_log.md`](docs/bob_development_log.md) covering state contract designs, verification algorithms, and safety constraint reviews.

---

## 📁 Repository Structure
```
NammaFlood-Sentinel/
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py              # Application entrypoint & static mounts
│   │   ├── api/v1/              # REST API routes (reports, incidents, dashboard, scenarios)
│   │   ├── core/                # Config, security, and logging
│   │   ├── database/            # SQLAlchemy session and table init
│   │   ├── models/              # Relational models (Incident, Report, AgentRun, Review)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── agents/              # 6 specialist AI agents
│   │   ├── orchestration/       # LangGraph multi-agent workflow
│   │   ├── utils/               # Geodesic, hashing, and date utilities
│   │   └── uploads/             # Citizen photo storage
│   └── requirements.txt
├── frontend/                    # React + TypeScript + Tailwind CSS + Leaflet
│   ├── src/
│   │   ├── citizen/             # Mobile-first Citizen Reporting Portal
│   │   ├── dashboard/           # Admin Control Room & ML Analytics View
│   │   ├── components/          # Leaflet map, navbar, detail modal
│   │   └── services/            # API client layer
│   └── package.json
├── data/                        # Sample photos & processed GeoJSON
├── ml/                          # Training and evaluation pipelines (RF & XGBoost)
├── scripts/                     # Seed script, scenario generator, and live demo
├── tests/                       # 18 unit, integration, and scenario tests
├── docs/                        # Architecture, Schema, Evaluation, Pitch, and Bob Log
├── artifacts/                   # Demo PowerPoint & evaluation metrics
├── run_project.bat              # One-click Windows CMD launcher
├── run_project.ps1              # One-click Windows PowerShell launcher
└── README.md
```

---

## 📄 License
MIT License. Created for IBM Bobathon: Build for Bengaluru 2026.
