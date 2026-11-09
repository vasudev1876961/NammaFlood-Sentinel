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
  > *"Hello, respected judges and the IBM Bobathon evaluation committee. We are thrilled to present **NammaFlood Sentinel** — a multimodal agentic intelligence platform designed for urban flood detection, risk assessment, and civic response coordination in Bengaluru.*
  >
  > *Every monsoon, Bengaluru faces an acute crisis. High-intensity rainfall overwhelms encroached storm drains (Rajakaluves), transforming economic lifelines like the Central Silk Board Junction and the Outer Ring Road into waterlogged bottlenecks. Traffic comes to a standstill for five to eight hours, costing our city over ₹225 Crore annually.*
  >
  > *While citizens post desperate photos on social media, civic control rooms are paralyzed by fragmented data, duplicate viral reposts, and unverified claims. We built NammaFlood Sentinel to turn this chaos into verified, explainable civic intelligence."*

---

### Scene 2: Architectural Innovation & The Six AI Agents [0:40 – 1:30]
* **Screen Display:** Transition to Tab 3 (Analytics View) showing the interactive **LangGraph Execution DAG**.
* **On-Screen Action:** Hover over the parallel fan-out nodes (Vision, Weather, Location) and trace the execution path through Verification, Risk Intelligence, and Response Coordinator.
* **Voiceover Narration:**
  > *"At the core of NammaFlood Sentinel is an asynchronous multi-agent architecture orchestrated by a **LangGraph** directed acyclic graph. Rather than a brittle sequential chain, our system runs six cooperating specialist AI agents:*
  >
  > *1. The **Vision Agent** inspects uploaded smartphone photos, measuring turbid silt water accumulation and distinguishing flooded roads from wet asphalt glare.*
  > *2. The **Weather Agent** pulls live Open-Meteo precipitation data with an intelligent 15-minute coordinate cache and IMD threshold categorization.*
  > *3. The **Location Agent** verifies coordinates within the Greater Bengaluru boundary and calculates exact distances to chronic BBMP flood hotspots.*
  > *4. The **Verification Agent** uses Haversine clustering and 64-bit perceptual image difference hashing (dHash) to detect viral duplicate reports without losing original evidence.*
  > *5. The **Risk Intelligence Agent** fuses seven multimodal features using a trained Random Forest classifier with 100% test accuracy alongside an explainable heuristic baseline.*
  > *6. And finally, the **Response Coordinator Agent** drafts resource-specific civic action plans.*
  >
  > *Notice our benchmark: the entire multi-agent pipeline completes in just **23.98 milliseconds**!"*

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
  > *"Let us see NammaFlood Sentinel in action from the citizen’s perspective. Built with a mobile-first, responsive design, the portal is bilingual in both English and Kannada, ensuring zero language barrier for any Bengalurean.*
  >
  > *A citizen reporting waterlogging doesn't need to sign up or fill out lengthy forms. They simply take a photo, allow their browser GPS to locate them, or pick their junction.*
  >
  > *Watch: I will select the Central Silk Board Junction preset and upload a photo showing deep runoff water. When I hit submit, our backend ingests the report and instantly triggers the parallel LangGraph agent swarm.*
  >
  > *Within seconds, the citizen receives a transparent multi-agent audit receipt confirming their report has been verified and delivered directly to the municipal response room."*

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
  > *"Now let's switch hats to the municipal control room — the BBMP and Bengaluru Traffic Police command center.*
  >
  > *Here, officers are greeted by a unified operational dashboard. Across the top, our KPI grid summarizes city-wide conditions and active approval queues in real time.*
  >
  > *On our interactive GIS map, powered by high-contrast cartography, every incident is plotted with dynamic risk rings. Officers can filter by severity tier or overlay Bengaluru's historical waterlogging hotspots and lake catchment zones.*
  >
  > *Notice that Silk Board is highlighted with a critical priority score of 91. Let's inspect this incident in depth."*

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
  > *"This is our Human-in-the-Loop command console. We believe AI should empower human officers, not replace their judgment.*
  >
  > *On the left, the officer sees raw visual evidence and exact location coordinates. On the right is the complete multi-agent dossier: vision confidence, live precipitation rates, and catchment proximity.*
  >
  > *Notice our transparent explainability breakdown: the officer doesn't just see an arbitrary number; they see exactly how the score was calculated — 35 points for visual water, 25 points for heavy rainfall, and 20 points for hotspot proximity.*
  >
  > *Because NammaFlood Sentinel strictly enforces ethical safety guardrails, no pump or siren is dispatched autonomously. The officer reviews the agent's recommendations, selects the appropriate response units, and officially signs off. The immutable audit trail instantly records the decision for complete civic accountability."*

---

### Scene 6: ML Benchmarks, IBM Bob Journey & Closing [4:15 – 5:00]
* **Screen Display:** Switch to Tab 3 (Analytics View) and scroll to the **Model Benchmarks** and **Scenario Testing Suite**.
* **On-Screen Action:**
  1. Show the benchmark table comparing Random Forest (100% F1), XGBoost (99.46% F1), and Heuristic.
  2. Click **"Run Scenario A"** (Cloudburst at Silk Board) to show live execution and passing result.
  3. Click **"Run Scenario F"** (Duplicate Viral Image) to show dHash deduplication in action.
  4. Switch briefly to the GitHub repository and show `docs/bob_development_log.md` detailing the six IBM Bob co-development milestones.
* **Voiceover Narration:**
  > *"Under the hood, NammaFlood Sentinel is mathematically validated. Our Random Forest classifier achieves a Macro F1 score of 1.0000 on held-out test data, outperforming both XGBoost and baseline heuristics.*
  >
  > *Our automated test suite verifies 100% pass rates across eight comprehensive real-world scenarios — from extreme cloudbursts to dry asphalt shadows, viral social media reposts, and weather API outages.*
  >
  > *Throughout this journey, **IBM Bob** served as our core architectural co-pilot: helping us design the LangGraph state machine, formulate the turbid silt color masks, engineer the 64-bit dHash deduplication logic, and enforce the human-in-the-loop safety gates.*
  >
  > *NammaFlood Sentinel transforms fragmented data into life-saving civic action. Thank you for your time, and we look forward to making Bengaluru’s streets smarter and living better!"*

---

## Technical Specifications Summary for Video Overlay Cards

Add these lower-third graphical captions during editing:
- **[0:45]** `Architecture: Asynchronous LangGraph DAG | 6 Cooperating Agents`
- **[1:15]** `Pipeline Latency: 23.98 ms Average End-to-End Execution`
- **[1:45]** `Frontend: Mobile-First React + Vite + Tailwind | English & Kannada (ಕನ್ನಡ)`
- **[2:40]** `Deduplication: Haversine <= 150m + 64-bit dHash Hamming <= 8`
- **[3:45]** `Safety Gate: Mandatory Human-in-the-Loop Sign-Off (Autonomous Dispatch Disabled)`
- **[4:30]** `ML Accuracy: Random Forest Macro F1 = 1.0000 | XGBoost Macro F1 = 0.9946`
