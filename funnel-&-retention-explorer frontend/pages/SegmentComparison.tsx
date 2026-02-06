import React, { useState } from 'react';
import { ChevronDown, Users } from '../components/Icons';
import { useSegmentComparison } from '../hooks/useSegmentComparison';

export const SegmentComparison: React.FC = () => {
  const { segmentResults, availablePlatforms, availableChannels, hasData, hasFunnel, runComparison } = useSegmentComparison();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
        <p className="text-slate-400">Upload a CSV file in the Data Import tab first.</p>
      </div>
    );
  }

  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleChannel = (c: string) => setSelectedChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const bestSegment = segmentResults && segmentResults.length > 0
    ? segmentResults.reduce((best, seg) => seg.conversion > best.conversion ? seg : best)
    : null;

  const avgConversion = segmentResults && segmentResults.length > 0
    ? segmentResults.reduce((sum, seg) => sum + seg.conversion, 0) / segmentResults.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Segment Comparison</h1>
        <p className="text-slate-400 text-lg">Deep dive into performance differences across user segments.</p>
      </div>

      {/* Controls */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6 space-y-4">
        {!hasFunnel && (
          <div className="bg-amber/10 border border-amber/20 rounded-lg p-3 text-amber text-sm">
            먼저 Funnel Editor에서 퍼널을 계산해주세요.
          </div>
        )}

        {availablePlatforms.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Platforms</label>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Channels</label>
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
          Compare Segments
        </button>
      </div>

      {/* Results */}
      {segmentResults && segmentResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bars */}
          <div className="lg:col-span-2 bg-surface border border-white/[0.06] rounded-lg p-6">
            <h3 className="text-white font-bold text-lg mb-6">Conversion Rate by Segment</h3>
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
                        <span className="font-mono">{seg.uplift >= 0 ? '+' : ''}{seg.uplift.toFixed(1)}%p</span> vs avg
                      </span>
                      <span className={seg.pValue < 0.05 ? 'text-accent' : 'text-slate-500'}>
                        <span className="font-mono">p={seg.pValue.toFixed(4)}</span> {seg.pValue < 0.05 ? '(유의미)' : ''}
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
                <h3 className="text-white font-bold text-lg mb-6">Top Performer</h3>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                  <span className="text-4xl">&#127942;</span>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-2 uppercase">Highest Conversion</p>
                <h2 className="text-3xl font-bold text-white mb-2">{bestSegment.name.replace(/^(플랫폼|채널): /, '')}</h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-bold border border-accent/20">
                  <span className="font-mono">{bestSegment.conversion.toFixed(1)}%</span> conversion
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  <span className="font-mono">+{(bestSegment.conversion - avgConversion).toFixed(1)}%p</span> vs avg
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Table */}
      {segmentResults && segmentResults.length > 0 && (
        <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Segment</th>
                <th className="px-4 py-4 text-right">Population</th>
                <th className="px-4 py-4 text-right">Conversion</th>
                <th className="px-4 py-4 text-right">Uplift</th>
                <th className="px-4 py-4 text-right">p-value</th>
                <th className="px-4 py-4 text-right">Significance</th>
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
                    {seg.pValue < 0.05 ? 'Significant' : 'Not significant'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
