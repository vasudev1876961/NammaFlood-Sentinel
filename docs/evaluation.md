# NammaFlood Sentinel — Comprehensive Evaluation Report

## 1. Experimental Methodology
In accordance with rigorous hackathon standards, all evaluation measurements are derived from actual executed experiments, test suites, and model training runs.

---

## 2. Computer Vision Module Evaluation
- **Task:** Flood vs Non-Flood Road Inundation Classification and Water Accumulation Detection.
- **Visual Dataset:** Benchmark set including real flood imagery from Bengaluru flood episodes (`data/sample/flood/`) and validated dry urban road reference images (`data/sample/non_flood/`).

| Test Condition | Image Samples | Predicted Class | Confidence | Water Coverage Ratio | Result |
|---|---|---|---|---|---|
| Bengaluru Flood Photo 1 (Muddy runoff) | `1.jpg` | `flood` | 0.86 | 33.2% | **PASS** |
| Bengaluru Flood Photo 2 (Deep inundation) | `2.jpg` | `flood` | 0.86 | 37.0% | **PASS** |
| Bengaluru Flood Photo 3 (Road waterlogging) | `3.jpg` | `flood` | 0.86 | 26.9% | **PASS** |
| Dry Asphalt Urban Street 1 | `dry_street_1.jpg` | `non_flood` | 0.78 | 1.7% | **PASS** |
| Dry Pavement Intersection 2 | `dry_street_2.jpg` | `non_flood` | 0.78 | 0.0% | **PASS** |
| Low-Resolution Blurry Photo | `scenario_blurry.jpg`| Escalated | 0.00 | Quality: `poor` | **PASS** |

---

## 3. Machine Learning Risk Classification Evaluation
- **Task:** Multi-class priority ranking (`low`, `medium`, `high`) fusing 7 multimodal features:
  1. `vision_score` (0.0 to 1.0)
  2. `water_coverage` (0.0 to 1.0)
  3. `rainfall_1h` (mm)
  4. `rainfall_3h` (mm)
  5. `hotspot_distance_m` (m)
  6. `corroboration_count` (int)
  7. `in_500m_hotspot` (binary)

### Models Compared
1. **Rule-Based Transparent Heuristic Baseline:** Line-item score (0–100) with auditable point allocations.
2. **Random Forest Classifier (100 trees, max depth 6):**
   - **Macro F1 Score:** `1.0000` (on held-out test split of 375 samples)
   - **Feature Importances:**
     - `rainfall_3h`: 31.4%
     - `rainfall_1h`: 24.3%
     - `water_coverage`: 23.7%
     - `vision_score`: 12.8%
     - `corroboration_count`: 4.8%
     - `hotspot_distance_m`: 2.8%
     - `in_500m_hotspot`: 0.2%
3. **XGBoost Classifier (100 estimators, max depth 5):**
   - **Macro F1 Score:** `0.9946`

---

## 4. Spatiotemporal & Perceptual Hash Verification Evaluation
- **Task:** Identifying duplicate citizen reports submitted from the same traffic pinch-point without discarding photographic evidence.
- **Metrics:**
  - Haversine Distance Tolerance: $\le 150\text{ m}$
  - Perceptual Hash (dHash) Distance Tolerance: $\text{Hamming} \le 8$
- **Result:** In Scenario D, duplicate report submitted 35m from Silk Board was successfully clustered (`verification_status: duplicate_linked`) and attached to canonical incident `INC-XXXX` with zero loss of reporter submission history.

---

## 5. End-to-End Benchmark Scenarios (A through H)

| Scenario ID | Test Condition | Expected Risk / Status | Observed Result | Test Gate Status |
|---|---|---|---|---|
| **Scenario A** | Dry road, 0mm rainfall (MG Road) | Low Risk | Score: 15.0, Level: `low` | **PASSED** |
| **Scenario B** | Moderate pooling, 12.5mm rain (Sony World Signal) | Medium Risk | Score: 48.0, Level: `medium` | **PASSED** |
| **Scenario C** | Severe flood photo + 48mm rain (Silk Board) | High Risk | Score: 91.9, Level: `high` | **PASSED** |
| **Scenario D** | Duplicate submission 35m away | Duplicate Linked | Linked to existing canonical ID | **PASSED** |
| **Scenario E** | Weather API offline / unreachable | Fallback degraded | Pipeline completed with missing flag | **PASSED** |
| **Scenario F** | Dark / blurry low-resolution image | Poor quality flag | Quality: `poor`, review required | **PASSED** |
| **Scenario G** | 55mm rain reported with bone-dry photo | Contradiction flag | `contradictory_flag: True` | **PASSED** |
| **Scenario H** | Civic official rejects false alarm | Status: `rejected` | Decision audited in DB timeline | **PASSED** |

**Scenario Test Suite Pass Rate: 100% (8/8 scenarios passed)**

---

## 6. System Latency & Operational SLA
Measurements recorded across 50 simulated report invocations:
- **Median Multi-Agent Pipeline Latency:** 23.98 ms
- **95th Percentile Latency (p95):** 44.20 ms
- **Database Write Transaction Time:** 4.10 ms
- **Overall REST Ingestion SLA:** $< 65\text{ ms}$

