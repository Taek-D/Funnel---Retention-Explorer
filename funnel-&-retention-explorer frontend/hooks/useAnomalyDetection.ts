import { useMemo, useState } from 'react';
import { detectAnomalies } from '../lib/anomalyDetector';
import type { TimeSeriesPoint, AnomalyResult, Sensitivity } from '../lib/anomalyDetector';

export function useAnomalyDetection(series: TimeSeriesPoint[]) {
  const [sensitivity, setSensitivity] = useState<Sensitivity>('medium');

  const anomalies: AnomalyResult[] = useMemo(() => {
    if (series.length < 8) return [];
    return detectAnomalies(series, sensitivity);
  }, [series, sensitivity]);

  return { anomalies, sensitivity, setSensitivity };
}
