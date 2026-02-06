import type {
  RawRow, ProcessedEvent, ColumnMapping, DatasetType,
  FunnelStep, RetentionCohort, SegmentResult, Insight,
  SubscriptionKPIs, TrialAnalysis, ChurnAnalysis,
  DataQualityReport, RecentFile, RetentionType
} from '../types';

export type AppAction =
  | { type: 'SET_RAW_DATA'; payload: { rawData: RawRow[]; headers: string[]; fileName: string } }
  | { type: 'SET_COLUMN_MAPPING'; payload: ColumnMapping }
  | { type: 'SET_PROCESSED_DATA'; payload: ProcessedEvent[] }
  | { type: 'SET_DETECTED_TYPE'; payload: DatasetType }
  | { type: 'SET_UNIQUE_EVENTS'; payload: string[] }
  | { type: 'SET_FUNNEL_STEPS'; payload: string[] }
  | { type: 'SET_FUNNEL_RESULTS'; payload: FunnelStep[] | null }
  | { type: 'SET_RETENTION_RESULTS'; payload: RetentionCohort[] | null }
  | { type: 'SET_RETENTION_TYPE'; payload: RetentionType }
  | { type: 'SET_SEGMENT_RESULTS'; payload: SegmentResult[] | null }
  | { type: 'SET_INSIGHTS'; payload: Insight[] }
  | { type: 'SET_SUBSCRIPTION_KPIS'; payload: SubscriptionKPIs | null }
  | { type: 'SET_TRIAL_ANALYSIS'; payload: TrialAnalysis | null }
  | { type: 'SET_CHURN_ANALYSIS'; payload: ChurnAnalysis | null }
  | { type: 'SET_PAID_RETENTION'; payload: RetentionCohort[] | null }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; progress: number; message: string } }
  | { type: 'SET_DATA_QUALITY'; payload: DataQualityReport | null }
  | { type: 'SET_RECENT_FILES'; payload: RecentFile[] }
  | { type: 'SET_AI_SUMMARY'; payload: string }
  | { type: 'RESET_ANALYSIS' };
