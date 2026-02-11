import { describe, it, expect } from 'vitest';
import { getUsersByEvent, getUsersByEventFuzzy } from '../../lib/eventUtils';
import type { ProcessedEvent } from '../../types';

const mockData: ProcessedEvent[] = [
  { userId: 'u1', eventName: 'page_view', timestamp: new Date('2025-01-01'), properties: {} },
  { userId: 'u2', eventName: 'page_view', timestamp: new Date('2025-01-01'), properties: {} },
  { userId: 'u1', eventName: 'sign_up', timestamp: new Date('2025-01-02'), properties: {} },
  { userId: 'u3', eventName: 'Sign_Up', timestamp: new Date('2025-01-02'), properties: {} },
  { userId: 'u2', eventName: 'purchase', timestamp: new Date('2025-01-03'), properties: {} },
];

describe('getUsersByEvent', () => {
  it('returns exact matches only', () => {
    const result = getUsersByEvent(mockData, 'page_view');
    expect(result).toEqual(new Set(['u1', 'u2']));
  });

  it('returns empty set for no matches', () => {
    const result = getUsersByEvent(mockData, 'nonexistent_event');
    expect(result.size).toBe(0);
  });

  it('returns Set of unique userIds', () => {
    const result = getUsersByEvent(mockData, 'page_view');
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
  });
});

describe('getUsersByEventFuzzy', () => {
  it('returns partial matches (case-insensitive)', () => {
    const result = getUsersByEventFuzzy(mockData, 'sign');
    expect(result).toEqual(new Set(['u1', 'u3']));
  });

  it('returns Set of unique userIds', () => {
    const result = getUsersByEventFuzzy(mockData, 'page');
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
  });
});
