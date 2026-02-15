const STORAGE_KEY = 'fre_alert_watchlist';

export type AlertCondition = 'above' | 'below';

export interface AlertRule {
  id: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  triggered: boolean;
  lastValue: number | null;
  createdAt: string;
}

export function getAlertRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const VALID_CONDITIONS = new Set(['above', 'below']);
    return parsed.filter(
      (item): item is AlertRule =>
        item &&
        typeof item.id === 'string' &&
        typeof item.metric === 'string' &&
        VALID_CONDITIONS.has(item.condition) &&
        typeof item.threshold === 'number' &&
        typeof item.triggered === 'boolean' &&
        typeof item.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

function persist(rules: AlertRule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function addAlertRule(
  rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggered' | 'lastValue'>,
): AlertRule {
  const list = getAlertRules();
  const newRule: AlertRule = {
    ...rule,
    id: crypto.randomUUID(),
    triggered: false,
    lastValue: null,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newRule);
  if (list.length > 10) list.pop();
  persist(list);
  return newRule;
}

export function evaluateAlerts(
  rules: AlertRule[],
  metrics: Record<string, number>,
): AlertRule[] {
  const updated = rules.map(rule => {
    const value = metrics[rule.metric];
    if (value === undefined) return rule;
    const triggered =
      rule.condition === 'above'
        ? value > rule.threshold
        : value < rule.threshold;
    return { ...rule, triggered, lastValue: value };
  });
  persist(updated);
  return updated;
}

export function removeAlertRule(id: string): void {
  const list = getAlertRules().filter(r => r.id !== id);
  persist(list);
}
