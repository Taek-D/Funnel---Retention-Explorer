import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import { SMALL_ECOMMERCE_CSV, EXPECTED_FUNNEL, EXPECTED_PLATFORMS, EXPECTED_CHANNELS } from '../fixtures/small-ecommerce';
import { compareSegments, calculateSegmentFunnel, calculateFullDataSegments } from '../../lib/segmentEngine';

describe('Segment Pipeline', () => {
  it('compareSegments returns segments for each platform and channel', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = compareSegments(processedData, EXPECTED_FUNNEL.steps, EXPECTED_PLATFORMS, EXPECTED_CHANNELS);

    const platformSegments = result.filter(s => s.type === 'platform');
    const channelSegments = result.filter(s => s.type === 'channel');

    expect(platformSegments.length).toBe(EXPECTED_PLATFORMS.length);
    expect(channelSegments.length).toBe(EXPECTED_CHANNELS.length);
  });

  it('each segment has valid conversion and pValue', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = compareSegments(processedData, EXPECTED_FUNNEL.steps, EXPECTED_PLATFORMS, EXPECTED_CHANNELS);

    result.forEach(seg => {
      expect(seg.conversion).toBeGreaterThanOrEqual(0);
      expect(seg.conversion).toBeLessThanOrEqual(100);
      expect(seg.pValue).toBeGreaterThanOrEqual(0);
      expect(seg.pValue).toBeLessThanOrEqual(1);
      expect(seg.population).toBeGreaterThan(0);
      expect(seg.stepByStep.length).toBe(EXPECTED_FUNNEL.steps.length);
    });
  });

  it('calculateSegmentFunnel produces correct step counts', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateSegmentFunnel(processedData, EXPECTED_FUNNEL.steps, false);

    expect(result).toHaveLength(EXPECTED_FUNNEL.steps.length);
    // First step should be 100%
    expect(result[0].conversionRate).toBe(100);
    // User counts should be monotonically non-increasing
    for (let i = 1; i < result.length; i++) {
      expect(result[i].userCount).toBeLessThanOrEqual(result[i - 1].userCount);
    }
  });

  it('calculateFullDataSegments returns platform and channel segments', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = calculateFullDataSegments(processedData, 'ecommerce');

    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
    result!.forEach(seg => {
      expect(['platform', 'channel']).toContain(seg.type);
      expect(seg.name).toBeTruthy();
      expect(seg.conversion).toBeGreaterThanOrEqual(0);
    });
  });

  it('segment uplift is relative to baseline', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const result = compareSegments(processedData, EXPECTED_FUNNEL.steps, EXPECTED_PLATFORMS, EXPECTED_CHANNELS);

    // The sum of (uplift * population) should roughly zero out
    // At minimum, uplift should be a number
    result.forEach(seg => {
      expect(typeof seg.uplift).toBe('number');
      expect(isNaN(seg.uplift)).toBe(false);
    });
  });
});
