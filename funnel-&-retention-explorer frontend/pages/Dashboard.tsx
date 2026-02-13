import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Info, Users, Zap, Download, UploadCloud, Sparkles, Filter, ArrowRight, Clock, Trash2, ChevronRight, BarChart2, Shield, AlertTriangle, Settings, Check, RotateCcw, LayoutDashboard, ShoppingBag, Activity, ChevronDown } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import { useExportReport } from '../hooks/useExportReport';
import { useDataExport } from '../hooks/useDataExport';
import { useSavedAnalyses } from '../hooks/useSavedAnalyses';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { formatNum, formatPct, formatCurrency } from '../lib/formatters';
import { useToast } from '../components/Toast';
import { ShareButton } from '../components/ShareButton';
import { ExportDropdown } from '../components/ExportDropdown';
import { DashboardWidget } from '../components/DashboardWidget';
import { ChartDownloadButton } from '../components/ChartDownloadButton';
import { UpgradeBanner } from '../components/UpgradeBanner';
import { CHART_COLORS, DASHBOARD_WIDGETS, PRESET_TEMPLATES } from '../lib/constants';
import { calculateStickiness } from '../lib/stickinessEngine';
import { useClickOutside } from '../hooks/useClickOutside';
import { FilterPanel } from '../components/FilterPanel';
import { useFilteredData } from '../hooks/useFilteredData';
import type { AppState, WidgetId } from '../types';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation('pages');
  const { state, dispatch } = useAppContext();
  const { exportReport, exporting: reportExporting, isPro } = useExportReport();
  const { exportCSV, exportExcel, exporting: dataExporting, isPro: dataPro } = useDataExport();
  const { snapshots, removeSnapshot } = useSavedAnalyses();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { layout, editMode, setEditMode, toggleVisibility, toggleWidth, reorder, resetToDefault, applyPreset } = useDashboardLayout();
  const { processedData, funnelResults, retentionResults, insights, subscriptionKPIs, detectedType, dataQualityReport } = state;
  const { filteredData, filterCount } = useFilteredData();

  // Chart download refs
  const dashFunnelRef = useRef<HTMLDivElement>(null);
  const dashRetentionRef = useRef<HTMLDivElement>(null);

  // Preset dropdown state
  const [presetOpen, setPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);
  useClickOutside(presetRef, () => setPresetOpen(false));

  const PRESET_ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
    LayoutDashboard,
    ShoppingBag,
    Activity,
  };

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex !== null && fromIndex !== toIndex) {
      reorder(fromIndex, toIndex);
    }
    dragIndexRef.current = null;
  }, [reorder]);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
  }, []);

  const handleMoveUp = useCallback((index: number) => () => {
    if (index > 0) {
      reorder(index, index - 1);
      setAnnouncement(t('dashboard.a11y.movedTo', { pos: index }));
      setTimeout(() => {
        const widgets = document.querySelectorAll('[role="listitem"]');
        (widgets[index - 1] as HTMLElement)?.focus();
      }, 50);
    }
  }, [reorder, t]);

  const handleMoveDown = useCallback((index: number) => () => {
    if (index < layout.length - 1) {
      reorder(index, index + 1);
      setAnnouncement(t('dashboard.a11y.movedTo', { pos: index + 2 }));
      setTimeout(() => {
        const widgets = document.querySelectorAll('[role="listitem"]');
        (widgets[index + 1] as HTMLElement)?.focus();
      }, 50);
    }
  }, [reorder, layout.length, t]);

  const restoreSnapshot = useCallback((snap: { snapshot_type: string; results: Record<string, unknown> | null }) => {
    const results = snap.results;
    if (!results) return;

    if (results.funnelResults) {
      dispatch({ type: 'SET_FUNNEL_RESULTS', payload: results.funnelResults as AppState['funnelResults'] });
    }
    if (results.retentionResults) {
      dispatch({ type: 'SET_RETENTION_RESULTS', payload: results.retentionResults as AppState['retentionResults'] });
    }
    if (results.insights) {
      dispatch({ type: 'SET_INSIGHTS', payload: results.insights as AppState['insights'] });
    }

    toast('success', t('dashboard.restoreSuccess'), t('dashboard.restoreDesc', { type: snap.snapshot_type }));
  }, [dispatch, toast, t]);

  const hasData = processedData.length > 0;

  // KPIs (use filteredData when filters are active)
  const displayData = filterCount > 0 ? filteredData : processedData;
  const uniqueUsers = filterCount > 0
    ? new Set(displayData.map(e => e.userId)).size
    : (dataQualityReport?.uniqueUsers || 0);
  const totalEvents = displayData.length;

  const funnelChartData = useMemo(() =>
    funnelResults
      ? funnelResults.map(s => ({ name: s.step, value: s.users }))
      : [],
    [funnelResults]
  );

  const overallConversion = useMemo(() =>
    funnelResults && funnelResults.length > 1
      ? ((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100)
      : null,
    [funnelResults]
  );

  const retentionCurveData = useMemo(() => {
    if (!retentionResults || retentionResults.length === 0) return [];
    const dayKeys = Object.keys(retentionResults[0].days).sort((a, b) =>
      parseInt(a.replace('D', '')) - parseInt(b.replace('D', ''))
    );
    return dayKeys.map(day => {
      const avg = retentionResults.reduce((sum, r) => sum + (r.days[day] || 0), 0) / retentionResults.length;
      return { name: day, value: parseFloat(avg.toFixed(1)) };
    });
  }, [retentionResults]);

  // KPI cards data (memoized)
  const kpiCards = useMemo(() => subscriptionKPIs
    ? [
        { label: t('dashboard.totalUsers'), value: formatNum(subscriptionKPIs.users_total), change: detectedType === 'subscription' ? t('dashboard.subscription') : t('dashboard.ecommerce'), positive: true, link: '/app/upload' },
        { label: t('dashboard.paidUsers'), value: formatNum(subscriptionKPIs.paid_user_count), change: formatPct(subscriptionKPIs.users_total > 0 ? (subscriptionKPIs.paid_user_count / subscriptionKPIs.users_total) * 100 : 0), positive: true, link: '/app/funnels' },
        { label: t('dashboard.churnRate'), value: formatPct(subscriptionKPIs.cancel_rate_paid), change: `${subscriptionKPIs.cancel_events} events`, positive: subscriptionKPIs.cancel_rate_paid < 10, link: '/app/retention' },
        { label: t('dashboard.revenue'), value: formatCurrency(subscriptionKPIs.gross_revenue), change: `ARPPU: ${formatCurrency(subscriptionKPIs.arppu)}`, positive: true, link: '/app/insights' },
      ]
    : [
        { label: t('dashboard.uniqueUsers'), value: formatNum(uniqueUsers), change: hasData ? t('dashboard.active') : t('dashboard.noData'), positive: hasData, link: '/app/upload' },
        { label: t('dashboard.totalEvents'), value: formatNum(totalEvents), change: hasData ? `${state.uniqueEvents.length} ${t('dashboard.types')}` : t('dashboard.noData'), positive: hasData, link: '/app/upload' },
        { label: t('dashboard.conversionRate'), value: overallConversion != null ? overallConversion.toFixed(1) + '%' : 'N/A', change: funnelResults ? `${funnelResults.length} ${t('dashboard.steps')}` : t('dashboard.notCalculated'), positive: overallConversion != null && overallConversion > 20, link: '/app/funnels' },
        { label: t('dashboard.dataType'), value: detectedType === 'ecommerce' ? t('dashboard.ecommerce') : detectedType === 'subscription' ? t('dashboard.subscription') : 'N/A', change: hasData ? t('dashboard.detected') : t('dashboard.uploadData'), positive: detectedType !== null, link: '/app/upload' },
      ], [subscriptionKPIs, detectedType, uniqueUsers, totalEvents, state.uniqueEvents.length, overallConversion, funnelResults, hasData, t]);

  // Widget content (individually memoized)
  const kpiWidget = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((kpi, i) => (
        <div
          key={i}
          onClick={() => navigate(kpi.link)}
          className={`bg-surface border border-white/[0.06] rounded-lg p-6 hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group animate-fade-up delay-${(i + 1) * 100}`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-400 text-sm font-medium">{kpi.label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${kpi.positive ? 'bg-accent/10 text-accent' : 'bg-coral/10 text-coral'}`}>
              {kpi.change}
            </span>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold font-mono text-white">{kpi.value}</div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      ))}
    </div>
  ), [kpiCards, navigate]);

  const funnelWidget = useMemo(() => funnelChartData.length > 0 ? (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {t('dashboard.funnelDropoff')}
            <Info size={16} className="text-slate-500 cursor-help" />
          </h3>
          <p className="text-slate-400 text-sm">{t('dashboard.nStepFunnel', { count: funnelResults?.length || 0 })}</p>
        </div>
        <div className="flex items-center gap-3">
          <ChartDownloadButton targetRef={dashFunnelRef} filename="dashboard-funnel" />
          <div className="text-right">
            <div className="text-3xl font-bold font-mono text-white">{overallConversion?.toFixed(1)}%</div>
            <div className="text-accent text-sm font-medium">{t('dashboard.overallConversion')}</div>
          </div>
        </div>
      </div>
      <div ref={dashFunnelRef} className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelChartData} barSize={60}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }} dy={10} />
            <Tooltip
              cursor={{ fill: CHART_COLORS.cursorFill }}
              contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff' }}
              formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), t('dashboard.users')]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {funnelChartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS.cellOpacity(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  ) : (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
      <Zap size={32} className="text-slate-600 mb-2" />
      <p className="text-slate-400 text-sm">{t('dashboard.funnelEmptyHint')}</p>
    </div>
  ), [funnelChartData, overallConversion, funnelResults, t]);

  const retentionWidget = useMemo(() => (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white">{t('dashboard.retentionCurve')}</h3>
        <ChartDownloadButton targetRef={dashRetentionRef} filename="dashboard-retention" />
      </div>
      {retentionCurveData.length > 0 ? (
        <div ref={dashRetentionRef} className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={retentionCurveData}>
              <defs>
                <linearGradient id="colorValueDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.gridLine} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisText, fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff' }}
                formatter={(value: number | undefined) => [`${value ?? 0}%`, t('dashboard.retention')]}
              />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorValueDash)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <p className="text-slate-500 text-sm">{t('dashboard.retentionEmptyHint')}</p>
        </div>
      )}
    </div>
  ), [retentionCurveData, t]);

  const dataQualityWidget = useMemo(() => dataQualityReport ? (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Shield size={14} className="text-accent" />
        {t('dashboard.dataQuality')}
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">{t('dashboard.totalRows')}</div>
          <div className="text-lg font-bold font-mono text-white">{formatNum(dataQualityReport.totalRows)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">{t('dashboard.validRows')}</div>
          <div className="text-lg font-bold font-mono text-accent">{formatNum(dataQualityReport.validRows)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">{t('dashboard.failedRows')}</div>
          <div className={`text-lg font-bold font-mono ${dataQualityReport.failedRows > 0 ? 'text-coral' : 'text-white'}`}>{formatNum(dataQualityReport.failedRows)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">{t('dashboard.dateRange')}</div>
          <div className="text-sm font-medium text-white">
            {dataQualityReport.minDate && dataQualityReport.maxDate
              ? `${new Date(dataQualityReport.minDate).toLocaleDateString()} — ${new Date(dataQualityReport.maxDate).toLocaleDateString()}`
              : 'N/A'}
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500">{t('dashboard.dataHealth')}</span>
          <span className="text-xs font-bold text-accent font-mono">
            {dataQualityReport.totalRows > 0
              ? ((dataQualityReport.validRows / dataQualityReport.totalRows) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${dataQualityReport.totalRows > 0 ? (dataQualityReport.validRows / dataQualityReport.totalRows) * 100 : 0}%` }}
          />
        </div>
        {(dataQualityReport.platformMissingRate !== '0%' || dataQualityReport.channelMissingRate !== '0%') && (
          <div className="flex gap-4 mt-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-500" />
              {t('dashboard.platformMissing')}: {dataQualityReport.platformMissingRate}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-500" />
              {t('dashboard.channelMissing')}: {dataQualityReport.channelMissingRate}
            </span>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-5 flex items-center justify-center min-h-[120px]">
      <p className="text-slate-500 text-sm">{t('dashboard.noData')}</p>
    </div>
  ), [dataQualityReport, t]);

  const quickActionsWidget = useMemo(() => (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Zap size={14} className="text-accent" />
        {t('dashboard.quickActions')}
      </h3>
      <div className="space-y-2">
        {[
          { label: t('dashboard.goToFunnel'), link: '/app/funnels', icon: Filter, color: 'text-accent' },
          { label: t('dashboard.goToRetention'), link: '/app/retention', icon: Users, color: 'text-sky-400' },
          { label: t('dashboard.goToSegments'), link: '/app/segments', icon: BarChart2, color: 'text-violet-400' },
          { label: t('dashboard.goToInsights'), link: '/app/insights', icon: Sparkles, color: 'text-amber-400' },
        ].map((action) => (
          <button
            key={action.link}
            onClick={() => navigate(action.link)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group text-left"
          >
            <action.icon size={16} className={action.color} />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{action.label}</span>
            <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  ), [navigate, t]);

  const recentInsightsWidget = useMemo(() => (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white">{t('dashboard.recentInsights')}</h3>
        <span className="text-xs text-slate-500">{insights.length} {t('dashboard.total')}</span>
      </div>
      <div className="space-y-4">
        {insights.length === 0 ? (
          <p className="text-slate-500 text-sm">{t('dashboard.noInsightsYet')}</p>
        ) : (
          insights.slice(0, 4).map((insight, i) => {
            const colors: Record<string, { text: string; bg: string }> = {
              danger: { text: 'text-coral', bg: 'bg-coral/10' },
              warning: { text: 'text-amber', bg: 'bg-amber/10' },
              success: { text: 'text-accent', bg: 'bg-accent/10' },
              info: { text: 'text-sky-400', bg: 'bg-sky-400/10' },
            };
            const c = colors[insight.type] || colors.info;
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                  <span className="text-sm">{insight.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">{insight.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{insight.body}</p>
                </div>
                {insight.metric && (
                  <span className="text-xs text-accent font-bold font-mono shrink-0">{insight.metric}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  ), [insights, t]);

  const stickinessData = useMemo(() => {
    if (!hasData) return null;
    return calculateStickiness(processedData);
  }, [processedData, hasData]);

  const stickinessWidget = useMemo(() => stickinessData ? (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity size={14} className="text-accent" />
          {t('dashboard.widgets.stickinessChart')}
        </h3>
        <span className="text-xs text-accent font-bold font-mono">{stickinessData.summary.avgRatio.toFixed(1)}%</span>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stickinessData.daily}>
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: '#e2e8f0' }}
              formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'DAU/MAU']}
            />
            <Area type="monotone" dataKey="ratio" stroke={CHART_COLORS.palette[0]} fill={CHART_COLORS.palette[0]} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  ) : (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-5 flex items-center justify-center min-h-[120px]">
      <p className="text-slate-500 text-sm">{t('dashboard.noData')}</p>
    </div>
  ), [stickinessData, t]);

  const savedAnalysesWidget = useMemo(() => snapshots.length > 0 ? (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Clock size={16} className="text-accent" />
          {t('dashboard.savedAnalyses')}
        </h3>
        <span className="text-xs text-slate-500">{t('dashboard.count', { count: snapshots.length })}</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {snapshots.map(snap => (
          <div
            key={snap.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
            onClick={() => restoreSnapshot(snap)}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-medium truncate">
                {snap.snapshot_type} — {snap.dataset_name || t('dashboard.unknownData')}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(snap.created_at).toLocaleString('ko-KR')}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <ShareButton snapshotId={snap.id} existingToken={snap.share_token} />
              <button
                onClick={(e) => { e.stopPropagation(); removeSnapshot(snap.id); }}
                className="p-1.5 rounded text-slate-500 hover:text-coral hover:bg-coral/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex items-center justify-center min-h-[80px]">
      <p className="text-slate-500 text-sm">{t('dashboard.savedAnalyses')}: 0</p>
    </div>
  ), [snapshots, restoreSnapshot, removeSnapshot, t]);

  const widgetContent: Record<WidgetId, React.ReactNode> = useMemo(() => ({
    'kpi-cards': kpiWidget,
    'funnel-chart': funnelWidget,
    'retention-chart': retentionWidget,
    'data-quality': dataQualityWidget,
    'quick-actions': quickActionsWidget,
    'recent-insights': recentInsightsWidget,
    'saved-analyses': savedAnalysesWidget,
    'stickiness-chart': stickinessWidget,
  }), [kpiWidget, funnelWidget, retentionWidget, dataQualityWidget, quickActionsWidget, recentInsightsWidget, savedAnalysesWidget, stickinessWidget]);

  // Empty state — show CTA instead of empty charts
  if (!hasData) {
    const featureCards = [
      { icon: Filter, title: t('dashboard.featureFunnel'), desc: t('dashboard.featureFunnelDesc'), gradient: 'from-accent to-teal-500' },
      { icon: Users, title: t('dashboard.featureRetention'), desc: t('dashboard.featureRetentionDesc'), gradient: 'from-sky-400 to-blue-500' },
      { icon: Zap, title: t('dashboard.featureAI'), desc: t('dashboard.featureAIDesc'), gradient: 'from-coral to-pink-500' },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-surface border border-white/[0.06] rounded-lg p-10 md:p-14 relative overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/15 rounded-full blur-[150px] pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
              {t('dashboard.heroTitle')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto mb-8">
              {t('dashboard.heroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/app/upload?sample=ecommerce')}
                className="group px-6 py-3 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                {t('dashboard.trySample')}
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/app/upload')}
                className="px-6 py-3 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <UploadCloud size={16} />
                {t('dashboard.uploadCsv')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featureCards.map((f, i) => (
            <div
              key={i}
              className={`bg-surface border border-white/[0.06] rounded-lg p-6 hover:bg-white/[0.03] transition-all duration-300 group animate-fade-up delay-${(i + 1) * 100}`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={20} className="text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterPanel />

      {/* Header: Export buttons + Edit layout toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              editMode
                ? 'text-accent bg-accent/10 border border-accent/30'
                : 'text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            {editMode ? <Check size={16} /> : <Settings size={16} />}
            {editMode ? t('dashboard.editDone') : t('dashboard.editLayout')}
          </button>
          {editMode && (
            <>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                <RotateCcw size={14} />
                {t('dashboard.resetLayout')}
              </button>
              <div className="relative" ref={presetRef}>
                <button
                  onClick={() => setPresetOpen(!presetOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                >
                  <LayoutDashboard size={14} />
                  {t('dashboard.presets')}
                  <ChevronDown size={14} className={`transition-transform ${presetOpen ? 'rotate-180' : ''}`} />
                </button>
                {presetOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    {Object.entries(PRESET_TEMPLATES).map(([id, preset]) => {
                      const IconComp = PRESET_ICON_MAP[preset.icon];
                      return (
                        <button
                          key={id}
                          onClick={() => { applyPreset(id); setPresetOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          {IconComp && <IconComp size={16} className="text-accent shrink-0" />}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white">{t(preset.labelKey)}</div>
                            <div className="text-xs text-slate-500 truncate">{t(preset.descKey)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            onCSV={() => { exportCSV('funnel'); exportCSV('retention'); exportCSV('segment'); }}
            onExcel={() => exportExcel('all')}
            exporting={dataExporting}
            isPro={dataPro}
          />
          <button
            onClick={() => exportReport('png')}
            disabled={reportExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          >
            <Download size={16} />
            {reportExporting ? t('dashboard.exporting') : t('dashboard.exportPng')}
          </button>
          <button
            onClick={() => exportReport('pdf')}
            disabled={reportExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg transition-all disabled:opacity-50"
          >
            <Download size={16} />
            {t('dashboard.exportPdf')}
            {!isPro && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full ml-1">Pro</span>}
          </button>
        </div>
      </div>

      {/* Dynamic Widget Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        role={editMode ? 'list' : undefined}
        aria-label={editMode ? t('dashboard.a11y.widgetList') : undefined}
      >
        {layout.map((item, index) => {
          const meta = DASHBOARD_WIDGETS[item.widgetId];
          const canResize = meta.minWidth !== 'full';

          return (
            <DashboardWidget
              key={item.widgetId}
              widgetId={item.widgetId}
              editMode={editMode}
              visible={item.visible}
              width={item.width}
              index={index}
              totalCount={layout.length}
              onToggleVisibility={() => toggleVisibility(item.widgetId)}
              onToggleWidth={() => toggleWidth(item.widgetId)}
              canResize={canResize}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              onMoveUp={handleMoveUp(index)}
              onMoveDown={handleMoveDown(index)}
            >
              {widgetContent[item.widgetId]}
            </DashboardWidget>
          );
        })}
      </div>

      {/* Upgrade Banner */}
      <UpgradeBanner
        messageKey="upgradeBanner.dashboard"
        page="dashboard"
        onUpgrade={() => navigate('/app/subscription')}
      />

      {/* Screen reader announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
};
