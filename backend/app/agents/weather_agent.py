import time
from datetime import datetime, timezone
import requests
from typing import Optional

class WeatherAgent:
    """Specialist AI Agent for Meteorological Rainfall Context and IMD Classification."""
    agent_name = "weather"
    
    def __init__(self, cache_ttl_seconds: int = 900):
        self.cache: dict[str, tuple[float, dict]] = {}
        self.cache_ttl = cache_ttl_seconds

    def _get_imd_category(self, rain_1h: float) -> str:
        """Categorizes rainfall intensity according to India Meteorological Department thresholds."""
        if rain_1h is None or rain_1h <= 0.0:
            return "none"
        elif rain_1h < 2.5:
            return "light"
        elif rain_1h <= 15.5:
            return "moderate"
        elif rain_1h <= 64.4:
            return "heavy"
        else:
            return "very_heavy_torrential"

    def fetch_open_meteo(self, lat: float, lon: float) -> Optional[dict]:
        """Queries Open-Meteo API for real-time hourly precipitation."""
        cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
        now_ts = time.time()
        
        # Check cache
        if cache_key in self.cache:
            saved_time, cached_data = self.cache[cache_key]
            if now_ts - saved_time < self.cache_ttl:
                return cached_data

        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": "precipitation",
                "current": "precipitation",
                "timezone": "auto",
                "forecast_days": 1
            }
            resp = requests.get(url, params=params, timeout=4.0)
            if resp.status_code == 200:
                data = resp.json()
                current_p = data.get("current", {}).get("precipitation", 0.0)
                hourly = data.get("hourly", {}).get("precipitation", [])
                
                # Approximate 1h and 3h values
                rain_1h = float(current_p) if current_p is not None else (float(hourly[0]) if hourly else 0.0)
                rain_3h = float(sum(hourly[:3])) if len(hourly) >= 3 else (rain_1h * 2.2)
                
                result = {
                    "rain_1h": round(rain_1h, 1),
                    "rain_3h": round(rain_3h, 1),
                    "source": "Open-Meteo Live API",
                    "observation_time": datetime.now(timezone.utc).isoformat()
                }
                self.cache[cache_key] = (now_ts, result)
                return result
        except Exception:
            pass
        return None

    def run(self, lat: float, lon: float, submitted_1h: Optional[float] = None, submitted_3h: Optional[float] = None) -> dict[str, any]:
        t0 = time.perf_counter()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Priority 1: Use citizen sensor or submitted values if explicitly provided
        if submitted_1h is not None or submitted_3h is not None:
            r1 = float(submitted_1h) if submitted_1h is not None else 0.0
            r3 = float(submitted_3h) if submitted_3h is not None else (r1 * 2.0)
            category = self._get_imd_category(r1)
            return {
                "agent": self.agent_name,
                "status": "completed",
                "rainfall_1h_mm": round(r1, 1),
                "rainfall_3h_mm": round(r3, 1),
                "source": "citizen_sensor_or_scenario",
                "observation_time": now_iso,
                "data_quality": "verified_submitted",
                "intensity_category": category,
                "missing_evidence": False,
                "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
            }

        # Priority 2: Query Live Open-Meteo Weather API
        live = self.fetch_open_meteo(lat, lon)
        if live:
            r1 = live["rain_1h"]
            r3 = live["rain_3h"]
            category = self._get_imd_category(r1)
            return {
                "agent": self.agent_name,
                "status": "completed",
                "rainfall_1h_mm": r1,
                "rainfall_3h_mm": r3,
                "source": live["source"],
                "observation_time": live["observation_time"],
                "data_quality": "live_grid_forecast",
                "intensity_category": category,
                "missing_evidence": False,
                "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
            }

        # Priority 3: Fallback state when external weather API is unreachable
        return {
            "agent": self.agent_name,
            "status": "degraded_fallback",
            "rainfall_1h_mm": None,
            "rainfall_3h_mm": None,
            "source": "weather_api_unavailable",
            "observation_time": now_iso,
            "data_quality": "missing",
            "intensity_category": "unknown",
            "missing_evidence": True,
            "note": "Precipitation context could not be retrieved from provider; pipeline continues with missing evidence flag.",
            "duration_ms": round((time.perf_counter() - t0) * 1000, 2)
        }

