import type { ProcessedEvent, FunnelStep, FunnelTimeStats } from '../types';
import { FUNNEL_TEMPLATES } from './constants';
import { getUsersByEvent } from './eventUtils';
import { startSpan } from './sentry';
import { createEngineCache, getCached, setCached } from './engineCache';

const funnelCache = createEngineCache<FunnelStep[]>();
const fullFunnelCache = createEngineCache<FunnelStep[] | null>();

export function loadFunnelTemplate(type: 'ecommerce' | 'subscription' | 'lifecycle'): string[] {
  return FUNNEL_TEMPLATES[type] || FUNNEL_TEMPLATES.ecommerce;
}

export function calculateFunnel(processedData: ProcessedEvent[], steps: string[]): FunnelStep[] {
  if (steps.length < 2) return [];
  const key = steps.join('|');
  const cached = getCached(funnelCache, processedData, key);
  if (cached) return cached;
  const result = startSpan('analysis.funnel', 'compute', () => _calculateFunnel(processedData, steps));
  setCached(funnelCache, processedData, key, result);
  return result;
}

function _calculateFunnel(processedData: ProcessedEvent[], steps: string[]): FunnelStep[] {

  const funnelData: FunnelStep[] = [];
  const usersByStep: Record<string, Set<string>> = {};

  steps.forEach((step, index) => {
    if (index === 0) {
      const users = getUsersByEvent(processedData, step);
      usersByStep[step] = users;
      funnelData.push({
        step,
        stepNumber: index + 1,
        users: users.size,
        conversionRate: 100,
        dropOff: 0
      });
    } else {
      const prevStep = steps[index - 1];
      const prevUsers = usersByStep[prevStep];

      const currentUsers = new Set(
        processedData
          .filter(e => e.eventName === step && prevUsers.has(e.userId))
          .map(e => e.userId)
      );

      usersByStep[step] = currentUsers;
      const conversionRate = prevUsers.size > 0 ? (currentUsers.size / prevUsers.size) * 100 : 0;
      const dropOff = prevUsers.size - currentUsers.size;

      funnelData.push({
        step,
        stepNumber: index + 1,
        users: currentUsers.size,
        conversionRate,
        dropOff
      });
    }
  });

  // Calculate time between steps
  funnelData.forEach((stepData, index) => {
    if (index > 0) {
      const stats = calculateTimeBetweenSteps(
        processedData, steps[index - 1], steps[index], usersByStep[steps[index]]
      );
      stepData.medianTime = stats.median;
      stepData.timeStats = stats;
    }
  });

  return funnelData;
}

function calculateTimeBetweenSteps(
  processedData: ProcessedEvent[], step1: string, step2: string, userSet: Set<string>
): FunnelTimeStats {
  const zero: FunnelTimeStats = { median: 0, p10: 0, p90: 0, mean: 0, count: 0 };
  if (userSet.size === 0) return zero;

  const times: number[] = [];

  userSet.forEach(userId => {
    const step1Events = processedData.filter(e => e.userId === userId && e.eventName === step1);
    const step2Events = processedData.filter(e => e.userId === userId && e.eventName === step2);

    if (step1Events.length === 0 || step2Events.length === 0) return;

    const time1 = step1Events[0].timestamp.getTime();
    const time2Event = step2Events.find(e => e.timestamp.getTime() > time1);
    if (time2Event) {
      const diff = (time2Event.timestamp.getTime() - time1) / 1000 / 60;
      if (diff > 0) {
        times.push(diff);
      }
    }
  });

  if (times.length === 0) return zero;

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const p10 = times[Math.floor(times.length * 0.1)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;

  return { median, p10, p90, mean, count: times.length };
}

// Calculate funnel using full dataset with fuzzy event matching
export function calculateFullDataFunnel(
  processedData: ProcessedEvent[],
  detectedType: 'ecommerce' | 'subscription'
): FunnelStep[] | null {
  if (!processedData || processedData.length === 0) return null;
  const cacheKey = `full|${detectedType}`;
  const cached = getCached(fullFunnelCache, processedData, cacheKey);
  if (cached !== undefined) return cached;

  const templates: Record<string, string[]> = {
    ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
    subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe']
  };

  const steps = templates[detectedType];
  if (!steps) return null;

  const availableEvents = [...new Set(processedData.map(e => e.eventName))];
  const validSteps = steps.filter(step =>
    availableEvents.some(event => event.toLowerCase().includes(step.toLowerCase()))
  );

  if (validSteps.length < 2) return null;

  const funnelData: FunnelStep[] = [];
  const usersByStep: Record<string, Set<string>> = {};

  validSteps.forEach((step, index) => {
    if (index === 0) {
      const stepEvents = processedData.filter(event =>
        event.eventName && event.eventName.toLowerCase().includes(step.toLowerCase())
      );
      usersByStep[step] = new Set(stepEvents.map(e => e.userId));

      funnelData.push({
        step,
        stepNumber: 1,
        users: usersByStep[step].size,
        conversionRate: 100,
        dropOff: 0
      });
    } else {
      const prevUsers = usersByStep[validSteps[index - 1]];
      const stepEvents = processedData.filter(event =>
        event.eventName && event.eventName.toLowerCase().includes(step.toLowerCase())
      );

      const currentUsers = new Set(
        stepEvents.filter(event => prevUsers.has(event.userId)).map(e => e.userId)
      );

      usersByStep[step] = currentUsers;
      const conversionRate = prevUsers.size > 0 ? (currentUsers.size / prevUsers.size) * 100 : 0;
      const dropOff = prevUsers.size - currentUsers.size;

      funnelData.push({
        step,
        stepNumber: index + 1,
        users: currentUsers.size,
        conversionRate,
        dropOff
      });
    }
  });

  const result = funnelData.length > 1 ? funnelData : null;
  setCached(fullFunnelCache, processedData, cacheKey, result);
  return result;
}

export type FunnelComparisonStep = {
  step: string;
  stepNumber: number;
  usersA: number;
  usersB: number;
  rateA: number;
  rateB: number;
  diff: number;
  direction: 'up' | 'down' | 'same';
};

export type FunnelComparisonResult = {
  steps: FunnelComparisonStep[];
  totalUsersA: number;
  totalUsersB: number;
};

export function compareFunnels(
  resultA: FunnelStep[],
  resultB: FunnelStep[]
): FunnelComparisonResult {
  const maxLen = Math.max(resultA.length, resultB.length);
  const steps: FunnelComparisonStep[] = [];

  for (let i = 0; i < maxLen; i++) {
    const a = resultA[i];
    const b = resultB[i];
    const rateA = a ? a.conversionRate : 0;
    const rateB = b ? b.conversionRate : 0;
    const diff = rateB - rateA;

    steps.push({
      step: a?.step || b?.step || `Step ${i + 1}`,
      stepNumber: i + 1,
      usersA: a?.users || 0,
      usersB: b?.users || 0,
      rateA,
      rateB,
      diff,
      direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'same',
    });
  }

  return {
    steps,
    totalUsersA: resultA[0]?.users || 0,
    totalUsersB: resultB[0]?.users || 0,
  };
}
