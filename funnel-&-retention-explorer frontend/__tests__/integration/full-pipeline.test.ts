import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import { loadEcommerceSampleCSV } from '../fixtures/ecommerce-sample';
import { loadSubscriptionSampleCSV } from '../fixtures/subscription-sample';
import { calculateFunnel, calculateFullDataFunnel, loadFunnelTemplate } from '../../lib/funnelEngine';
import { calculateActivityRetention, calculatePaidRetention } from '../../lib/retentionEngine';
import { compareSegments } from '../../lib/segmentEngine';
import { calculateSubscriptionKPIs, analyzeTrialConversion, analyzeChurn } from '../../lib/subscriptionEngine';
import { generateInsights } from '../../lib/insightsEngine';
import { getUniqueEvents, generateDataQualityReport } from '../../lib/dataProcessor';

describe('Full Pipeline E2E - Real 3000-row Ecommerce CSV', () => {
  it('runs the complete ecommerce analysis pipeline', async () => {
    const csv = loadEcommerceSampleCSV();
    const { rawData, headers, mapping, processedData, detectedType } = await parseAndProcess(csv);

    // Step 1: Data validation
    expect(rawData.length).toBeGreaterThan(2000);
    expect(processedData.length).toBeGreaterThan(2000);
    expect(detectedType).toBe('ecommerce');

    // Step 2: Data quality
    const report = generateDataQualityReport(rawData, processedData);
    expect(report.uniqueUsers).toBeGreaterThan(50);
    expect(report.topEvents.length).toBeGreaterThan(0);

    // Step 3: Funnel
    const steps = loadFunnelTemplate('ecommerce');
    const funnel = calculateFunnel(processedData, steps);
    expect(funnel.length).toBe(4);
    expect(funnel[0].users).toBeGreaterThan(0);
    // Each step should have fewer or equal users than the previous
    for (let i = 1; i < funnel.length; i++) {
      expect(funnel[i].users).toBeLessThanOrEqual(funnel[i - 1].users);
    }

    // Step 4: Full data funnel
    const fullFunnel = calculateFullDataFunnel(processedData, 'ecommerce');
    expect(fullFunnel).not.toBeNull();

    // Step 5: Retention
    const uniqueEvents = getUniqueEvents(processedData);
    const cohortEvent = uniqueEvents.includes('session_start') ? 'session_start' : uniqueEvents[0];
    const retention = calculateActivityRetention(processedData, cohortEvent, uniqueEvents);
    expect(retention.length).toBeGreaterThan(0);

    // Step 6: Segments
    const platforms = [...new Set(processedData.map(e => e.platform).filter(Boolean))] as string[];
    const channels = [...new Set(processedData.map(e => e.channel).filter(Boolean))] as string[];
    const segments = compareSegments(processedData, steps, platforms, channels);
    expect(segments.length).toBeGreaterThan(0);

    // Step 7: Insights
    const insights = generateInsights(processedData, detectedType, null, null, null, null);
    expect(Array.isArray(insights)).toBe(true);
  });
});

describe('Full Pipeline E2E - Real 3000-row Subscription CSV', () => {
  it('runs the complete subscription analysis pipeline', async () => {
    const csv = loadSubscriptionSampleCSV();
    const { rawData, headers, mapping, processedData, detectedType } = await parseAndProcess(csv);

    // Step 1: Data validation
    expect(rawData.length).toBeGreaterThan(2000);
    expect(processedData.length).toBeGreaterThan(2000);
    expect(detectedType).toBe('subscription');

    // Step 2: Funnel
    const steps = loadFunnelTemplate('subscription');
    const funnel = calculateFunnel(processedData, steps);
    expect(funnel.length).toBe(5);
    expect(funnel[0].users).toBeGreaterThan(0);

    // Step 3: Subscription KPIs
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);
    expect(kpis).not.toBeNull();
    expect(kpis!.users_total).toBeGreaterThan(50);
    expect(kpis!.users_subscribed).toBeGreaterThan(0);

    // Step 4: Trial conversion
    const trial = analyzeTrialConversion(rawData, mapping, headers);
    expect(trial).not.toBeNull();
    expect(trial!.overall.trial_users).toBeGreaterThan(0);

    // Step 5: Churn analysis
    const churn = analyzeChurn(rawData, mapping);
    expect(churn).not.toBeNull();
    expect(churn!.churn_users).toBeGreaterThanOrEqual(0);

    // Step 6: Paid retention
    const paidRetention = calculatePaidRetention(rawData, mapping);
    expect(paidRetention.length).toBeGreaterThan(0);

    // Step 7: Insights (with all subscription data)
    const insights = generateInsights(processedData, detectedType, kpis, trial, churn, paidRetention);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('all subscription KPI fields are non-null', async () => {
    const csv = loadSubscriptionSampleCSV();
    const { rawData, headers, mapping } = await parseAndProcess(csv);
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);

    expect(kpis).not.toBeNull();
    expect(typeof kpis!.users_total).toBe('number');
    expect(typeof kpis!.users_signup).toBe('number');
    expect(typeof kpis!.subscribe_events).toBe('number');
    expect(typeof kpis!.renew_events).toBe('number');
    expect(typeof kpis!.cancel_events).toBe('number');
    expect(typeof kpis!.paid_user_count).toBe('number');
    expect(typeof kpis!.cancel_rate_paid).toBe('number');
  });

  it('trial analysis has valid conversion rates', async () => {
    const csv = loadSubscriptionSampleCSV();
    const { rawData, headers, mapping } = await parseAndProcess(csv);
    const trial = analyzeTrialConversion(rawData, mapping, headers);

    expect(trial).not.toBeNull();
    expect(trial!.overall.conversion_rate).toBeGreaterThanOrEqual(0);
    expect(trial!.overall.conversion_rate).toBeLessThanOrEqual(100);
    trial!.by_trial_days.forEach(group => {
      expect(group.conversion_rate).toBeGreaterThanOrEqual(0);
      expect(group.conversion_rate).toBeLessThanOrEqual(100);
    });
  });
});
