import { describe, it, expect } from 'vitest';
import { createEngineCache, getCached, setCached } from '../../lib/engineCache';

describe('engineCache', () => {
  it('returns undefined for uncached entries', () => {
    const cache = createEngineCache<number>();
    const data = [1, 2, 3];
    expect(getCached(cache, data, 'key')).toBeUndefined();
  });

  it('stores and retrieves cached values', () => {
    const cache = createEngineCache<string>();
    const data = [1, 2, 3];
    setCached(cache, data, 'hello', 'world');
    expect(getCached(cache, data, 'hello')).toBe('world');
  });

  it('returns same reference for cached result', () => {
    const cache = createEngineCache<number[]>();
    const data = [1, 2, 3];
    const result = [10, 20, 30];
    setCached(cache, data, 'key', result);
    expect(getCached(cache, data, 'key')).toBe(result);
  });

  it('separates entries by key', () => {
    const cache = createEngineCache<string>();
    const data = [1, 2, 3];
    setCached(cache, data, 'a', 'alpha');
    setCached(cache, data, 'b', 'beta');
    expect(getCached(cache, data, 'a')).toBe('alpha');
    expect(getCached(cache, data, 'b')).toBe('beta');
  });

  it('separates entries by data reference', () => {
    const cache = createEngineCache<string>();
    const data1 = [1, 2];
    const data2 = [1, 2];
    setCached(cache, data1, 'key', 'first');
    setCached(cache, data2, 'key', 'second');
    expect(getCached(cache, data1, 'key')).toBe('first');
    expect(getCached(cache, data2, 'key')).toBe('second');
  });

  it('overwrites existing cached value with same key', () => {
    const cache = createEngineCache<number>();
    const data = [1];
    setCached(cache, data, 'x', 10);
    setCached(cache, data, 'x', 20);
    expect(getCached(cache, data, 'x')).toBe(20);
  });
});
