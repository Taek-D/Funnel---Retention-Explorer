import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from './Icons';
import type { PeriodComparisonResult } from '../lib/periodComparison';

interface PeriodComparisonCardProps {
  comparison: PeriodComparisonResult;
}

interface DeltaProps {
  label: string;
  current: number;
  delta: number;
  format?: (n: number) => string;
}

const DeltaIndicator: React.FC<DeltaProps> = ({ label, current, delta, format }) => {
  const isPositive = delta >= 0;
  const displayValue = format ? format(current) : current.toLocaleString();

  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] text-slate-500 mb-1 truncate">{label}</div>
      <div className="text-lg font-bold font-mono text-white">{displayValue}</div>
      <div className={`flex items-center gap-1 mt-0.5 ${isPositive ? 'text-accent' : 'text-coral'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span className="text-xs font-bold font-mono">{isPositive ? '+' : ''}{delta.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export const PeriodComparisonCard: React.FC<PeriodComparisonCardProps> = ({ comparison }) => {
  const { t } = useTranslation('pages');

  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-white">{t('periodComp.title')}</h4>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded">{comparison.currentLabel}</span>
          <span>vs</span>
          <span className="px-1.5 py-0.5 bg-white/5 rounded">{comparison.previousLabel}</span>
        </div>
      </div>
      <div className="flex gap-4">
        <DeltaIndicator
          label={t('periodComp.uniqueUsers')}
          current={comparison.current.uniqueUsers}
          delta={comparison.deltas.uniqueUsers}
        />
        <DeltaIndicator
          label={t('periodComp.totalEvents')}
          current={comparison.current.totalEvents}
          delta={comparison.deltas.totalEvents}
        />
        <DeltaIndicator
          label={t('periodComp.avgEvents')}
          current={comparison.current.avgEventsPerUser}
          delta={comparison.deltas.avgEventsPerUser}
          format={(n) => n.toFixed(1)}
        />
      </div>
    </div>
  );
};
