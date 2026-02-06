import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import { SMALL_ECOMMERCE_CSV, EXPECTED_FUNNEL } from '../fixtures/small-ecommerce';
import { SMALL_SUBSCRIPTION_CSV, EXPECTED_SUBSCRIPTION_FUNNEL } from '../fixtures/small-subscription';
import { calculateFunnel, calculateFullDataFunnel, loadFunnelTemplate } from '../../lib/funnelEngine';

describe('Funnel Pipeline', () => {
  it('loadFunnelTemplate returns correct steps for ecommerce', () => {
    const steps = loadFunnelTemplate('ecommerce');
    expect(steps).toEqual(['view_item', 'add_to_cart', 'begin_checkout', 'purchase']);
  });

  it('loadFunnelTemplate returns correct steps for subscription', () => {
    const steps = loadFunnelTemplate('subscription');
    expect(steps).toEqual(['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe']);
  });

  it('calculates exact ecommerce funnel from small fixture', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateFunnel(processedData, EXPECTED_FUNNEL.steps);

    expect(result).toHaveLength(EXPECTED_FUNNEL.steps.length);
    result.forEach((step, i) => {
      expect(step.step).toBe(EXPECTED_FUNNEL.steps[i]);
      expect(step.users).toBe(EXPECTED_FUNNEL.users[i]);
      expect(step.stepNumber).toBe(i + 1);
    });

    // First step should always be 100%
    expect(result[0].conversionRate).toBe(100);
    expect(result[0].dropOff).toBe(0);
  });

  it('calculates step-to-step conversion rates correctly', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateFunnel(processedData, EXPECTED_FUNNEL.steps);

    // add_to_cart: 7/10 = 70%
    expect(result[1].conversionRate).toBeCloseTo(70, 0);
    // begin_checkout: 4/7 ≈ 57.1%
    expect(result[2].conversionRate).toBeCloseTo(57.14, 0);
    // purchase: 2/4 = 50%
    expect(result[3].conversionRate).toBeCloseTo(50, 0);
  });

  it('calculates median time between steps', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateFunnel(processedData, EXPECTED_FUNNEL.steps);

    // medianTime should exist for steps after the first
    for (let i = 1; i < result.length; i++) {
      expect(result[i].medianTime).toBeDefined();
      expect(typeof result[i].medianTime).toBe('number');
      expect(result[i].medianTime).toBeGreaterThanOrEqual(0);
    }
  });

  it('calculates exact subscription funnel from small fixture', async () => {
    const { processedData } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const result = calculateFunnel(processedData, EXPECTED_SUBSCRIPTION_FUNNEL.steps);

    expect(result).toHaveLength(EXPECTED_SUBSCRIPTION_FUNNEL.steps.length);
    result.forEach((step, i) => {
      expect(step.step).toBe(EXPECTED_SUBSCRIPTION_FUNNEL.steps[i]);
      expect(step.users).toBe(EXPECTED_SUBSCRIPTION_FUNNEL.users[i]);
    });
  });

  it('returns empty array for less than 2 steps', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    expect(calculateFunnel(processedData, ['view_item'])).toEqual([]);
    expect(calculateFunnel(processedData, [])).toEqual([]);
  });

  it('calculateFullDataFunnel works for ecommerce type', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateFullDataFunnel(processedData, 'ecommerce');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(2);
    expect(result![0].conversionRate).toBe(100);
  });
});
