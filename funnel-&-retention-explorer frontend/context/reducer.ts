import type { AppState } from '../types';
import type { AppAction } from './actions';

export const initialState: AppState = {
  rawData: [],
  processedData: [],
  columnMapping: {},
  headers: [],
  currentDataset: null,
  detectedType: null,
  funnelSteps: [],
  funnelResults: null,
  retentionResults: null,
  segmentResults: null,
  insights: [],
  subscriptionKPIs: null,
  trialAnalysis: null,
  churnAnalysis: null,
  paidRetentionResults: null,
  retentionType: 'activity',
  isProcessing: false,
  processingProgress: 0,
  processingMessage: '',
  dataQualityReport: null,
  recentFiles: [],
  uniqueEvents: []
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_RAW_DATA':
      return {
        ...state,
        rawData: action.payload.rawData,
        headers: action.payload.headers,
        currentDataset: action.payload.fileName
      };

    case 'SET_COLUMN_MAPPING':
      return { ...state, columnMapping: action.payload };

    case 'SET_PROCESSED_DATA':
      return { ...state, processedData: action.payload };

    case 'SET_DETECTED_TYPE':
      return { ...state, detectedType: action.payload };

    case 'SET_UNIQUE_EVENTS':
      return { ...state, uniqueEvents: action.payload };

    case 'SET_FUNNEL_STEPS':
      return { ...state, funnelSteps: action.payload };

    case 'SET_FUNNEL_RESULTS':
      return { ...state, funnelResults: action.payload };

    case 'SET_RETENTION_RESULTS':
      return { ...state, retentionResults: action.payload };

    case 'SET_RETENTION_TYPE':
      return { ...state, retentionType: action.payload };

    case 'SET_SEGMENT_RESULTS':
      return { ...state, segmentResults: action.payload };

    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };

    case 'SET_SUBSCRIPTION_KPIS':
      return { ...state, subscriptionKPIs: action.payload };

    case 'SET_TRIAL_ANALYSIS':
      return { ...state, trialAnalysis: action.payload };

    case 'SET_CHURN_ANALYSIS':
      return { ...state, churnAnalysis: action.payload };

    case 'SET_PAID_RETENTION':
      return { ...state, paidRetentionResults: action.payload };

    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload.isProcessing,
        processingProgress: action.payload.progress,
        processingMessage: action.payload.message
      };

    case 'SET_DATA_QUALITY':
      return { ...state, dataQualityReport: action.payload };

    case 'SET_RECENT_FILES':
      return { ...state, recentFiles: action.payload };

    case 'RESET_ANALYSIS':
      return {
        ...state,
        funnelSteps: [],
        funnelResults: null,
        retentionResults: null,
        segmentResults: null,
        insights: [],
        subscriptionKPIs: null,
        trialAnalysis: null,
        churnAnalysis: null,
        paidRetentionResults: null,
        retentionType: 'activity'
      };

    default:
      return state;
  }
}
