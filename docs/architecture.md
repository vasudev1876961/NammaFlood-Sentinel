# NammaFlood Sentinel — System Architecture

## 1. System Overview
**NammaFlood Sentinel** is a multimodal, multi-agent intelligence platform designed for urban flood detection, risk assessment, and civic response coordination in Bengaluru. 

The system fuses citizen-submitted visual evidence, real-time meteorological observations, geographic and hydrological context, and historical incident records into an explainable, prioritized incident feed for civic authorities (BBMP/NDRF/Traffic Police).

```
                      +-----------------------------+
                      |   Citizen Ingestion Layer   |
                      |  (Photo + GPS + Timestamp)  |
                      +--------------+--------------+
                                     |
                                     v
                 +---------------------------------------+
                 |       LangGraph Orchestrator          |
                 +-------------------+-------------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+-------------------+       +-------------------+       +-------------------+
|   Vision Agent    |       |   Weather Agent   |       |  Location Agent   |
| (EfficientNet-B0) |       | (Open-Meteo/IMD)  |       | (Shapely/Hotspots)|
+---------+---------+       +---------+---------+       +---------+---------+
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
                                     v
                        +-------------------------+
                        |   Verification Agent    |
                        | (pHash + Spatiotemporal)|
                        +------------+------------+
                                     |
                                     v
                        +-------------------------+
                        |  Risk Intelligence ML   |
                        | (Rule + RF / XGBoost)   |
                        +------------+------------+
                                     |
                                     v
                        +-------------------------+
                        |  Response Coordinator   |
                        |  (Advisory Action Plan) |
                        +------------+------------+
                                     |
                                     v
                     +-------------------------------+
                     |  Human-in-the-Loop Audit Gate |
                     |   (Approve / Edit / Reject)   |
                     +---------------+---------------+
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
         +-----------------------+       +-----------------------+
         |  Citizen Tracker UI   |       |  Admin Intel Console  |
         +-----------------------+       +-----------------------+
```

## 2. Six Specialist AI Agents

1. **Vision Agent (`vision_agent.py`)**:
   - Validates image dimensions, formats, and structural integrity.
   - Evaluates flood visual evidence using a pretrained convolutional feature extractor (EfficientNet-B0 / MobileNet baseline).
   - Generates confidence score, quality tag, and visual observations (e.g. road submerged, vehicle wheel level water).

2. **Weather Intelligence Agent (`weather_agent.py`)**:
   - Queries Open-Meteo hourly precipitation API for coordinates with local in-memory caching (15-min TTL).
   - Normalizes 1-hour and 3-hour rainfall accumulations against IMD torrential thresholds.
   - Gracefully handles offline or network-failure states with transparent "missing_evidence" flags.

3. **Location Intelligence Agent (`location_agent.py`)**:
   - Verifies coordinates within the Greater Bengaluru Metropolitan Area bounding box [12.75N - 13.20N, 77.40E - 77.80E].
   - Computes distance to known vulnerable hotspots (e.g. Silk Board Junction, Ecospace Bellandur, Hebbal Flyover, Koramangala 4th Block, Manyata Tech Park).
   - Identifies ward names and proximity to major lakes (Varthur, Bellandur, Ulsoor, Sankey).

4. **Verification Agent (`verification_agent.py`)**:
   - Detects duplicate submissions using a dual-filter:
     - Spatiotemporal: Haversine distance $\le 150\text{ m}$ within a 2-hour window.
     - Perceptual image hashing (dHash/pHash): Hamming distance $\le 8$ between photo signatures.
   - Groups duplicates under the primary canonical incident without deleting original citizen submissions.

5. **Risk Intelligence Agent (`risk_agent.py`)**:
   - Constructs a standardized 7-feature multimodal incident vector.
   - Computes a transparent, auditable heuristic score (0–100) alongside trained Random Forest classifier predictions.
   - Categorizes risk into `Low` (0–39), `Medium` (40–69), and `High` (70–100).
   - Outlines precise contributing reasons and data completeness metrics.

6. **Response Coordinator Agent (`response_agent.py`)**:
   - Translates risk score and location vulnerability into actionable operational recommendations.
   - Enforces human-in-the-loop oversight: prevents autonomous external emergency dispatches.
   - Generates administrative review tasks with estimated field response priority.

## 3. LangGraph Orchestration Contract
The execution graph is structured as:
```python
workflow = StateGraph(IncidentState)
workflow.add_node("validate", validate_input_node)
workflow.add_node("vision", vision_agent_node)
workflow.add_node("weather", weather_agent_node)
workflow.add_node("location", location_agent_node)
workflow.add_node("verification", verification_agent_node)
workflow.add_node("risk", risk_agent_node)
workflow.add_node("response", response_agent_node)
```
Parallel branching is supported for `vision`, `weather`, and `location` nodes before converging into `verification`, ensuring rapid response times (< 250ms per incident evaluation).

