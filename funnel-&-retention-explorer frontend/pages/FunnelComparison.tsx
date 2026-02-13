import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCompareArrows, Plus, X, TrendingUp, TrendingDown } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { calculateFunnel, compareFunnels } from '../lib/funnelEngine';
import { CHART_COLORS } from '../lib/constants';
import { ChartDownloadButton } from '../components/ChartDownloadButton';
import type { FunnelComparisonResult } from '../lib/funnelEngine';

export const FunnelComparison: React.FC = () => {
  const { t } = useTranslation('pages');
  const { state } = useAppContext();
  const { processedData, uniqueEvents } = state;
  const hasData = processedData.length > 0;

  const [periodA, setPeriodA] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [periodB, setPeriodB] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [result, setResult] = useState<FunnelComparisonResult | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  const handleAddStep = useCallback(() => {
    if (newStep && !steps.includes(newStep)) {
      setSteps(prev => [...prev, newStep]);
      setNewStep('');
    }
  }, [newStep, steps]);

  const handleRemoveStep = useCallback((index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCompare = useCallback(() => {
    if (steps.length < 2 || !periodA.start || !periodA.end || !periodB.start || !periodB.end) return;

    const filterByPeriod = (data: typeof processedData, start: string, end: string) => {
      const s = new Date(start);
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      return data.filter(ev => ev.timestamp >= s && ev.timestamp <= e);
    };

    const dataA = filterByPeriod(processedData, periodA.start, periodA.end);
    const dataB = filterByPeriod(processedData, periodB.start, periodB.end);

    const resultA = calculateFunnel(dataA, steps);
    const resultB = calculateFunnel(dataB, steps);

    setResult(compareFunnels(resultA, resultB));
  }, [processedData, steps, periodA, periodB]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.steps.map(s => ({
      step: s.step,
      rateA: Math.round(s.rateA * 10) / 10,
      rateB: Math.round(s.rateB * 10) / 10,
    }));
  }, [result]);

  const canCompare = steps.length >= 2 && periodA.start && periodA.end && periodB.start && periodB.end;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <GitCompareArrows size={48} className="text-slate-600 mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">{t('funnelCompare.noData')}</h2>
        <p className="text-sm text-slate-400">{t('funnelCompare.noDataDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">{t('funnelCompare.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('funnelCompare.desc')}</p>
      </div>

      {/* Period Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">{t('funnelCompare.periodA')}</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('funnelCompare.start')}</label>
              <input
                type="date"
                value={periodA.start}
                onChange={e => setPeriodA(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('funnelCompare.end')}</label>
              <input
                type="date"
                value={periodA.end}
                onChange={e => setPeriodA(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">{t('funnelCompare.periodB')}</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('funnelCompare.start')}</label>
              <input
                type="date"
                value={periodB.start}
                onChange={e => setPeriodB(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('funnelCompare.end')}</label>
              <input
                type="date"
                value={periodB.end}
                onChange={e => setPeriodB(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Selector */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <select
            value={newStep}
            onChange={e => setNewStep(e.target.value)}
            className="flex-1 bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="">{t('funnelCompare.selectEvent')}</option>
            {uniqueEvents
              .filter(ev => !steps.includes(ev))
              .map(ev => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
          </select>
          <button
            onClick={handleAddStep}
            disabled={!newStep}
            className="p-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {steps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {steps.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-accent text-xs">
                <span className="text-slate-400 mr-0.5">{i + 1}.</span>
                {step}
                <button onClick={() => handleRemoveStep(i)} className="hover:text-coral transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className="mt-3 px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t('funnelCompare.compare')}
        </button>
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{t('funnelCompare.periodA')} — {t('funnelCompare.totalUsers')}</div>
              <div className="text-2xl font-bold text-white">{result.totalUsersA.toLocaleString()}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{t('funnelCompare.periodB')} — {t('funnelCompare.totalUsers')}</div>
              <div className="text-2xl font-bold text-white">{result.totalUsersB.toLocaleString()}</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">Step</th>
                  <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('funnelCompare.periodA')}</th>
                  <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('funnelCompare.periodB')}</th>
                  <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('funnelCompare.diff')}</th>
                  <th className="px-4 py-3 text-center text-xs text-slate-400 font-medium" />
                </tr>
              </thead>
              <tbody>
                {result.steps.map(step => (
                  <tr key={step.stepNumber} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-white">{step.step}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{step.rateA.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-slate-300">{step.rateB.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-right font-medium ${step.direction === 'up' ? 'text-green-400' : step.direction === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
                      {step.diff > 0 ? '+' : ''}{step.diff.toFixed(1)}pp
                    </td>
                    <td className="px-4 py-3 text-center">
                      {step.direction === 'up' && <TrendingUp size={14} className="text-accent inline" />}
                      {step.direction === 'down' && <TrendingDown size={14} className="text-coral inline" />}
                      {step.direction === 'same' && <span className="text-slate-500">&mdash;</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grouped BarChart */}
          <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">{t('funnelCompare.periodA')} vs {t('funnelCompare.periodB')}</h3>
              <ChartDownloadButton chartRef={chartRef} filename="funnel-comparison" />
            </div>
            <div ref={chartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="step" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="rateA" name={t('funnelCompare.periodA')} fill={CHART_COLORS.palette[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rateB" name={t('funnelCompare.periodB')} fill={CHART_COLORS.palette[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          {t('funnelCompare.emptyHint')}
        </div>
      )}
    </div>
  );
};

export default { FunnelComparison };
