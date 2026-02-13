import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Diff, Plus, X, TrendingUp, TrendingDown } from '../components/Icons';
import type { CohortGrouping } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { calculateActivityRetention, compareRetention } from '../lib/retentionEngine';
import { CHART_COLORS } from '../lib/constants';
import { ChartDownloadButton } from '../components/ChartDownloadButton';
import type { RetentionComparisonResult } from '../lib/retentionEngine';

export const RetentionComparison: React.FC = () => {
  const { t } = useTranslation('pages');
  const { state } = useAppContext();
  const { processedData, uniqueEvents } = state;
  const hasData = processedData.length > 0;

  const [periodA, setPeriodA] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [periodB, setPeriodB] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [cohortEvent, setCohortEvent] = useState('');
  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const [newActiveEvent, setNewActiveEvent] = useState('');
  const [cohortGrouping, setCohortGrouping] = useState<CohortGrouping>('daily');
  const [result, setResult] = useState<RetentionComparisonResult | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  const handleAddActive = useCallback(() => {
    if (newActiveEvent && !activeEvents.includes(newActiveEvent)) {
      setActiveEvents(prev => [...prev, newActiveEvent]);
      setNewActiveEvent('');
    }
  }, [newActiveEvent, activeEvents]);

  const handleRemoveActive = useCallback((index: number) => {
    setActiveEvents(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCompare = useCallback(() => {
    if (!cohortEvent || activeEvents.length === 0) return;
    if (!periodA.start || !periodA.end || !periodB.start || !periodB.end) return;

    const filterByPeriod = (data: typeof processedData, start: string, end: string) => {
      const s = new Date(start);
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      return data.filter(ev => ev.timestamp >= s && ev.timestamp <= e);
    };

    const dataA = filterByPeriod(processedData, periodA.start, periodA.end);
    const dataB = filterByPeriod(processedData, periodB.start, periodB.end);

    const resultA = calculateActivityRetention(dataA, cohortEvent, activeEvents, cohortGrouping);
    const resultB = calculateActivityRetention(dataB, cohortEvent, activeEvents, cohortGrouping);

    setResult(compareRetention(resultA, resultB));
  }, [processedData, cohortEvent, activeEvents, periodA, periodB, cohortGrouping]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.days.map(d => ({
      day: d.day,
      rateA: Math.round(d.rateA * 10) / 10,
      rateB: Math.round(d.rateB * 10) / 10,
    }));
  }, [result]);

  const canCompare = cohortEvent && activeEvents.length > 0 && periodA.start && periodA.end && periodB.start && periodB.end;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Diff size={48} className="text-slate-600 mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">{t('retentionCompare.noData')}</h2>
        <p className="text-sm text-slate-400">{t('retentionCompare.noDataDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">{t('retentionCompare.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('retentionCompare.desc')}</p>
      </div>

      {/* Event Selection */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-4 space-y-3">
        {/* Cohort Event */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{t('retentionCompare.cohortEvent')}</label>
          <select
            value={cohortEvent}
            onChange={e => setCohortEvent(e.target.value)}
            className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="">{t('retentionCompare.selectCohort')}</option>
            {uniqueEvents.map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
        </div>

        {/* Active Events */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{t('retentionCompare.activeEvents')}</label>
          <div className="flex items-center gap-2">
            <select
              value={newActiveEvent}
              onChange={e => setNewActiveEvent(e.target.value)}
              className="flex-1 bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="">{t('retentionCompare.selectActive')}</option>
              {uniqueEvents
                .filter(ev => !activeEvents.includes(ev))
                .map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
            </select>
            <button
              onClick={handleAddActive}
              disabled={!newActiveEvent}
              className="p-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {activeEvents.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activeEvents.map((ev, i) => (
                <span key={ev} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-accent text-xs">
                  {ev}
                  <button onClick={() => handleRemoveActive(i)} className="hover:text-coral transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cohort Grouping */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
        <label className="text-xs text-slate-400 mb-2 block">{t('retentionCompare.grouping')}</label>
        <div className="flex items-center gap-1 bg-background border border-white/[0.06] p-1 rounded w-fit">
          {(['daily', 'weekly', 'monthly'] as const).map(g => (
            <button
              key={g}
              onClick={() => setCohortGrouping(g)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                cohortGrouping === g ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t(`retentionCompare.${g}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Period Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">{t('retentionCompare.periodA')}</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('retentionCompare.start')}</label>
              <input
                type="date"
                value={periodA.start}
                onChange={e => setPeriodA(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('retentionCompare.end')}</label>
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
          <h3 className="text-sm font-medium text-white mb-3">{t('retentionCompare.periodB')}</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('retentionCompare.start')}</label>
              <input
                type="date"
                value={periodB.start}
                onChange={e => setPeriodB(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-background border border-white/[0.06] rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">{t('retentionCompare.end')}</label>
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

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={!canCompare}
        className="px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('retentionCompare.compare')}
      </button>

      {/* Results */}
      {result ? (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{t('retentionCompare.periodA')} — {t('retentionCompare.cohorts')}</div>
              <div className="text-2xl font-bold text-white">{result.cohortsA}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{t('retentionCompare.periodA')} — {t('retentionCompare.totalUsers')}</div>
              <div className="text-2xl font-bold text-white">{result.totalUsersA.toLocaleString()}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{t('retentionCompare.periodB')} — {t('retentionCompare.cohorts')}</div>
              <div className="text-2xl font-bold text-white">{result.cohortsB}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{t('retentionCompare.periodB')} — {t('retentionCompare.totalUsers')}</div>
              <div className="text-2xl font-bold text-white">{result.totalUsersB.toLocaleString()}</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">Day</th>
                  <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('retentionCompare.periodA')}</th>
                  <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('retentionCompare.periodB')}</th>
                  <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('retentionCompare.diff')}</th>
                  <th className="px-4 py-3 text-center text-xs text-slate-400 font-medium" />
                </tr>
              </thead>
              <tbody>
                {result.days.map(d => (
                  <tr key={d.day} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-white font-mono">{d.day}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{d.rateA.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-slate-300">{d.rateB.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-right font-medium ${d.direction === 'up' ? 'text-green-400' : d.direction === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
                      {d.diff > 0 ? '+' : ''}{d.diff.toFixed(1)}pp
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.direction === 'up' && <TrendingUp size={14} className="text-accent inline" />}
                      {d.direction === 'down' && <TrendingDown size={14} className="text-coral inline" />}
                      {d.direction === 'same' && <span className="text-slate-500">&mdash;</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LineChart */}
          <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">{t('retentionCompare.periodA')} vs {t('retentionCompare.periodB')}</h3>
              <ChartDownloadButton targetRef={chartRef} filename="retention-comparison" />
            </div>
            <div ref={chartRef}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="rateA" name={t('retentionCompare.periodA')} stroke={CHART_COLORS.palette[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rateB" name={t('retentionCompare.periodB')} stroke={CHART_COLORS.palette[1]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          {t('retentionCompare.emptyHint')}
        </div>
      )}
    </div>
  );
};

export default { RetentionComparison };
