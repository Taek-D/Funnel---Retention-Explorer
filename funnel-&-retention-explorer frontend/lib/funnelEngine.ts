import type { ProcessedEvent, FunnelStep } from '../types';
import { FUNNEL_TEMPLATES } from './constants';

export function loadFunnelTemplate(type: 'ecommerce' | 'subscription' | 'lifecycle'): string[] {
  return FUNNEL_TEMPLATES[type] || FUNNEL_TEMPLATES.ecommerce;
}

export function calculateFunnel(processedData: ProcessedEvent[], steps: string[]): FunnelStep[] {
  if (steps.length < 2) return [];

  const funnelData: FunnelStep[] = [];
  const usersByStep: Record<string, Set<string>> = {};

  steps.forEach((step, index) => {
    if (index === 0) {
      const users = new Set(
        processedData.filter(e => e.eventName === step).map(e => e.userId)
      );
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
      const times = calculateMedianTimeBetweenSteps(
        processedData, steps[index - 1], steps[index], usersByStep[steps[index]]
      );
      stepData.medianTime = times.median;
    }
  });

  return funnelData;
}

function calculateMedianTimeBetweenSteps(
  processedData: ProcessedEvent[], step1: string, step2: string, userSet: Set<string>
): { median: number } {
  const times: number[] = [];

  userSet.forEach(userId => {
    const step1Events = processedData.filter(e => e.userId === userId && e.eventName === step1);
    const step2Events = processedData.filter(e => e.userId === userId && e.eventName === step2);

    if (step1Events.length > 0 && step2Events.length > 0) {
      const time1 = step1Events[0].timestamp.getTime();
      const time2 = step2Events.find(e => e.timestamp.getTime() > time1);
      if (time2) {
        const diff = (time2.timestamp.getTime() - time1) / 1000 / 60;
        times.push(diff);
      }
    }
  });

  times.sort((a, b) => a - b);
  const median = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;

  return { median };
}

// Calculate funnel using full dataset with fuzzy event matching
export function calculateFullDataFunnel(
  processedData: ProcessedEvent[],
  detectedType: 'ecommerce' | 'subscription'
): FunnelStep[] | null {
  if (!processedData || processedData.length === 0) return null;

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

  return funnelData.length > 1 ? funnelData : null;
}
