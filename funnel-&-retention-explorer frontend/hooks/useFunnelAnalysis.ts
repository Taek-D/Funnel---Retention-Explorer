import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateFunnel, loadFunnelTemplate } from '../lib/funnelEngine';
import { generateInsights } from '../lib/insightsEngine';

export function useFunnelAnalysis() {
  const { state, dispatch } = useAppContext();

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
      alert('최소 2개 이상의 퍼널 단계를 선택해주세요');
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
  }, [state, dispatch]);

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
