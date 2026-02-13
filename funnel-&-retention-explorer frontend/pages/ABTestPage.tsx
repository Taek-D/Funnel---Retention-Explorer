import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FlaskConical, Plus, X, AlertTriangle } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useDataExport } from '../hooks/useDataExport';
import { ExportDropdown } from '../components/ExportDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { CHART_COLORS } from '../lib/constants';
import { runABTest } from '../lib/abTestEngine';
import { listCustomEvents } from '../lib/supabaseData';
import type { ABTestSegment, ABTestResult, ABSegmentFilter, CustomEventDefinition } from '../types';

const AB_COLOR_A = CHART_COLORS.accent;
const AB_COLOR_B = '#a78bfa';

export default function ABTestPage() {
  const { t } = useTranslation('pages');
  const { state } = useAppContext();
  const { user } = useAuth();
  const { exportCSV, exportExcel, exporting, isPro } = useDataExport();
  const { processedData, uniqueEvents } = state;

  const [filterA, setFilterA] = useState<ABSegmentFilter>('platform');
  const [valueA, setValueA] = useState('');
  const [filterB, setFilterB] = useState<ABSegmentFilter>('platform');
  const [valueB, setValueB] = useState('');
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [result, setResult] = useState<ABTestResult | null>(null);
  const [customEvents, setCustomEvents] = useState<CustomEventDefinition[]>([]);

  const platforms = useMemo(() =>
    [...new Set((processedData || []).map(e => e.platform).filter(Boolean))] as string[],
    [processedData]
  );
  const channels = useMemo(() =>
    [...new Set((processedData || []).map(e => e.channel).filter(Boolean))] as string[],
    [processedData]
  );

  useEffect(() => {
    if (user) {
      listCustomEvents(user.id).then(setCustomEvents);
    } else {
      try {
        const stored = localStorage.getItem('fre_custom_events');
        if (stored) setCustomEvents(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [user]);

  const getValueOptions = (filter: ABSegmentFilter): string[] => {
    if (filter === 'platform') return platforms;
    if (filter === 'channel') return channels;
    return customEvents.map(ce => ce.id);
  };

  const getValueLabel = (filter: ABSegmentFilter, value: string): string => {
    if (filter === 'custom') {
      const ce = customEvents.find(c => c.id === value);
      return ce ? ce.name : value;
    }
    return value;
  };

  const addStep = () => {
    if (steps.length < 8) setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    if (steps.length > 2) setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const canRun = valueA && valueB && steps.filter(Boolean).length >= 2;

  const handleRun = () => {
    if (!processedData || !canRun) return;

    const segA: ABTestSegment = { filter: filterA, value: valueA, label: getValueLabel(filterA, valueA) };
    const segB: ABTestSegment = { filter: filterB, value: valueB, label: getValueLabel(filterB, valueB) };
    const validSteps = steps.filter(Boolean);

    const res = runABTest(processedData, validSteps, segA, segB);
    setResult(res);
  };

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.steps.map(s => ({
      step: s.step,
      A: Math.round(s.rateA * 10) / 10,
      B: Math.round(s.rateB * 10) / 10,
    }));
  }, [result]);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FlaskConical size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('abTest.noData')}</h2>
        <p className="text-slate-400">{t('abTest.noDataDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('abTest.title')}</h1>
          <p className="text-slate-400 text-lg">{t('abTest.desc')}</p>
        </div>
        {result && (
          <ExportDropdown
            onCSV={() => exportCSV('segment')}
            onExcel={() => exportExcel('segment')}
            exporting={exporting}
            isPro={isPro}
          />
        )}
      </div>

      <FilterPanel />

      {/* Segment Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SegmentSelector
          label={t('abTest.segmentA')}
          color={AB_COLOR_A}
          filter={filterA}
          value={valueA}
          onFilterChange={setFilterA}
          onValueChange={setValueA}
          options={getValueOptions(filterA)}
          getLabel={(v) => getValueLabel(filterA, v)}
          t={t}
        />
        <SegmentSelector
          label={t('abTest.segmentB')}
          color={AB_COLOR_B}
          filter={filterB}
          value={valueB}
          onFilterChange={setFilterB}
          onValueChange={setValueB}
          options={getValueOptions(filterB)}
          getLabel={(v) => getValueLabel(filterB, v)}
          t={t}
        />
      </div>

      {/* Step Builder */}
      <div className="bg-surface rounded-xl p-5 border border-white/5">
        <h3 className="text-white font-semibold mb-3">{t('abTest.funnelSteps')}</h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-500 text-sm w-6">{i + 1}.</span>
              <select
                className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={step}
                onChange={e => updateStep(i, e.target.value)}
              >
                <option value="">{t('abTest.selectValue')}</option>
                {uniqueEvents.map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
              {steps.length > 2 && (
                <button
                  onClick={() => removeStep(i)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  aria-label={t('abTest.removeStep')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          {steps.length < 8 && (
            <button
              onClick={addStep}
              className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              <Plus size={14} /> {t('abTest.addStep')}
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="ml-auto px-5 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('abTest.runTest')}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl p-5 border border-white/5">
              <p className="text-slate-400 text-sm mb-1">{t('abTest.winner')}</p>
              <p className="text-2xl font-bold text-white">
                {result.winner === 'none'
                  ? t('abTest.noWinner')
                  : `${t('abTest.segmentA').charAt(0) === 'S' ? 'Segment' : t('abTest.segmentA').split(' ')[0]} ${result.winner}`}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {result.winner !== 'none'
                  ? (result.winner === 'A' ? result.segmentA.label : result.segmentB.label)
                  : '—'}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-white/5">
              <p className="text-slate-400 text-sm mb-1">{t('abTest.confidence')}</p>
              <p className="text-2xl font-bold text-white">
                {result.overallSignificant
                  ? `${(100 - result.overallPValue * 100).toFixed(1)}%`
                  : '—'}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                p={result.overallPValue < 0.001 ? '<0.001' : result.overallPValue.toFixed(3)}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-5 border border-white/5">
              <p className="text-slate-400 text-sm mb-1">{t('abTest.sampleSize')}</p>
              <p className="text-2xl font-bold text-white">
                A:{result.sampleSizeA.toLocaleString()} B:{result.sampleSizeB.toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {t('abTest.recommended')}: {result.recommendedSampleSize.toLocaleString()} {t('abTest.perGroup')}
              </p>
            </div>
          </div>

          {/* Insufficient sample warning */}
          {(result.sampleSizeA < result.recommendedSampleSize || result.sampleSizeB < result.recommendedSampleSize) && result.recommendedSampleSize > 0 && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <AlertTriangle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-yellow-400 font-medium">{t('abTest.insufficientSample')}</p>
                <p className="text-yellow-500/70 text-sm">
                  {t('abTest.insufficientSampleDesc', { num: result.recommendedSampleSize.toLocaleString() })}
                </p>
              </div>
            </div>
          )}

          {/* Grouped Bar Chart */}
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridLine} />
                <XAxis dataKey="step" tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }} />
                <YAxis
                  tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.tooltipBg,
                    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number | undefined) => `${value ?? 0}%`}
                />
                <Legend />
                <Bar
                  dataKey="A"
                  name={result.segmentA.label}
                  fill={AB_COLOR_A}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="B"
                  name={result.segmentB.label}
                  fill={AB_COLOR_B}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Step-by-Step Comparison Table */}
          <div className="bg-surface rounded-xl p-5 border border-white/5">
            <h3 className="text-white font-semibold mb-3">{t('abTest.stepComparison')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-white/5">
                    <th className="text-left py-2 pr-4">{t('abTest.step')}</th>
                    <th className="text-right py-2 px-3">A</th>
                    <th className="text-right py-2 px-3">B</th>
                    <th className="text-right py-2 px-3">{t('abTest.diff')}</th>
                    <th className="text-right py-2 px-3">{t('abTest.pValue')}</th>
                    <th className="text-center py-2 pl-3">{t('abTest.significant')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.steps.map((s, i) => (
                    <tr key={s.step} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 pr-4 text-white font-medium">{s.step}</td>
                      <td className="text-right py-2.5 px-3 text-white">{s.rateA.toFixed(1)}%</td>
                      <td className="text-right py-2.5 px-3 text-white">{s.rateB.toFixed(1)}%</td>
                      <td className={`text-right py-2.5 px-3 font-medium ${s.diff > 0 ? 'text-green-400' : s.diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {i === 0 ? '—' : `${s.diff > 0 ? '+' : ''}${s.diff.toFixed(1)}%`}
                      </td>
                      <td className="text-right py-2.5 px-3 text-slate-400">
                        {i === 0 ? '—' : (s.pValue < 0.001 ? '<0.001' : s.pValue.toFixed(3))}
                      </td>
                      <td className="text-center py-2.5 pl-3">
                        {i === 0 ? '—' : (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.significant ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {s.significant ? t('abTest.yes') : t('abTest.no')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CI Footer */}
            {result.steps.length > 1 && (
              <div className="mt-4 pt-3 border-t border-white/5 text-sm text-slate-400">
                <span className="font-medium text-slate-300">{t('abTest.ci95')}:</span>{' '}
                [{result.steps[result.steps.length - 1].ci95[0].toFixed(1)}%, {result.steps[result.steps.length - 1].ci95[1].toFixed(1)}%]
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SegmentSelector({
  label, color, filter, value, onFilterChange, onValueChange, options, getLabel, t
}: {
  label: string;
  color: string;
  filter: ABSegmentFilter;
  value: string;
  onFilterChange: (f: ABSegmentFilter) => void;
  onValueChange: (v: string) => void;
  options: string[];
  getLabel: (v: string) => string;
  t: (key: string) => string;
}) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-white font-semibold">{label}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          className="bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          value={filter}
          onChange={e => {
            onFilterChange(e.target.value as ABSegmentFilter);
            onValueChange('');
          }}
        >
          <option value="platform">{t('abTest.platform')}</option>
          <option value="channel">{t('abTest.channel')}</option>
          <option value="custom">{t('abTest.custom')}</option>
        </select>
        <select
          className="bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          value={value}
          onChange={e => onValueChange(e.target.value)}
        >
          <option value="">{t('abTest.selectValue')}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{getLabel(opt)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
