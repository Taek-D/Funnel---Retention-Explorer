import { describe, it, expect } from 'vitest';
import { detectColumnsByValues } from '../../lib/columnValueDetector';
import type { RawRow, ColumnMapping } from '../../types';

function makeRows(count: number, gen: (i: number) => RawRow): RawRow[] {
  return Array.from({ length: count }, (_, i) => gen(i));
}

describe('detectColumnsByValues', () => {
  it('detects ISO timestamp column', () => {
    const headers = ['col_a', 'col_b'];
    const rawData = makeRows(20, i => ({
      col_a: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      col_b: `user_${i}`,
    }));

    const result = detectColumnsByValues(headers, rawData, {});
    expect(result.timestamp).toBe('col_a');
  });

  it('detects userId column with ID patterns', () => {
    const headers = ['ts', 'uid', 'event'];
    const rawData = makeRows(30, i => ({
      ts: `2025-01-01T${String(i).padStart(2, '0')}:00:00Z`,
      uid: `user_${1000 + (i % 15)}`,
      event: i % 3 === 0 ? 'view_item' : i % 3 === 1 ? 'add_to_cart' : 'purchase',
    }));

    const result = detectColumnsByValues(headers, rawData, {});
    expect(result.userid).toBe('uid');
  });

  it('detects event name column with known patterns', () => {
    const headers = ['ts', 'uid', 'action'];
    const events = ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'];
    const rawData = makeRows(40, i => ({
      ts: `2025-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`,
      uid: `u_${i % 10}`,
      action: events[i % events.length],
    }));

    const result = detectColumnsByValues(headers, rawData, {});
    expect(result.eventname).toBe('action');
  });

  it('preserves already-mapped columns', () => {
    const headers = ['date_col', 'user_col', 'evt_col'];
    const rawData = makeRows(20, i => ({
      date_col: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      user_col: `user_${i}`,
      evt_col: 'view_item',
    }));

    const existing: ColumnMapping = { timestamp: 'date_col' };
    const result = detectColumnsByValues(headers, rawData, existing);
    expect(result.timestamp).toBe('date_col');
  });

  it('returns existing mapping when rawData is empty', () => {
    const existing: ColumnMapping = { timestamp: 'ts' };
    const result = detectColumnsByValues(['ts', 'uid'], [], existing);
    expect(result.timestamp).toBe('ts');
  });
});
