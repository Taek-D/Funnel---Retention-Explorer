export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface AnomalyResult {
  date: string;
  value: number;
  expected: number;
  zScore: number;
  type: 'spike' | 'drop';
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export type Sensitivity = 'high' | 'medium' | 'low';

const THRESHOLDS: Record<Sensitivity, number> = {
  high: 1.5,
  medium: 2.0,
  low: 2.5,
};

export function detectAnomalies(
  series: TimeSeriesPoint[],
  sensitivity: Sensitivity = 'medium',
  windowSize = 7,
): AnomalyResult[] {
  if (series.length < windowSize + 1) return [];

  const threshold = THRESHOLDS[sensitivity];
  const anomalies: AnomalyResult[] = [];

  for (let i = windowSize; i < series.length; i++) {
    const window = series.slice(i - windowSize, i).map(p => p.value);
    const avg = mean(window);
    const sd = stdDev(window, avg);

    if (sd === 0) continue;

    const z = (series[i].value - avg) / sd;

    if (Math.abs(z) >= threshold) {
      anomalies.push({
        date: series[i].date,
        value: series[i].value,
        expected: Math.round(avg * 10) / 10,
        zScore: Math.round(z * 100) / 100,
        type: z > 0 ? 'spike' : 'drop',
      });
    }
  }

  return anomalies;
}
