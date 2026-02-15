import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Zap, ArrowRight, TrendingUp, TrendingDown, Plus, X, ChevronDown, ChevronUp, GripVertical, Save, AlertTriangle } from '../components/Icons';
import { UpgradeBanner } from '../components/UpgradeBanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFunnelAnalysis } from '../hooks/useFunnelAnalysis';
import { useDataExport } from '../hooks/useDataExport';
import { formatTime } from '../lib/formatters';
import { CHART_COLORS } from '../lib/constants';
import { ChartSkeleton } from '../components/ChartSkeleton';
import { ExportDropdown } from '../components/ExportDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { ChartDownloadButton } from '../components/ChartDownloadButton';
import { useFilteredData } from '../hooks/useFilteredData';
import { useAuth } from '../context/AuthContext';
import { listCustomEvents, listSavedFunnels, createSavedFunnel, updateSavedFunnel, deleteSavedFunnel } from '../lib/supabaseData';
import type { CustomEventDefinition, SavedFunnel } from '../types';

export const FunnelAnalysis: React.FC = () => {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const {
    funnelSteps, funnelResults, uniqueEvents, detectedType, hasData,
    setFunnelSteps, applyTemplate, runFunnelAnalysis
  } = useFunnelAnalysis();
  const { exportCSV, exportExcel, exporting, isPro } = useDataExport();
  const { filteredData, filterCount } = useFilteredData();
  const { user } = useAuth();

  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [customEvents, setCustomEvents] = useState<CustomEventDefinition[]>([]);

  // DnD state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Chart refs for image download
  const funnelChartRef = useRef<HTMLDivElement>(null);
  const dropoffChartRef = useRef<HTMLDivElement>(null);
  const timeChartRef = useRef<HTMLDivElement>(null);

  // Drop-off chart state
  const [showDropoff, setShowDropoff] = useState(false);

  // Saved funnels state
  const [savedFunnels, setSavedFunnels] = useState<SavedFunnel[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    if (user) {
      listCustomEvents(user.id).then(setCustomEvents);
    } else {
      try { const p = JSON.parse(localStorage.getItem('fre_custom_events') || '[]'); setCustomEvents(Array.isArray(p) ? p : []); } catch { /* empty */ }
    }
  }, [user]);

  // Load saved funnels
  useEffect(() => {
    if (user) {
      listSavedFunnels(user.id).then(setSavedFunnels);
    } else {
      try {
        const raw = JSON.parse(localStorage.getItem('fre-funnel-templates') || '[]');
        if (!Array.isArray(raw)) { setSavedFunnels([]); return; }
        const typed = raw as { name: string; steps: string[] }[];
        setSavedFunnels(typed.map((tmpl, i) => ({
          id: `local-${i}`, user_id: '', name: tmpl.name, steps: tmpl.steps,
          created_at: '', updated_at: ''
        })));
      } catch { /* empty */ }
    }
  }, [user]);

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
  const moveStep = useCallback((from: number, to: number) => {
    if (to < 0 || to >= funnelSteps.length) return;
    const newSteps = [...funnelSteps];
    const [moved] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, moved);
    setFunnelSteps(newSteps);
  }, [funnelSteps, setFunnelSteps]);

  // DnD handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex) moveStep(fromIndex, toIndex);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Save funnel
  const handleSaveFunnel = async () => {
    const validSteps = funnelSteps.filter(Boolean);
    if (validSteps.length < 2 || !saveName.trim()) return;
    const trimmedName = saveName.trim();

    if (user) {
      const existing = savedFunnels.find(f => f.name === trimmedName);
      if (existing) {
        if (!window.confirm(t('funnel.overwriteConfirm', { name: trimmedName }))) return;
        await updateSavedFunnel(existing.id, { steps: validSteps });
        setSavedFunnels(prev => prev.map(f => f.id === existing.id ? { ...f, steps: validSteps } : f));
      } else {
        const created = await createSavedFunnel({ userId: user.id, name: trimmedName, steps: validSteps });
        setSavedFunnels(prev => [created, ...prev]);
      }
    } else {
      const localFunnels = savedFunnels.map(f => ({ name: f.name, steps: f.steps }));
      const existingIdx = localFunnels.findIndex(f => f.name === trimmedName);
      if (existingIdx >= 0) {
        if (!window.confirm(t('funnel.overwriteConfirm', { name: trimmedName }))) return;
        localFunnels[existingIdx].steps = validSteps;
      } else {
        localFunnels.push({ name: trimmedName, steps: validSteps });
      }
      localStorage.setItem('fre-funnel-templates', JSON.stringify(localFunnels));
      setSavedFunnels(localFunnels.map((tmpl, i) => ({
        id: `local-${i}`, user_id: '', name: tmpl.name, steps: tmpl.steps,
        created_at: '', updated_at: ''
      })));
    }

    setShowSaveModal(false);
    setSaveName('');
  };

  // Delete funnel
  const handleDeleteFunnel = async (funnel: SavedFunnel) => {
    if (!window.confirm(t('funnel.deleteFunnelConfirm', { name: funnel.name }))) return;
    if (user) {
      await deleteSavedFunnel(funnel.id);
      setSavedFunnels(prev => prev.filter(f => f.id !== funnel.id));
    } else {
      const updated = savedFunnels.filter(f => f.id !== funnel.id);
      localStorage.setItem('fre-funnel-templates', JSON.stringify(
        updated.map(f => ({ name: f.name, steps: f.steps }))
      ));
      setSavedFunnels(updated);
    }
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

  const dropoffData = useMemo(() =>
    hasResults
      ? funnelResults.slice(1).map((s, i) => ({
          name: `${funnelResults[i].step} → ${s.step}`,
          dropoff: Number(s.dropOff.toFixed(1)),
          lost: funnelResults[i].users - s.users,
        }))
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

      <FilterPanel />

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

            {/* Saved Funnels */}
            {savedFunnels.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 text-sm font-medium">{t('funnel.loadFunnel')}</span>
                {savedFunnels.map((funnel) => (
                  <div key={funnel.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setFunnelSteps(funnel.steps)}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white border border-white/10 transition-all"
                    >
                      {funnel.name}
                    </button>
                    <button
                      onClick={() => handleDeleteFunnel(funnel)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      title={t('funnel.deleteTemplate')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Funnel Steps */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t('funnel.funnelSteps')}</h4>
                <span className="text-[10px] text-slate-600 font-mono">{funnelSteps.length} steps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {funnelSteps.map((step, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-2 p-3 rounded-lg border bg-background hover:border-accent/50 transition-colors ${dragIndex === i ? 'opacity-40' : ''} ${dragOverIndex === i && dragIndex !== i ? 'border-accent' : 'border-white/10'}`}
                  >
                    <GripVertical size={14} className="text-slate-600 cursor-grab shrink-0" />
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveStep(i, i - 1)}
                        disabled={i === 0}
                        className="text-slate-600 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveStep(i, i + 1)}
                        disabled={i === funnelSteps.length - 1}
                        className="text-slate-600 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    <div className="bg-accent/10 text-accent w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                    <select
                      className="flex-1 bg-transparent text-white text-sm border-none outline-none"
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                    >
                      <option value="" className="bg-surface">{t('funnel.selectEvent')}</option>
                      <optgroup label={t('customEvents.optgroupRaw')}>
                        {uniqueEvents.map(event => (
                          <option key={event} value={event} className="bg-surface">{event}</option>
                        ))}
                      </optgroup>
                      {customEvents.length > 0 && (
                        <optgroup label={t('customEvents.optgroupCustom')}>
                          {customEvents.map(ce => (
                            <option key={`custom:${ce.id}`} value={`custom:${ce.id}`} className="bg-surface">{ce.name}</option>
                          ))}
                        </optgroup>
                      )}
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
                  onClick={() => {
                    setSaveName('');
                    setShowSaveModal(true);
                  }}
                  disabled={funnelSteps.filter(Boolean).length < 2}
                  className="py-2 px-4 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:text-accent hover:border-accent transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Save size={16} /> {t('funnel.saveFunnel')}
                </button>
                <button
                  onClick={() => runFunnelAnalysis(filterCount > 0 ? filteredData : undefined)}
                  className="py-2 px-6 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-all"
                >
                  {t('funnel.calculate')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-surface border border-white/10 rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4">{t('funnel.saveFunnel')}</h3>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t('funnel.funnelNamePlaceholder')}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4 outline-none focus:border-accent"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && saveName.trim()) handleSaveFunnel(); }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {t('funnel.cancel')}
              </button>
              <button
                onClick={handleSaveFunnel}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-40 transition-colors"
              >
                {t('funnel.save')}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-3">
                  <ChartDownloadButton targetRef={funnelChartRef} filename="funnel-chart" />
                  <div className="text-right">
                    <div className="text-3xl font-bold font-mono text-white">{overallConversion.toFixed(1)}%</div>
                    <div className="text-accent text-sm font-medium">{t('funnel.overallConversion')}</div>
                  </div>
                </div>
              </div>

              <div ref={funnelChartRef} className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={60}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: CHART_COLORS.cursorFill }}
                      contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff', borderRadius: '6px' }}
                      formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), t('funnel.users')]}
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

              {/* Time Distribution Chart */}
              {funnelResults.some(s => s.timeStats && s.timeStats.count > 0) && (() => {
                const timeChartData = funnelResults.slice(1)
                  .filter(s => s.timeStats && s.timeStats.count > 0)
                  .map((step, i) => ({
                    label: `${funnelResults[i].step} → ${step.step}`,
                    p10: Math.round(step.timeStats!.p10 * 10) / 10,
                    median: Math.round(step.timeStats!.median * 10) / 10,
                    p90: Math.round(step.timeStats!.p90 * 10) / 10,
                    mean: Math.round(step.timeStats!.mean * 10) / 10,
                    count: step.timeStats!.count,
                    isBottleneck: false,
                  }));
                const maxMedian = Math.max(...timeChartData.map(d => d.median));
                timeChartData.forEach(d => { d.isBottleneck = d.median === maxMedian && maxMedian > 0 && timeChartData.length > 1; });
                const bottleneck = timeChartData.find(d => d.isBottleneck);

                return (
                  <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">{t('funnel.timeAnalysis')}</h3>
                      <ChartDownloadButton targetRef={timeChartRef} filename="funnel-time-analysis" />
                    </div>
                    <div ref={timeChartRef} className="w-full" style={{ height: Math.max(180, timeChartData.length * 60) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={timeChartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 11 }}
                            tickFormatter={(v: number) => formatTime(v)}
                          />
                          <YAxis
                            type="category"
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }}
                            width={160}
                          />
                          <Tooltip
                            cursor={{ fill: CHART_COLORS.cursorFill }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.[0]) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-elevated border border-white/[0.06] rounded-md p-3 text-xs space-y-1">
                                  <p className="font-semibold text-white text-sm">{d.label}</p>
                                  <p className="text-slate-300">{t('funnel.timeP10')}: <span className="text-white font-mono">{formatTime(d.p10)}</span></p>
                                  <p className="text-slate-300">{t('funnel.timeMedian')}: <span className="text-white font-mono">{formatTime(d.median)}</span></p>
                                  <p className="text-slate-300">{t('funnel.timeP90')}: <span className="text-white font-mono">{formatTime(d.p90)}</span></p>
                                  <p className="text-slate-300">{t('funnel.timeMean')}: <span className="text-white font-mono">{formatTime(d.mean)}</span></p>
                                  <p className="text-slate-300">{t('funnel.timeCount')}: <span className="text-white font-mono">{d.count}</span></p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="p90" name="P90" radius={[0, 4, 4, 0]} opacity={0.2}>
                            {timeChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.isBottleneck ? '#ef4444' : CHART_COLORS.accent} />
                            ))}
                          </Bar>
                          <Bar dataKey="median" name="Median" radius={[0, 4, 4, 0]}>
                            {timeChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.isBottleneck ? '#ef4444' : CHART_COLORS.accent} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {bottleneck && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-amber-400">
                        <AlertTriangle size={14} />
                        <span>{t('funnel.bottleneckHint', { step: bottleneck.label, time: formatTime(bottleneck.median) })}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          {/* Upgrade Banner */}
          <UpgradeBanner
            messageKey="upgradeBanner.funnel"
            page="funnel"
            onUpgrade={() => navigate('/app/subscription')}
          />

          {/* Drop-off Chart Toggle + Chart */}
          {dropoffData.length > 0 && (
            <>
              <button
                onClick={() => setShowDropoff(!showDropoff)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {showDropoff ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showDropoff ? t('funnel.hideDropoff') : t('funnel.showDropoff')}
              </button>

              {showDropoff && (
                <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{t('funnel.dropoffTitle')}</h3>
                    <ChartDownloadButton targetRef={dropoffChartRef} filename="dropoff-chart" />
                  </div>
                  <div ref={dropoffChartRef} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dropoffData} layout="vertical" barSize={24}>
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 11 }} domain={[0, 100]} unit="%" />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }} width={180} />
                        <Tooltip
                          cursor={{ fill: CHART_COLORS.cursorFill }}
                          contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff', borderRadius: '6px' }}
                          formatter={(value, _name, entry) => {
                            const data = (entry as { payload: { lost: number } }).payload;
                            return [`${(value ?? 0)}% (${data.lost.toLocaleString()} ${t('funnel.dropoffRate')})`, t('funnel.dropoffTitle')];
                          }}
                        />
                        <Bar dataKey="dropoff" radius={[0, 4, 4, 0]}>
                          {dropoffData.map((entry, index) => (
                            <Cell key={index} fill={CHART_COLORS.dropoffColor(entry.dropoff)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
