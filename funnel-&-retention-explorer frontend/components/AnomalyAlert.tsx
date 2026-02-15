import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingUp, TrendingDown } from './Icons';
import type { AnomalyResult, Sensitivity } from '../lib/anomalyDetector';

interface AnomalyBadgeProps {
  count: number;
}

export const AnomalyBadge: React.FC<AnomalyBadgeProps> = ({ count }) => {
  const { t } = useTranslation('pages');

  if (count === 0) return null;

  return (
    <span className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full">
      <AlertTriangle size={11} />
      {t('anomaly.detected', { count })}
    </span>
  );
};

interface SensitivitySelectProps {
  value: Sensitivity;
  onChange: (v: Sensitivity) => void;
}

export const SensitivitySelect: React.FC<SensitivitySelectProps> = ({ value, onChange }) => {
  const { t } = useTranslation('pages');

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{t('anomaly.sensitivity')}:</span>
      <div className="flex rounded-md overflow-hidden border border-white/[0.06]">
        {(['high', 'medium', 'low'] as Sensitivity[]).map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`px-2.5 py-1 text-[11px] transition-colors ${
              value === s
                ? 'bg-accent/20 text-accent font-medium'
                : 'bg-white/[0.02] text-slate-500 hover:text-white'
            }`}
          >
            {t(`anomaly.${s}`)}
          </button>
        ))}
      </div>
    </div>
  );
};

interface AnomalyListProps {
  anomalies: AnomalyResult[];
}

export const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies }) => {
  const { t } = useTranslation('pages');

  if (anomalies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
        <AlertTriangle size={12} />
        {t('anomaly.noAnomalies')}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
      {anomalies.slice(0, 10).map((a, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs border ${
            a.type === 'spike'
              ? 'bg-green-500/5 border-green-500/10'
              : 'bg-red-500/5 border-red-500/10'
          }`}
        >
          {a.type === 'spike'
            ? <TrendingUp size={13} className="text-green-400 shrink-0" />
            : <TrendingDown size={13} className="text-red-400 shrink-0" />
          }
          <span className="font-mono text-slate-400 shrink-0">{a.date}</span>
          <span className="text-white flex-1">
            {a.value.toFixed(1)} <span className="text-slate-500">({t('anomaly.expected')}: {a.expected})</span>
          </span>
          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
            a.type === 'spike' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            z={a.zScore > 0 ? '+' : ''}{a.zScore}
          </span>
        </div>
      ))}
    </div>
  );
};
