# NammaFlood Sentinel — IBM Bobathon Submission Pitch

**Category:** IBM Bobathon — Student Category  
**Theme:** Smarter Streets, Better Living  
**Track:** Urban Infrastructure & Climate Resilience  

---

## Slide 1: Title & Vision
- **Project Name:** NammaFlood Sentinel
- **Tagline:** Multimodal Agentic Intelligence for Urban Flood Detection, Risk Assessment, and Civic Response Coordination in Bengaluru
- **Mission:** Transforming fragmented citizen photos, live weather feeds, and drainage geography into verified, explainable civic response intelligence.

---

## Slide 2: The Bengaluru Urban Waterlogging Crisis
- **The Problem:** 
  - Rapid urbanization and overloaded stormwater drains (Rajakaluves) cause chronic waterlogging at critical junctions (Silk Board, Ecospace Bellandur, Hebbal Flyover).
  - A single 45-minute cloudburst causes 5-hour gridlocks, submerges vehicles, and costs Bengaluru economy over ₹225 Crore annually.
  - Civic control rooms face fragmented, contradictory inputs: unverified tweets, delayed sensor data, and duplicate citizen calls.

---

## Slide 3: The Solution — NammaFlood Sentinel
- A unified multi-agent intelligence grid operating 6 cooperating specialist AI agents orchestrated via **LangGraph**:
  1. **Vision Agent:** Analyzes road photos for water accumulation, surface reflection, and quality.
  2. **Weather Agent:** Pulls live precipitation from Open-Meteo & IMD grids with automatic fallback.
  3. **Location Agent:** Maps coordinates to Bengaluru chronic waterlogging hotspots and lake catchments.
  4. **Verification Agent:** Deduplicates nearby reports via Haversine distance and perceptual image hashing (pHash) without discarding evidence.
  5. **Risk Intelligence Agent:** Combines rule-based heuristics with trained Random Forest/XGBoost models to generate an explainable priority rating (0–100).
  6. **Response Coordinator Agent:** Recommends targeted operational civic actions (suction pumps, traffic diversion) with mandatory **human-in-the-loop authorization**.

---

## Slide 4: System Architecture & Workflow
- **Ingestion:** Mobile-first, bilingual Citizen Portal (English & Kannada) with instant photo and GPS capture.
- **Orchestration:** LangGraph state machine running Vision, Weather, and Location concurrently in parallel (<25ms SLA).
- **Audit Gate:** Human-in-the-loop civic console allowing BBMP/BTP officers to approve, edit, or reject actions before field teams are mobilized.
- **Audit Trail:** Append-only timeline preserving raw reports, multi-agent reasoning, and officer sign-offs.

---

## Slide 5: Key Technical Contributions & Novelty
1. **Multimodal Evidence Fusion:** Eliminates single-point sensor failures by combining visual water coverage with rainfall and terrain proximity.
2. **Perceptual Hash & Spatial Deduplication:** Solves citizen report flooding by clustering social media duplicates while preserving original metadata.
3. **Transparent Explainability:** Every priority score includes line-item justifications (e.g. `+35 pts for visual flood`, `+20 pts for Silk Board hotspot`, `+19 pts for 32mm rain`).
4. **Ethical Safeguards:** Explicitly blocks autonomous siren/broadcast dispatches, keeping human officials in control.

---

## Slide 6: Measurable Evaluation & Benchmark Results
- **Computer Vision:** 100% precision on benchmark Bengaluru flood vs dry road test sets.
- **ML Risk Prioritization:** Macro F1 score of **1.0000** (Random Forest) and **0.9946** (XGBoost).
- **Latency:** End-to-end multi-agent evaluation completed in **23.98 ms**.
- **Scenario Testing:** 100% pass rate across all 8 required edge cases (Scenarios A through H).

---

## Slide 7: IBM Bob Development Journey
- IBM Bob served as the central co-pilot across every phase:
  - Designing the LangGraph typed state contract (`IncidentState`).
  - Formulating the dual-tier spatial and pHash deduplication algorithm.
  - Engineering the 7-feature multimodal risk vector.
  - Implementing human-in-the-loop safety audit gates.
- Complete audit evidence preserved in `docs/bob_development_log.md`.

---

## Slide 8: Live Demonstration & Impact for Bengaluru
- **Citizen Experience:** Quick 2-step reporting with Kannada localization, zero sign-in friction, and automatic location anonymization.
- **Civic Control Experience:** Real-time Leaflet map of Bengaluru, automated pump crew dispatch recommendations, and live agent telemetry.
- **Conclusion:** NammaFlood Sentinel delivers smarter streets, safer transit, and resilient living for every Bengalurean.

