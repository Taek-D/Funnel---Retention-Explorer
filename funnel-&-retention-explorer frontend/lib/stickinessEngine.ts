import type { ProcessedEvent } from '../types';
import { startSpan } from './sentry';

export type StickinessDay = {
  date: string;
  dau: number;
  mau: number;
  ratio: number;
};

export type StickinessSummary = {
  avgDAU: number;
  avgMAU: number;
  avgRatio: number;
  peakRatio: number;
  lowRatio: number;
  totalDays: number;
};

export type StickinessResult = {
  summary: StickinessSummary;
  daily: StickinessDay[];
};

export function calculateStickiness(
  processedData: ProcessedEvent[],
  windowDays: number = 28
): StickinessResult {
  return startSpan('analysis.stickiness', 'compute', () => _calculateStickiness(processedData, windowDays));
}

function _calculateStickiness(
  processedData: ProcessedEvent[],
  windowDays: number
): StickinessResult {
  // Build date -> unique users map
  const dateUsers = new Map<string, Set<string>>();
  for (const event of processedData) {
    const dateKey = event.timestamp.toISOString().split('T')[0];
    const existing = dateUsers.get(dateKey);
    if (existing) {
      existing.add(event.userId);
    } else {
      dateUsers.set(dateKey, new Set([event.userId]));
    }
  }

  const sortedDates = [...dateUsers.keys()].sort();
  if (sortedDates.length === 0) {
    return {
      summary: { avgDAU: 0, avgMAU: 0, avgRatio: 0, peakRatio: 0, lowRatio: 0, totalDays: 0 },
      daily: [],
    };
  }

  const daily: StickinessDay[] = [];

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    const dauSet = dateUsers.get(currentDate)!;
    const dau = dauSet.size;

    // Compute MAU: unique users in the window ending at currentDate
    const mauSet = new Set<string>();
    for (let j = i; j >= 0; j--) {
      const pastDate = sortedDates[j];
      // Check if pastDate is within windowDays of currentDate
      const diffMs = new Date(currentDate).getTime() - new Date(pastDate).getTime();
      const diffDays = diffMs / 86400000;
      if (diffDays >= windowDays) break;
      const users = dateUsers.get(pastDate)!;
      for (const u of users) mauSet.add(u);
    }

    const mau = mauSet.size;
    const ratio = mau > 0 ? Math.round((dau / mau) * 1000) / 10 : 0;

    daily.push({ date: currentDate, dau, mau, ratio });
  }

  const totalDays = daily.length;
  const sumDAU = daily.reduce((s, d) => s + d.dau, 0);
  const sumMAU = daily.reduce((s, d) => s + d.mau, 0);
  const sumRatio = daily.reduce((s, d) => s + d.ratio, 0);
  const ratios = daily.map(d => d.ratio);

  return {
    summary: {
      avgDAU: Math.round(sumDAU / totalDays),
      avgMAU: Math.round(sumMAU / totalDays),
      avgRatio: Math.round(sumRatio / totalDays * 10) / 10,
      peakRatio: Math.max(...ratios),
      lowRatio: Math.min(...ratios),
      totalDays,
    },
    daily,
  };
}
