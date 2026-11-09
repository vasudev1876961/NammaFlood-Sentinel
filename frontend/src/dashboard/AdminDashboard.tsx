import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Eye, Filter, ArrowUpRight, Cpu, Radio, AlertCircle
} from 'lucide-react';
import { IncidentSummary, DashboardSummary, AgentHealth } from '../types';
import { fetchIncidents, fetchDashboardSummary, fetchAgentHealth } from '../services/api';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

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
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = summary?.high_risk_count ?? incidents.filter(i => i.risk_level === 'high').length;
  const pendingReviewCount = summary?.pending_review_count ?? incidents.filter(i => i.status === 'open').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Emergency Advisory Ticker */}
      <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-gradient-to-r from-red-500/15 via-amber-500/10 to-sky-500/10 border border-red-500/30 text-xs shadow-lg">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-extrabold uppercase text-red-400 tracking-wider shrink-0 text-[11px]">
            {lang === 'en' ? 'LIVE CIVIC DISPATCH GRID:' : 'ಲೈವ್ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ:'}
          </span>
          <span className="text-slate-200 font-medium truncate">
            {highRiskCount > 0 
              ? `${highRiskCount} Critical Waterlogging Bottlenecks Active in Mahadevapura & Bommanahalli Zones. High-capacity dewatering pumps alerted.`
              : 'Normal Monsoon Drainage Operation Across All 198 BBMP Wards. 6 Specialist AI Agents Active.'}
          </span>
        </div>

        <button
          onClick={loadData}
          className="shrink-0 ml-3 flex items-center space-x-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold border border-slate-700/80 transition shadow-sm"
        >
          <RefreshCw className="w-3 h-3 text-sky-400" />
          <span className="hidden sm:inline">{lang === 'en' ? 'Sync Feed' : 'ಮರುಲೋಡ್'}</span>
        </button>
      </div>

      {/* Control Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <span>{lang === 'en' ? 'Civic Emergency Control Room' : 'ನಾಗರಿಕ ತುರ್ತು ನಿಯಂತ್ರಣ ಕೊಠಡಿ'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25">
              BBMP-BTP Unified
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'en' 
              ? 'Real-Time Urban Waterlogging Intelligence, Hotspot Risk Verification & Human Authorized Dispatch' 
              : 'ಬೆಂಗಳೂರು ನಗರ ಜಲಾವೃತ ನಿರ್ವಹಣೆ ಮತ್ತು ಅಧಿಕೃತ ಪರಿಶೀಲನಾ ವ್ಯವಸ್ಥೆ'}
          </p>
        </div>
      </div>

      {/* KPI Stats 4-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Incidents */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">{lang === 'en' ? 'Active Incidents' : 'ಒಟ್ಟು ಘಟನೆಗಳು'}</span>
            <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-3xl font-black text-white tracking-tight">
            {summary?.total_incidents ?? incidents.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Across 198 BBMP Wards</div>
        </div>

        {/* High Risk Hotspots */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-red-500/30 shadow-xl relative overflow-hidden group hover:border-red-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-red-400 font-extrabold">{lang === 'en' ? 'High Risk Alerts' : 'ತೀವ್ರ ಅಪಾಯ'}</span>
            <div className="p-1.5 rounded-xl bg-red-500/10 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-3xl font-black text-red-400 tracking-tight">
            {highRiskCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Prioritized for mobile dewatering</div>
        </div>

        {/* Pending Human Reviews */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-amber-400 font-extrabold">{lang === 'en' ? 'Awaiting Human Audit' : 'ಪರಿಶೀಲನೆ ಬಾಕಿ'}</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-3xl font-black text-amber-400 tracking-tight">
            {pendingReviewCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Mandatory officer sign-off gate</div>
        </div>

        {/* Multi-Agent Orchestrator Latency */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">{lang === 'en' ? 'Agent Pipeline SLA' : 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯಾ ಸಮಯ'}</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 text-3xl font-black text-emerald-400 tracking-tight flex items-baseline space-x-1">
            <span>{summary?.mean_agent_duration_ms ?? 23.98}</span>
            <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">6 specialist agents orchestrated in parallel</div>
        </div>

      </div>

      {/* Main Interactive Map Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>{lang === 'en' ? 'Bengaluru Geospatial Waterlogging Grid' : 'ಪ್ರವಾಹ ನಿರ್ವಹಣಾ ನಕ್ಷೆ'}</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {lang === 'en' ? 'Click markers to open Multi-Agent Evidence Dossier' : 'ವಿವರಗಳಿಗೆ ಮಾರ್ಕರ್ ಕ್ಲಿಕ್ ಮಾಡಿ'}
          </span>
        </div>
        
        <IncidentMap 
          incidents={incidents}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          selectedId={selectedIncidentId || undefined}
        />
      </div>

      {/* 6 Specialist Agents Live Monitor */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Specialist Multi-Agent System Health & Telemetry</span>
          </h3>
          <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            LangGraph Orchestrated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {agents.map((ag) => (
            <div key={ag.agent_name} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="capitalize">{ag.agent_name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                SLA: <span className="text-slate-200 font-bold">{ag.avg_latency_ms}ms</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Success: <span className="text-emerald-400 font-bold">{ag.success_rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Incident Queue Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>{lang === 'en' ? 'Prioritized Civic Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿ'}</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Risk filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk (&ge;70)</option>
              <option value="medium">Medium Risk (40-69)</option>
              <option value="low">Low Risk (&lt;40)</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="all">All Lifecycles</option>
              <option value="open">Open (Needs Audit)</option>
              <option value="action_approved">Action Approved</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">Incident ID</th>
                <th className="py-3 px-3.5">Ward / Chronic Hotspot</th>
                <th className="py-3 px-3.5">Priority Rating</th>
                <th className="py-3 px-3.5">Submissions</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Advisory Response Plan</th>
                <th className="py-3 px-3.5 text-right">Human Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                    No waterlogging incidents matching selected filters.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => {
                  const riskColor = inc.risk_level === 'high' 
                    ? 'text-red-400 bg-red-500/10 border-red-500/30' 
                    : inc.risk_level === 'medium' 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' 
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                  return (
                    <tr 
                      key={inc.incident_id} 
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => setSelectedIncidentId(inc.incident_id)}
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {inc.incident_id}
                      </td>
                      <td className="py-3 px-3.5 text-slate-200 font-semibold whitespace-nowrap">
                        {inc.ward_name || 'Bengaluru Urban'}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase ${riskColor}`}>
                          {inc.risk_level} ({inc.risk_score})
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 font-medium whitespace-nowrap">
                        {inc.reports_count} report(s)
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-300 max-w-xs truncate font-medium">
                        {inc.recommended_action || 'Routine monitoring'}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(inc.incident_id);
                          }}
                          className="px-3 py-1 bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white rounded-lg text-[11px] font-bold transition border border-sky-500/30 inline-flex items-center space-x-1"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Detail & Human Approval Modal */}
      {selectedIncidentId && (
        <IncidentDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
          onUpdated={loadData}
        />
      )}

    </div>
  );
};
