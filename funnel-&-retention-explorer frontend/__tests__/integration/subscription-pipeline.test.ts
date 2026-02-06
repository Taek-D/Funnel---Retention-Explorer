import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import {
  SMALL_SUBSCRIPTION_CSV,
  EXPECTED_TOTAL_USERS,
  EXPECTED_SUBSCRIBE_USERS,
  EXPECTED_CANCEL_USERS,
  EXPECTED_GROSS_REVENUE,
} from '../fixtures/small-subscription';
import { calculateSubscriptionKPIs, analyzeTrialConversion, analyzeChurn } from '../../lib/subscriptionEngine';

describe('Subscription Pipeline', () => {
  it('calculateSubscriptionKPIs returns correct user counts', async () => {
    const { rawData, headers, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);

    expect(kpis).not.toBeNull();
    expect(kpis!.users_total).toBe(EXPECTED_TOTAL_USERS);
    expect(kpis!.users_subscribed).toBe(EXPECTED_SUBSCRIBE_USERS);
    expect(kpis!.cancel_events).toBeGreaterThanOrEqual(EXPECTED_CANCEL_USERS);
  });

  it('calculates revenue correctly', async () => {
    const { rawData, headers, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);

    expect(kpis).not.toBeNull();
    expect(kpis!.gross_revenue).toBe(EXPECTED_GROSS_REVENUE);
    expect(kpis!.arppu).not.toBeNull();
    expect(kpis!.arppu).toBeGreaterThan(0);
  });

  it('detects plan mix', async () => {
    const { rawData, headers, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);

    expect(kpis).not.toBeNull();
    const { monthly, yearly, other } = kpis!.plan_mix;
    // monthly + yearly + other should sum to ~100
    expect(monthly + yearly + other).toBeCloseTo(100, 0);
  });

  it('analyzeTrialConversion returns trial data', async () => {
    const { rawData, headers, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const trial = analyzeTrialConversion(rawData, mapping, headers);

    expect(trial).not.toBeNull();
    expect(trial!.overall.trial_users).toBeGreaterThan(0);
    expect(trial!.overall.conversion_rate).toBeGreaterThanOrEqual(0);
    expect(trial!.overall.conversion_rate).toBeLessThanOrEqual(100);
    expect(trial!.by_trial_days.length).toBeGreaterThan(0);
  });

  it('analyzeChurn identifies churned users', async () => {
    const { rawData, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const churn = analyzeChurn(rawData, mapping);

    expect(churn).not.toBeNull();
    expect(churn!.churn_users).toBe(EXPECTED_CANCEL_USERS);
    expect(churn!.churn_rate_paid).toBeGreaterThan(0);
    expect(churn!.cancel_reason_top.length).toBeGreaterThan(0);
    // "too_expensive" should be the top reason
    expect(churn!.cancel_reason_top[0].reason).toBe('too_expensive');
  });

  it('returns null for empty data', () => {
    const kpis = calculateSubscriptionKPIs([], { eventname: 'event_name' }, []);
    expect(kpis).toBeNull();
  });
});
