import { useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { compareSegments } from '../lib/segmentEngine';
import { generateInsights } from '../lib/insightsEngine';
import { useToast } from '../components/Toast';
import i18n from '../lib/i18n';

export function useSegmentComparison() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();

  const availablePlatforms = useMemo(() => {
    return [...new Set(state.processedData.map(e => e.platform).filter(Boolean))] as string[];
  }, [state.processedData]);

  const availableChannels = useMemo(() => {
    return [...new Set(state.processedData.map(e => e.channel).filter(Boolean))] as string[];
  }, [state.processedData]);

  const runComparison = useCallback((platforms: string[], channels: string[]) => {
    if (platforms.length === 0 && channels.length === 0) {
      toast('warning', i18n.t('analysis.selectSegment'));
      return;
    }

    if (!state.funnelSteps || state.funnelSteps.length === 0) {
      toast('warning', i18n.t('analysis.calculateFunnel'));
      return;
    }

    const results = compareSegments(state.processedData, state.funnelSteps, platforms, channels);
    dispatch({ type: 'SET_SEGMENT_RESULTS', payload: results });

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
  }, [state, dispatch, toast]);

  return {
    segmentResults: state.segmentResults,
    availablePlatforms,
    availableChannels,
    hasData: state.processedData.length > 0,
    hasFunnel: state.funnelSteps.length > 0,
    runComparison
  };
}
