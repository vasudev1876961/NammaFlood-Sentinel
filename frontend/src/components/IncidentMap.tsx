import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { IncidentSummary } from '../types';

interface IncidentMapProps {
  incidents: IncidentSummary[];
  onSelectIncident: (id: string) => void;
  selectedId?: string;
}

// Chronic hotspots for context layer
const CHRONIC_HOTSPOTS = [
  { name: "Silk Board Underpass", lat: 12.9175, lon: 77.6238, vuln: "Severe" },
  { name: "Ecospace / Bellandur ORR", lat: 12.9260, lon: 77.6834, vuln: "Critical" },
  { name: "Hebbal Flyover", lat: 13.0358, lon: 77.5970, vuln: "Severe" },
  { name: "Koramangala 4th Block", lat: 12.9345, lon: 77.6269, vuln: "High" },
  { name: "Manyata Tech Park", lat: 13.0458, lon: 77.6206, vuln: "High" },
  { name: "Tin Factory / KR Puram", lat: 13.0006, lon: 77.6698, vuln: "Severe" },
];

export const IncidentMap: React.FC<IncidentMapProps> = ({ incidents, onSelectIncident, selectedId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered at Bengaluru
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: true,
      });

      // CartoDB Dark Matter tiles for modern high-contrast UI
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Hotspots layer
      const hotspotGroup = L.layerGroup().addTo(map);
      CHRONIC_HOTSPOTS.forEach(spot => {
        const spotIcon = L.divIcon({
          className: 'custom-hotspot-pin',
          html: `<div class="px-2 py-0.5 rounded bg-amber-500/90 text-[10px] font-bold text-slate-900 border border-amber-300 shadow-md whitespace-nowrap">⚠️ ${spot.name}</div>`,
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });
        L.marker([spot.lat, spot.lon], { icon: spotIcon }).addTo(hotspotGroup);
      });

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Update Incident Markers
    if (markersLayerRef.current && mapInstanceRef.current) {
      markersLayerRef.current.clearLayers();

      incidents.forEach(inc => {
        const isSelected = inc.incident_id === selectedId;
        const color = inc.risk_level === 'high' ? '#ef4444' : inc.risk_level === 'medium' ? '#f59e0b' : '#10b981';
        const pulseClass = inc.risk_level === 'high' ? 'animate-ping' : '';

        const iconHtml = `
          <div class="relative flex items-center justify-center">
            ${inc.risk_level === 'high' ? `<span class="absolute w-6 h-6 rounded-full bg-red-500/40 ${pulseClass}"></span>` : ''}
            <div style="background-color: ${color};" class="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-black text-white ${isSelected ? 'ring-4 ring-sky-400' : ''}">
              ${inc.risk_level === 'high' ? '!' : inc.risk_score >= 40 ? 'M' : 'L'}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'incident-marker-custom',
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon });

        // Popup Content
        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 text-slate-800 text-xs font-sans';
        popupContent.innerHTML = `
          <div class="font-bold text-sm mb-1">${inc.incident_id}</div>
          <div class="text-[11px] text-slate-600 mb-1">Ward: <span class="font-medium">${inc.ward_name || 'Bengaluru Urban'}</span></div>
          <div class="flex items-center space-x-2 mb-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white" style="background-color: ${color};">${inc.risk_level} RISK (${inc.risk_score}/100)</span>
            <span class="text-slate-500 text-[10px]">${inc.status.toUpperCase()}</span>
          </div>
          <button id="btn-inspect-${inc.incident_id}" class="w-full py-1 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-medium transition">
            Inspect Full Multi-Agent Evidence &rarr;
          </button>
        `;

        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-${inc.incident_id}`);
          if (btn) {
            btn.onclick = () => onSelectIncident(inc.incident_id);
          }
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    return () => {
      // Map stays alive across renders
    };
  }, [incidents, selectedId, onSelectIncident]);

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs shadow-xl space-y-1.5">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1">Risk Severity</div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
          <span className="text-slate-300">High Risk (Score $\ge$ 70)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50"></span>
          <span className="text-slate-300">Medium Risk (Score 40–69)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
          <span className="text-slate-300">Low Risk (Score &lt; 40)</span>
        </div>
        <div className="flex items-center space-x-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
          <span>⚠️</span>
          <span>BBMP Chronic Flood Hotspots</span>
        </div>
      </div>
    </div>
  );
};

