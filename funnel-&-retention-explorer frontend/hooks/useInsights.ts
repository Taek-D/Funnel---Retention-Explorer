import { useAppContext } from '../context/AppContext';

export function useInsights() {
  const { state } = useAppContext();

  return {
    insights: state.insights,
    subscriptionKPIs: state.subscriptionKPIs,
    trialAnalysis: state.trialAnalysis,
    churnAnalysis: state.churnAnalysis,
    detectedType: state.detectedType,
    dataQualityReport: state.dataQualityReport,
    hasData: state.processedData.length > 0
  };
}
