import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Plus, Trash2, X, Check, AlertTriangle } from './Icons';
import type { AlertCondition } from '../lib/alertWatchlist';

interface AlertWatchlistProps {
  rules: { id: string; metric: string; condition: AlertCondition; threshold: number; triggered: boolean; lastValue: number | null }[];
  onAdd: (rule: { metric: string; condition: AlertCondition; threshold: number }) => void;
  onRemove: (id: string) => void;
  triggeredCount: number;
}

const ALERT_METRIC_KEYS = [
  { value: 'conversion', labelKey: 'alerts.metrics.conversion' },
  { value: 'users', labelKey: 'alerts.metrics.users' },
  { value: 'events', labelKey: 'alerts.metrics.events' },
  { value: 'retention_d7', labelKey: 'alerts.metrics.retention' },
  { value: 'churn_rate', labelKey: 'alerts.metrics.churn' },
];

export const AlertWatchlist: React.FC<AlertWatchlistProps> = ({ rules, onAdd, onRemove, triggeredCount }) => {
  const { t } = useTranslation('pages');
  const [adding, setAdding] = useState(false);
  const [metric, setMetric] = useState('conversion');
  const [condition, setCondition] = useState<AlertCondition>('below');
  const [threshold, setThreshold] = useState('');

  const handleAdd = () => {
    const val = parseFloat(threshold);
    if (isNaN(val)) return;
    onAdd({ metric, condition, threshold: val });
    setThreshold('');
    setAdding(false);
  };

  return (
    <section aria-labelledby="alert-watchlist-heading" className="bg-surface border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 id="alert-watchlist-heading" className="text-sm font-bold text-white flex items-center gap-2">
          <Bell size={14} className="text-accent" aria-hidden="true" />
          {t('alerts.title')}
          {triggeredCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400" aria-label={t('alerts.triggeredCount', { count: triggeredCount })}>
              {triggeredCount}
            </span>
          )}
        </h3>
        <button
          onClick={() => setAdding(!adding)}
          aria-expanded={adding}
          className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1"
        >
          {adding ? <X size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          {adding ? t('alerts.cancel') : t('alerts.add')}
        </button>
      </div>

      {adding && (
        <div className="mb-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-md space-y-2" role="form" aria-label={t('alerts.add')}>
          <label className="sr-only" htmlFor="alert-metric">{t('alerts.metricLabel')}</label>
          <select
            id="alert-metric"
            value={metric}
            onChange={e => setMetric(e.target.value)}
            className="w-full bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50"
          >
            {ALERT_METRIC_KEYS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-surface">{t(opt.labelKey)}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="alert-condition">{t('alerts.conditionLabel')}</label>
            <select
              id="alert-condition"
              value={condition}
              onChange={e => setCondition(e.target.value as AlertCondition)}
              className="bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50"
            >
              <option value="below" className="bg-surface">{t('alerts.below')}</option>
              <option value="above" className="bg-surface">{t('alerts.above')}</option>
            </select>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              placeholder={t('alerts.thresholdPlaceholder')}
              aria-label={t('alerts.thresholdPlaceholder')}
              className="flex-1 bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!threshold || isNaN(parseFloat(threshold))}
            className="w-full py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded transition-colors disabled:opacity-40"
          >
            <Check size={12} className="inline mr-1" aria-hidden="true" />
            {t('alerts.save')}
          </button>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500">{t('alerts.empty')}</div>
      ) : (
        <ul className="space-y-1.5" aria-label={t('alerts.title')}>
          {rules.map(rule => {
            const metricLabel = ALERT_METRIC_KEYS.find(m => m.value === rule.metric);
            const label = metricLabel ? t(metricLabel.labelKey) : rule.metric;
            return (
              <li
                key={rule.id}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors ${
                  rule.triggered ? 'bg-red-500/5 border border-red-500/20' : 'hover:bg-white/[0.03]'
                }`}
              >
                {rule.triggered && <AlertTriangle size={12} className="text-red-400 shrink-0" aria-hidden="true" />}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-white">{label}</span>
                  <span className="text-[10px] text-slate-500 mx-1">
                    {rule.condition === 'above' ? '>' : '<'} {rule.threshold}
                  </span>
                  {rule.lastValue !== null && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({t('alerts.current')}: {rule.lastValue.toFixed(1)})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(rule.id)}
                  aria-label={t('alerts.removeRule', { metric: label })}
                  className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
