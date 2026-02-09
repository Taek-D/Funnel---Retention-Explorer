import { describe, it, expect } from 'vitest';
import { calculateActivityRetention, calculatePaidRetention } from '../../lib/retentionEngine';
import type { ProcessedEvent } from '../../types';

function makeEvent(userId: string, eventName: string, dateStr: string): ProcessedEvent {
  return { userId, eventName, timestamp: new Date(dateStr + 'T12:00:00Z') };
}

describe('calculateActivityRetention', () => {
  it('returns empty array for no data', () => {
    const result = calculateActivityRetention([], 'signup', ['login']);
    expect(result).toEqual([]);
  });

  it('groups cohorts by date', () => {
    const data: ProcessedEvent[] = [
      makeEvent('u1', 'signup', '2025-01-01'),
      makeEvent('u2', 'signup', '2025-01-01'),
      makeEvent('u3', 'signup', '2025-01-02'),
    ];

    const result = calculateActivityRetention(data, 'signup', ['login']);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.cohortDate === '2025-01-01')?.cohortSize).toBe(2);
    expect(result.find(r => r.cohortDate === '2025-01-02')?.cohortSize).toBe(1);
  });

  it('calculates D0 as 100% when active event matches', () => {
    const data: ProcessedEvent[] = [
      makeEvent('u1', 'signup', '2025-01-01'),
      makeEvent('u1', 'login', '2025-01-01'),
    ];

    const result = calculateActivityRetention(data, 'signup', ['login']);
    expect(result[0].days['D0']).toBe(100);
  });

  it('calculates D1 retention correctly', () => {
    const data: ProcessedEvent[] = [
      makeEvent('u1', 'signup', '2025-01-01'),
      makeEvent('u2', 'signup', '2025-01-01'),
      makeEvent('u1', 'login', '2025-01-02'),
      // u2 does not login on D1
    ];

    const result = calculateActivityRetention(data, 'signup', ['login']);
    const cohort = result.find(r => r.cohortDate === '2025-01-01');
    expect(cohort?.days['D1']).toBe(50); // 1 of 2
  });
});

describe('calculatePaidRetention', () => {
  it('returns empty for no subscribe events', () => {
    const result = calculatePaidRetention(
      [{ event_name: 'login', user_id: 'u1', timestamp: '2025-01-01' }],
      { eventname: 'event_name', userid: 'user_id', timestamp: 'timestamp' }
    );
    expect(result).toEqual([]);
  });

  it('tracks cancel events for paid retention', () => {
    const rawData = [
      { event_name: 'subscribe', user_id: 'u1', timestamp: '2025-01-01T10:00:00Z' },
      { event_name: 'cancel', user_id: 'u1', timestamp: '2025-01-15T10:00:00Z' },
      { event_name: 'subscribe', user_id: 'u2', timestamp: '2025-01-01T10:00:00Z' },
    ];

    const result = calculatePaidRetention(rawData, {
      eventname: 'event_name',
      userid: 'user_id',
      timestamp: 'timestamp',
    });

    expect(result).toHaveLength(1);
    const cohort = result[0];
    // D0: both retained
    expect(cohort.days['D0']).toBe(100);
    // D30: u1 cancelled on day 14, u2 still active → 50%
    expect(cohort.days['D30']).toBe(50);
  });
});
