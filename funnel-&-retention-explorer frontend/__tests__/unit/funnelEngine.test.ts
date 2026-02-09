import { describe, it, expect } from 'vitest';
import { calculateFunnel } from '../../lib/funnelEngine';
import type { ProcessedEvent } from '../../types';

function makeEvent(userId: string, eventName: string, minutesOffset: number): ProcessedEvent {
  const ts = new Date('2025-01-01T00:00:00Z');
  ts.setMinutes(ts.getMinutes() + minutesOffset);
  return { userId, eventName, timestamp: ts };
}

describe('calculateFunnel', () => {
  it('returns empty array for fewer than 2 steps', () => {
    expect(calculateFunnel([], ['step1'])).toEqual([]);
    expect(calculateFunnel([], [])).toEqual([]);
  });

  it('calculates a basic 3-step funnel', () => {
    const data: ProcessedEvent[] = [
      makeEvent('u1', 'view', 0),
      makeEvent('u2', 'view', 1),
      makeEvent('u3', 'view', 2),
      makeEvent('u1', 'cart', 10),
      makeEvent('u2', 'cart', 11),
      makeEvent('u1', 'buy', 20),
    ];

    const result = calculateFunnel(data, ['view', 'cart', 'buy']);
    expect(result).toHaveLength(3);

    // Step 1: all 3 users
    expect(result[0].users).toBe(3);
    expect(result[0].conversionRate).toBe(100);
    expect(result[0].dropOff).toBe(0);

    // Step 2: u1, u2 (2 of 3)
    expect(result[1].users).toBe(2);
    expect(result[1].dropOff).toBe(1);

    // Step 3: u1 only (1 of 2)
    expect(result[2].users).toBe(1);
    expect(result[2].conversionRate).toBe(50);
    expect(result[2].dropOff).toBe(1);
  });

  it('handles zero users at first step', () => {
    const data: ProcessedEvent[] = [
      makeEvent('u1', 'cart', 10),
    ];

    const result = calculateFunnel(data, ['view', 'cart']);
    expect(result).toHaveLength(2);
    expect(result[0].users).toBe(0);
    expect(result[1].users).toBe(0);
    expect(result[1].conversionRate).toBe(0);
  });

  it('calculates medianTime between steps', () => {
    const data: ProcessedEvent[] = [
      makeEvent('u1', 'view', 0),
      makeEvent('u2', 'view', 0),
      makeEvent('u1', 'cart', 10),
      makeEvent('u2', 'cart', 20),
    ];

    const result = calculateFunnel(data, ['view', 'cart']);
    expect(result[1].medianTime).toBeDefined();
    // Median of [10, 20] = 20 (floor(2/2)=1 → index 1)
    expect(result[1].medianTime).toBe(20);
  });
});
