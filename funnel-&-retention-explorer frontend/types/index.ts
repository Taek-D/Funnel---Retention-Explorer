// ===== Data Connectors =====

export type ConnectorType = 'csv' | 'json' | 'google-sheets' | 'ga4-export' | 'mixpanel-export' | 'amplitude-export';

export type ExportFormat = 'ga4' | 'mixpanel' | 'amplitude' | 'unknown';

export interface ConnectorConfig {
  type: ConnectorType;
  labelKey: string;
  descKey: string;
  iconName: string;
  inputType: 'file' | 'url';
  acceptedFormats?: string;
}

// ===== Filters =====

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface ActiveFilters {
  platforms: string[];
  channels: string[];
}

// ===== Dashboard Layout =====

export type WidgetId =
  | 'kpi-cards'
  | 'funnel-chart'
  | 'retention-chart'
  | 'data-quality'
  | 'quick-actions'
  | 'recent-insights'
  | 'saved-analyses';

export type WidgetWidth = 'full' | 'half';

export interface WidgetLayout {
  widgetId: WidgetId;
  visible: boolean;
  width: WidgetWidth;
  order: number;
}

// ===== Team =====

export type TeamRole = 'admin' | 'member' | 'viewer';
export type TeamMemberStatus = 'pending' | 'active' | 'removed';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invited_at: string;
  joined_at: string | null;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// ===== Plan & Subscription =====

export type PlanType = 'free' | 'pro' | 'team';
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'past_due';
export type BillingCycle = 'monthly' | 'annual';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  plan: PlanType;
  plan_started_at: string | null;
  toss_customer_key: string | null;
  toss_billing_key: string | null;
  subscription_status: SubscriptionStatus;
  next_billing_date: string | null;
  ai_calls_today: number;
  ai_calls_reset_at: string;
  csv_row_limit: number;
  billing_cycle: BillingCycle;
  retry_count: number;
  grace_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Billing History =====

export interface BillingRecord {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  toss_payment_key: string | null;
  failure_reason: string | null;
  created_at: string;
}

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
  rowCount: number;
  columnCount: number;
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
  aiSummary: string;
  dashboardLayout: WidgetLayout[];
  dateRange: DateRange;
  activeFilters: ActiveFilters;
}
