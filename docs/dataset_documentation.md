# Dataset Documentation & Provenance

## 1. Overview
NammaFlood Sentinel relies on a combination of verified public open datasets and real Bengaluru civic geography. Where actual flood images or sensor inputs are unavailable, synthetic benchmarks are generated and explicitly labelled.

| Dataset Name | Source / Organization | License / Terms | Modality | Primary Use in NammaFlood |
|---|---|---|---|---|
| **FloodNet** | Bina Lab (Univ. of Maryland / CVPR Workshop) | CC BY-NC-SA 4.0 | UAV / High-resolution RGB images | Flood / water coverage visual validation |
| **Flood10K** | Computer Vision Research Community | Research / Open Access | Multi-angle ground photos | Flood vs non-flood binary classification |
| **OpenCity Bengaluru** | OpenCity.in / Civic Data Repository | Open Data Commons (ODC-BY) | Tabular / CSV | BBMP vulnerable waterlogging points & stormwater drains |
| **Open-Meteo Weather API** | Open-Meteo GmbH | Non-commercial / CC BY 4.0 | REST API / Numerical Weather | Real-time & forecast precipitation measurements |
| **India Meteorological Department (IMD)** | Ministry of Earth Sciences, Govt of India | Public Meteorological Data | Daily / Hourly Bulletins | Rainfall intensity threshold definitions |
| **OpenStreetMap (OSM) Bengaluru** | OpenStreetMap Contributors / Geofabrik | ODbL (Open Database License) | Vector GIS (PBF / GeoJSON) | Bengaluru road networks, lake boundaries, and ward bounds |

---

## 2. Bengaluru Vulnerable Hotspot Registry
From BBMP and Bengaluru Traffic Police (BTP) monsoon advisories, the top chronic waterlogging hotspots hard-coded with geospatial coordinates in EPSG:4326 include:

1. **Central Silk Board Underpass & Junction**: `(12.9175, 77.6238)` — Critical pinch-point connecting Hosur Road, BTM, and Outer Ring Road (ORR).
2. **Ecospace / Bellandur Outer Ring Road**: `(12.9260, 77.6834)` — Major IT corridor prone to runoff from Bellandur Lake overflow.
3. **Hebbal Flyover Service Roads**: `(13.0358, 77.5970)` — Airport corridor junction bottlenecked by Hebbal Lake catchment runoff.
4. **Koramangala 4th Block (KHB Colony)**: `(12.9345, 77.6269)` — Low-lying residential zone adjacent to the primary stormwater drain (Rajakaluve).
5. **Manyata Tech Park / Nagawara**: `(13.0458, 77.6206)` — Nagawara Lake catchment overflow during intense 1-hour downpours.
6. **Sony World Signal / 80 Feet Road Koramangala**: `(12.9363, 77.6322)` — Heavy stormwater buildup area.
7. **Tin Factory / KR Puram Hanging Bridge**: `(13.0006, 77.6698)` — Key east Bengaluru transit corridor.
8. **Bannerghatta Road (Bilekahalli Junction)**: `(12.8988, 77.5997)` — Inundation prone during >25mm/hr rain.
9. **Majestic / Anand Rao Circle Underpass**: `(12.9772, 77.5714)` — Central transit node underpass.
10. **HSR Layout Sector 6 & 7**: `(12.9121, 77.6446)` — Submerged road intersections during continuous monsoon rainfall.

---

## 3. Rainfall Threshold Classifications (IMD Guidelines)
- **Trace / Light Rain**: $< 2.5\text{ mm/hr}$
- **Moderate Rain**: $2.5\text{ mm/hr} - 15.5\text{ mm/hr}$
- **Heavy Rain**: $15.6\text{ mm/hr} - 64.4\text{ mm/hr}$ (Triggers urban waterlogging at sensitive culverts)
- **Very Heavy / Torrential Rain**: $> 64.5\text{ mm/hr}$ (High civic emergency alert)

---

## 4. Synthetic Scenarios for Demonstration & Edge Cases
To guarantee reproducible evaluation of all failure modes without relying on live storms during a live demo, the platform includes Scenarios A through H with clear `SYNTH_` prefixes. No synthetic data is presented as real historical events.

