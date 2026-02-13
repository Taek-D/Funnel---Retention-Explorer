import type { ProcessedEvent, ABTestSegment, ABTestStepResult, ABTestResult } from '../types';
import { calculateSegmentFunnel, calculatePValue } from './segmentEngine';

export function runABTest(
  data: ProcessedEvent[],
  steps: string[],
  segmentA: ABTestSegment,
  segmentB: ABTestSegment
): ABTestResult {
  const dataA = filterBySegment(data, segmentA);
  const dataB = filterBySegment(data, segmentB);

  const funnelA = calculateSegmentFunnel(dataA, steps, false);
  const funnelB = calculateSegmentFunnel(dataB, steps, false);

  const stepResults: ABTestStepResult[] = steps.map((step, i) => {
    const stepA = funnelA[i];
    const stepB = funnelB[i];

    const usersA = stepA ? stepA.userCount : 0;
    const usersB = stepB ? stepB.userCount : 0;
    const rateA = stepA ? stepA.conversionRate : 0;
    const rateB = stepB ? stepB.conversionRate : 0;
    const diff = rateA - rateB;

    const totalA = funnelA[0] ? funnelA[0].userCount : 0;
    const totalB = funnelB[0] ? funnelB[0].userCount : 0;

    const pValue = i === 0 ? 1 : calculatePValue(usersA, totalA, usersB, totalB);
    const ci95 = calculateConfidenceInterval(rateA / 100, totalA, rateB / 100, totalB);
    const significant = pValue < 0.05 && i > 0;

    return { step, usersA, usersB, rateA, rateB, diff, pValue, ci95, significant };
  });

  const lastStep = stepResults[stepResults.length - 1];
  const overallPValue = lastStep ? lastStep.pValue : 1;
  const overallSignificant = overallPValue < 0.05;

  const sampleSizeA = funnelA[0] ? funnelA[0].userCount : 0;
  const sampleSizeB = funnelB[0] ? funnelB[0].userCount : 0;

  let winner: 'A' | 'B' | 'none' = 'none';
  if (overallSignificant && lastStep) {
    winner = lastStep.rateA > lastStep.rateB ? 'A' : 'B';
  }

  const finalRateA = lastStep ? lastStep.rateA / 100 : 0;
  const finalRateB = lastStep ? lastStep.rateB / 100 : 0;
  const recommendedSampleSize = calculateRequiredSampleSize(finalRateA, finalRateB);

  return {
    segmentA,
    segmentB,
    steps: stepResults,
    overallPValue,
    overallSignificant,
    sampleSizeA,
    sampleSizeB,
    winner,
    recommendedSampleSize,
  };
}

export function filterBySegment(
  data: ProcessedEvent[],
  segment: ABTestSegment
): ProcessedEvent[] {
  switch (segment.filter) {
    case 'platform':
      return data.filter(e => e.platform === segment.value);
    case 'channel':
      return data.filter(e => e.channel === segment.value);
    case 'custom':
      return data;
    default:
      return data;
  }
}

export function calculateConfidenceInterval(
  rateA: number,
  nA: number,
  rateB: number,
  nB: number,
  z: number = 1.96
): [number, number] {
  if (nA === 0 || nB === 0) return [0, 0];

  const diff = (rateA - rateB) * 100;
  const se = Math.sqrt(
    (rateA * (1 - rateA)) / nA +
    (rateB * (1 - rateB)) / nB
  ) * 100;

  return [
    Math.round((diff - z * se) * 100) / 100,
    Math.round((diff + z * se) * 100) / 100,
  ];
}

export function calculateRequiredSampleSize(
  rateA: number,
  rateB: number,
  alpha: number = 0.05,
  power: number = 0.8
): number {
  const diff = Math.abs(rateA - rateB);
  if (diff === 0) return 0;

  const zAlpha = 1.96;
  const zBeta = 0.84;
  const avgRate = (rateA + rateB) / 2;

  const n = Math.ceil(
    (2 * avgRate * (1 - avgRate) * Math.pow(zAlpha + zBeta, 2)) /
    Math.pow(diff, 2)
  );

  return Math.max(n, 30);
}
