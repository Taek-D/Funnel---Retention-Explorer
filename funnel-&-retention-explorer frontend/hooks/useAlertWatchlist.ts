import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  getAlertRules,
  addAlertRule,
  removeAlertRule,
  evaluateAlerts,
  type AlertRule,
} from '../lib/alertWatchlist';

function stableMetricsKey(metrics: Record<string, number>): string {
  const keys = Object.keys(metrics).sort();
  return keys.map(k => `${k}:${metrics[k]}`).join('|');
}

export function useAlertWatchlist(metrics: Record<string, number>) {
  const [rules, setRules] = useState<AlertRule[]>(() => getAlertRules());
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const metricsKey = useMemo(() => stableMetricsKey(metrics), [metrics]);

  useEffect(() => {
    if (metricsKey && rules.length > 0) {
      const updated = evaluateAlerts(rules, metricsRef.current);
      setRules(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricsKey]);

  const add = useCallback(
    (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggered' | 'lastValue'>) => {
      addAlertRule(rule);
      const fresh = getAlertRules();
      if (Object.keys(metricsRef.current).length > 0) {
        setRules(evaluateAlerts(fresh, metricsRef.current));
      } else {
        setRules(fresh);
      }
    },
    [],
  );

  const remove = useCallback((id: string) => {
    removeAlertRule(id);
    setRules(getAlertRules());
  }, []);

  const triggeredCount = rules.filter(r => r.triggered).length;

  return { rules, add, remove, triggeredCount };
}
