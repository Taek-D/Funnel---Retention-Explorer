import { describe, it, expect } from 'vitest';
import {
  autoDetectColumns,
  hasCol,
  getColValue,
  getUniqueColValues,
  getUniqueEvents,
  processData,
  detectDatasetType,
  generateDataQualityReport,
} from '../../lib/dataProcessor';
import type { RawRow, ProcessedEvent } from '../../types';

describe('autoDetectColumns', () => {
  it('maps standard ecommerce headers', () => {
    const headers = ['timestamp', 'user_id', 'event_name', 'session_id', 'platform', 'channel'];
    const mapping = autoDetectColumns(headers);
    expect(mapping.timestamp).toBe('timestamp');
    expect(mapping.userid).toBe('user_id');
    expect(mapping.eventname).toBe('event_name');
    expect(mapping.sessionid).toBe('session_id');
    expect(mapping.platform).toBe('platform');
    expect(mapping.channel).toBe('channel');
  });

  it('handles case-insensitive matching', () => {
    const headers = ['Timestamp', 'User_ID', 'Event_Name'];
    const mapping = autoDetectColumns(headers);
    expect(mapping.timestamp).toBe('Timestamp');
    expect(mapping.userid).toBe('User_ID');
    expect(mapping.eventname).toBe('Event_Name');
  });

  it('returns empty mapping for unknown headers', () => {
    const headers = ['foo', 'bar', 'baz'];
    const mapping = autoDetectColumns(headers);
    expect(mapping.timestamp).toBeUndefined();
    expect(mapping.userid).toBeUndefined();
    expect(mapping.eventname).toBeUndefined();
  });
});

describe('hasCol', () => {
  it('finds column case-insensitively', () => {
    expect(hasCol(['Revenue', 'plan'], 'revenue')).toBe(true);
    expect(hasCol(['Revenue', 'plan'], 'PLAN')).toBe(true);
  });

  it('returns false when column not present', () => {
    expect(hasCol(['name', 'age'], 'revenue')).toBe(false);
  });
});

describe('getColValue', () => {
  it('retrieves value case-insensitively', () => {
    const row: RawRow = { 'Revenue': '9900', 'Plan': 'monthly' };
    expect(getColValue(row, 'revenue')).toBe('9900');
    expect(getColValue(row, 'plan')).toBe('monthly');
  });

  it('returns null for missing column', () => {
    const row: RawRow = { name: 'test' };
    expect(getColValue(row, 'revenue')).toBeNull();
  });

  it('returns null for null row', () => {
    expect(getColValue(null as unknown as RawRow, 'revenue')).toBeNull();
  });
});

describe('getUniqueColValues', () => {
  it('returns unique non-empty values', () => {
    const rawData: RawRow[] = [
      { plan: 'monthly' },
      { plan: 'yearly' },
      { plan: 'monthly' },
      { plan: '' },
    ];
    const result = getUniqueColValues(rawData, ['plan'], 'plan');
    expect(result).toHaveLength(2);
    expect(result).toContain('monthly');
    expect(result).toContain('yearly');
  });

  it('returns empty array when column missing', () => {
    const rawData: RawRow[] = [{ name: 'test' }];
    const result = getUniqueColValues(rawData, ['name'], 'plan');
    expect(result).toEqual([]);
  });
});

describe('processData', () => {
  it('processes valid rows and filters invalid', () => {
    const rawData: RawRow[] = [
      { timestamp: '2025-01-01T10:00:00Z', user_id: 'u001', event_name: 'view_item' },
      { timestamp: 'invalid', user_id: 'u002', event_name: 'click' },
      { timestamp: '2025-01-01T11:00:00Z', user_id: '', event_name: 'click' },
      { timestamp: '2025-01-01T12:00:00Z', user_id: 'u003', event_name: 'purchase' },
    ];
    const mapping = { timestamp: 'timestamp', userid: 'user_id', eventname: 'event_name' };
    const result = processData(rawData, mapping);
    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('u001');
    expect(result[1].userId).toBe('u003');
  });

  it('sorts by timestamp ascending', () => {
    const rawData: RawRow[] = [
      { timestamp: '2025-01-02T10:00:00Z', user_id: 'u002', event_name: 'b' },
      { timestamp: '2025-01-01T10:00:00Z', user_id: 'u001', event_name: 'a' },
    ];
    const mapping = { timestamp: 'timestamp', userid: 'user_id', eventname: 'event_name' };
    const result = processData(rawData, mapping);
    expect(result[0].eventName).toBe('a');
    expect(result[1].eventName).toBe('b');
  });
});

describe('detectDatasetType', () => {
  it('detects ecommerce type', () => {
    const data: ProcessedEvent[] = [
      { timestamp: new Date(), userId: 'u1', eventName: 'view_item' },
      { timestamp: new Date(), userId: 'u1', eventName: 'add_to_cart' },
      { timestamp: new Date(), userId: 'u1', eventName: 'purchase' },
    ];
    expect(detectDatasetType(data)).toBe('ecommerce');
  });

  it('detects subscription type', () => {
    const data: ProcessedEvent[] = [
      { timestamp: new Date(), userId: 'u1', eventName: 'app_open' },
      { timestamp: new Date(), userId: 'u1', eventName: 'signup' },
      { timestamp: new Date(), userId: 'u1', eventName: 'subscribe' },
    ];
    expect(detectDatasetType(data)).toBe('subscription');
  });

  it('returns null for empty data', () => {
    expect(detectDatasetType([])).toBeNull();
  });

  it('returns null for ambiguous data', () => {
    const data: ProcessedEvent[] = [
      { timestamp: new Date(), userId: 'u1', eventName: 'custom_event_1' },
      { timestamp: new Date(), userId: 'u1', eventName: 'custom_event_2' },
    ];
    expect(detectDatasetType(data)).toBeNull();
  });
});

describe('getUniqueEvents', () => {
  it('returns sorted unique event names', () => {
    const data: ProcessedEvent[] = [
      { timestamp: new Date(), userId: 'u1', eventName: 'purchase' },
      { timestamp: new Date(), userId: 'u1', eventName: 'add_to_cart' },
      { timestamp: new Date(), userId: 'u2', eventName: 'purchase' },
    ];
    expect(getUniqueEvents(data)).toEqual(['add_to_cart', 'purchase']);
  });
});

describe('generateDataQualityReport', () => {
  it('produces correct report', () => {
    const rawData: RawRow[] = [
      { timestamp: '2025-01-01T10:00:00Z', user_id: 'u001', event_name: 'view' },
      { timestamp: 'bad', user_id: 'u002', event_name: 'click' },
    ];
    const processed: ProcessedEvent[] = [
      { timestamp: new Date('2025-01-01T10:00:00Z'), userId: 'u001', eventName: 'view' },
    ];
    const report = generateDataQualityReport(rawData, processed);
    expect(report.totalRows).toBe(2);
    expect(report.validRows).toBe(1);
    expect(report.failedRows).toBe(1);
    expect(report.uniqueUsers).toBe(1);
  });
});
