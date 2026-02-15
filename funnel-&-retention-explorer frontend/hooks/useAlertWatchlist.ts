import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getAlertRules,
  addAlertRule,
  removeAlertRule,
  evaluateAlerts,
  type AlertRule,
} from '../lib/alertWatchlist';

export function useAlertWatchlist(metrics: Record<string, number>) {
  const [rules, setRules] = useState<AlertRule[]>(() => getAlertRules());
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    if (Object.keys(metrics).length > 0 && rules.length > 0) {
      const updated = evaluateAlerts(rules, metrics);
      setRules(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

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
