import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IncidentSummary, RiskLevel } from '../types';
import { Layers, Crosshair, Filter, ShieldAlert, Sun, Moon, Eye, AlertTriangle } from 'lucide-react';

interface IncidentMapProps {
  incidents: IncidentSummary[];
  onSelectIncident: (id: string) => void;
  selectedId?: string;
}

// Chronic hotspots for context layer
const CHRONIC_HOTSPOTS = [
  { name: "Silk Board Underpass", lat: 12.9175, lon: 77.6238, vuln: "Severe", ward: "BTM Layout" },
  { name: "Ecospace / Bellandur ORR", lat: 12.9260, lon: 77.6834, vuln: "Critical", ward: "Bellandur" },
  { name: "Hebbal Flyover Service Rd", lat: 13.0358, lon: 77.5970, vuln: "Severe", ward: "Hebbal" },
  { name: "Koramangala 4th Block", lat: 12.9345, lon: 77.6269, vuln: "High", ward: "Koramangala" },
  { name: "Manyata Tech Park", lat: 13.0458, lon: 77.6206, vuln: "High", ward: "Nagawara" },
  { name: "Tin Factory / KR Puram", lat: 13.0006, lon: 77.6698, vuln: "Severe", ward: "KR Puram" },
  { name: "Anand Rao Circle", lat: 12.9772, lon: 77.5714, vuln: "Severe", ward: "Gandhinagar" },
];

export const IncidentMap: React.FC<IncidentMapProps> = ({ incidents, onSelectIncident, selectedId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapRiskFilter, setMapRiskFilter] = useState<'all' | RiskLevel>('all');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: false,
      });

      // Add Zoom Control to Top-Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Official 100% Free OpenStreetMap tile layer (ZERO API KEY, ZERO WATERMARKS)
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: 'tactical-dark-tiles',
      }).addTo(map);

      tileLayerRef.current = tiles;
      hotspotsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Toggle Dark/Light Tile Filter
  const toggleMapTheme = () => {
    if (!tileLayerRef.current) return;
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    
    const tileContainer = tileLayerRef.current.getContainer();
    if (tileContainer) {
      if (nextDark) {
        tileContainer.classList.add('tactical-dark-tiles');
        tileContainer.classList.remove('tactical-light-tiles');
      } else {
        tileContainer.classList.remove('tactical-dark-tiles');
        tileContainer.classList.add('tactical-light-tiles');
      }
    }
  };

  // Update Hotspots Layer with non-colliding compact badges
  useEffect(() => {
    if (!hotspotsLayerRef.current) return;
    hotspotsLayerRef.current.clearLayers();

    if (showHotspots) {
      CHRONIC_HOTSPOTS.forEach(spot => {
        // Sleek compact diamond marker with tooltip on hover
        const spotIcon = L.divIcon({
          className: 'custom-hotspot-pin',
          html: `
            <div class="group relative flex items-center justify-center cursor-pointer">
              <div class="w-5 h-5 rounded-md bg-amber-950/90 border border-amber-400 text-amber-300 flex items-center justify-center text-[10px] shadow-lg shadow-amber-500/20 hover:scale-125 transition-all">
                ⚠️
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const hotspotMarker = L.marker([spot.lat, spot.lon], { icon: spotIcon });
        
        hotspotMarker.bindTooltip(
          `<strong>⚠️ ${spot.name}</strong><br/><span style="color:#f59e0b;">${spot.vuln} Vulnerability · ${spot.ward}</span>`,
          {
            direction: 'top',
            offset: [0, -10],
            className: 'hotspot-tooltip',
          }
        );

        hotspotsLayerRef.current?.addLayer(hotspotMarker);
      });
    }
  }, [showHotspots]);

  // Update Incident Markers with distinct glowing beacons
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    const filteredIncidents = mapRiskFilter === 'all'
      ? incidents
      : incidents.filter(i => i.risk_level === mapRiskFilter);

    filteredIncidents.forEach(inc => {
      const isSelected = inc.incident_id === selectedId;
      const isHigh = inc.risk_level === 'high';
      const isMedium = inc.risk_level === 'medium';
      
      const pinColor = isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';
      const labelSymbol = isHigh ? '!' : isMedium ? 'M' : 'L';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isHigh ? `<span class="absolute w-8 h-8 rounded-full bg-red-500/50 animate-ping"></span>` : ''}
          <div style="background-color: ${pinColor};" class="w-6 h-6 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-[11px] font-black text-white transition-all duration-200 ${isSelected ? 'ring-4 ring-sky-400 scale-125' : 'group-hover:scale-115'}">
            ${labelSymbol}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'incident-marker-custom',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon });

      // Clean tooltip on hover
      marker.bindTooltip(
        `<strong>${inc.ward_name || inc.incident_id}</strong><br/>Risk Score: <strong>${inc.risk_score}/100</strong> (${inc.risk_level.toUpperCase()})`,
        {
          direction: 'top',
          offset: [0, -14],
          className: 'hotspot-tooltip'
        }
      );

      // Popup Content with Glassmorphic Card Styling
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1.5 text-slate-100 text-xs font-sans min-w-[210px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
          <span class="font-mono font-bold text-xs text-white">${inc.incident_id}</span>
          <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white shadow-sm" style="background-color: ${pinColor};">
            ${inc.risk_level} (${inc.risk_score})
          </span>
        </div>
        <div class="text-[11px] text-slate-300 mb-1">
          Ward: <span class="font-bold text-white">${inc.ward_name || 'Bengaluru Urban'}</span>
        </div>
        <div class="text-[11px] text-slate-400 mb-2">
          Status: <span class="font-semibold text-white uppercase text-[10px]">${inc.status}</span> &bull; 
          <span class="text-slate-400 font-medium">${inc.reports_count} report(s)</span>
        </div>
        <button id="btn-inspect-${inc.incident_id}" class="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold shadow-md transition flex items-center justify-center space-x-1">
          <span>Open Multi-Agent Dossier</span>
          <span>&rarr;</span>
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
  }, [incidents, mapRiskFilter, selectedId, onSelectIncident]);

  const handleCenterBengaluru = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([12.9716, 77.5946], 12);
    }
  };

  return (
    <div className="relative w-full h-[560px] rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950" style={{ isolation: 'isolate' }}>
      
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Floating Map Control Toolbar */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-1.5 bg-slate-950/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        
        {/* Risk Filter Buttons */}
        <button
          onClick={() => setMapRiskFilter('all')}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
            mapRiskFilter === 'all' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({incidents.length})
        </button>
        <button
          onClick={() => setMapRiskFilter('high')}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center space-x-1 ${
            mapRiskFilter === 'high' ? 'bg-red-500 text-white shadow-sm' : 'text-red-400 hover:text-red-300'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          <span>High ({incidents.filter(i => i.risk_level === 'high').length})</span>
        </button>
        <button
          onClick={() => setMapRiskFilter('medium')}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center space-x-1 ${
            mapRiskFilter === 'medium' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Medium ({incidents.filter(i => i.risk_level === 'medium').length})</span>
        </button>
        <button
          onClick={() => setMapRiskFilter('low')}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center space-x-1 ${
            mapRiskFilter === 'low' ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Low ({incidents.filter(i => i.risk_level === 'low').length})</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>

        {/* Hotspot Toggle */}
        <button
          onClick={() => setShowHotspots(!showHotspots)}
          className={`px-2 py-1 rounded-xl text-[10px] font-bold transition flex items-center space-x-1 ${
            showHotspots ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-400'
          }`}
          title="Toggle Chronic Hotspots"
        >
          <span>⚠️ Hotspots</span>
        </button>

        {/* Theme Switcher: Dark Tactical vs Daylight Street */}
        <button
          onClick={toggleMapTheme}
          className="p-1 px-2 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 transition flex items-center space-x-1 border border-slate-800"
          title="Toggle Map Style (Dark Tactical / Street View)"
        >
          {isDarkMode ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-sky-400" />}
          <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>

        {/* Recenter Button */}
        <button
          onClick={handleCenterBengaluru}
          className="p-1 px-2 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 transition flex items-center space-x-1 border border-slate-800"
          title="Recenter Map to Bengaluru"
        >
          <Crosshair className="w-3 h-3 text-sky-400" />
          <span className="hidden sm:inline">Center</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-30 bg-slate-950/95 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-xs shadow-2xl space-y-1.5 max-w-[210px]">
        <div className="font-extrabold text-slate-200 text-[10px] uppercase tracking-wider mb-1 flex items-center space-x-1">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>Risk Severity Legend</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
          <span className="text-slate-300 text-[11px]">High Risk (&ge; 70 pts)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
          <span className="text-slate-300 text-[11px]">Medium Risk (40–69 pts)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
          <span className="text-slate-300 text-[11px]">Low Risk (&lt; 40 pts)</span>
        </div>
        <div className="flex items-center space-x-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-400 font-medium">
          <span>⚠️</span>
          <span>BBMP Chronic Flood Points</span>
        </div>
      </div>
    </div>
  );
};
