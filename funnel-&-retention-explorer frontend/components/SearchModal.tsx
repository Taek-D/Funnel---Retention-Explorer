import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, LayoutDashboard, Filter, Users, UploadCloud, PieChart, BarChart2, Zap } from './Icons';
import { useAppContext } from '../context/AppContext';

interface SearchResult {
  id: string;
  category: 'page' | 'insight' | 'event';
  title: string;
  subtitle?: string;
  path?: string;
  icon?: React.ElementType;
}

interface PageItemDef {
  id: string;
  titleKey: string;
  subtitleKey: string;
  path: string;
  icon: React.ElementType;
}

const pageItemDefs: PageItemDef[] = [
  { id: 'p-dashboard', titleKey: 'nav.dashboard', subtitleKey: 'pages:dashboard.title', path: '/app/dashboard', icon: LayoutDashboard },
  { id: 'p-upload', titleKey: 'nav.dataImport', subtitleKey: 'pages:dataImport.title', path: '/app/upload', icon: UploadCloud },
  { id: 'p-funnels', titleKey: 'nav.funnel', subtitleKey: 'pages:funnel.title', path: '/app/funnels', icon: Filter },
  { id: 'p-retention', titleKey: 'nav.retention', subtitleKey: 'pages:retention.title', path: '/app/retention', icon: Users },
  { id: 'p-segments', titleKey: 'nav.segments', subtitleKey: 'pages:segments.title', path: '/app/segments', icon: PieChart },
  { id: 'p-insights', titleKey: 'nav.aiInsights', subtitleKey: 'pages:insights.title', path: '/app/insights', icon: BarChart2 },
];

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { state } = useAppContext();

  const pageItems: SearchResult[] = useMemo(() =>
    pageItemDefs.map(d => ({
      id: d.id,
      category: 'page' as const,
      title: t(d.titleKey),
      subtitle: t(d.subtitleKey),
      path: d.path,
      icon: d.icon,
    })), [t]);

  const categoryLabels: Record<string, string> = useMemo(() => ({
    page: t('search.categoryPage'),
    insight: t('search.categoryInsight'),
    event: t('search.categoryEvent'),
  }), [t]);

  // Build dynamic results
  const allResults = useMemo(() => {
    const results: SearchResult[] = [...pageItems];

    // Add insights
    state.insights.forEach((insight, i) => {
      results.push({
        id: `i-${i}`,
        category: 'insight',
        title: insight.title,
        subtitle: insight.body,
        path: '/app/insights',
      });
    });

    // Add unique events
    state.uniqueEvents.forEach((event, i) => {
      results.push({
        id: `e-${i}`,
        category: 'event',
        title: event,
        subtitle: t('search.eventType'),
        path: '/app/funnels',
      });
    });

    return results;
  }, [state.insights, state.uniqueEvents, pageItems, t]);

  const filtered = useMemo(() => {
    if (!query.trim()) return pageItems;
    const q = query.toLowerCase();
    return allResults.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.subtitle && r.subtitle.toLowerCase().includes(q))
    );
  }, [query, allResults]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of filtered) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return groups;
  }, [filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.path) {
      navigate(result.path);
    }
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('search.label')}>
      <div
        className="bg-surface border border-white/[0.06] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={18} className="text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
            aria-label={t('search.placeholder')}
            placeholder={t('search.placeholder')}
          />
          <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-slate-600 bg-white/[0.03] border border-white/[0.06] rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Search size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">{t('search.noResults', { query })}</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </span>
                </div>
                {items.map((result) => {
                  itemIndex++;
                  const idx = itemIndex;
                  const isSelected = idx === selectedIndex;
                  const Icon = result.icon || Zap;
                  return (
                    <button
                      key={result.id}
                      data-index={idx}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-accent/10 text-white' : 'text-slate-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-accent' : 'text-slate-500'} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{result.title}</span>
                        {result.subtitle && (
                          <span className="text-[11px] text-slate-500 block truncate">{result.subtitle}</span>
                        )}
                      </div>
                      {isSelected && (
                        <kbd className="text-[10px] text-slate-600 font-mono">Enter</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[10px] text-slate-600">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded font-mono">↑↓</kbd> {t('search.move')}</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded font-mono">↵</kbd> {t('search.select')}</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded font-mono">esc</kbd> {t('search.close')}</span>
        </div>
      </div>
    </div>
  );
};
