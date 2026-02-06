import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import { SMALL_ECOMMERCE_CSV } from '../fixtures/small-ecommerce';
import { SMALL_SUBSCRIPTION_CSV } from '../fixtures/small-subscription';
import { calculateActivityRetention, calculatePaidRetention, calculateFullDataRetention } from '../../lib/retentionEngine';

describe('Retention Pipeline', () => {
  it('calculates activity retention cohorts for ecommerce', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const cohortEvent = 'session_start';
    const activeEvents = ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'];
    const result = calculateActivityRetention(processedData, cohortEvent, activeEvents);

    expect(result.length).toBeGreaterThan(0);
    result.forEach(cohort => {
      expect(cohort.cohortDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(cohort.cohortSize).toBeGreaterThan(0);
      expect(cohort.days).toBeDefined();
      // D0 should be >= 0% (some cohort users had active events on day 0)
      expect(cohort.days.D0).toBeGreaterThanOrEqual(0);
      expect(cohort.days.D0).toBeLessThanOrEqual(100);
    });
  });

  it('D0 retention is always highest', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateActivityRetention(processedData, 'session_start', ['view_item']);

    result.forEach(cohort => {
      for (let day = 1; day <= 14; day++) {
        expect(cohort.days[`D${day}`]).toBeLessThanOrEqual(cohort.days.D0);
      }
    });
  });

  it('calculates paid retention for subscription data', async () => {
    const { rawData, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const result = calculatePaidRetention(rawData, mapping);

    expect(result.length).toBeGreaterThan(0);
    result.forEach(cohort => {
      expect(cohort.cohortSize).toBeGreaterThan(0);
      // D0 should be 100% (user just subscribed)
      expect(cohort.days.D0).toBe(100);
    });
  });

  it('paid retention D0=100% and later days <= 100%', async () => {
    const { rawData, mapping } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const result = calculatePaidRetention(rawData, mapping);

    result.forEach(cohort => {
      Object.values(cohort.days).forEach(rate => {
        expect(rate).toBeLessThanOrEqual(100);
        expect(rate).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('calculateFullDataRetention returns cohorts', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateFullDataRetention(processedData);

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    result!.forEach(cohort => {
      expect(cohort.cohortDate).toBeTruthy();
      expect(cohort.cohortSize).toBeGreaterThan(0);
      expect(cohort.days).toBeDefined();
    });
  });
});
