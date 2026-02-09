import type { ProcessedEvent } from '../types';

export function getUsersByEvent(data: ProcessedEvent[], eventName: string): Set<string> {
  return new Set(
    data.filter(e => e.eventName === eventName).map(e => e.userId)
  );
}

export function getUsersByEventFuzzy(data: ProcessedEvent[], eventName: string): Set<string> {
  const lower = eventName.toLowerCase();
  return new Set(
    data.filter(e => e.eventName && e.eventName.toLowerCase().includes(lower))
      .map(e => e.userId)
  );
}
