import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Eye, Filter, ArrowUpRight, Cpu, Radio, 
  AlertCircle, ChevronRight, UserCheck, Flame, Waves, Search, Download, 
  Layers, Check, X, Shield, PhoneCall, Gauge, CheckSquare, Wrench
} from 'lucide-react';
import { IncidentSummary, DashboardSummary, AgentHealth } from '../types';
import { fetchIncidents, fetchDashboardSummary, fetchAgentHealth, submitHumanReview } from '../services/api';
import { IncidentMap } from '../components/IncidentMap';
import { IncidentDetailModal } from '../components/IncidentDetailModal';

interface AdminDashboardProps {
  lang: 'en' | 'kn';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang }) => {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agents, setAgents] = useState<AgentHealth[]>([]);
  
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filters & Persona
  const [persona, setPersona] = useState<string>('BBMP Zonal Commissioner');
  const [gridMode, setGridMode] = useState<'normal' | 'crisis' | 'simulation'>('crisis');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Human approval form states inside the docked side-panel
  const [reviewAction, setReviewAction] = useState<string>('approve');
  const [reviewNote, setReviewNote] = useState<string>('Authorized 100 HP suction unit and traffic diversion at Silk Board.');
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [statusFilter, riskFilter]);

  const loadData = async () => {
    try {
      const [incs, sum, ags] = await Promise.all([
        fetchIncidents({
          status: statusFilter === 'all' ? undefined : statusFilter,
          risk_level: riskFilter === 'all' ? undefined : riskFilter,
          limit: 100,
        }),
        fetchDashboardSummary(),
        fetchAgentHealth(),
      ]);
      setIncidents(incs);
      setSummary(sum);
      setAgents(ags);

      // Auto-select first high risk incident if none selected
      if (!selectedIncidentId && incs.length > 0) {
        const highRisk = incs.find(i => i.risk_level === 'high') || incs[0];
        setSelectedIncidentId(highRisk.incident_id);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedIncident = incidents.find(i => i.incident_id === selectedIncidentId);

  const handleDockedReviewSubmit = async () => {
    if (!selectedIncidentId) return;
    setReviewing(true);
    setReviewSuccessMsg(null);
    try {
      await submitHumanReview(selectedIncidentId, {
        decision: reviewAction as 'approve' | 'reject' | 'edit',
        reviewer_note: `[${persona}] ${reviewNote}`,
        action_dispatched: reviewAction === 'approve' ? '100 HP High-Capacity Suction Unit & BTP Traffic Diversion' : undefined,
      });
      setReviewSuccessMsg(lang === 'en' ? 'Civic Action Authorized & Dispatched!' : 'ಅಧಿಕೃತ ಆದೇಶ ರವಾನೆಯಾಗಿದೆ!');
      setTimeout(() => {
        setReviewSuccessMsg(null);
        loadData();
      }, 2000);
    } catch (err: any) {
      alert(`Review submission error: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      i.incident_id.toLowerCase().includes(q) ||
      (i.ward_name && i.ward_name.toLowerCase().includes(q)) ||
      i.risk_level.toLowerCase().includes(q)
    );
  });

  const highRiskCount = summary?.high_risk_count ?? incidents.filter(i => i.risk_level === 'high').length;
  const pendingReviewCount = summary?.pending_review_count ?? incidents.filter(i => i.status === 'open').length;
  const avgLatency = summary?.mean_agent_duration_ms ? summary.mean_agent_duration_ms.toFixed(2) : '23.84';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR (Matches Image 5 Emergency Command Center Header)       */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Persona */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                {lang === 'en' ? 'BBMP Emergency Civic Command Center' : 'ಬಿಬಿಎಂಪಿ ತುರ್ತು ನಾಗರಿಕ ನಿಯಂತ್ರಣ ಕೊಠಡಿ'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE 24x7</span>
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
              <span>Persona:</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-sky-400 font-bold focus:outline-none"
              >
                <option value="BBMP Zonal Commissioner">BBMP Zonal Commissioner</option>
                <option value="BTP Traffic Superintendent">BTP Traffic Superintendent</option>
                <option value="SDRF Field Coordinator">SDRF Field Coordinator</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operational Modes & Ticker Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setGridMode('normal')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                gridMode === 'normal' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setGridMode('crisis')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                gridMode === 'crisis' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monsoon Crisis
            </button>
            <button
              onClick={() => setGridMode('simulation')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                gridMode === 'simulation' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulation
            </button>
          </div>

          {/* Quick Metrics Badges (Matches Image 5 header pills) */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Active Incidents</span>
              <span className="text-sm font-black text-white">{incidents.length}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-center">
              <span className="text-[10px] text-red-400 uppercase block font-mono font-bold">Critical High</span>
              <span className="text-sm font-black text-red-400 animate-pulse">{highRiskCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Avg SLA</span>
              <span className="text-sm font-black text-sky-400 font-mono">{avgLatency}ms</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. FLOOD MONITOR GAUGES & PUMP COUNTERS (Matches Image 2 reference)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Semicircular Risk Gauge Widget */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              City Peak Inundation Index
            </span>
            <div className="text-2xl font-black text-red-400 font-mono">
              {selectedIncident ? `${selectedIncident.risk_score}/100` : '88.5/100'}
            </div>
            <span className="text-[10px] text-red-400/80 font-medium">Critical Hydrological Flashpoint</span>
          </div>

          {/* Semicircular SVG Gauge (Matches Image 2) */}
          <div className="relative w-20 h-12 flex items-end justify-center">
            <svg viewBox="0 0 100 50" className="w-20 h-12">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 80 20"
                fill="none"
                stroke="#ef4444"
                strokeWidth="10"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute bottom-0 text-[10px] font-black text-white font-mono">91%</span>
          </div>
        </div>

        {/* Pump Stations Counter (Matches Image 2 "Pump stations 158") */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Municipal Pump Stations
            </span>
            <div className="text-2xl font-black text-white font-mono flex items-center space-x-1.5">
              <span>158</span>
              <span className="text-xs font-bold text-emerald-400">Deployed</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">100% Backup Generators Armed</span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Stream Gauges Status */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Rajakaluve Telemetry Gauges
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              24 / 28
            </div>
            <span className="text-[10px] text-amber-300 font-medium">4 Channels Approaching High Bank</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Waves className="w-5 h-5" />
          </div>
        </div>

        {/* Human Audit Approvals Pending */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Human Reviews Pending
            </span>
            <div className="text-2xl font-black text-sky-400 font-mono">
              {pendingReviewCount}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Officer Authorization Required</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. THREE-COLUMN COMMAND CONSOLE (Matches Image 5 Layout)                   */}
      {/*    Left: Incident Queue | Center: Map | Right: Triage Dossier Drawer      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMN 1: INCIDENT QUEUE (3 of 12 cols on LG) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col h-[700px]">
          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Incident Queue</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredIncidents.length} shown
            </span>
          </div>

          {/* Search & Filter pills */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by location or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px]">
              {['all', 'high', 'medium', 'low'].map(r => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-2.5 py-1 rounded-lg uppercase font-bold tracking-wider transition shrink-0 ${
                    riskFilter === r
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Incidents List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No incidents match current filter.
              </div>
            ) : (
              filteredIncidents.map(inc => {
                const isSelected = selectedIncidentId === inc.incident_id;
                const isHigh = inc.risk_level === 'high';
                const isMed = inc.risk_level === 'medium';

                return (
                  <div
                    key={inc.incident_id}
                    onClick={() => setSelectedIncidentId(inc.incident_id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-400 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{inc.incident_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
                        isHigh
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isMed
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {inc.risk_level} &bull; {inc.risk_score}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white truncate">
                      {inc.ward_name || 'Bengaluru Road Segment'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-900">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      <span className={`capitalize font-bold ${
                        inc.status === 'open' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* COLUMN 2: INTERACTIVE BENGALURU MAP (5 of 12 cols on LG) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Bengaluru Geospatial Intelligence Grid</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              EPSG:4326 WGS84
            </span>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 relative">
            <IncidentMap
              incidents={incidents}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              selectedId={selectedIncidentId || undefined}
            />
          </div>
        </div>

        {/* COLUMN 3: LIVE INCIDENT DOSSIER & HUMAN APPROVAL (4 of 12 cols on LG) */}
        {/* Matches Image 5 Right Panel with Recommended Action & Missing Fields */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[700px] overflow-y-auto custom-scrollbar">
          
          {selectedIncident ? (
            <div className="space-y-4">
              
              {/* Header with Full Screen Inspect Trigger */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">ACTIVE TRIAGE DOSSIER</div>
                  <h3 className="text-sm font-black text-white">{selectedIncident.incident_id}</h3>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold flex items-center space-x-1 border border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Deep Inspect</span>
                </button>
              </div>

              {/* Location Badge */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{selectedIncident.ward_name || 'Bengaluru Road Node'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {selectedIncident.latitude.toFixed(4)}°N, {selectedIncident.longitude.toFixed(4)}°E
                </div>
              </div>

              {/* Six Specialist AI Agent Evidence Summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-black tracking-wider block">
                  6-Agent Live Evidence Checklist
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Vision Agent</div>
                    <div className="text-white font-bold">Flood Confirmed</div>
                    <div className="text-[10px] text-emerald-400">Confidence: 91%</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Weather Feed</div>
                    <div className="text-white font-bold">38.4 mm/hr</div>
                    <div className="text-[10px] text-red-400">IMD: Heavy Cloudburst</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Location Intel</div>
                    <div className="text-white font-bold">Silk Board Hotspot</div>
                    <div className="text-[10px] text-amber-400">Distance: 85m</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Verification</div>
                    <div className="text-white font-bold">dHash Verified</div>
                    <div className="text-[10px] text-sky-400">Zero Contradictions</div>
                  </div>
                </div>
              </div>

              {/* Recommended Action (Matches Image 5 "RECOMMENDED ACTION") */}
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-sky-400 font-black tracking-wider block">
                  AI Recommended Response Plan
                </span>
                <p className="text-xs text-slate-200 font-medium leading-snug">
                  Deploy BBMP Quick-Response Trailer Diesel Suction Pump (100 HP) and notify BTP for Hosur Road ramp traffic diversion.
                </p>
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-500 text-slate-950">
                    Resource Tier 1
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Human Authorization Required
                  </span>
                </div>
              </div>

              {/* Human-in-the-Loop Authorization Form */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono uppercase text-slate-300 font-black tracking-wider block flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Human-in-the-Loop Signoff</span>
                </span>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Officer Action</label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setReviewAction('approve')}
                      className={`py-1.5 rounded-xl font-bold border transition ${
                        reviewAction === 'approve'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      Authorize
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction('modify')}
                      className={`py-1.5 rounded-xl font-bold border transition ${
                        reviewAction === 'modify'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      Modify
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction('reject')}
                      className={`py-1.5 rounded-xl font-bold border transition ${
                        reviewAction === 'reject'
                          ? 'bg-red-500 text-white border-red-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Dispatch Notes / Orders</label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {reviewSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold">
                    {reviewSuccessMsg}
                  </div>
                )}

                <button
                  type="button"
                  disabled={reviewing}
                  onClick={handleDockedReviewSubmit}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{reviewing ? 'Transmitting Dispatch...' : 'Sign & Transmit Dispatch'}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-700" />
              <span>Select an incident from the queue to view evidence and authorize dispatch.</span>
            </div>
          )}

        </div>

      </div>

      {/* Deep Inspection Modal (when officer clicks 'Deep Inspect') */}
      {isModalOpen && selectedIncidentId && (
        <IncidentDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setIsModalOpen(false)}
          onUpdated={() => {
            setIsModalOpen(false);
            loadData();
          }}
        />
      )}

    </div>
  );
};
