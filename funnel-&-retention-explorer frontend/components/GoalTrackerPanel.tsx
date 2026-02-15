import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X, Check } from './Icons';
import { useGoalTracker } from '../hooks/useGoalTracker';
import type { GoalStatus, KPIGoal } from '../lib/goalTracker';

const STATUS_KEYS: Record<GoalStatus, string> = {
  'on-track': 'goals.onTrack',
  'at-risk': 'goals.atRisk',
  'behind': 'goals.behind',
};

const STATUS_STYLES: Record<GoalStatus, { bg: string; text: string }> = {
  'on-track': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'at-risk': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'behind': { bg: 'bg-red-500/10', text: 'text-red-400' },
};

const METRIC_KEYS = [
  { value: 'conversion', labelKey: 'goals.metrics.conversion', unit: '%' as const },
  { value: 'users', labelKey: 'goals.metrics.users', unit: 'count' as const },
  { value: 'events', labelKey: 'goals.metrics.events', unit: 'count' as const },
  { value: 'retention_d7', labelKey: 'goals.metrics.retention', unit: '%' as const },
  { value: 'revenue', labelKey: 'goals.metrics.revenue', unit: 'currency' as const },
];

export const GoalTrackerPanel: React.FC = () => {
  const { t } = useTranslation('pages');
  const { goals, add, remove } = useGoalTracker();
  const [adding, setAdding] = useState(false);
  const [metric, setMetric] = useState('conversion');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');

  const handleAdd = () => {
    const tgt = parseFloat(target);
    const cur = parseFloat(current);
    if (isNaN(tgt) || tgt <= 0) return;
    const opt = METRIC_KEYS.find(m => m.value === metric);
    add({ metric, target: tgt, current: isNaN(cur) ? 0 : cur, unit: opt?.unit || 'count' });
    setTarget('');
    setCurrent('');
    setAdding(false);
  };

  return (
    <section aria-labelledby="goal-tracker-heading" className="bg-surface border border-white/[0.06] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 id="goal-tracker-heading" className="text-sm font-bold text-white">{t('goals.title')}</h3>
        <button
          onClick={() => setAdding(!adding)}
          aria-expanded={adding}
          className="text-xs text-accent hover:text-accent/80 font-medium flex items-center gap-1"
        >
          {adding ? <X size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          {adding ? t('goals.cancel') : t('goals.add')}
        </button>
      </div>

      {adding && (
        <div className="mb-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-md space-y-2" role="form" aria-label={t('goals.add')}>
          <label className="sr-only" htmlFor="goal-metric">{t('goals.metricLabel')}</label>
          <select
            id="goal-metric"
            value={metric}
            onChange={e => setMetric(e.target.value)}
            className="w-full bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50"
          >
            {METRIC_KEYS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-surface">{t(opt.labelKey)}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder={t('goals.targetPlaceholder')}
              aria-label={t('goals.targetPlaceholder')}
              className="flex-1 bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50"
            />
            <input
              type="number"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              placeholder={t('goals.currentPlaceholder')}
              aria-label={t('goals.currentPlaceholder')}
              className="flex-1 bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!target || parseFloat(target) <= 0}
            className="w-full py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded transition-colors disabled:opacity-40"
          >
            <Check size={12} className="inline mr-1" aria-hidden="true" />
            {t('goals.save')}
          </button>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500">{t('goals.empty')}</div>
      ) : (
        <ul className="space-y-2" aria-label={t('goals.title')}>
          {goals.map(goal => (
            <GoalRow key={goal.id} goal={goal} onRemove={remove} />
          ))}
        </ul>
      )}
    </section>
  );
};

const GoalRow: React.FC<{ goal: KPIGoal; onRemove: (id: string) => void }> = ({ goal, onRemove }) => {
  const { t } = useTranslation('pages');
  const style = STATUS_STYLES[goal.status];
  const statusLabel = t(STATUS_KEYS[goal.status]);
  const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const opt = METRIC_KEYS.find(m => m.value === goal.metric);
  const label = opt ? t(opt.labelKey) : goal.metric;

  const formatValue = (v: number) => {
    if (goal.unit === '%') return `${v.toFixed(1)}%`;
    if (goal.unit === 'currency') return `$${v.toLocaleString()}`;
    return v.toLocaleString();
  };

  return (
    <li className="group flex items-center gap-3 p-2 rounded-md hover:bg-white/[0.03] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-white font-medium truncate">{label}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goal.status === 'on-track' ? 'bg-emerald-500' : goal.status === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {formatValue(goal.current)} / {formatValue(goal.target)}
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(goal.id)}
        aria-label={t('goals.removeGoal', { metric: label })}
        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>
    </li>
  );
};
