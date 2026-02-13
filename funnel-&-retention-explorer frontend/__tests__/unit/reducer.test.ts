import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from '../../context/reducer';
import type { AppAction } from '../../context/actions';

describe('appReducer', () => {
  it('returns initialState by default', () => {
    const result = appReducer(initialState, { type: 'UNKNOWN' } as unknown as AppAction);
    expect(result).toEqual(initialState);
  });

  it('SET_RAW_DATA sets rawData, headers, currentDataset', () => {
    const payload = {
      rawData: [{ col1: 'a' }],
      headers: ['col1'],
      fileName: 'test.csv',
    };
    const result = appReducer(initialState, { type: 'SET_RAW_DATA', payload });
    expect(result.rawData).toEqual(payload.rawData);
    expect(result.headers).toEqual(['col1']);
    expect(result.currentDataset).toBe('test.csv');
  });

  it('SET_COLUMN_MAPPING sets columnMapping', () => {
    const mapping = { userid: 'user_id', eventname: 'event' };
    const result = appReducer(initialState, { type: 'SET_COLUMN_MAPPING', payload: mapping });
    expect(result.columnMapping).toEqual(mapping);
  });

  it('SET_PROCESSED_DATA sets processedData', () => {
    const events = [{ userId: 'u1', eventName: 'e1', timestamp: new Date() }];
    const result = appReducer(initialState, { type: 'SET_PROCESSED_DATA', payload: events });
    expect(result.processedData).toEqual(events);
  });

  it('SET_DETECTED_TYPE sets detectedType', () => {
    const result = appReducer(initialState, { type: 'SET_DETECTED_TYPE', payload: 'subscription' });
    expect(result.detectedType).toBe('subscription');
  });

  it('SET_UNIQUE_EVENTS sets uniqueEvents', () => {
    const events = ['signup', 'login', 'purchase'];
    const result = appReducer(initialState, { type: 'SET_UNIQUE_EVENTS', payload: events });
    expect(result.uniqueEvents).toEqual(events);
  });

  it('SET_FUNNEL_STEPS sets funnelSteps', () => {
    const steps = ['signup', 'activate'];
    const result = appReducer(initialState, { type: 'SET_FUNNEL_STEPS', payload: steps });
    expect(result.funnelSteps).toEqual(steps);
  });

  it('SET_FUNNEL_RESULTS sets funnelResults', () => {
    const results = [{ step: 'Step 1', stepNumber: 1, users: 100, conversionRate: 100, dropOff: 0 }];
    const result = appReducer(initialState, { type: 'SET_FUNNEL_RESULTS', payload: results });
    expect(result.funnelResults).toEqual(results);
  });

  it('SET_RETENTION_RESULTS sets retentionResults', () => {
    const cohorts = [{ cohortDate: '2025-01', cohortSize: 50, days: { D0: 100 } }];
    const result = appReducer(initialState, { type: 'SET_RETENTION_RESULTS', payload: cohorts });
    expect(result.retentionResults).toEqual(cohorts);
  });

  it('SET_RETENTION_TYPE sets retentionType', () => {
    const result = appReducer(initialState, { type: 'SET_RETENTION_TYPE', payload: 'paid' });
    expect(result.retentionType).toBe('paid');
  });

  it('SET_SEGMENT_RESULTS sets segmentResults', () => {
    const segments = [{ segmentName: 'Segment A', users: 100, metrics: {} }];
    const result = appReducer(initialState, { type: 'SET_SEGMENT_RESULTS', payload: segments as never });
    expect(result.segmentResults).toEqual(segments);
  });

  it('SET_INSIGHTS sets insights', () => {
    const insights = [{ type: 'warning', title: 'Test', description: 'desc', priority: 1 }];
    const result = appReducer(initialState, { type: 'SET_INSIGHTS', payload: insights as never });
    expect(result.insights).toEqual(insights);
  });

  it('SET_SUBSCRIPTION_KPIS sets subscriptionKPIs', () => {
    const kpis = { mrr: 1000, churnRate: 5 };
    const result = appReducer(initialState, { type: 'SET_SUBSCRIPTION_KPIS', payload: kpis as never });
    expect(result.subscriptionKPIs).toEqual(kpis);
  });

  it('SET_TRIAL_ANALYSIS sets trialAnalysis', () => {
    const trial = { totalTrials: 100, conversionRate: 25 };
    const result = appReducer(initialState, { type: 'SET_TRIAL_ANALYSIS', payload: trial as never });
    expect(result.trialAnalysis).toEqual(trial);
  });

  it('SET_CHURN_ANALYSIS sets churnAnalysis', () => {
    const churn = { totalChurned: 10, churnRate: 5 };
    const result = appReducer(initialState, { type: 'SET_CHURN_ANALYSIS', payload: churn as never });
    expect(result.churnAnalysis).toEqual(churn);
  });

  it('SET_PAID_RETENTION sets paidRetentionResults', () => {
    const retention = [{ cohortDate: '2025-01', cohortSize: 20, days: { D0: 100 } }];
    const result = appReducer(initialState, { type: 'SET_PAID_RETENTION', payload: retention });
    expect(result.paidRetentionResults).toEqual(retention);
  });

  it('SET_PROCESSING sets isProcessing, progress, message', () => {
    const payload = { isProcessing: true, progress: 50, message: 'Loading...' };
    const result = appReducer(initialState, { type: 'SET_PROCESSING', payload });
    expect(result.isProcessing).toBe(true);
    expect(result.processingProgress).toBe(50);
    expect(result.processingMessage).toBe('Loading...');
  });

  it('SET_DATA_QUALITY sets dataQualityReport', () => {
    const report = { score: 85, issues: [] };
    const result = appReducer(initialState, { type: 'SET_DATA_QUALITY', payload: report as never });
    expect(result.dataQualityReport).toEqual(report);
  });

  it('SET_RECENT_FILES sets recentFiles', () => {
    const files = [{ fileName: 'test.csv', rowCount: 100, columnCount: 5, lastOpened: '2025-01-01' }];
    const result = appReducer(initialState, { type: 'SET_RECENT_FILES', payload: files });
    expect(result.recentFiles).toEqual(files);
  });

  it('SET_AI_SUMMARY sets aiSummary', () => {
    const result = appReducer(initialState, { type: 'SET_AI_SUMMARY', payload: 'AI analysis result' });
    expect(result.aiSummary).toBe('AI analysis result');
  });

  it('RESET_ANALYSIS resets analysis fields but preserves data', () => {
    const stateWithData = {
      ...initialState,
      rawData: [{ col: 'val' }],
      headers: ['col'],
      currentDataset: 'file.csv',
      funnelSteps: ['a', 'b'],
      funnelResults: [{ step: 'a', stepNumber: 1, users: 10, conversionRate: 100, dropOff: 0 }],
      retentionResults: [{ cohortDate: '2025-01', cohortSize: 5, days: {} }],
      retentionType: 'paid' as const,
      insights: [{ type: 'info' as const, icon: 'i', title: 't', body: 'd' }],
      aiSummary: 'summary',
    };

    const result = appReducer(stateWithData, { type: 'RESET_ANALYSIS' });

    // Data preserved
    expect(result.rawData).toEqual(stateWithData.rawData);
    expect(result.headers).toEqual(stateWithData.headers);
    expect(result.currentDataset).toBe('file.csv');

    // Analysis reset
    expect(result.funnelSteps).toEqual([]);
    expect(result.funnelResults).toBeNull();
    expect(result.retentionResults).toBeNull();
    expect(result.segmentResults).toBeNull();
    expect(result.insights).toEqual([]);
    expect(result.subscriptionKPIs).toBeNull();
    expect(result.trialAnalysis).toBeNull();
    expect(result.churnAnalysis).toBeNull();
    expect(result.paidRetentionResults).toBeNull();
    expect(result.retentionType).toBe('activity');
    expect(result.aiSummary).toBe('');
  });

  it('does not mutate previous state', () => {
    const prevState = { ...initialState };
    const frozen = Object.freeze({ ...prevState });
    // Should not throw with frozen state
    const result = appReducer(frozen as typeof initialState, {
      type: 'SET_AI_SUMMARY',
      payload: 'test',
    });
    expect(result).not.toBe(frozen);
    expect(result.aiSummary).toBe('test');
    expect(frozen.aiSummary).toBe('');
  });
});
