import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Users } from '../components/Icons';
import { useSegmentComparison } from '../hooks/useSegmentComparison';
import { useDataExport } from '../hooks/useDataExport';
import { ChartSkeleton } from '../components/ChartSkeleton';
import { ExportDropdown } from '../components/ExportDropdown';
import { FilterPanel } from '../components/FilterPanel';

export const SegmentComparison: React.FC = () => {
  const { t } = useTranslation('pages');
  const { segmentResults, availablePlatforms, availableChannels, hasData, hasFunnel, runComparison } = useSegmentComparison();
  const { exportCSV, exportExcel, exporting, isPro } = useDataExport();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('segments.noData')}</h2>
        <p className="text-slate-400">{t('segments.noDataDesc')}</p>
      </div>
    );
  }

  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleChannel = (c: string) => setSelectedChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const bestSegment = useMemo(() =>
    segmentResults && segmentResults.length > 0
      ? segmentResults.reduce((best, seg) => seg.conversion > best.conversion ? seg : best)
      : null,
    [segmentResults]
  );

  const avgConversion = useMemo(() =>
    segmentResults && segmentResults.length > 0
      ? segmentResults.reduce((sum, seg) => sum + seg.conversion, 0) / segmentResults.length
      : 0,
    [segmentResults]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('segments.title')}</h1>
          <p className="text-slate-400 text-lg">{t('segments.desc')}</p>
        </div>
        {segmentResults && segmentResults.length > 0 && (
          <ExportDropdown
            onCSV={() => exportCSV('segment')}
            onExcel={() => exportExcel('segment')}
            exporting={exporting}
            isPro={isPro}
          />
        )}
      </div>

      <FilterPanel showPlatform={false} showChannel={false} />

      {/* Controls */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6 space-y-4">
        {!hasFunnel && (
          <div className="bg-amber/10 border border-amber/20 rounded-lg p-3 text-amber text-sm">
            {t('segments.funnelRequired')}
          </div>
        )}

        {availablePlatforms.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">{t('segments.platform')}</label>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedPlatforms.includes(p) ? 'bg-accent text-white' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableChannels.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">{t('segments.channel')}</label>
            <div className="flex flex-wrap gap-2">
              {availableChannels.map(c => (
                <button
                  key={c}
                  onClick={() => toggleChannel(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedChannels.includes(c) ? 'bg-accent text-white' : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => runComparison(selectedPlatforms, selectedChannels)}
          disabled={!hasFunnel}
          className="h-[42px] px-6 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
        >
          {t('segments.compare')}
        </button>
      </div>

      {/* Pre-calculation placeholder */}
      {!segmentResults && hasFunnel && (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('segments.emptyHint')}</h3>
          <ChartSkeleton variant="bar" />
        </div>
      )}

      {/* Results */}
      {segmentResults && segmentResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bars */}
          <div className="lg:col-span-2 bg-surface border border-white/[0.06] rounded-lg p-6">
            <h3 className="text-white font-bold text-lg mb-6">{t('segments.conversionBySegment')}</h3>
            <div className="space-y-6">
              {segmentResults.map((seg, i) => {
                const maxConversion = Math.max(...segmentResults.map(s => s.conversion));
                const barWidth = maxConversion > 0 ? (seg.conversion / maxConversion) * 100 : 0;
                const isTop = seg === bestSegment;

                return (
                  <div key={i} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300 font-medium">{seg.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-xs font-mono">n={seg.population.toLocaleString()}</span>
                        <span className="text-white font-bold font-mono">{seg.conversion.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isTop ? 'bg-accent' : 'bg-slate-600'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={seg.uplift >= 0 ? 'text-accent' : 'text-coral'}>
                        <span className="font-mono">{seg.uplift >= 0 ? '+' : ''}{seg.uplift.toFixed(1)}%p</span> {t('segments.vsAvg')}
                      </span>
                      <span className={seg.pValue < 0.05 ? 'text-accent' : 'text-slate-500'}>
                        <span className="font-mono">p={seg.pValue.toFixed(4)}</span> {seg.pValue < 0.05 ? `(${t('segments.significant')})` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Performer */}
          {bestSegment && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-1 flex flex-col relative overflow-hidden">
              <div className="flex-1 bg-surface/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-white font-bold text-lg mb-6">{t('segments.topPerformance')}</h3>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                  <span className="text-4xl">&#127942;</span>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-2 uppercase">{t('segments.topConversion')}</p>
                <h2 className="text-3xl font-bold text-white mb-2">{bestSegment.name.replace(/^.+?:\s*/, '')}</h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-bold border border-accent/20">
                  <span className="font-mono">{bestSegment.conversion.toFixed(1)}%</span> {t('segments.conversion')}
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  <span className="font-mono">+{(bestSegment.conversion - avgConversion).toFixed(1)}%p</span> {t('segments.vsAvg')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Table */}
      {segmentResults && segmentResults.length > 0 && (
        <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden relative">
          <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable' }}>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10 md:hidden" />
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">{t('segments.segment')}</th>
                <th className="px-4 py-4 text-right">{t('segments.sampleSize')}</th>
                <th className="px-4 py-4 text-right">{t('segments.conversion')}</th>
                <th className="px-4 py-4 text-right">{t('segments.lift')}</th>
                <th className="px-4 py-4 text-right">{t('segments.pValue')}</th>
                <th className="px-4 py-4 text-right">{t('segments.significance')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {segmentResults.map((seg, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-3 font-medium text-white">{seg.name}</td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">{seg.population.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-white font-mono">{seg.conversion.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-right font-mono ${seg.uplift >= 5 ? 'text-accent' : seg.uplift <= -5 ? 'text-coral' : 'text-slate-400'}`}>
                    {seg.uplift >= 0 ? '+' : ''}{seg.uplift.toFixed(1)}%p
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 font-mono">{seg.pValue.toFixed(4)}</td>
                  <td className={`px-4 py-3 text-right ${seg.pValue < 0.05 ? 'text-accent' : 'text-slate-500'}`}>
                    {seg.pValue < 0.05 ? t('segments.significant') : t('segments.notSignificant')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};
