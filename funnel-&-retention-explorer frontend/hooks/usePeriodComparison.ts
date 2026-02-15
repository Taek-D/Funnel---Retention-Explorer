import { useMemo } from 'react';
import type { ProcessedEvent } from '../types';
import { autoComparePeriods, type PeriodComparisonResult } from '../lib/periodComparison';

export function usePeriodComparison(data: ProcessedEvent[]): PeriodComparisonResult | null {
  return useMemo(() => autoComparePeriods(data), [data]);
}
