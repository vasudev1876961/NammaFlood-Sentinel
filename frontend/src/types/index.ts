export type RiskLevel = 'low' | 'medium' | 'high';
export type IncidentStatus = 'open' | 'investigating' | 'action_approved' | 'resolved' | 'rejected' | 'verified';

export interface IncidentSummary {
  incident_id: string;
  latitude: number;
  longitude: number;
  ward_name?: string;
  first_seen_at: string;
  last_seen_at: string;
  status: IncidentStatus;
  risk_score: number;
  risk_level: RiskLevel;
  risk_confidence: number;
  recommended_action?: string;
  reports_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReportItem {
  report_id: string;
  incident_id: string;
  image_path: string;
  latitude: number;
  longitude: number;
  reporter_note?: string;
  occurred_at: string;
  received_at: string;
  vision_label?: string;
  vision_confidence?: number;
  rainfall_mm_1h?: number;
  rainfall_mm_3h?: number;
  source_type: string;
  verification_status: string;
}

export interface AgentRunItem {
  run_id: number;
  agent_name: string;
  status: string;
  output: Record<string, any>;
  duration_ms: number;
  created_at: string;
}

export interface ReviewItem {
  review_id: number;
  incident_id: string;
  reviewer_id: string;
  decision: 'approve' | 'reject' | 'edit';
  reviewer_note?: string;
  action_dispatched?: string;
  reviewed_at: string;
}

export interface IncidentUpdateItem {
  update_id: number;
  incident_id: string;
  update_type: string;
  note: string;
  created_at: string;
}

export interface IncidentDetail extends IncidentSummary {
  risk_reasons: string[];
  location_context: Record<string, any>;
  weather_context: Record<string, any>;
  reports: ReportItem[];
  agent_runs: AgentRunItem[];
  reviews: ReviewItem[];
  updates: IncidentUpdateItem[];
}

export interface DashboardSummary {
  total_incidents: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  pending_review_count: number;
  resolved_count: number;
  total_reports: number;
  mean_agent_duration_ms: number;
}

export interface AgentHealth {
  agent_name: string;
  total_invocations: number;
  success_rate: number;
  avg_latency_ms: number;
  status: string;
}

export interface RiskAnalytics {
  risk_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  zone_hotspots: Array<{
    zone: string;
    risk_index: number;
    reported_incidents: number;
  }>;
}
