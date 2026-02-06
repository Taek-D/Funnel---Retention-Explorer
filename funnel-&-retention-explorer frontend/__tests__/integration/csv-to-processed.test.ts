import { describe, it, expect } from 'vitest';
import { parseAndProcess } from '../helpers/pipeline';
import { SMALL_ECOMMERCE_CSV, EXPECTED_UNIQUE_USERS, EXPECTED_DETECTED_TYPE as ECOMMERCE_TYPE, EXPECTED_PLATFORMS, EXPECTED_CHANNELS } from '../fixtures/small-ecommerce';
import { SMALL_SUBSCRIPTION_CSV, EXPECTED_DETECTED_TYPE as SUBSCRIPTION_TYPE, EXPECTED_TOTAL_USERS } from '../fixtures/small-subscription';

describe('CSV → Processed Data Pipeline', () => {
  it('parses ecommerce CSV and auto-detects columns', async () => {
    const { headers, mapping, rawData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    expect(headers).toContain('timestamp');
    expect(headers).toContain('user_id');
    expect(headers).toContain('event_name');
    expect(mapping.timestamp).toBe('timestamp');
    expect(mapping.userid).toBe('user_id');
    expect(mapping.eventname).toBe('event_name');
    expect(rawData.length).toBeGreaterThan(0);
  });

  it('produces correct processedData from ecommerce CSV', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const uniqueUsers = new Set(processedData.map(e => e.userId));
    expect(uniqueUsers.size).toBe(EXPECTED_UNIQUE_USERS);
    expect(processedData.every(e => e.timestamp instanceof Date)).toBe(true);
    expect(processedData.every(e => !isNaN(e.timestamp.getTime()))).toBe(true);
  });

  it('extracts platforms and channels correctly', async () => {
    const { processedData } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    const platforms = [...new Set(processedData.map(e => e.platform).filter(Boolean))].sort();
    const channels = [...new Set(processedData.map(e => e.channel).filter(Boolean))].sort();
    expect(platforms).toEqual(EXPECTED_PLATFORMS);
    expect(channels).toEqual(EXPECTED_CHANNELS);
  });

  it('detects ecommerce dataset type', async () => {
    const { detectedType } = await parseAndProcess(SMALL_ECOMMERCE_CSV);
    expect(detectedType).toBe(ECOMMERCE_TYPE);
  });

  it('detects subscription dataset type', async () => {
    const { detectedType } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    expect(detectedType).toBe(SUBSCRIPTION_TYPE);
  });

  it('produces correct user count from subscription CSV', async () => {
    const { processedData } = await parseAndProcess(SMALL_SUBSCRIPTION_CSV);
    const uniqueUsers = new Set(processedData.map(e => e.userId));
    expect(uniqueUsers.size).toBe(EXPECTED_TOTAL_USERS);
  });

  it('returns null type for unrecognizable data', async () => {
    const csv = `timestamp,user_id,event_name
2025-01-01T10:00:00Z,u001,custom_alpha
2025-01-01T11:00:00Z,u002,custom_beta`;
    const { detectedType } = await parseAndProcess(csv);
    expect(detectedType).toBeNull();
  });
});
