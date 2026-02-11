import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Zap, ArrowRight, TrendingUp, TrendingDown, Plus, X, ChevronDown, ChevronUp } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFunnelAnalysis } from '../hooks/useFunnelAnalysis';
import { useDataExport } from '../hooks/useDataExport';
import { formatTime } from '../lib/formatters';
import { CHART_COLORS } from '../lib/constants';
import { ChartSkeleton } from '../components/ChartSkeleton';
import { ExportDropdown } from '../components/ExportDropdown';

export const FunnelAnalysis: React.FC = () => {
  const { t } = useTranslation('pages');
  const {
    funnelSteps, funnelResults, uniqueEvents, detectedType, hasData,
    setFunnelSteps, applyTemplate, runFunnelAnalysis
  } = useFunnelAnalysis();
  const { exportCSV, exportExcel, exporting, isPro } = useDataExport();

  const [editorCollapsed, setEditorCollapsed] = useState(false);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('funnel.noData')}</h2>
        <p className="text-slate-400">{t('funnel.noDataDesc')}</p>
      </div>
    );
  }

  const addStep = () => setFunnelSteps([...funnelSteps, '']);
  const removeStep = (index: number) => setFunnelSteps(funnelSteps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const newSteps = [...funnelSteps];
    newSteps[index] = value;
    setFunnelSteps(newSteps);
  };

  const hasResults = funnelResults && funnelResults.length > 0;

  const overallConversion = useMemo(() =>
    hasResults && funnelResults.length > 1
      ? ((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100)
      : 100,
    [hasResults, funnelResults]
  );

  const chartData = useMemo(() =>
    hasResults
      ? funnelResults.map(s => ({ name: s.step, value: s.users, rate: s.conversionRate }))
      : [],
    [hasResults, funnelResults]
  );

  const totalUsers = useMemo(() =>
    hasResults ? (funnelResults[0]?.users || 0) : 0,
    [hasResults, funnelResults]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('funnel.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {detectedType === 'ecommerce' ? t('funnel.ecommerce') : detectedType === 'subscription' ? t('funnel.subscription') : t('funnel.custom')} {t('funnel.desc')}
          </p>
        </div>
        {hasResults && (
          <ExportDropdown
            onCSV={() => exportCSV('funnel')}
            onExcel={() => exportExcel('funnel')}
            disabled={!hasResults}
            exporting={exporting}
            isPro={isPro}
          />
        )}
      </div>

      {/* Editor Section (collapsible when results exist) */}
      <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
        <button
          onClick={() => hasResults && setEditorCollapsed(!editorCollapsed)}
          className={`w-full flex items-center justify-between p-4 ${hasResults ? 'cursor-pointer hover:bg-white/[0.02]' : 'cursor-default'} transition-colors`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent"><Zap size={20} /></div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">{t('funnel.settings')}</p>
              <p className="text-slate-400 text-xs">
                {hasResults
                  ? `${t('funnel.stepsConfigured', { count: funnelSteps.filter(Boolean).length })} ${editorCollapsed ? t('funnel.expand') : t('funnel.collapse')}`
                  : t('funnel.settingsHint')}
              </p>
            </div>
          </div>
          {hasResults && (
            editorCollapsed ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />
          )}
        </button>

        {(!hasResults || !editorCollapsed) && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06]">
            {/* Template Selector */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <span className="text-slate-400 text-sm font-medium">{t('funnel.template')}</span>
              <button
                onClick={() => applyTemplate('ecommerce')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detectedType === 'ecommerce' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white border border-white/10'}`}
              >
                {t('funnel.ecommerce')}
              </button>
              <button
                onClick={() => applyTemplate('subscription')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detectedType === 'subscription' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white border border-white/10'}`}
              >
                {t('funnel.subscription')}
              </button>
              {detectedType === 'subscription' && (
                <button
                  onClick={() => applyTemplate('lifecycle')}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white border border-white/10 transition-all"
                >
                  Lifecycle
                </button>
              )}
            </div>

            {/* Funnel Steps */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t('funnel.funnelSteps')}</h4>
                <span className="text-[10px] text-slate-600 font-mono">{funnelSteps.length} steps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {funnelSteps.map((step, i) => (
                  <div key={i} className="group flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-background hover:border-accent/50 transition-colors">
                    <div className="bg-accent/10 text-accent w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                    <select
                      className="flex-1 bg-transparent text-white text-sm border-none outline-none"
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                    >
                      <option value="" className="bg-surface">{t('funnel.selectEvent')}</option>
                      {uniqueEvents.map(event => (
                        <option key={event} value={event} className="bg-surface">{event}</option>
                      ))}
                    </select>
                    {i > 0 && (
                      <button onClick={() => removeStep(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={addStep}
                  className="py-2 px-4 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium flex items-center gap-2"
                >
                  <Plus size={16} /> {t('funnel.addStep')}
                </button>
                <button
                  onClick={runFunnelAnalysis}
                  className="py-2 px-6 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-all"
                >
                  {t('funnel.calculate')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculating placeholder */}
      {!hasResults && funnelSteps.filter(Boolean).length >= 2 && (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('funnel.emptyHint')}</h3>
          <ChartSkeleton variant="bar" />
        </div>
      )}

      {/* Results Section */}
      {hasResults && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('funnel.totalEntry'), value: totalUsers.toLocaleString(), icon: Users },
              { label: t('funnel.overallConversion'), value: overallConversion.toFixed(1) + '%', icon: TrendingUp },
              { label: t('funnel.finalUsers'), value: funnelResults[funnelResults.length - 1].users.toLocaleString(), icon: Users },
              { label: t('funnel.stepCount'), value: String(funnelResults.length), icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="bg-surface border border-white/[0.06] rounded-lg p-5 flex flex-col gap-1 hover:border-accent/20 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                  <div className="p-1.5 rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                    <stat.icon size={18} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold font-mono text-white">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Funnel Chart */}
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('funnel.conversionFunnel')}</h3>
                  <p className="text-sm text-slate-400">{t('funnel.stepJourney')}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-mono text-white">{overallConversion.toFixed(1)}%</div>
                  <div className="text-accent text-sm font-medium">{t('funnel.overallConversion')}</div>
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={60}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: CHART_COLORS.cursorFill }}
                      contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff', borderRadius: '6px' }}
                      formatter={(value: number) => [value.toLocaleString(), t('funnel.users')]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS.cellOpacity(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Step Details Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="bg-surface border border-white/[0.06] rounded-lg flex-1 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="text-base font-semibold text-white">{t('funnel.stepDetails')}</h3>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-300">
                      <tr>
                        <th className="px-4 py-3">{t('funnel.step')}</th>
                        <th className="px-4 py-3 text-right">{t('funnel.users')}</th>
                        <th className="px-4 py-3 text-right">{t('funnel.conversion')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {funnelResults.map((step, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">{step.stepNumber}</span>
                              <span className="font-medium text-white text-xs">{step.step}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium font-mono">{step.users.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono ${step.conversionRate >= 50 ? 'text-accent' : step.conversionRate >= 25 ? 'text-amber-400' : 'text-coral'}`}>
                              {step.conversionRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Median Time */}
              {funnelResults.some(s => s.medianTime) && (
                <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">{t('funnel.medianTime')}</h3>
                  <div className="space-y-2">
                    {funnelResults.slice(1).map((step, i) => (
                      step.medianTime ? (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{funnelResults[i].step} <ArrowRight size={10} className="inline" /> {step.step}</span>
                          <span className="text-white font-medium font-mono">{formatTime(step.medianTime)}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
