import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateActivityRetention, calculatePaidRetention } from '../lib/retentionEngine';
import { generateInsights } from '../lib/insightsEngine';
import type { RetentionType } from '../types';

export function useRetentionAnalysis() {
  const { state, dispatch } = useAppContext();

  const setRetentionType = useCallback((type: RetentionType) => {
    dispatch({ type: 'SET_RETENTION_TYPE', payload: type });
  }, [dispatch]);

  const runRetentionAnalysis = useCallback((cohortEvent: string, activeEvents: string[]) => {
    if (state.retentionType === 'paid' && state.detectedType === 'subscription') {
      const paidRetention = state.paidRetentionResults || calculatePaidRetention(state.rawData, state.columnMapping);
      if (!paidRetention || paidRetention.length === 0) {
        alert('Paid Retention 데이터가 없습니다. subscribe 이벤트가 필요합니다.');
        return;
      }

      // Transform for display
      const transformed = paidRetention.map(cohort => ({
        cohortDate: cohort.cohortDate,
        cohortSize: cohort.cohortSize,
        days: {
          D0: cohort.days.D0 || 100,
          D7: cohort.days.D7 || 0,
          D14: cohort.days.D14 || 0,
          D30: cohort.days.D30 || 0,
          D60: cohort.days.D60 || 0,
          D90: cohort.days.D90 || 0
        }
      }));

      dispatch({ type: 'SET_RETENTION_RESULTS', payload: transformed });
    } else {
      if (!cohortEvent) {
        alert('코호트 이벤트를 선택해주세요');
        return;
      }
      if (activeEvents.length === 0) {
        alert('최소 1개 이상의 활성 이벤트를 선택해주세요');
        return;
      }

      const results = calculateActivityRetention(state.processedData, cohortEvent, activeEvents);
      dispatch({ type: 'SET_RETENTION_RESULTS', payload: results });
    }

    // Regenerate insights
    const insights = generateInsights(
      state.processedData,
      state.detectedType,
      state.subscriptionKPIs,
      state.trialAnalysis,
      state.churnAnalysis,
      state.paidRetentionResults
    );
    dispatch({ type: 'SET_INSIGHTS', payload: insights });
  }, [state, dispatch]);

  return {
    retentionResults: state.retentionResults,
    retentionType: state.retentionType,
    uniqueEvents: state.uniqueEvents,
    detectedType: state.detectedType,
    hasData: state.processedData.length > 0,
    setRetentionType,
    runRetentionAnalysis
  };
}
