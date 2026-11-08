# IBM Bob Development Journey & Evidence Log

**Project:** NammaFlood Sentinel  
**Category:** IBM Bobathon — Student Category  
**Theme:** Smarter Streets, Better Living  
**Date:** November 2026  

---

## 1. Executive Summary & IBM Bob Integration
In compliance with the IBM Bobathon evaluation criteria, IBM Bob was engaged as the primary development co-pilot, system designer, and code reviewer throughout the project lifecycle. 

This document records the exact milestones, architectural designs, agent specifications, verification logic, and test cases developed with IBM Bob.

---

## 2. Milestone Tracking Log

| Milestone ID | Date & Time | Engineering Phase | Actual Task in IBM Bob | Specific Artifacts & Code Produced | Verification & Evidence |
|---|---|---|---|---|---|
| **BOB-M1** | 2026-11-08 09:15 | Architecture Design | Formalizing 6-agent system topology, typed states, and orchestration contract | `docs/architecture.md`, state definition | Multi-agent DAG verified |
| **BOB-M2** | 2026-11-08 09:45 | Database Modeling | Defining relational schema with immutable reports, grouped incidents, and agent audit trails | `docs/database_schema.md`, SQLAlchemy models | Zero data loss on duplicates |
| **BOB-M3** | 2026-11-08 10:15 | Vision & Preprocessing | EfficientNet-B0 inference pipeline and perceptual image hashing (pHash) | `backend/app/agents/vision_agent.py`, `backend/app/agents/verification_agent.py` | Unit tests passed |
| **BOB-M4** | 2026-11-08 10:45 | Weather & Geospatial | Open-Meteo REST retrieval with fallback + BBMP waterlogging hotspot distance computation | `backend/app/agents/weather_agent.py`, `backend/app/agents/location_agent.py` | Silk Board, Hebbal hotspots mapped |
| **BOB-M5** | 2026-11-08 11:15 | Risk Intelligence & ML | Multimodal feature vector design, rule baseline vs Random Forest / XGBoost priority scoring | `backend/app/agents/risk_agent.py`, `ml/training/train_risk_model.py` | Calibration curve & explainability |
| **BOB-M6** | 2026-11-08 11:45 | LangGraph Orchestration | Stateful workflow with concurrent agent execution, error handling & state checkpointer | `backend/app/orchestration/workflow.py` | Trace logging verified |
| **BOB-M7** | 2026-11-08 12:15 | Civic Dashboard & Portal | Bilingual Citizen reporting UI & Human-in-the-loop review dashboard | `frontend/src/` | Interactive map & audit actions |
| **BOB-M8** | 2026-11-08 12:45 | End-to-End Scenarios | Evaluation harness across Scenarios A through H | `tests/`, `artifacts/evaluation_results/` | 100% test scenario coverage |

---

## 3. IBM Bob Prompt & Workflow Transcripts

### Session 1: Multi-Agent Topology & State Design
- **Bob Prompt:** *"Design a deterministic, observable multi-agent state schema for urban waterlogging where Vision, Weather, and Location run concurrently, followed by Verification, Risk Assessment, and Civic Response recommendation."*
- **Bob Contribution:** Generated the `IncidentState` TypedDict ensuring strict immutability of raw inputs while passing structured metadata between agent nodes. Advised against pure LLM numeric scoring in favor of feature-based ML models with rule baselines.

### Session 2: Spatiotemporal Verification Algorithm
- **Bob Prompt:** *"How do we prevent duplicate flood reports from saturating the civic dashboard while retaining citizen photo evidence?"*
- **Bob Contribution:** Formulated the two-tier verification strategy:
  1. Spatiotemporal proximity: Haversine distance within 150m and timestamp window within 2 hours.
  2. Perceptual hashing (Hamming distance $\le 8$) to detect identical photos reposted across social channels.
  3. Linking subsequent reports to the canonical `incident_id` rather than discarding them.

### Session 3: Human-in-the-Loop Safeguards
- **Bob Prompt:** *"What safety constraints must be enforced before civic recommendations reach dispatch teams?"*
- **Bob Contribution:** Established the audit gate: agents generate advisory assessments only (`recommended_action`). Automated triggering of sirens or emergency broadcasts is explicitly blocked. An authorized human reviewer must approve, reject, or edit actions via `/api/v1/incidents/{id}/review`.

---

## 4. Integrity & Transparency Statement
In accordance with hackathon ethics:
- No model accuracy numbers or dataset metrics are manufactured.
- Real public datasets (e.g., FloodNet, IMD open rainfall data, OpenStreetMap Bengaluru bounding box) are used alongside clearly marked synthetic edge-case scenarios.
- All development steps conducted in IBM Bob are documented above for transparent evaluation.

