import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateActivityRetention, calculatePaidRetention } from '../lib/retentionEngine';
import { generateInsights } from '../lib/insightsEngine';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';
import { trackEvent } from '../lib/analytics';
import { isCustomEventRef, getCustomEventId, resolveCustomEventRows } from '../lib/eventResolver';
import { listCustomEvents } from '../lib/supabaseData';
import { useAuth } from '../context/AuthContext';
import type { RetentionType, CohortGrouping, CustomEventDefinition } from '../types';
import i18n from '../lib/i18n';

export function useRetentionAnalysis() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [customEvents, setCustomEvents] = useState<CustomEventDefinition[]>([]);
  const [cohortGrouping, setCohortGrouping] = useState<CohortGrouping>('daily');

  useEffect(() => {
    if (user) {
      listCustomEvents(user.id).then(setCustomEvents);
    } else {
      try { const p = JSON.parse(localStorage.getItem('fre_custom_events') || '[]'); setCustomEvents(Array.isArray(p) ? p : []); } catch { /* empty */ }
    }
  }, [user]);

  const setRetentionType = useCallback((type: RetentionType) => {
    dispatch({ type: 'SET_RETENTION_TYPE', payload: type });
  }, [dispatch]);

  const runRetentionAnalysis = useCallback((cohortEvent: string, activeEvents: string[], dataOverride?: typeof state.processedData) => {
    if (state.retentionType === 'paid' && state.detectedType === 'subscription') {
      const paidRetention = state.paidRetentionResults || calculatePaidRetention(state.rawData, state.columnMapping);
      if (!paidRetention || paidRetention.length === 0) {
        toast('warning', i18n.t('analysis.paidNoData'), i18n.t('analysis.paidNoDataDesc'));
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
        toast('warning', i18n.t('analysis.selectCohort'));
        return;
      }
      if (activeEvents.length === 0) {
        toast('warning', i18n.t('analysis.selectActive'));
        return;
      }

      const baseData = dataOverride ?? state.processedData;
      // Resolve custom event references
      let resolvedCohort = cohortEvent;
      let data = baseData;
      const virtualEvents: typeof baseData = [];

      if (isCustomEventRef(cohortEvent)) {
        const ce = customEvents.find(c => c.id === getCustomEventId(cohortEvent));
        if (ce) {
          resolvedCohort = `__custom__${ce.id}`;
          resolveCustomEventRows(baseData, ce).forEach(row => virtualEvents.push({ ...row, eventName: resolvedCohort }));
        }
      }

      const resolvedActive = activeEvents.map(ae => {
        if (isCustomEventRef(ae)) {
          const ce = customEvents.find(c => c.id === getCustomEventId(ae));
          if (ce) {
            const virtualName = `__custom__${ce.id}`;
            resolveCustomEventRows(baseData, ce).forEach(row => virtualEvents.push({ ...row, eventName: virtualName }));
            return virtualName;
          }
        }
        return ae;
      });

      if (virtualEvents.length > 0) data = [...baseData, ...virtualEvents];
      const results = calculateActivityRetention(data, resolvedCohort, resolvedActive, cohortGrouping);
      dispatch({ type: 'SET_RETENTION_RESULTS', payload: results });
    }

    trackEvent('retention_analysis', { retention_type: state.retentionType });
    addNotification('analysis', i18n.t('analysis.retentionComplete'), i18n.t('analysis.retentionCompleteDesc'));

    // Regenerate insights
    const insightsData = dataOverride ?? state.processedData;
    const insights = generateInsights(
      insightsData,
      state.detectedType,
      state.subscriptionKPIs,
      state.trialAnalysis,
      state.churnAnalysis,
      state.paidRetentionResults
    );
    dispatch({ type: 'SET_INSIGHTS', payload: insights });
  }, [state, dispatch, toast, addNotification]);

  return useMemo(() => ({
    retentionResults: state.retentionResults,
    retentionType: state.retentionType,
    uniqueEvents: state.uniqueEvents,
    detectedType: state.detectedType,
    hasData: state.processedData.length > 0,
    cohortGrouping,
    setRetentionType,
    setCohortGrouping,
    runRetentionAnalysis,
  }), [
    state.retentionResults, state.retentionType, state.uniqueEvents,
    state.detectedType, state.processedData.length, cohortGrouping,
    setRetentionType, setCohortGrouping, runRetentionAnalysis,
  ]);
}
