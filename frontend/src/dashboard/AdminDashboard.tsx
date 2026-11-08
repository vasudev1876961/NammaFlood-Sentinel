import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Eye, Filter, ArrowUpRight, Cpu
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
    const interval = setInterval(loadData, 15000); // Poll every 15s for live incident feed
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

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner & Control Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === 'en' ? 'Civic Emergency Control Room' : 'ನಾಗರಿಕ ತುರ್ತು ನಿಯಂತ್ರಣ ಕೊಠಡಿ'}
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'en' 
              ? 'Bengaluru Urban Waterlogging Operational Intelligence & Human-in-the-Loop Audit Gateway' 
              : 'ಬೆಂಗಳೂರು ನಗರ ಜಲಾವೃತ ನಿರ್ವಹಣೆ ಮತ್ತು ಅಧಿಕೃತ ಪರಿಶೀಲನಾ ವ್ಯವಸ್ಥೆ'}
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>{lang === 'en' ? 'Refresh Feed' : 'ಮರುಲೋಡ್'}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Incidents */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{lang === 'en' ? 'Total Active Incidents' : 'ಒಟ್ಟು ಘಟನೆಗಳು'}</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {summary?.total_incidents ?? incidents.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across 198 BBMP wards</div>
        </div>

        {/* High Risk Hotspots */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-red-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-red-400 font-semibold">{lang === 'en' ? 'High Risk Bottlenecks' : 'ತೀವ್ರ ಅಪಾಯದ ಸ್ಥಳಗಳು'}</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-400">
            {summary?.high_risk_count ?? incidents.filter(i => i.risk_level === 'high').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Prioritized for suction pump deployment</div>
        </div>

        {/* Pending Human Reviews */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-amber-400 font-semibold">{lang === 'en' ? 'Awaiting Human Audit' : 'ಪರಿಶೀಲನೆ ಬಾಕಿ'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {summary?.pending_review_count ?? incidents.filter(i => i.status === 'open').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Mandatory officer sign-off gate</div>
        </div>

        {/* Multi-Agent Orchestrator Latency */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{lang === 'en' ? 'Agent Pipeline SLA' : 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯಾ ಸಮಯ'}</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {summary?.mean_agent_duration_ms ?? 18.5} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">6 specialist agents orchestrated in parallel</div>
        </div>

      </div>

      {/* Main Interactive Map Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>{lang === 'en' ? 'Live Geospatial Waterlogging Grid' : 'ಪ್ರವಾಹ ನಿರ್ವಹಣಾ ನಕ್ಷೆ'}</span>
          </h3>
          <span className="text-xs text-slate-500">
            {lang === 'en' ? 'Click any marker to open multi-agent audit dossier' : 'ವಿವರಗಳಿಗೆ ಮಾರ್ಕರ್ ಕ್ಲಿಕ್ ಮಾಡಿ'}
          </span>
        </div>
        
        <IncidentMap 
          incidents={incidents}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          selectedId={selectedIncidentId || undefined}
        />
      </div>

      {/* 6 Specialist Agents Live Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Specialist Multi-Agent System Health & Execution Telemetry</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">LangGraph Orchestrated</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {agents.map((ag) => (
            <div key={ag.agent_name} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white capitalize">{ag.agent_name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400">
                SLA: <span className="font-mono text-slate-200">{ag.avg_latency_ms}ms</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Success: <span className="text-emerald-400 font-semibold">{ag.success_rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Incident Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span>{lang === 'en' ? 'Prioritized Incident Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿ'}</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Risk filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk Only</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open (Needs Audit)</option>
              <option value="action_approved">Action Approved</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Ward / Hotspot</th>
                <th className="py-2.5 px-3">Priority Score</th>
                <th className="py-2.5 px-3">Reports</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Action Plan</th>
                <th className="py-2.5 px-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No incidents matching selected filters.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => {
                  const riskColor = inc.risk_level === 'high' 
                    ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                    : inc.risk_level === 'medium' 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                  return (
                    <tr 
                      key={inc.incident_id} 
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => setSelectedIncidentId(inc.incident_id)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {inc.incident_id}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {inc.ward_name || 'Bengaluru Urban'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${riskColor}`}>
                          {inc.risk_level} ({inc.risk_score})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium">
                        {inc.reports_count} submission(s)
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {inc.recommended_action || 'Routine monitoring'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentId(inc.incident_id);
                          }}
                          className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white rounded-lg text-[11px] font-semibold transition border border-sky-500/30 inline-flex items-center space-x-1"
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

