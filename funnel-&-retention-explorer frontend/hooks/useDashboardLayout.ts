import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_LAYOUT, DASHBOARD_WIDGETS, PRESET_TEMPLATES } from '../lib/constants';
import { supabase } from '../lib/supabase';
import type { WidgetId, WidgetLayout } from '../types';

const STORAGE_KEY = 'fre-dashboard-layout';
const SUPABASE_DEBOUNCE_MS = 1000;

function loadFromStorage(): WidgetLayout[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetLayout[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(layout: WidgetLayout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function useDashboardLayout() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const supabaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Load layout on mount: Supabase (if logged in) > localStorage > DEFAULT_LAYOUT
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      // Try Supabase first for logged-in users
      if (user && supabase) {
        const { data } = await supabase
          .from('fre_user_profiles')
          .select('dashboard_layout')
          .eq('id', user.id)
          .single();

        if (data?.dashboard_layout && Array.isArray(data.dashboard_layout) && data.dashboard_layout.length > 0) {
          const layout = data.dashboard_layout as WidgetLayout[];
          dispatch({ type: 'SET_DASHBOARD_LAYOUT', payload: layout });
          saveToStorage(layout);
          return;
        }
      }

      // Fallback to localStorage
      const stored = loadFromStorage();
      if (stored) {
        dispatch({ type: 'SET_DASHBOARD_LAYOUT', payload: stored });
        return;
      }

      // Default
      dispatch({ type: 'SET_DASHBOARD_LAYOUT', payload: DEFAULT_LAYOUT });
    };

    init();
  }, [user, dispatch]);

  // Resolved layout: use state if populated, otherwise DEFAULT_LAYOUT
  const layout = useMemo(() => {
    return state.dashboardLayout.length > 0
      ? [...state.dashboardLayout].sort((a, b) => a.order - b.order)
      : DEFAULT_LAYOUT;
  }, [state.dashboardLayout]);

  // Persist helper
  const persist = useCallback((next: WidgetLayout[]) => {
    dispatch({ type: 'SET_DASHBOARD_LAYOUT', payload: next });
    saveToStorage(next);

    // Debounced Supabase write
    if (user && supabase) {
      if (supabaseTimerRef.current) clearTimeout(supabaseTimerRef.current);
      supabaseTimerRef.current = setTimeout(() => {
        supabase
          .from('fre_user_profiles')
          .update({ dashboard_layout: next })
          .eq('id', user.id)
          .then(() => {});
      }, SUPABASE_DEBOUNCE_MS);
    }
  }, [dispatch, user]);

  const toggleVisibility = useCallback((widgetId: WidgetId) => {
    const next = layout.map(w =>
      w.widgetId === widgetId ? { ...w, visible: !w.visible } : w
    );
    persist(next);
  }, [layout, persist]);

  const toggleWidth = useCallback((widgetId: WidgetId) => {
    const meta = DASHBOARD_WIDGETS[widgetId];
    const next = layout.map(w => {
      if (w.widgetId !== widgetId) return w;
      // Respect minWidth constraint
      const newWidth = w.width === 'full' ? 'half' : 'full';
      if (meta.minWidth === 'full') return w; // Can't shrink
      return { ...w, width: newWidth };
    });
    persist(next);
  }, [layout, persist]);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const items = [...layout];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    const reordered = items.map((w, i) => ({ ...w, order: i }));
    persist(reordered);
  }, [layout, persist]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESET_TEMPLATES[presetId];
    if (!preset) return;
    persist([...preset.layout]);
  }, [persist]);

  const resetToDefault = useCallback(() => {
    applyPreset('default');
  }, [applyPreset]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (supabaseTimerRef.current) clearTimeout(supabaseTimerRef.current);
    };
  }, []);

  return {
    layout,
    editMode,
    setEditMode,
    toggleVisibility,
    toggleWidth,
    reorder,
    resetToDefault,
    applyPreset,
  };
}
