import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const pageItems: SearchResult[] = [
  { id: 'p-dashboard', category: 'page', title: '대시보드', subtitle: '대시보드 & KPI', path: '/app/dashboard', icon: LayoutDashboard },
  { id: 'p-upload', category: 'page', title: '데이터 가져오기', subtitle: 'CSV 데이터 업로드', path: '/app/upload', icon: UploadCloud },
  { id: 'p-funnels', category: 'page', title: '퍼널 분석', subtitle: '퍼널 설정 및 분석', path: '/app/funnels', icon: Filter },
  { id: 'p-retention', category: 'page', title: '리텐션', subtitle: '코호트 리텐션 분석', path: '/app/retention', icon: Users },
  { id: 'p-segments', category: 'page', title: '세그먼트', subtitle: '세그먼트 비교', path: '/app/segments', icon: PieChart },
  { id: 'p-insights', category: 'page', title: 'AI 인사이트', subtitle: 'AI 기반 분석', path: '/app/insights', icon: BarChart2 },
];

const categoryLabels: Record<string, string> = {
  page: '페이지',
  insight: '인사이트',
  event: '이벤트',
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { state } = useAppContext();

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
        subtitle: '이벤트 유형',
        path: '/app/funnels',
      });
    });

    return results;
  }, [state.insights, state.uniqueEvents]);

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

  const flatList = useMemo(() => filtered, [filtered]);

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
      setSelectedIndex(prev => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatList[selectedIndex]) {
        handleSelect(flatList[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatList, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
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
            placeholder="페이지, 인사이트, 이벤트 검색..."
          />
          <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-slate-600 bg-white/[0.03] border border-white/[0.06] rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Search size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">검색 결과 없음: &quot;{query}&quot;</p>
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
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded font-mono">↑↓</kbd> 이동</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded font-mono">↵</kbd> 선택</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded font-mono">esc</kbd> 닫기</span>
        </div>
      </div>
    </div>
  );
};
