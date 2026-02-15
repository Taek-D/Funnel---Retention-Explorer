import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, Trash2, ChevronDown, X, Check } from './Icons';
import { useClickOutside } from '../hooks/useClickOutside';
import { useSavedViews } from '../hooks/useSavedViews';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import type { ActiveFilters } from '../types';

export const SavedViewsDropdown: React.FC = () => {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useAppContext();
  const { views, save, remove } = useSavedViews();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => { setOpen(false); setSaving(false); });

  const handleSave = () => {
    if (!name.trim()) return;
    const { dateRange, activeFilters } = state;
    save({
      name: name.trim(),
      path: location.pathname,
      dateRange: dateRange.start && dateRange.end ? { start: dateRange.start, end: dateRange.end } : null,
      filters: { platforms: activeFilters.platforms, channels: activeFilters.channels },
    });
    setName('');
    setSaving(false);
    toast('success', t('savedViews.saved'));
  };

  const handleLoad = (view: typeof views[number]) => {
    navigate(view.path);
    if (view.dateRange) {
      dispatch({ type: 'SET_DATE_RANGE', payload: { start: view.dateRange.start, end: view.dateRange.end } });
    }
    const f = view.filters as Partial<ActiveFilters>;
    if (f.platforms?.length) {
      dispatch({ type: 'SET_PLATFORM_FILTER', payload: f.platforms });
    }
    if (f.channels?.length) {
      dispatch({ type: 'SET_CHANNEL_FILTER', payload: f.channels });
    }
    setOpen(false);
    toast('info', t('savedViews.loaded'));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(prev => !prev); setSaving(false); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
        title={t('savedViews.quickAccess')}
      >
        <Save size={15} />
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-surface border border-white/[0.08] rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-medium text-white">{t('savedViews.title')}</span>
            <button
              onClick={() => setSaving(true)}
              className="text-[11px] text-accent hover:text-accent/80 font-medium"
            >
              {t('savedViews.save')}
            </button>
          </div>

          {saving && (
            <div className="px-3 py-2 border-b border-white/[0.06] flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('savedViews.namePlaceholder')}
                className="flex-1 bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                autoFocus
              />
              <button onClick={handleSave} className="p-1.5 text-accent hover:bg-accent/10 rounded">
                <Check size={14} />
              </button>
              <button onClick={() => setSaving(false)} className="p-1.5 text-slate-400 hover:text-white rounded">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="max-h-[240px] overflow-y-auto">
            {views.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                {t('savedViews.empty')}
              </div>
            ) : (
              views.map(v => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] group cursor-pointer"
                  onClick={() => handleLoad(v)}
                >
                  <Save size={12} className="text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{v.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{v.path.replace('/app/', '')}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); remove(v.id); }}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
