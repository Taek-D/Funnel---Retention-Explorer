import type { ProcessedEvent, SegmentResult, SegmentFunnelStep } from '../types';

export function compareSegments(
  processedData: ProcessedEvent[],
  funnelSteps: string[],
  platforms: string[],
  channels: string[]
): SegmentResult[] {
  const allFunnel = calculateSegmentFunnel(processedData, funnelSteps, false);
  const baselineConversion = allFunnel.length > 0 ? allFunnel[allFunnel.length - 1].conversionRate : 0;

  const segments: SegmentResult[] = [];

  platforms.forEach(platform => {
    const segmentData = processedData.filter(e => e.platform === platform);
    const segmentFunnel = calculateSegmentFunnel(segmentData, funnelSteps, false);

    if (segmentFunnel.length === 0) return;

    const finalStep = segmentFunnel[segmentFunnel.length - 1];
    const conversion = finalStep.conversionRate;
    const uplift = conversion - baselineConversion;

    const pValue = calculatePValue(
      finalStep.userCount,
      segmentFunnel[0].userCount,
      allFunnel[allFunnel.length - 1].userCount,
      allFunnel[0].userCount
    );

    segments.push({
      name: `플랫폼: ${platform}`,
      type: 'platform',
      population: segmentFunnel[0].userCount,
      conversion,
      uplift,
      pValue,
      stepByStep: segmentFunnel
    });
  });

  channels.forEach(channel => {
    const segmentData = processedData.filter(e => e.channel === channel);
    const segmentFunnel = calculateSegmentFunnel(segmentData, funnelSteps, false);

    if (segmentFunnel.length === 0) return;

    const finalStep = segmentFunnel[segmentFunnel.length - 1];
    const conversion = finalStep.conversionRate;
    const uplift = conversion - baselineConversion;

    const pValue = calculatePValue(
      finalStep.userCount,
      segmentFunnel[0].userCount,
      allFunnel[allFunnel.length - 1].userCount,
      allFunnel[0].userCount
    );

    segments.push({
      name: `채널: ${channel}`,
      type: 'channel',
      population: segmentFunnel[0].userCount,
      conversion,
      uplift,
      pValue,
      stepByStep: segmentFunnel
    });
  });

  return segments;
}

export function calculateSegmentFunnel(
  segmentData: ProcessedEvent[],
  steps: string[],
  strictOrder: boolean
): SegmentFunnelStep[] {
  const results: SegmentFunnelStep[] = [];

  steps.forEach((stepName, index) => {
    let stepUsers: Set<string>;

    if (strictOrder && index > 0) {
      const prevStepUsers = results[index - 1].users;
      stepUsers = new Set<string>();

      prevStepUsers.forEach(userId => {
        const userEvents = segmentData
          .filter(e => e.userId === userId)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const prevEvent = userEvents.find(e => e.eventName === steps[index - 1]);
        const currentEvent = userEvents.find(e =>
          e.eventName === stepName &&
          e.timestamp.getTime() > (prevEvent?.timestamp?.getTime() || 0)
        );

        if (currentEvent) stepUsers.add(userId);
      });
    } else {
      stepUsers = new Set(
        segmentData.filter(e => e.eventName === stepName).map(e => e.userId)
      );
    }

    const userCount = stepUsers.size;
    const conversionRate = index === 0 ? 100 :
      (results[0].users.size > 0 ? (userCount / results[0].users.size * 100) : 0);
    const dropOff = index === 0 ? 0 :
      results[index - 1].users.size - userCount;

    results.push({ step: stepName, users: stepUsers, userCount, conversionRate, dropOff });
  });

  return results;
}

// Calculate full data segments for insights
export function calculateFullDataSegments(
  processedData: ProcessedEvent[],
  detectedType: 'ecommerce' | 'subscription'
): { type: string; name: string; conversion: number }[] | null {
  if (!processedData || processedData.length === 0) return null;

  const templates: Record<string, string[]> = {
    ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
    subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe']
  };
  const steps = templates[detectedType];
  if (!steps) return null;

  const segments: { type: string; name: string; conversion: number }[] = [];

  const platforms = [...new Set(processedData.map(e => e.platform).filter(Boolean))] as string[];
  platforms.forEach(platform => {
    const platformData = processedData.filter(e => e.platform === platform);
    if (platformData.length > 0) {
      const conversion = calculateConversionRate(platformData, steps);
      if (conversion !== null) {
        segments.push({ type: 'platform', name: platform, conversion });
      }
    }
  });

  const channels = [...new Set(processedData.map(e => e.channel).filter(Boolean))] as string[];
  channels.forEach(channel => {
    const channelData = processedData.filter(e => e.channel === channel);
    if (channelData.length > 0) {
      const conversion = calculateConversionRate(channelData, steps);
      if (conversion !== null) {
        segments.push({ type: 'channel', name: channel, conversion });
      }
    }
  });

  return segments.length > 0 ? segments : null;
}

function calculateConversionRate(data: ProcessedEvent[], steps: string[]): number | null {
  if (!data || data.length === 0 || !steps || steps.length < 2) return null;

  const firstStepUsers = new Set(
    data.filter(e => e.eventName && e.eventName.toLowerCase().includes(steps[0].toLowerCase()))
      .map(e => e.userId)
  );

  const lastStepUsers = new Set(
    data.filter(e => e.eventName && e.eventName.toLowerCase().includes(steps[steps.length - 1].toLowerCase()))
      .map(e => e.userId)
  );

  const completedUsers = [...lastStepUsers].filter(userId => firstStepUsers.has(userId));

  return firstStepUsers.size > 0 ? (completedUsers.length / firstStepUsers.size) * 100 : 0;
}

// Statistical functions
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const tau = t * Math.exp(-x * x - 1.26551223 +
    t * (1.00002368 +
      t * (0.37409196 +
        t * (0.09678418 +
          t * (-0.18628806 +
            t * (0.27886807 +
              t * (-1.13520398 +
                t * (1.48851587 +
                  t * (-0.82215223 +
                    t * 0.17087277)))))))));
  return x >= 0 ? 1 - tau : tau - 1;
}

function calculatePValue(count1: number, total1: number, count2: number, total2: number): number {
  if (total1 === 0 || total2 === 0) return 1.0;
  const p1 = count1 / total1;
  const p2 = count2 / total2;
  const pPool = (count1 + count2) / (total1 + total2);

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / total1 + 1 / total2));
  if (se === 0) return 1.0;

  const z = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return Math.min(1.0, Math.max(0.0, pValue));
}
