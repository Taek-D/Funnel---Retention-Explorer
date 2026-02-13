import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sankey, Tooltip, Rectangle } from 'recharts';
import { ArrowRightLeft, Users, Zap } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import { buildJourneyFlow } from '../lib/journeyEngine';
import { CHART_COLORS } from '../lib/constants';
import { ChartSkeleton } from '../components/ChartSkeleton';
import { ChartDownloadButton } from '../components/ChartDownloadButton';
import { FilterPanel } from '../components/FilterPanel';
import { useFilteredData } from '../hooks/useFilteredData';
import type { JourneyFlowData } from '../lib/journeyEngine';

const NODE_COLORS = CHART_COLORS.palette;

const CustomNode = ({ x, y, width, height, index, payload }: {
  x: number; y: number; width: number; height: number; index: number;
  payload: { name: string; value?: number };
}) => {
  const label = payload.name.replace(/^Step \d+: /, '');
  const stepMatch = payload.name.match(/^Step (\d+)/);
  const step = stepMatch ? parseInt(stepMatch[1]) : 0;
  const color = NODE_COLORS[(step - 1) % NODE_COLORS.length];

  return (
    <g>
      <Rectangle x={x} y={y} width={width} height={height} fill={color} radius={[2, 2, 2, 2]} />
      <text
        x={x + width + 8}
        y={y + height / 2}
        dy={4}
        fontSize={11}
        fill="#94a3b8"
        textAnchor="start"
      >
        {label}
      </text>
    </g>
  );
};

const CustomLink = ({ sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, payload }: {
  sourceX: number; sourceY: number; sourceControlX: number;
  targetX: number; targetY: number; targetControlX: number;
  linkWidth: number;
  payload: { source: { name: string }; target: { name: string }; value: number };
}) => {
  const stepMatch = payload.source.name.match(/^Step (\d+)/);
  const step = stepMatch ? parseInt(stepMatch[1]) : 0;
  const color = NODE_COLORS[(step - 1) % NODE_COLORS.length];

  return (
    <path
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={0.3}
      className="hover:stroke-opacity-60 transition-all"
    />
  );
};

export const UserJourneyFlow: React.FC = () => {
  const { t } = useTranslation('pages');
  const { state } = useAppContext();
  const { processedData } = state;
  const { filteredData, filterCount } = useFilteredData();
  const chartRef = useRef<HTMLDivElement>(null);

  const [maxSteps, setMaxSteps] = useState(5);
  const [minFlowPct, setMinFlowPct] = useState(1);
  const [flowData, setFlowData] = useState<JourneyFlowData | null>(null);

  const hasData = processedData.length > 0;

  const handleCalculate = useCallback(() => {
    const data = filterCount > 0 ? filteredData : processedData;
    const result = buildJourneyFlow(data, { maxSteps, minFlowPct });
    setFlowData(result);
  }, [processedData, filteredData, filterCount, maxSteps, minFlowPct]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ArrowRightLeft size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('journey.noData')}</h2>
        <p className="text-slate-400">{t('journey.noDataDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('journey.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('journey.desc')}</p>
        </div>
      </div>

      <FilterPanel />

      {/* Controls */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">
              {t('journey.maxSteps')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={3}
                max={8}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="text-white font-mono text-sm w-6 text-center">{maxSteps}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">
              {t('journey.minFlow')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={minFlowPct}
                onChange={(e) => setMinFlowPct(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="text-white font-mono text-sm w-10 text-center">{minFlowPct}%</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleCalculate}
          className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-all"
        >
          {t('journey.calculate')}
        </button>
      </div>

      {/* Pre-calculation placeholder */}
      {!flowData && (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('journey.emptyHint')}</h3>
          <ChartSkeleton variant="bar" />
        </div>
      )}

      {/* Results */}
      {flowData && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-white/[0.06] rounded-lg p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                <Users size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">{t('journey.totalUsers')}</p>
                <p className="text-2xl font-bold font-mono text-white">{flowData.totalUsers.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-lg p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase">{t('journey.totalTransitions')}</p>
                <p className="text-2xl font-bold font-mono text-white">{flowData.totalTransitions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Sankey Diagram */}
          {flowData.nodes.length > 0 && flowData.links.length > 0 ? (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{t('journey.title')}</h3>
                <ChartDownloadButton targetRef={chartRef} filename="user-journey-flow" />
              </div>
              <div ref={chartRef} className="w-full overflow-x-auto">
                <Sankey
                  width={900}
                  height={500}
                  data={flowData}
                  nodePadding={30}
                  nodeWidth={10}
                  linkCurvature={0.5}
                  margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
                  node={CustomNode as never}
                  link={CustomLink as never}
                >
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_COLORS.tooltipBg,
                      borderColor: CHART_COLORS.tooltipBorder,
                      color: '#fff',
                      borderRadius: '6px',
                    }}
                  />
                </Sankey>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 text-center">
              <ArrowRightLeft size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">{t('journey.noResults')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserJourneyFlow;
