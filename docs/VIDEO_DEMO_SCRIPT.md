# NammaFlood Sentinel — Video Demonstration Script

**Competition:** IBM Bobathon — Student Category  
**Theme:** Smarter Streets, Better Living  
**Target Duration:** 4 to 5 Minutes  
**Format:** Screen Recording + Voiceover Audio + Picture-in-Picture Presenter (optional)  
**Resolution:** 1080p (1920x1080) @ 60 FPS  

---

## Pre-Recording Checklist & Setup

Before pressing record, ensure the demo environment is prepared:
1. **Launch the Demo Stack:**
   - Double-click `run_project.bat` (or run `./run_project.ps1` in PowerShell).
   - Verify backend is running on `http://localhost:8000` (API docs at `http://localhost:8000/docs`).
   - Verify frontend is running on `http://localhost:3000`.
2. **Open Browser Tabs:**
   - **Tab 1:** `http://localhost:3000` (Citizen Portal view).
   - **Tab 2:** `http://localhost:3000` (Civic Command Center / Admin Dashboard view).
   - **Tab 3:** `http://localhost:3000` (Analytics & Scenarios view).
   - **Tab 4:** GitHub Repository ([vasudev1876961/NammaFlood-Sentinel](https://github.com/vasudev1876961/NammaFlood-Sentinel.git)).
3. **Audio Setup:** Clear USB microphone, quiet room, closed background applications.

---

## Scene-by-Scene Recording Script

### Scene 1: Title & The Bengaluru Crisis [0:00 – 0:40]
* **Screen Display:** Slide 1 and Slide 2 of the presentation deck (`NammaFlood_Sentinel_IBM_Bobathon_Submission.pptx`), or the homepage banner showing Bengaluru waterlogging context.
* **On-Screen Action:** Smooth zoom on title slide, then transition to newspaper headlines / footage of waterlogged Silk Board and Ecospace Bellandur.
* **Voiceover Narration:**
  > *"Hello everyone, and welcome to our IBM Bobathon presentation. We are excited to present **NammaFlood Sentinel** — an AI platform built to tackle Bengaluru’s chronic urban waterlogging crisis.
  >
  > Every monsoon, heavy rainfall overwhelms storm drains across Bengaluru. Key junctions like Central Silk Board and the Outer Ring Road turn into rivers, stalling traffic for hours and costing our city over ₹225 Crore each year.
  >
  > While citizens post photos on social media, civic control rooms get overwhelmed with fragmented data, viral duplicate reposts, and unverified claims. We built NammaFlood Sentinel to cut through that noise. It turns scattered citizen photos and live weather data into verified, explainable civic intelligence so authorities know exactly where to send help first."*

---

### Scene 2: Architectural Innovation & The Six AI Agents [0:40 – 1:30]
* **Screen Display:** Transition to Tab 3 (Analytics View) showing the interactive **LangGraph Execution DAG**.
* **On-Screen Action:** Hover over the parallel fan-out nodes (Vision, Weather, Location) and trace the execution path through Verification, Risk Intelligence, and Response Coordinator.
* **Voiceover Narration:**
  > *"Under the hood, NammaFlood Sentinel runs on a team of six specialized AI agents, orchestrated with **LangGraph**.
  >
  > Rather than running in a slow line, our agents work together in parallel:
  >
  > 1. Our **Vision Agent** inspects uploaded smartphone photos, measuring water accumulation while ignoring dry asphalt reflections.
  > 2. Our **Weather Agent** pulls live rainfall data from Open-Meteo with automatic 15-minute caching.
  > 3. Our **Location Agent** checks coordinates against known BBMP flood hotspots and lake catchments.
  > 4. Our **Verification Agent** detects viral duplicate photos using perceptual image hashing without losing original evidence.
  > 5. Our **Risk Agent** calculates an overall severity score from 0 to 100 using a trained Random Forest classifier.
  > 6. And our **Response Agent** drafts a targeted action plan for municipal teams.
  >
  > Best of all, this entire multi-agent pipeline completes in just **24 milliseconds**!"*

---

### Scene 3: The Citizen Experience (Live Demo) [1:30 – 2:30]
* **Screen Display:** Switch to Tab 1 (`http://localhost:3000` — Citizen Portal).
* **On-Screen Action:**
  1. Click the **"ಕನ್ನಡ"** language toggle in the top bar to show instant Kannada localization, then switch back to English.
  2. Click the **"Silk Board Junction"** preset chip. Observe coordinates automatically populated ($12.9177^\circ\text{N}, 77.6238^\circ\text{E}$).
  3. Drag and drop the flood demo photo (`tests/fixtures/sample_flood.jpg`) into the dropzone. Show the image preview thumbnail.
  4. Enter a short description: *"Severe waterlogging under the Silk Board flyover, cars stranded."*
  5. Click the glowing **"Submit Report to Civic Control"** button.
  6. Point out the instant submission feedback card displaying live agent confirmation badges (`Vision: Verified`, `Weather: Live Heavy Rain`, `Location: BBMP Hotspot`).
* **Voiceover Narration:**
  > *"Now let's see how simple this is for everyday citizens.
  >
  > Built with a mobile-first design, our portal is bilingual — with a single click right here, anyone can switch between English and Kannada.
  >
  > There’s no login or paperwork needed. A commuter simply taps their junction — like Central Silk Board here — or lets their GPS locate them.
  >
  > Next, they upload a photo and add a quick note: 'Severe waterlogging under the flyover, cars stranded.'
  >
  > When they hit **Submit**, our backend triggers the parallel multi-agent swarm. Within seconds, the citizen gets a transparent receipt confirming their report has been verified and delivered straight to the city's emergency control room."*

---

### Scene 4: Civic Command Center & GIS Intelligence [2:30 – 3:30]
* **Screen Display:** Switch to Tab 2 (`http://localhost:3000` — Civic Command Center / Admin Dashboard).
* **On-Screen Action:**
  1. Highlight the **Live Emergency Dispatch Advisory** ticker at the top with its pulsating red indicator.
  2. Review the 4 KPI cards: Total Incidents (6), High Risk Criticalities (2), Human Approvals Pending (2), Pipeline Latency (23.98 ms).
  3. Interact with the **Leaflet GIS Map**:
     - Click the **"High"** filter pill to show only critical markers.
     - Toggle the **"Hotspots"** layer to display BBMP's chronic waterlogging zones and lake catchment basins.
     - Click the **"Recenter"** button to pan cleanly back to central Bengaluru.
     - Click on the pulsing red marker at Central Silk Board to view its popup.
  4. Scroll down to the **Live Incident Triage Queue** table. Highlight how reports are ranked by risk score.
* **Voiceover Narration:**
  > *"Now let’s switch over to the municipal command center — the dashboard used by BBMP officers and Bengaluru Traffic Police.
  >
  > At the top, officers see live city-wide stats: active high-risk incidents, pending approvals, and system speed.
  >
  > Below that is our live interactive map. Every incident is plotted with color-coded risk markers. Officers can filter for critical areas, or toggle our hotspot overlay to see historical waterlogging zones and lake catchment basins.
  >
  > Notice that Central Silk Board is highlighted with a critical risk score of 91. Let's click **Deep Inspect** to look into it."*

---

### Scene 5: Multi-Agent Dossier & Human-in-the-Loop Audit [3:30 – 4:15]
* **Screen Display:** In the Incident Triage Queue, click **"Inspect & Triage"** on the Silk Board report to open the **Incident Detail Modal**.
* **On-Screen Action:**
  1. Show the two-column executive console:
     - Left column: High-resolution photo evidence, detected GPS coordinates, reverse-geocoded address, and incident timestamp.
     - Right column: Multi-Agent Evidence Dossier. Point out each agent card (Vision confidence 91%, Open-Meteo 38.4 mm/hr heavy rain, Location 85m to Silk Board hotspot, Verification duplicate check passed).
  2. Scroll down to the **Explainable Factor Allocation Bar Chart** showing `+35 pts for water coverage`, `+25 pts for rainfall`, `+20 pts for hotspot proximity`.
  3. In the Human Authorization section, select the action radio button: **"Dispatch High-Capacity Diesel Suction Pump (100 HP)"** and check **"Alert BTP for Traffic Diversion"**.
  4. Click the green **"Authorize & Dispatch Civic Response"** button.
  5. Show the modal update: status changes to `action_approved`, and the immutable audit timeline logs the officer's name, action, and timestamp.
* **Voiceover Narration:**
  > *"This is our deep inspection console. On the left, the officer sees the raw photo evidence and exact GPS coordinates. On the right is the complete multi-agent dossier: image confidence, live rainfall rates, and drainage proximity.
  >
  > What makes this special is our transparent explainability breakdown. We don’t just show an arbitrary number; the officer sees exactly how the score was calculated — 35 points for visual water coverage, 25 points for heavy rain, and 20 points for hotspot proximity.
  >
  > Most importantly, we enforce a strict **Human-in-the-Loop** safety boundary. No pumps or sirens are dispatched automatically. The officer reviews the recommendations, selects: 'Dispatch 100 HP diesel suction pump', and clicks **Authorize**.
  >
  > The decision is instantly logged to an immutable audit trail for complete civic accountability."*

---

### Scene 6: ML Benchmarks, IBM Bob Journey & Closing [4:15 – 5:00]
* **Screen Display:** Switch to Tab 3 (Analytics View) and scroll to the **Model Benchmarks** and **Scenario Testing Suite**.
* **On-Screen Action:**
  1. Show the benchmark table comparing Random Forest (100% F1), XGBoost (99.46% F1), and Heuristic.
  2. Click **"Run Scenario A"** (Cloudburst at Silk Board) to show live execution and passing result.
  3. Click **"Run Scenario F"** (Duplicate Viral Image) to show dHash deduplication in action.
  4. Switch briefly to the GitHub repository and show `docs/bob_development_log.md` detailing the six IBM Bob co-development milestones.
* **Voiceover Narration:**
  > *"Finally, let’s look at our testing and analytics.
  >
  > Our trained Random Forest model achieved a perfect 1.0 Macro F1 score on test data, outperforming both XGBoost and baseline heuristics.
  >
  > Our automated test suite runs 18 comprehensive tests covering extreme cloudbursts, dark pavement shadows, offline weather APIs, and viral duplicate photos — with a 100% pass rate.
  >
  > Throughout this journey, **IBM Bob** was our central co-pilot: helping us architect the LangGraph state machine, build the image deduplication logic, train the ML models, and establish the human-in-the-loop safety gates.
  >
  > NammaFlood Sentinel turns scattered citizen photos into fast, life-saving civic action. Thank you so much for your time, and we look forward to making Bengaluru’s streets smarter and living better!"*

---

## Technical Specifications Summary for Video Overlay Cards

Add these lower-third graphical captions during editing:
- **[0:45]** `Architecture: Asynchronous LangGraph DAG | 6 Cooperating Agents`
- **[1:15]** `Pipeline Latency: 23.98 ms Average End-to-End Execution`
- **[1:45]** `Frontend: Mobile-First React + Vite + Tailwind | English & Kannada (ಕನ್ನಡ)`
- **[2:40]** `Deduplication: Haversine <= 150m + 64-bit dHash Hamming <= 8`
- **[3:45]** `Safety Gate: Mandatory Human-in-the-Loop Sign-Off (Autonomous Dispatch Disabled)`
- **[4:30]** `ML Accuracy: Random Forest Macro F1 = 1.0000 | XGBoost Macro F1 = 0.9946`

---

## Demo State Reset Procedure (Between Takes)

If you need to rehearse or re-record any scene, you can restore clean demo data in under 2 seconds:
```powershell
# Reset SQLite database to pristine demo state with seeded Silk Board & Ecospace incidents:
python scripts/seed_database.py
```
This guarantees the dashboard and triage queues are in the exact baseline state described in the script.

---

## IBM Bobathon Judging Rubric Alignment Matrix

Every scene in this script is engineered to directly prove one or more dimensions of the competition rubric:

| Rubric Dimension | Weight | Key Evidence Demonstrated in Video | Script Scene |
| :--- | :---: | :--- | :---: |
| **Completeness & Feasibility** | 25% | Fully working end-to-end full-stack platform (React + FastAPI + SQLite), 18/18 passing tests, LangGraph state machine, real image upload & triage. | Scene 2, 3, 4, 5 |
| **Creativity & Innovation** | 25% | Multimodal evidence fusion (Vision + Weather + GIS), 64-bit dHash deduplication for viral reposts, and explainable factor allocation bar charts. | Scene 2, 3, 5, 6 |
| **Design & Usability** | 25% | Mobile-first citizen reporting with English & Kannada (ಕನ್ನಡ) localization, Leaflet GIS command center with dynamic risk rings, 1-click preset chips. | Scene 3, 4, 5 |
| **Effectiveness & Efficiency** | 25% | 23.98 ms multi-agent pipeline latency, Random Forest 1.0000 Macro F1 score, zero false negatives on critical inundation, and strict HITL safety gates. | Scene 2, 5, 6 |

---

## Fast-Track 3-Minute Alternative Cue Sheet (If Time is Strict)

If the submission platform enforces a strict 3-minute hard ceiling, follow this condensed cue sheet:

- **[0:00 – 0:30] The Crisis & The Solution:** Introduce Bengaluru monsoon waterlogging (Silk Board / ORR gridlocks, ₹225 Cr annual loss) and define NammaFlood Sentinel as a LangGraph-powered multimodal multi-agent decision support platform.
- **[0:30 – 1:15] Citizen Ingestion:** Switch to Tab 1 (Citizen Portal). Show Kannada toggle, click Silk Board preset, upload `tests/fixtures/sample_flood.jpg`, click Submit, and show instant multi-agent audit receipt.
- **[1:15 – 2:05] Civic Command Center & HITL Triage:** Switch to Tab 2 (Admin Dashboard). Show Leaflet GIS map with pulsing critical markers, open Silk Board Incident modal, highlight explainable factor allocation (+35 pts water, +25 pts rain, +20 pts hotspot), select diesel pump, and click "Authorize & Dispatch Civic Response".
- **[2:05 – 2:40] Multi-Agent DAG & ML Validation:** Switch to Tab 3 (Analytics View). Show LangGraph 6-agent parallel DAG (23.98 ms latency) and Random Forest 1.0000 Macro F1 benchmark.
- **[2:40 – 3:00] IBM Bob Journey & Closing:** Highlight `docs/bob_development_log.md` detailing the 6 IBM Bob co-development milestones, state the GitHub repository link, and conclude with the vision for smarter streets and resilient living.


