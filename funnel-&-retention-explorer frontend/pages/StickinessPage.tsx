import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import { calculateStickiness } from '../lib/stickinessEngine';
import { CHART_COLORS } from '../lib/constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartDownloadButton } from '../components/ChartDownloadButton';
import { AnnotationPanel } from '../components/ChartAnnotations';
import { AnomalyBadge, SensitivitySelect, AnomalyList } from '../components/AnomalyAlert';
import { useAnnotations } from '../hooks/useAnnotations';
import { useAnomalyDetection } from '../hooks/useAnomalyDetection';

export const StickinessPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const { state } = useAppContext();
  const { processedData } = state;
  const hasData = processedData.length > 0;
  const chartRef = useRef<HTMLDivElement>(null);
  const { annotations, add, remove } = useAnnotations('stickiness');

  const result = useMemo(() => {
    if (!hasData) return null;
    return calculateStickiness(processedData);
  }, [processedData, hasData]);

  const timeSeries = useMemo(() => {
    if (!result) return [];
    return result.daily.map(d => ({ date: d.date, value: d.ratio }));
  }, [result]);

  const { anomalies, sensitivity, setSensitivity } = useAnomalyDetection(timeSeries);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Activity size={48} className="text-slate-600 mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">{t('stickiness.noData')}</h2>
        <p className="text-sm text-slate-400">{t('stickiness.noDataDesc')}</p>
      </div>
    );
  }

  if (!result) return null;

  const { summary, daily } = result;
  const recentDaily = [...daily].reverse().slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t('stickiness.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('stickiness.desc')}</p>
        </div>
        <AnomalyBadge count={anomalies.length} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t('stickiness.avgRatio')}</div>
          <div className="text-2xl font-bold text-white">{summary.avgRatio.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-1">DAU {summary.avgDAU.toLocaleString()} / MAU {summary.avgMAU.toLocaleString()}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t('stickiness.peakRatio')}</div>
          <div className="text-2xl font-bold text-green-400">{summary.peakRatio.toFixed(1)}%</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-lg p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t('stickiness.lowRatio')}</div>
          <div className="text-2xl font-bold text-red-400">{summary.lowRatio.toFixed(1)}%</div>
        </div>
      </div>

      {/* AreaChart */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">{t('stickiness.trendTitle')}</h3>
          <div className="flex items-center gap-2">
            <SensitivitySelect value={sensitivity} onChange={setSensitivity} />
            <ChartDownloadButton targetRef={chartRef} filename="stickiness-trend" />
          </div>
        </div>
        <div ref={chartRef}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={daily}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value, name) => {
                  const v = (value ?? 0) as number;
                  if (name === 'ratio') return [`${v.toFixed(1)}%`, 'DAU/MAU'];
                  return [v.toLocaleString(), String(name).toUpperCase()];
                }}
              />
              {annotations.map(a => (
                <ReferenceLine
                  key={a.id}
                  x={a.date}
                  stroke={a.color}
                  strokeDasharray="4 3"
                  label={{ value: a.label, position: 'top', fill: a.color, fontSize: 10 }}
                />
              ))}
              {anomalies.map((a, i) => (
                <ReferenceLine
                  key={`anomaly-${i}`}
                  x={a.date}
                  stroke={a.type === 'spike' ? '#22c55e' : '#ef4444'}
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                />
              ))}
              <Area
                type="monotone"
                dataKey="ratio"
                stroke={CHART_COLORS.palette[0]}
                fill={CHART_COLORS.palette[0]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Annotations panel */}
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <AnnotationPanel annotations={annotations} onAdd={add} onRemove={remove} />
        </div>
      </div>

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">{t('anomaly.title')}</h3>
          <AnomalyList anomalies={anomalies} />
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-xs text-slate-400 font-medium">{t('stickiness.date')}</th>
                <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('stickiness.dau')}</th>
                <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('stickiness.mau')}</th>
                <th className="px-4 py-3 text-right text-xs text-slate-400 font-medium">{t('stickiness.ratio')}</th>
              </tr>
            </thead>
            <tbody>
              {recentDaily.map(d => (
                <tr key={d.date} className="border-b border-white/[0.04]">
                  <td className="px-4 py-3 text-white font-mono">{d.date}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{d.dau.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{d.mau.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    d.ratio >= 30 ? 'text-green-400' : d.ratio >= 15 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {d.ratio.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default { StickinessPage };
