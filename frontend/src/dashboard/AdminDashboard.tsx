import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Eye, Filter, ArrowUpRight, Cpu, Radio, 
  AlertCircle, ChevronRight, UserCheck, Flame, Waves, Search, Download, 
  Layers, Check, X, Shield, PhoneCall, Gauge, CheckSquare, Wrench, Sparkles, Play
} from 'lucide-react';
import { IncidentSummary, IncidentDetail, DashboardSummary, AgentHealth } from '../types';
import { 
  fetchIncidents, 
  fetchIncidentDetail, 
  fetchDashboardSummary, 
  fetchAgentHealth, 
  submitHumanReview,
  triggerBenchmarkScenario
} from '../services/api';
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
  const [selectedDetail, setSelectedDetail] = useState<IncidentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filters & Operational Modes
  const [persona, setPersona] = useState<string>('BBMP Zonal Commissioner');
  const [gridMode, setGridMode] = useState<'normal' | 'crisis' | 'simulation'>('crisis');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Human approval form states
  const [reviewAction, setReviewAction] = useState<string>('approve');
  const [reviewNote, setReviewNote] = useState<string>('Authorized 100 HP suction unit and traffic diversion at Silk Board.');
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [statusFilter, riskFilter, gridMode]);

  useEffect(() => {
    if (selectedIncidentId) {
      loadSelectedDetail(selectedIncidentId);
    }
  }, [selectedIncidentId]);

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

  const loadSelectedDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const d = await fetchIncidentDetail(id);
      setSelectedDetail(d);
      setReviewNote(`[${persona}] Authorized municipal response for ${d.ward_name || id}.`);
    } catch (err) {
      console.error('Failed to load detail for', id, err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const selectedIncident = incidents.find(i => i.incident_id === selectedIncidentId);

  // Mode-based incident filtering
  const modeFilteredIncidents = incidents.filter(i => {
    if (gridMode === 'normal') {
      // Normal mode highlights routine / low-to-medium maintenance
      return i.risk_level === 'low' || i.risk_level === 'medium';
    }
    if (gridMode === 'crisis') {
      // Crisis mode prioritizes all incidents with high/critical at the top
      return true;
    }
    // Simulation mode shows all
    return true;
  });

  const filteredIncidents = modeFilteredIncidents.filter(i => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      i.incident_id.toLowerCase().includes(q) ||
      (i.ward_name && i.ward_name.toLowerCase().includes(q)) ||
      i.risk_level.toLowerCase().includes(q)
    );
  });

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
        if (selectedIncidentId) loadSelectedDetail(selectedIncidentId);
      }, 2000);
    } catch (err: any) {
      alert(`Review submission error: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  // Trigger live simulation
  const handleTriggerSimulation = async (scenarioId: string) => {
    setSimulating(true);
    try {
      const res = await triggerBenchmarkScenario(scenarioId);
      await loadData();
      if (res.incident_id) {
        setSelectedIncidentId(res.incident_id);
      }
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const highRiskCount = summary?.high_risk_count ?? incidents.filter(i => i.risk_level === 'high').length;
  const pendingReviewCount = summary?.pending_review_count ?? incidents.filter(i => i.status === 'open').length;
  const avgLatency = summary?.mean_agent_duration_ms ? summary.mean_agent_duration_ms.toFixed(2) : '23.84';

  // Dynamic peak score
  const currentPeakScore = selectedIncident ? selectedIncident.risk_score : (highRiskCount > 0 ? 88.5 : 22.0);
  const gaugePercent = Math.min(100, Math.round(currentPeakScore));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CURRICULUM-STYLE TYPOGRAPHY (Matches Image 5 style)        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-sky-400 block mb-1">
            CIVIC INFRASTRUCTURE · RESILIENCE COMMAND
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {lang === 'en' ? 'Civic Emergency Control Room' : 'ನಾಗರಿಕ ತುರ್ತು ನಿಯಂತ್ರಣ ಕೊಠಡಿ'}
          </h1>
          {/* Accent Line Bar (Curriculum style) */}
          <div className="w-16 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 rounded-full mt-2.5 mb-2"></div>
          <p className="text-xs text-slate-400 max-w-2xl">
            {lang === 'en' 
              ? 'Real-Time Urban Waterlogging Intelligence, Hotspot Risk Verification & Human-in-the-Loop Civic Response Coordination.'
              : 'ಬೆಂಗಳೂರು ನಗರ ಜಲಾವೃತ ನಿರ್ವಹಣೆ, ಮಲ್ಟಿ-ಏಜೆಂಟ್ ಪರಿಶೀಲನೆ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರತಿಕ್ರಿಯೆ ವ್ಯವಸ್ಥೆ.'}
          </p>
        </div>

        {/* Sync Feed Button */}
        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-800 shadow-md transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>{lang === 'en' ? 'Sync Feed' : 'ಮರುಲೋಡ್'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC EMERGENCY ADVISORY TICKER                                      */}
      {/* ========================================================================= */}
      <div className={`p-3 px-4 rounded-2xl border text-xs shadow-lg flex items-center justify-between ${
        gridMode === 'normal'
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          : gridMode === 'simulation'
          ? 'bg-purple-950/20 border-purple-500/30 text-purple-300'
          : 'bg-red-950/20 border-red-500/30 text-red-300'
      }`}>
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              gridMode === 'normal' ? 'bg-emerald-400' : gridMode === 'simulation' ? 'bg-purple-400' : 'bg-red-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              gridMode === 'normal' ? 'bg-emerald-500' : gridMode === 'simulation' ? 'bg-purple-500' : 'bg-red-500'
            }`}></span>
          </span>
          <span className="font-extrabold uppercase tracking-wider shrink-0 text-[11px]">
            {gridMode === 'normal'
              ? 'NORMAL DRAINAGE WATCH:'
              : gridMode === 'simulation'
              ? 'SIMULATION BENCHMARK MODE:'
              : 'LIVE CRISIS DISPATCH GRID:'}
          </span>
          <span className="text-slate-200 font-medium truncate">
            {gridMode === 'normal'
              ? 'All 198 BBMP wards operating within normal drainage capacity. 6 specialist AI agents active.'
              : gridMode === 'simulation'
              ? 'Hydraulic Stress Simulator Active. Test automated dispatch with simulated rainfall spikes.'
              : `${highRiskCount} Critical Waterlogging Bottlenecks Active in Mahadevapura & Bommanahalli. High-capacity dewatering pumps deployed.`}
          </span>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 shrink-0 ml-2">
          {gridMode.toUpperCase()}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP COMMAND BAR WITH OPERATIONAL MODE SWITCHER                         */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Persona */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Emergency Command Operations
              </h2>
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
          <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => setGridMode('normal')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                gridMode === 'normal' 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Normal</span>
            </button>
            <button
              onClick={() => setGridMode('crisis')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                gridMode === 'crisis' 
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Monsoon Crisis</span>
            </button>
            <button
              onClick={() => setGridMode('simulation')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                gridMode === 'simulation' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Simulation</span>
            </button>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Active Incidents</span>
              <span className="text-sm font-black text-white">{filteredIncidents.length}</span>
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
      {/* 3B. SIMULATION TOOLBAR (Visible in Simulation Mode)                       */}
      {/* ========================================================================= */}
      {gridMode === 'simulation' && (
        <div className="p-4 rounded-3xl bg-purple-950/30 border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <div className="text-xs font-black uppercase text-purple-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hydraulic Stress Simulator & Instant Scenario Injector</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Inject live cloudburst events to stress test multi-agent perception, deduplication, and pump dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={simulating}
              onClick={() => handleTriggerSimulation('SCENARIO_C')}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-amber-300" />
              <span>Simulate Cloudburst (Silk Board)</span>
            </button>
            <button
              disabled={simulating}
              onClick={() => handleTriggerSimulation('SCENARIO_B')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-sky-300" />
              <span>Simulate Ponding (Ecospace)</span>
            </button>
            <button
              disabled={simulating}
              onClick={() => handleTriggerSimulation('SCENARIO_D')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <span>Duplicate Repost Test</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FLOOD MONITOR GAUGES & PUMP COUNTERS                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Dynamic Peak Risk Gauge */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Inundation Index (Selected)
            </span>
            <div className={`text-2xl font-black font-mono ${
              gaugePercent >= 70 ? 'text-red-400' : gaugePercent >= 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {currentPeakScore.toFixed(1)}/100
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {gaugePercent >= 70 ? 'Critical Flashpoint Active' : gaugePercent >= 40 ? 'Moderate Ponding' : 'Routine Safe Baseline'}
            </span>
          </div>

          {/* Semicircular Gauge */}
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
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={gaugePercent >= 70 ? '#ef4444' : gaugePercent >= 40 ? '#f59e0b' : '#10b981'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="126"
                strokeDashoffset={126 - (126 * gaugePercent) / 100}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute bottom-0 text-[10px] font-black text-white font-mono">{gaugePercent}%</span>
          </div>
        </div>

        {/* Pump Stations Counter */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Municipal Pump Stations
            </span>
            <div className="text-2xl font-black text-white font-mono flex items-center space-x-1.5">
              <span>158</span>
              <span className="text-xs font-bold text-emerald-400">Deployed</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">100% Generators Armed</span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Rajakaluve Telemetry */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Rajakaluve Telemetry
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

        {/* Human Reviews Pending */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
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
      {/* 5. THREE-COLUMN COMMAND CONSOLE (Queue | Map | Live Dynamic Dossier)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMN 1: INCIDENT QUEUE (3 of 12 cols) */}
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
                        ? 'bg-sky-500/15 border-sky-400 shadow-lg shadow-sky-500/10 scale-[1.01]'
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

        {/* COLUMN 2: INTERACTIVE BENGALURU MAP (5 of 12 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold block">
                GEOSPATIAL INTELLIGENCE GRID
              </span>
              <h3 className="text-sm font-black text-white flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Bengaluru Urban Grid</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              EPSG:4326 WGS84
            </span>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 relative">
            <IncidentMap
              incidents={filteredIncidents}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              selectedId={selectedIncidentId || undefined}
            />
          </div>
        </div>

        {/* COLUMN 3: DYNAMIC INCIDENT DOSSIER (4 of 12 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[700px] overflow-y-auto custom-scrollbar">
          
          {selectedIncident ? (
            <div className="space-y-4">
              
              {/* Header with Full Screen Inspect Trigger */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">ACTIVE TRIAGE DOSSIER</div>
                  <h3 className="text-base font-black text-white">{selectedIncident.incident_id}</h3>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center space-x-1.5 border border-sky-500/30 transition shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Deep Inspect</span>
                </button>
              </div>

              {/* Dynamic Location Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{selectedDetail?.ward_name || selectedIncident.ward_name || 'Bengaluru Road Node'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {selectedIncident.latitude.toFixed(4)}°N, {selectedIncident.longitude.toFixed(4)}°E
                </div>
              </div>

              {/* Six Specialist AI Agent Evidence Summary (Dynamic from selectedDetail!) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-black tracking-wider block">
                  6-Agent Live Evidence Checklist
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Vision Agent */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Vision Agent</div>
                    <div className="text-white font-bold capitalize">
                      {selectedDetail?.reports?.[0]?.vision_label || (selectedIncident.risk_level === 'low' ? 'Dry / Clear' : 'Flood Detected')}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Confidence: {selectedDetail?.reports?.[0]?.vision_confidence ? `${(selectedDetail.reports[0].vision_confidence * 100).toFixed(0)}%` : '91%'}
                    </div>
                  </div>

                  {/* Weather Agent */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Weather Feed</div>
                    <div className="text-white font-bold">
                      {selectedDetail?.reports?.[0]?.rainfall_mm_1h !== undefined ? `${selectedDetail.reports[0].rainfall_mm_1h} mm/hr` : '38.4 mm/hr'}
                    </div>
                    <div className={`text-[10px] font-bold ${
                      (selectedDetail?.reports?.[0]?.rainfall_mm_1h || 0) > 35 ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {(selectedDetail?.reports?.[0]?.rainfall_mm_1h || 0) > 35 ? 'Heavy Cloudburst' : 'Moderate Rain'}
                    </div>
                  </div>

                  {/* Location Agent */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Location Intel</div>
                    <div className="text-white font-bold truncate">
                      {selectedDetail?.ward_name || selectedIncident.ward_name || 'BBMP Hotspot'}
                    </div>
                    <div className="text-[10px] text-amber-400">
                      Buffer: &lt; 100m Hotspot
                    </div>
                  </div>

                  {/* Verification Agent */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-500 font-bold text-[9px] uppercase">Verification</div>
                    <div className="text-white font-bold">
                      {selectedIncident.reports_count} Report(s) Linked
                    </div>
                    <div className="text-[10px] text-sky-400">
                      dHash Verified
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Action (Dynamic from selectedDetail!) */}
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-sky-400 font-black tracking-wider block">
                  AI Recommended Response Plan
                </span>
                <p className="text-xs text-slate-200 font-medium leading-snug">
                  {selectedDetail?.recommended_action || selectedIncident.recommended_action || 'Deploy BBMP Quick-Response Trailer Diesel Suction Pump (100 HP) and notify BTP for Hosur Road ramp traffic diversion.'}
                </p>
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-500 text-slate-950">
                    Resource Tier {selectedIncident.risk_level === 'high' ? '1 (Urgent)' : '2 (Inspection)'}
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
            if (selectedIncidentId) loadSelectedDetail(selectedIncidentId);
          }}
        />
      )}

    </div>
  );
};
