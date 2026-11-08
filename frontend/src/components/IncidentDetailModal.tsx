import React, { useState, useEffect } from 'react';
import { 
  X, ShieldAlert, CheckCircle2, AlertTriangle, Eye, CloudRain, 
  MapPin, CheckCheck, Sparkles, Send, Clock, User
} from 'lucide-react';
import { IncidentDetail, ReviewItem } from '../types';
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateIncidentStatus(incidentId, newStatus, 'Status manually adjusted in civic control room.');
      await loadDetail();
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm">Retrieving Multi-Agent Evidence Dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-red-300 text-sm">{error || 'Incident details not found.'}</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs hover:bg-slate-700">
            Close
          </button>
        </div>
      </div>
    );
  }

  const riskBadgeColor = detail.risk_level === 'high' 
    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
    : detail.risk_level === 'medium'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <span className="font-mono font-bold text-lg text-white">{detail.incident_id}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${riskBadgeColor}`}>
              {detail.risk_level} Risk ({detail.risk_score}/100)
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {detail.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Ward / Area</div>
              <div className="text-slate-200 font-semibold mt-0.5">{detail.ward_name || 'Bengaluru Urban'}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Coordinates</div>
              <div className="text-slate-200 font-mono mt-0.5">{detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Reports Linked</div>
              <div className="text-slate-200 font-semibold mt-0.5">{detail.reports.length} submission(s)</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Evidence Confidence</div>
              <div className="text-slate-200 font-semibold mt-0.5">{(detail.risk_confidence * 100).toFixed(0)}% Complete</div>
            </div>
          </div>

          {/* Citizen Photo Gallery */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Submitted Photographic Evidence</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {detail.reports.map((rpt, idx) => {
                // Ensure image src works with relative uploads path or direct file
                const imgSrc = rpt.image_path.startsWith('http') 
                  ? rpt.image_path 
                  : `/uploads/${rpt.image_path.split(/[/\\]/).pop()}`;

                return (
                  <div key={rpt.report_id} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img 
                      src={imgSrc} 
                      alt={`Report ${rpt.report_id}`} 
                      className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      onError={(e: any) => {
                        e.target.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 200 120' fill='%231e293b'><text x='50%' y='50%' fill='%2364748b' text-anchor='middle' font-family='sans-serif' font-size='12'>Photo Stored on Disk</text></svg>";
                      }}
                    />
                    <div className="p-2.5 bg-slate-900/95 text-[11px] border-t border-slate-800">
                      <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                        <span>{rpt.report_id}</span>
                        <span className="text-sky-400 font-medium">{rpt.vision_label?.toUpperCase()}</span>
                      </div>
                      {rpt.reporter_note && (
                        <p className="text-slate-300 text-xs italic mt-1 line-clamp-2">"{rpt.reporter_note}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Agent Reasoning Dossier */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Specialist AI Agent Intelligence Dossier</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Agent 1: Vision */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <Eye className="w-4 h-4" />
                    <span>Vision Agent</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Status: Completed</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Classification: <span className="font-semibold text-white">{detail.reports[0]?.vision_label || 'flood'}</span> (Conf: {((detail.reports[0]?.vision_confidence || 0.86) * 100).toFixed(1)}%)</div>
                  <div className="text-slate-400 text-[11px]">Water region detected and surface reflection analyzed.</div>
                </div>
              </div>

              {/* Agent 2: Weather */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <CloudRain className="w-4 h-4" />
                    <span>Weather Agent</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Open-Meteo / IMD</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>1-Hour Precipitation: <span className="font-semibold text-white">{detail.reports[0]?.rainfall_mm_1h ?? 0} mm</span></div>
                  <div>3-Hour Accumulation: <span className="font-semibold text-white">{detail.reports[0]?.rainfall_mm_3h ?? 0} mm</span></div>
                </div>
              </div>

              {/* Agent 3: Location */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <MapPin className="w-4 h-4" />
                    <span>Location Agent</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">EPSG:4326 GIS</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Hotspot Proximity: <span className="font-semibold text-white">{detail.location_context?.nearest_hotspot?.name || 'Silk Board / Bellandur corridor'}</span></div>
                  <div className="text-slate-400 text-[11px]">Distance: {detail.location_context?.nearest_hotspot?.distance_m ? `${detail.location_context.nearest_hotspot.distance_m}m` : 'Nearby'}</div>
                </div>
              </div>

              {/* Agent 4: Verification */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <CheckCheck className="w-4 h-4" />
                    <span>Verification Agent</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Spatiotemporal + pHash</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Corroborating Reports: <span className="font-semibold text-white">{detail.reports.length} report(s)</span></div>
                  <div className="text-slate-400 text-[11px]">Submissions clustered within 150m spatial tolerance buffer.</div>
                </div>
              </div>

            </div>
          </div>

          {/* Explainable Risk Assessment Line Items */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Explainable Priority Factors</h4>
            <ul className="space-y-1 text-xs text-slate-300">
              {detail.risk_reasons.map((r, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Response Recommendation */}
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Recommended Civic Response (Advisory)</span>
            </div>
            <p className="text-sm font-medium text-slate-100">{detail.recommended_action}</p>
            <p className="text-[11px] text-slate-400 italic">
              Safety gate active: Autonomous emergency vehicle dispatch is disabled. Human approval required below.
            </p>
          </div>

          {/* Human-in-the-Loop Review Audit Form */}
          <div className="p-5 rounded-2xl bg-slate-950 border-2 border-sky-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <User className="w-4 h-4 text-sky-400" />
                <span>Civic Official Decision & Audit Panel</span>
              </h4>
              <span className="text-[11px] text-slate-500">Authorized Operator Review</span>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDecision('approve')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    decision === 'approve'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ✓ Approve Action
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('edit')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    decision === 'edit'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ✏️ Edit / Investigate
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    decision === 'reject'
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ✕ Reject / False Alarm
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Dispatched Civic Action / Field Instructions:
                </label>
                <input
                  type="text"
                  value={actionDispatched}
                  onChange={(e) => setActionDispatched(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Deploy BBMP Suction Pump Crew 4 to underpass"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Reviewer Operational Notes (Mandatory for audit trail):
                </label>
                <textarea
                  required
                  rows={2}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Confirmed CCTV shows 1.5 ft water accumulation on service road; pump team alerted."
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingReview ? 'Recording Audit Decision...' : 'Commit Human Authorization'}</span>
              </button>
            </form>
          </div>

          {/* Timeline History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Incident Progression Timeline</span>
            </h4>
            <div className="space-y-2 border-l border-slate-800 pl-4 ml-2">
              {detail.updates.map((up) => (
                <div key={up.update_id} className="text-xs space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(up.created_at).toLocaleString()}
                  </div>
                  <div className="text-slate-300 font-medium">
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 mr-2">
                      {up.update_type}
                    </span>
                    {up.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition">
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};

