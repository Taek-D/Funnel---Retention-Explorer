import type { ProcessedEvent } from '../types';

export interface PeriodKPI {
  uniqueUsers: number;
  totalEvents: number;
  avgEventsPerUser: number;
}

export interface PeriodComparisonResult {
  current: PeriodKPI;
  previous: PeriodKPI;
  deltas: {
    uniqueUsers: number;
    totalEvents: number;
    avgEventsPerUser: number;
  };
  currentLabel: string;
  previousLabel: string;
}

function computeKPI(events: ProcessedEvent[]): PeriodKPI {
  const users = new Set(events.map(e => e.userId));
  const uniqueUsers = users.size;
  const totalEvents = events.length;
  const avgEventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;
  return { uniqueUsers, totalEvents, avgEventsPerUser };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function comparePeriods(
  data: ProcessedEvent[],
  currentStart: Date,
  currentEnd: Date,
): PeriodComparisonResult {
  const periodMs = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - periodMs);
  const previousEnd = new Date(currentStart.getTime());

  const currentEvents = data.filter(
    e => e.timestamp >= currentStart && e.timestamp <= currentEnd,
  );
  const previousEvents = data.filter(
    e => e.timestamp >= previousStart && e.timestamp < previousEnd,
  );

  const current = computeKPI(currentEvents);
  const previous = computeKPI(previousEvents);

  return {
    current,
    previous,
    deltas: {
      uniqueUsers: pctChange(current.uniqueUsers, previous.uniqueUsers),
      totalEvents: pctChange(current.totalEvents, previous.totalEvents),
      avgEventsPerUser: pctChange(current.avgEventsPerUser, previous.avgEventsPerUser),
    },
    currentLabel: `${formatLabel(currentStart)}–${formatLabel(currentEnd)}`,
    previousLabel: `${formatLabel(previousStart)}–${formatLabel(previousEnd)}`,
  };
}

export function autoComparePeriods(data: ProcessedEvent[]): PeriodComparisonResult | null {
  if (data.length === 0) return null;

  let maxTs = 0;
  for (const e of data) {
    const t = e.timestamp.getTime();
    if (t > maxTs) maxTs = t;
  }

  const currentEnd = new Date(maxTs);
  const currentStart = new Date(maxTs - 7 * 24 * 60 * 60 * 1000);

  return comparePeriods(data, currentStart, currentEnd);
}
