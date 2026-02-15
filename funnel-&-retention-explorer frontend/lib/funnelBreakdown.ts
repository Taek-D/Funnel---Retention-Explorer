import type { ProcessedEvent, FunnelStep } from '../types';
import { calculateFunnel } from './funnelEngine';

export type BreakdownProperty = 'platform' | 'channel';

export interface BreakdownGroup {
  name: string;
  eventCount: number;
  funnel: FunnelStep[];
  overallConversion: number;
}

export interface FunnelBreakdownResult {
  property: BreakdownProperty;
  groups: BreakdownGroup[];
  steps: string[];
}

export function calculateFunnelBreakdown(
  data: ProcessedEvent[],
  steps: string[],
  property: BreakdownProperty,
): FunnelBreakdownResult {
  if (steps.length < 2 || data.length === 0) {
    return { property, groups: [], steps };
  }

  const buckets = new Map<string, ProcessedEvent[]>();
  for (const event of data) {
    const val = event[property] || 'Unknown';
    let arr = buckets.get(val);
    if (!arr) {
      arr = [];
      buckets.set(val, arr);
    }
    arr.push(event);
  }

  const groups: BreakdownGroup[] = [];
  for (const [name, events] of buckets) {
    const funnel = calculateFunnel(events, steps);
    const first = funnel[0];
    const last = funnel[funnel.length - 1];
    const overallConversion =
      first && first.users > 0 && last
        ? (last.users / first.users) * 100
        : 0;
    groups.push({ name, eventCount: events.length, funnel, overallConversion });
  }

  groups.sort((a, b) => b.eventCount - a.eventCount);

  return { property, groups, steps };
}
