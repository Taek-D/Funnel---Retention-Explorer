import type { ProcessedEvent, CustomEventDefinition } from '../types';

/**
 * Resolve a custom event to matching user IDs from the dataset.
 */
export function resolveCustomEvent(
  data: ProcessedEvent[],
  customEvent: CustomEventDefinition
): Set<string> {
  switch (customEvent.type) {
    case 'alias': {
      if (!customEvent.sourceEvent) return new Set();
      return new Set(
        data.filter(e => e.eventName === customEvent.sourceEvent).map(e => e.userId)
      );
    }
    case 'group': {
      if (!customEvent.sourceEvents || customEvent.sourceEvents.length === 0) return new Set();
      const eventSet = new Set(customEvent.sourceEvents);
      return new Set(
        data.filter(e => eventSet.has(e.eventName)).map(e => e.userId)
      );
    }
    case 'conditional': {
      if (!customEvent.sourceEvent) return new Set();
      return new Set(
        data.filter(e => {
          if (e.eventName !== customEvent.sourceEvent) return false;
          if (!customEvent.conditions || customEvent.conditions.length === 0) return true;
          return customEvent.conditions.every(cond => {
            const fieldValue = cond.field === 'platform' ? e.platform : e.channel;
            if (cond.operator === 'eq') return fieldValue === cond.value;
            if (cond.operator === 'neq') return fieldValue !== cond.value;
            return true;
          });
        }).map(e => e.userId)
      );
    }
    default:
      return new Set();
  }
}

/**
 * Resolve a custom event to matching ProcessedEvent rows (for funnel engine).
 */
export function resolveCustomEventRows(
  data: ProcessedEvent[],
  customEvent: CustomEventDefinition
): ProcessedEvent[] {
  switch (customEvent.type) {
    case 'alias': {
      if (!customEvent.sourceEvent) return [];
      return data.filter(e => e.eventName === customEvent.sourceEvent);
    }
    case 'group': {
      if (!customEvent.sourceEvents || customEvent.sourceEvents.length === 0) return [];
      const eventSet = new Set(customEvent.sourceEvents);
      return data.filter(e => eventSet.has(e.eventName));
    }
    case 'conditional': {
      if (!customEvent.sourceEvent) return [];
      return data.filter(e => {
        if (e.eventName !== customEvent.sourceEvent) return false;
        if (!customEvent.conditions || customEvent.conditions.length === 0) return true;
        return customEvent.conditions.every(cond => {
          const fieldValue = cond.field === 'platform' ? e.platform : e.channel;
          if (cond.operator === 'eq') return fieldValue === cond.value;
          if (cond.operator === 'neq') return fieldValue !== cond.value;
          return true;
        });
      });
    }
    default:
      return [];
  }
}

/**
 * Check if a step value is a custom event reference.
 */
export function isCustomEventRef(value: string): boolean {
  return value.startsWith('custom:');
}

/**
 * Extract custom event ID from reference string.
 */
export function getCustomEventId(ref: string): string {
  return ref.replace('custom:', '');
}

/**
 * Resolve funnel steps, replacing custom event refs with virtual event names.
 * Returns the processed data augmented with virtual events for custom definitions.
 */
export function resolveStepsWithCustomEvents(
  data: ProcessedEvent[],
  steps: string[],
  customEvents: CustomEventDefinition[]
): { resolvedData: ProcessedEvent[]; resolvedSteps: string[] } {
  const customMap = new Map(customEvents.map(ce => [ce.id, ce]));
  const virtualEvents: ProcessedEvent[] = [];
  const resolvedSteps: string[] = [];

  for (const step of steps) {
    if (isCustomEventRef(step)) {
      const ceId = getCustomEventId(step);
      const ce = customMap.get(ceId);
      if (ce) {
        const virtualName = `__custom__${ce.id}`;
        const rows = resolveCustomEventRows(data, ce);
        rows.forEach(row => {
          virtualEvents.push({ ...row, eventName: virtualName });
        });
        resolvedSteps.push(virtualName);
      } else {
        resolvedSteps.push(step);
      }
    } else {
      resolvedSteps.push(step);
    }
  }

  return {
    resolvedData: virtualEvents.length > 0 ? [...data, ...virtualEvents] : data,
    resolvedSteps,
  };
}
