import {
  IncidentSummary,
  IncidentDetail,
  DashboardSummary,
  AgentHealth,
  RiskAnalytics,
  ReviewItem
} from '../types';

const API_BASE = '/api/v1';

export async function fetchIncidents(params?: { status?: string; risk_level?: string; limit?: number }): Promise<IncidentSummary[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.risk_level) query.append('risk_level', params.risk_level);
  if (params?.limit) query.append('limit', params.limit.toString());
  
  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentDetail(incidentId: string): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
  if (!res.ok) throw new Error(`Failed to fetch incident ${incidentId}`);
  return res.json();
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchAgentHealth(): Promise<AgentHealth[]> {
  const res = await fetch(`${API_BASE}/agents/status`);
  if (!res.ok) throw new Error('Failed to fetch agent health');
  return res.json();
}

export async function fetchRiskAnalytics(): Promise<RiskAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/risk`);
  if (!res.ok) throw new Error('Failed to fetch risk analytics');
  return res.json();
}

export async function submitCitizenReport(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit report' }));
    throw new Error(err.detail || 'Submission failed');
  }
  return res.json();
}

export async function submitHumanReview(
  incidentId: string,
  review: { decision: 'approve' | 'reject' | 'edit'; reviewer_note: string; action_dispatched?: string }
): Promise<ReviewItem> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  note: string = ''
): Promise<any> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function triggerBenchmarkScenario(scenarioId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scenarios/run/${scenarioId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to execute scenario ${scenarioId}`);
  return res.json();
}

export function downloadIncidentsCSV(): void {
  window.open(`${API_BASE}/export/csv`, '_blank');
}
