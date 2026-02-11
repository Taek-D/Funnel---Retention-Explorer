import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { AppProvider } from '../../context/AppContext';
import { DEFAULT_LAYOUT } from '../../lib/constants';
import type { WidgetLayout } from '../../types';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Supabase
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ then: vi.fn() }) });
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// localStorage mock
const storageStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => storageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storageStore[key]; }),
  clear: vi.fn(),
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('useDashboardLayout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });
    mockLocalStorage.getItem.mockImplementation((key: string) => storageStore[key] ?? null);
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => { storageStore[key] = value; });
    // Default: no user
    mockUseAuth.mockReturnValue({ user: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    // Clear storage
    Object.keys(storageStore).forEach(k => delete storageStore[k]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns DEFAULT_LAYOUT when no stored layout and no user', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });

    // Wait for init
    await act(async () => {});

    expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
  });

  it('starts with editMode false', () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    expect(result.current.editMode).toBe(false);
  });

  it('setEditMode toggles editMode', () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });

    act(() => {
      result.current.setEditMode(true);
    });
    expect(result.current.editMode).toBe(true);

    act(() => {
      result.current.setEditMode(false);
    });
    expect(result.current.editMode).toBe(false);
  });

  it('loads layout from localStorage when no user', async () => {
    const customLayout: WidgetLayout[] = [
      { widgetId: 'kpi-cards', visible: true, width: 'full', order: 0 },
      { widgetId: 'funnel-chart', visible: false, width: 'half', order: 1 },
    ];
    storageStore['fre-dashboard-layout'] = JSON.stringify(customLayout);

    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    expect(result.current.layout).toEqual(customLayout.sort((a, b) => a.order - b.order));
  });

  it('toggleVisibility flips visible flag for given widget', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    const initialVisible = result.current.layout.find(w => w.widgetId === 'kpi-cards')!.visible;

    act(() => {
      result.current.toggleVisibility('kpi-cards');
    });

    const updated = result.current.layout.find(w => w.widgetId === 'kpi-cards')!;
    expect(updated.visible).toBe(!initialVisible);
  });

  it('toggleVisibility saves to localStorage', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.toggleVisibility('funnel-chart');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'fre-dashboard-layout',
      expect.any(String)
    );
  });

  it('toggleWidth switches between full and half', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    // funnel-chart starts at full, minWidth is half → can toggle
    const initialWidth = result.current.layout.find(w => w.widgetId === 'funnel-chart')!.width;
    expect(initialWidth).toBe('full');

    act(() => {
      result.current.toggleWidth('funnel-chart');
    });

    expect(result.current.layout.find(w => w.widgetId === 'funnel-chart')!.width).toBe('half');

    act(() => {
      result.current.toggleWidth('funnel-chart');
    });

    expect(result.current.layout.find(w => w.widgetId === 'funnel-chart')!.width).toBe('full');
  });

  it('toggleWidth does not shrink widgets with minWidth=full', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    // kpi-cards has minWidth: 'full'
    act(() => {
      result.current.toggleWidth('kpi-cards');
    });

    expect(result.current.layout.find(w => w.widgetId === 'kpi-cards')!.width).toBe('full');
  });

  it('reorder moves widget from one position to another', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    const first = result.current.layout[0].widgetId;
    const second = result.current.layout[1].widgetId;

    act(() => {
      result.current.reorder(0, 1);
    });

    expect(result.current.layout[0].widgetId).toBe(second);
    expect(result.current.layout[1].widgetId).toBe(first);
  });

  it('reorder does nothing when fromIndex === toIndex', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    const before = result.current.layout.map(w => w.widgetId);

    act(() => {
      result.current.reorder(0, 0);
    });

    expect(result.current.layout.map(w => w.widgetId)).toEqual(before);
  });

  it('resetToDefault restores DEFAULT_LAYOUT', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    // Modify layout first
    act(() => {
      result.current.toggleVisibility('kpi-cards');
      result.current.reorder(0, 2);
    });

    act(() => {
      result.current.resetToDefault();
    });

    expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
  });

  it('layout is sorted by order', async () => {
    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    const orders = result.current.layout.map(w => w.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it('debounces Supabase write for logged-in user', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });

    const { result } = renderHook(() => useDashboardLayout(), { wrapper });
    await act(async () => {});

    // Clear any calls made during init (select query)
    mockFrom.mockClear();
    mockUpdate.mockClear();

    act(() => {
      result.current.toggleVisibility('kpi-cards');
    });

    // Before debounce fires, update should not be called yet
    expect(mockUpdate).not.toHaveBeenCalled();

    // After debounce (1000ms)
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(mockFrom).toHaveBeenCalledWith('fre_user_profiles');
  });
});
