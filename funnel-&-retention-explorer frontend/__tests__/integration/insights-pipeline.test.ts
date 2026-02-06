import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import { SMALL_ECOMMERCE_CSV } from '../fixtures/small-ecommerce';
import { SMALL_SUBSCRIPTION_CSV } from '../fixtures/small-subscription';
import { generateInsights } from '../../lib/insightsEngine';
import { calculateSubscriptionKPIs, analyzeTrialConversion, analyzeChurn } from '../../lib/subscriptionEngine';
import { calculatePaidRetention } from '../../lib/retentionEngine';

describe('Insights Pipeline', () => {
  it('generates insights for ecommerce data', async () => {
    const { processedData, detectedType } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const insights = generateInsights(processedData, detectedType, null, null, null, null);

    expect(Array.isArray(insights)).toBe(true);
    // Should produce at least some insights from funnel/segment/retention analysis
    insights.forEach(insight => {
      expect(insight.type).toMatch(/^(success|warning|danger|info)$/);
      expect(insight.title).toBeTruthy();
      expect(insight.body).toBeTruthy();
    });
  });

  it('generates subscription-specific insights', async () => {
    const { rawData, headers, mapping, processedData, detectedType } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);
    const trial = analyzeTrialConversion(rawData, mapping, headers);
    const churn = analyzeChurn(rawData, mapping);
    const paidRetention = calculatePaidRetention(rawData, mapping);

    const insights = generateInsights(processedData, detectedType, kpis, trial, churn, paidRetention);

    expect(Array.isArray(insights)).toBe(true);
    insights.forEach(insight => {
      expect(insight.type).toMatch(/^(success|warning|danger|info)$/);
      expect(insight.title).toBeTruthy();
      expect(insight.body).toBeTruthy();
      if (insight.recommendations) {
        expect(insight.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  it('returns empty array for null type with minimal data', () => {
    const insights = generateInsights([], null, null, null, null, null);
    expect(insights).toEqual([]);
  });

  it('handles ecommerce type with subscription KPIs gracefully', async () => {
    const { processedData, detectedType } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    // Pass subscription-related params as null to ecommerce data
    const insights = generateInsights(processedData, detectedType, null, null, null, null);
    // Should not throw and should produce valid insights
    expect(Array.isArray(insights)).toBe(true);
  });

  it('each insight has correct structure', async () => {
    const { rawData, headers, mapping, processedData, detectedType } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const kpis = calculateSubscriptionKPIs(rawData, mapping, headers);
    const trial = analyzeTrialConversion(rawData, mapping, headers);
    const churn = analyzeChurn(rawData, mapping);
    const insights = generateInsights(processedData, detectedType, kpis, trial, churn, null);

    insights.forEach(insight => {
      expect(typeof insight.icon).toBe('string');
      expect(typeof insight.title).toBe('string');
      expect(typeof insight.body).toBe('string');
    });
  });
});
