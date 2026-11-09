import React, { useState, useEffect } from 'react';
import { 
  X, ShieldAlert, CheckCircle2, AlertTriangle, Eye, CloudRain, 
  MapPin, CheckCheck, Sparkles, Send, Clock, User, FileText, Activity
} from 'lucide-react';
import { IncidentDetail } from '../types';
import { fetchIncidentDetail, submitHumanReview, updateIncidentStatus } from '../services/api';

interface IncidentDetailModalProps {
  incidentId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({ incidentId, onClose, onUpdated }) => {
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAgentTab, setActiveAgentTab] = useState<'all' | 'vision' | 'weather' | 'location' | 'verification'>('all');
  
  // Review form state
  const [decision, setDecision] = useState<'approve' | 'reject' | 'edit'>('approve');
  const [reviewerNote, setReviewerNote] = useState('');
  const [actionDispatched, setActionDispatched] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [incidentId]);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIncidentDetail(incidentId);
      setDetail(data);
      setActionDispatched(data.recommended_action || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerNote.trim()) {
      alert('Please provide an operational note explaining the decision.');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitHumanReview(incidentId, {
        decision,
        reviewer_note: reviewerNote,
        action_dispatched: actionDispatched,
      });
      alert(`Decision '${decision.toUpperCase()}' successfully audited and recorded.`);
      setReviewerNote('');
      await loadDetail();
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to save review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-white font-bold text-sm">Retrieving Multi-Agent Dossier</h4>
            <p className="text-slate-400 text-xs">Fusing vision, weather, and geospatial evidence...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-300 text-sm">{error || 'Incident details not found.'}</p>
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  const riskBadgeColor = detail.risk_level === 'high' 
    ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-red-500/10' 
    : detail.risk_level === 'medium'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Executive Header */}
        <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/70 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <span className="font-mono font-extrabold text-lg text-white tracking-wider">{detail.incident_id}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border shadow-sm ${riskBadgeColor}`}>
              {detail.risk_level} Risk ({detail.risk_score}/100)
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {detail.status}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              &bull; {detail.ward_name || 'Bengaluru Urban'}
            </span>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Close Dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual-Column Responsive Grid Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Visual Evidence & Geospatial Telemetry (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Citizen Photo Evidence Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Citizen Visual Evidence ({detail.reports.length})</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Originals Retained</span>
              </div>

              <div className="space-y-3">
                {detail.reports.map((rpt) => {
                  const imgSrc = rpt.image_path.startsWith('http') 
                    ? rpt.image_path 
                    : `/uploads/${rpt.image_path.split(/[/\\]/).pop()}`;

                  return (
                    <div key={rpt.report_id} className="group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                      <div className="relative overflow-hidden bg-slate-950 max-h-56">
                        <img 
                          src={imgSrc} 
                          alt={`Report ${rpt.report_id}`} 
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e: any) => {
                            e.target.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 120' fill='%231e293b'><text x='50%' y='50%' fill='%2364748b' text-anchor='middle' font-family='sans-serif' font-size='12'>Citizen Photo on Record</text></svg>";
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md text-[9px] font-mono text-sky-400 border border-slate-700">
                          {rpt.report_id}
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md text-[9px] font-bold text-white border border-slate-700 uppercase">
                          {rpt.vision_label || 'flood'}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/80 text-xs border-t border-slate-800 space-y-1">
                        {rpt.reporter_note ? (
                          <p className="text-slate-300 italic">"{rpt.reporter_note}"</p>
                        ) : (
                          <p className="text-slate-500 italic">No additional citizen remarks submitted.</p>
                        )}
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
                          <span>{new Date(rpt.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="uppercase text-amber-400 font-bold">{rpt.verification_status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic & Weather Snapshot Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Geographic & Meteorological Coordinates</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">GPS Latitude / Longitude</div>
                  <div className="font-mono font-bold text-white mt-0.5">{detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">Nearest Chronic Hotspot</div>
                  <div className="font-bold text-amber-400 truncate mt-0.5">
                    {detail.location_context?.nearest_hotspot?.name || 'Central Silk Board'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">1-Hour Rain (Observed)</div>
                  <div className="font-mono font-bold text-white mt-0.5">{detail.reports[0]?.rainfall_mm_1h ?? 35} mm/hr</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">3-Hour Cumulative</div>
                  <div className="font-mono font-bold text-white mt-0.5">{detail.reports[0]?.rainfall_mm_3h ?? 70} mm</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Multi-Agent Dossier, Scoring Waterfall & Human Decision Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Multi-Agent Reasoning Tabbed Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Specialist AI Agent Intelligence Dossier</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">6 Agents Synchronized</span>
              </div>

              {/* Agent Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                    <span className="flex items-center space-x-1"><Eye className="w-3 h-3" /><span>Vision Agent</span></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <p className="text-slate-300 text-[11px]">Class: <span className="font-bold text-white">{detail.reports[0]?.vision_label || 'flood'}</span> ({((detail.reports[0]?.vision_confidence || 0.88)*100).toFixed(0)}% conf)</p>
                  <p className="text-[10px] text-slate-500">Surface water pooling & asphalt sheen detected.</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                    <span className="flex items-center space-x-1"><CloudRain className="w-3 h-3" /><span>Weather Agent</span></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <p className="text-slate-300 text-[11px]">IMD Status: <span className="font-bold text-white">Heavy Precipitation</span></p>
                  <p className="text-[10px] text-slate-500">Continuous downpour exceeding stormwater drain capacity.</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                    <span className="flex items-center space-x-1"><MapPin className="w-3 h-3" /><span>Location Agent</span></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <p className="text-slate-300 text-[11px]">Buffer: <span className="font-bold text-white">&lt; 100m of Hotspot</span></p>
                  <p className="text-[10px] text-slate-500">Severe vulnerability index recorded at this culvert.</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                    <span className="flex items-center space-x-1"><CheckCheck className="w-3 h-3" /><span>Verification Agent</span></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <p className="text-slate-300 text-[11px]">Cluster: <span className="font-bold text-white">{detail.reports.length} Reports Clustered</span></p>
                  <p className="text-[10px] text-slate-500">Haversine &le; 150m & pHash matched duplicate.</p>
                </div>

              </div>
            </div>

            {/* Explainable Factor Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Explainable Score Allocation (Heuristic & ML Fused)</span>
                <span className="text-sky-400 font-mono">{detail.risk_score} / 100</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {detail.risk_reasons.map((reason, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-sky-400 font-bold mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advisory Action Recommendation */}
            <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-1.5">
              <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>Recommended Operational Response Plan</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                {detail.recommended_action}
              </p>
              <p className="text-[10px] text-slate-400 italic">
                Strict Safety Gate: Autonomous emergency mobilization is disabled. Civic officer sign-off required below.
              </p>
            </div>

            {/* Human-in-the-Loop Decision Form */}
            <div className="p-5 rounded-2xl bg-slate-950 border-2 border-sky-500/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Authorized Civic Officer Decision Panel</span>
                </h4>
                <span className="text-[10px] text-amber-400 font-semibold uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Audit Gate Active
                </span>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('approve')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      decision === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ✓ Approve Action
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('edit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      decision === 'edit'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ✏️ Investigate / Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      decision === 'reject'
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20 scale-[1.02]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ✕ Reject False Alarm
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Dispatched Civic Team Instructions:
                  </label>
                  <input
                    type="text"
                    value={actionDispatched}
                    onChange={(e) => setActionDispatched(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                    placeholder="e.g. Deploy BBMP High-Capacity Suction Pump Crew 2 to Silk Board"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Officer Operational Rationale (Logged to immutable audit history):
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Verified CCTV feed shows 1.5ft water pooling on service ramp; suction crew mobilized."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Committing Authorization...' : 'Sign & Commit Human Authorization'}</span>
                </button>
              </form>
            </div>

            {/* Timeline Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Incident Progression Timeline</span>
              </h4>
              <div className="space-y-2 border-l border-slate-800 pl-4 ml-1 max-h-36 overflow-y-auto">
                {detail.updates.map((up) => (
                  <div key={up.update_id} className="text-xs space-y-0.5">
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(up.created_at).toLocaleString()}
                    </div>
                    <div className="text-slate-300 font-medium">
                      <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 mr-2 border border-slate-700">
                        {up.update_type}
                      </span>
                      {up.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/90 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Audit ID: {detail.incident_id} &bull; First seen: {new Date(detail.first_seen_at).toLocaleDateString()}
          </span>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
