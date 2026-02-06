import { useCallback, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { compareSegments } from '../lib/segmentEngine';
import { generateInsights } from '../lib/insightsEngine';
import { useToast } from '../components/Toast';

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
      toast('warning', '비교할 세그먼트를 최소 1개 선택해주세요');
      return;
    }

    if (!state.funnelSteps || state.funnelSteps.length === 0) {
      toast('warning', '먼저 퍼널을 계산해주세요');
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
