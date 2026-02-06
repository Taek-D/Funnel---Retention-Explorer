import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateFunnel, loadFunnelTemplate } from '../lib/funnelEngine';
import { generateInsights } from '../lib/insightsEngine';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';

export function useFunnelAnalysis() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const setFunnelSteps = useCallback((steps: string[]) => {
    dispatch({ type: 'SET_FUNNEL_STEPS', payload: steps });
  }, [dispatch]);

  const applyTemplate = useCallback((type: 'ecommerce' | 'subscription' | 'lifecycle') => {
    const steps = loadFunnelTemplate(type);
    // Filter to only include events that exist in the data
    const availableEvents = state.uniqueEvents.map(e => e.toLowerCase());
    const validSteps = steps.filter(step =>
      availableEvents.some(e => e.includes(step.toLowerCase()) || step.toLowerCase().includes(e))
    );
    dispatch({ type: 'SET_FUNNEL_STEPS', payload: validSteps.length > 0 ? validSteps : steps });
  }, [state.uniqueEvents, dispatch]);

  const runFunnelAnalysis = useCallback(() => {
    if (state.funnelSteps.length < 2) {
      toast('warning', '최소 2개 이상의 퍼널 단계를 선택해주세요');
      return;
    }

    const results = calculateFunnel(state.processedData, state.funnelSteps);
    dispatch({ type: 'SET_FUNNEL_RESULTS', payload: results });

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

    const conversion = results.length > 1
      ? ((results[results.length - 1].users / results[0].users) * 100).toFixed(1)
      : null;
    addNotification('analysis', '퍼널 분석 완료', `${results.length}단계, 전환율 ${conversion || 'N/A'}%`);
  }, [state, dispatch, toast, addNotification]);

  return {
    funnelSteps: state.funnelSteps,
    funnelResults: state.funnelResults,
    uniqueEvents: state.uniqueEvents,
    detectedType: state.detectedType,
    hasData: state.processedData.length > 0,
    setFunnelSteps,
    applyTemplate,
    runFunnelAnalysis
  };
}
