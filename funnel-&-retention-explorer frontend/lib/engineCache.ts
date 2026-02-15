/**
 * Engine-level result cache using WeakMap.
 * Automatically invalidated when data reference changes (GC).
 */

type CacheStore<T> = WeakMap<object, Map<string, T>>;

export function createEngineCache<T>(): CacheStore<T> {
  return new WeakMap();
}

export function getCached<T>(cache: CacheStore<T>, data: object, key: string): T | undefined {
  return cache.get(data)?.get(key);
}

export function setCached<T>(cache: CacheStore<T>, data: object, key: string, value: T): void {
  let map = cache.get(data);
  if (!map) {
    map = new Map();
    cache.set(data, map);
  }
  map.set(key, value);
}
