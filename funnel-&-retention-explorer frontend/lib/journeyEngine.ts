import type { ProcessedEvent } from '../types';

export type JourneyNode = {
  name: string;
};

export type JourneyLink = {
  source: number;
  target: number;
  value: number;
};

export type JourneyFlowData = {
  nodes: JourneyNode[];
  links: JourneyLink[];
  totalUsers: number;
  totalTransitions: number;
};

export type JourneyOptions = {
  maxSteps: number;
  minFlowPct: number;
};

export function buildJourneyFlow(
  processedData: ProcessedEvent[],
  options: JourneyOptions
): JourneyFlowData {
  const { maxSteps, minFlowPct } = options;

  // 1. Group events by userId and sort by timestamp
  const userEvents = new Map<string, ProcessedEvent[]>();
  for (const event of processedData) {
    const list = userEvents.get(event.userId);
    if (list) {
      list.push(event);
    } else {
      userEvents.set(event.userId, [event]);
    }
  }

  // 2. Build transition counts
  const transitionCounts = new Map<string, number>();
  let totalTransitions = 0;

  for (const [, events] of userEvents) {
    // Sort by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Take first maxSteps events
    const limited = events.slice(0, maxSteps);

    for (let i = 0; i < limited.length - 1; i++) {
      const sourceKey = `Step ${i + 1}: ${limited[i].eventName}`;
      const targetKey = `Step ${i + 2}: ${limited[i + 1].eventName}`;
      const linkKey = `${sourceKey}→${targetKey}`;

      transitionCounts.set(linkKey, (transitionCounts.get(linkKey) || 0) + 1);
      totalTransitions++;
    }
  }

  // 3. Filter by minFlowPct
  const threshold = totalTransitions * (minFlowPct / 100);
  const filteredTransitions = new Map<string, number>();
  for (const [key, count] of transitionCounts) {
    if (count >= threshold) {
      filteredTransitions.set(key, count);
    }
  }

  // 4. Build nodes array (unique names from filtered links)
  const nodeSet = new Set<string>();
  for (const key of filteredTransitions.keys()) {
    const [source, target] = key.split('→');
    nodeSet.add(source);
    nodeSet.add(target);
  }

  // Sort nodes by step number for consistent ordering
  const nodeNames = Array.from(nodeSet).sort((a, b) => {
    const stepA = parseInt(a.match(/^Step (\d+)/)?.[1] || '0');
    const stepB = parseInt(b.match(/^Step (\d+)/)?.[1] || '0');
    return stepA - stepB;
  });

  const nodeIndex = new Map<string, number>();
  nodeNames.forEach((name, i) => nodeIndex.set(name, i));

  const nodes: JourneyNode[] = nodeNames.map(name => ({ name }));
  const links: JourneyLink[] = [];

  for (const [key, value] of filteredTransitions) {
    const [source, target] = key.split('→');
    const sourceIdx = nodeIndex.get(source);
    const targetIdx = nodeIndex.get(target);
    if (sourceIdx !== undefined && targetIdx !== undefined) {
      links.push({ source: sourceIdx, target: targetIdx, value });
    }
  }

  return {
    nodes,
    links,
    totalUsers: userEvents.size,
    totalTransitions,
  };
}
