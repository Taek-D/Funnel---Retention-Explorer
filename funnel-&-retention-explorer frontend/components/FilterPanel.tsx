import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Calendar, X } from './Icons';
import { useFilteredData } from '../hooks/useFilteredData';
import { useAppContext } from '../context/AppContext';

interface FilterPanelProps {
  showPlatform?: boolean;
  showChannel?: boolean;
}

const FilterPanelInner: React.FC<FilterPanelProps> = ({ showPlatform = true, showChannel = true }) => {
  const { t } = useTranslation('pages');
  const { state } = useAppContext();
  const {
    filterCount, clearFilters,
    setDateRange, setPlatformFilter, setChannelFilter,
    dateRange, activeFilters,
  } = useFilteredData();

  const [expanded, setExpanded] = useState(false);

  const availablePlatforms = useMemo(() =>
    [...new Set(state.processedData.map(e => e.platform).filter(Boolean))] as string[],
    [state.processedData]
  );

  const availableChannels = useMemo(() =>
    [...new Set(state.processedData.map(e => e.channel).filter(Boolean))] as string[],
    [state.processedData]
  );

  const minDate = state.dataQualityReport?.minDate
    ? new Date(state.dataQualityReport.minDate).toISOString().split('T')[0]
    : undefined;
  const maxDate = state.dataQualityReport?.maxDate
    ? new Date(state.dataQualityReport.maxDate).toISOString().split('T')[0]
    : undefined;

  const handlePreset = (days: number | null) => {
    if (days === null) {
      setDateRange({ start: null, end: null });
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  const togglePlatform = (platform: string) => {
    const current = activeFilters.platforms;
    if (current.includes(platform)) {
      setPlatformFilter(current.filter(p => p !== platform));
    } else {
      setPlatformFilter([...current, platform]);
    }
  };

  const toggleChannel = (channel: string) => {
    const current = activeFilters.channels;
    if (current.includes(channel)) {
      setChannelFilter(current.filter(c => c !== channel));
    } else {
      setChannelFilter([...current, channel]);
    }
  };

  const hasPlatforms = showPlatform && availablePlatforms.length > 0;
  const hasChannels = showChannel && availableChannels.length > 0;

  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-white">{t('filter.title')}</span>
          {filterCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-accent/10 text-accent border border-accent/20 rounded-full">
              {filterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filterCount > 0 && (
            <button
              onClick={e => { e.stopPropagation(); clearFilters(); }}
              className="text-xs text-slate-500 hover:text-coral transition-colors flex items-center gap-1"
            >
              <X size={12} />
              {t('filter.clearAll')}
            </button>
          )}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06]">
          {/* Date Range */}
          <div className="pt-3">
            <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">{t('filter.dateRange')}</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <input
                type="date"
                value={dateRange.start ?? ''}
                min={minDate}
                max={dateRange.end ?? maxDate}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value || null })}
                className="px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-accent/50 [color-scheme:dark]"
              />
              <span className="text-slate-500 text-xs">~</span>
              <input
                type="date"
                value={dateRange.end ?? ''}
                min={dateRange.start ?? minDate}
                max={maxDate}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value || null })}
                className="px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-accent/50 [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t('filter.preset7d'), days: 7 },
                { label: t('filter.preset30d'), days: 30 },
                { label: t('filter.preset90d'), days: 90 },
                { label: t('filter.presetAll'), days: null },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.days)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          {hasPlatforms && (
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">{t('filter.platform')}</label>
              <div className="flex flex-wrap gap-1.5">
                {availablePlatforms.map(platform => {
                  const active = activeFilters.platforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                        active
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Channel */}
          {hasChannels && (
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">{t('filter.channel')}</label>
              <div className="flex flex-wrap gap-1.5">
                {availableChannels.map(channel => {
                  const active = activeFilters.channels.includes(channel);
                  return (
                    <button
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                        active
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const FilterPanel = React.memo(FilterPanelInner);
FilterPanel.displayName = 'FilterPanel';
