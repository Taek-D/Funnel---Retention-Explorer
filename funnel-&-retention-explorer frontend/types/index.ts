// ===== Core Data Types =====

export type View =
  | 'dashboard'
  | 'funnels'
  | 'retention'
  | 'upload'
  | 'editor'
  | 'segments'
  | 'insights'
  | 'mobile';

export type DatasetType = 'ecommerce' | 'subscription' | null;

export type RetentionType = 'activity' | 'paid';

export type InsightType = 'success' | 'warning' | 'danger' | 'info';

// ===== Raw / Processed Data =====

export interface RawRow {
  [key: string]: string;
}

export interface ColumnMapping {
  timestamp?: string;
  userid?: string;
  eventname?: string;
  sessionid?: string;
  platform?: string;
  channel?: string;
}

export interface ProcessedEvent {
  timestamp: Date;
  userId: string;
  eventName: string;
  sessionId?: string;
  platform?: string;
  channel?: string;
}

// ===== Data Quality =====

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  failedRows: number;
  uniqueUsers: number;
  minDate: Date | null;
  maxDate: Date | null;
  platformMissingRate: string;
  channelMissingRate: string;
  topEvents: { name: string; count: number; percentage: string }[];
}

// ===== Funnel =====

export interface FunnelStep {
  step: string;
  stepNumber: number;
  users: number;
  conversionRate: number;
  dropOff: number;
  medianTime?: number;
}

export interface FunnelTemplates {
  ecommerce: string[];
  subscription: string[];
  lifecycle: string[];
}

// ===== Retention =====

export interface RetentionCohort {
  cohortDate: string;
  cohortSize: number;
  days: Record<string, number>;
}

// ===== Segment =====

export interface SegmentResult {
  name: string;
  type: 'platform' | 'channel';
  population: number;
  conversion: number;
  uplift: number;
  pValue: number;
  stepByStep: SegmentFunnelStep[];
}

export interface SegmentFunnelStep {
  step: string;
  users: Set<string>;
  userCount: number;
  conversionRate: number;
  dropOff: number;
}

// ===== Insights =====

export interface Insight {
  type: InsightType;
  icon: string;
  title: string;
  body: string;
  metric?: string;
  recommendations?: string[];
}

// ===== Subscription Analytics =====

export interface SubscriptionKPIs {
  users_total: number;
  users_signup: number;
  users_onboarded: number;
  users_trial: number;
  users_subscribed: number;
  subscribe_events: number;
  renew_events: number;
  cancel_events: number;
  payment_failed_events: number;
  paid_user_count: number;
  gross_revenue: number | null;
  net_revenue: number | null;
  arppu: number | null;
  plan_mix: { monthly: number; yearly: number; other: number };
  cancel_rate_paid: number;
  renew_success_rate: number | null;
}

export interface TrialAnalysis {
  by_trial_days: TrialDayGroup[];
  overall: {
    trial_users: number;
    subscribed_users: number;
    conversion_rate: number;
    median_hours: number | null;
    p90_hours: number | null;
  };
}

export interface TrialDayGroup {
  trial_days: string;
  trial_users: number;
  subscribed_users: number;
  conversion_rate: number;
  median_time_to_subscribe_hours: number | null;
  p90_time_to_subscribe_hours: number | null;
}

export interface ChurnAnalysis {
  churn_users: number;
  churn_rate_paid: number;
  cancel_reason_top: { reason: string; users: number; share: number }[];
  time_to_cancel_median_days: number | null;
  time_to_cancel_p90_days: number | null;
  churn_by_plan: { plan: string; churn_rate: number; n: number }[];
  churn_by_channel: { channel: string; churn_rate: number; n: number }[];
}

// ===== Recent Files =====

export interface RecentFile {
  fileName: string;
  lastOpened: string;
  csvData: string;
}

// ===== App State =====

export interface AppState {
  rawData: RawRow[];
  processedData: ProcessedEvent[];
  columnMapping: ColumnMapping;
  headers: string[];
  currentDataset: string | null;
  detectedType: DatasetType;
  funnelSteps: string[];
  funnelResults: FunnelStep[] | null;
  retentionResults: RetentionCohort[] | null;
  segmentResults: SegmentResult[] | null;
  insights: Insight[];
  subscriptionKPIs: SubscriptionKPIs | null;
  trialAnalysis: TrialAnalysis | null;
  churnAnalysis: ChurnAnalysis | null;
  paidRetentionResults: RetentionCohort[] | null;
  retentionType: RetentionType;
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  dataQualityReport: DataQualityReport | null;
  recentFiles: RecentFile[];
  uniqueEvents: string[];
}
