import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFunnelAnalysis } from '../../hooks/useFunnelAnalysis';
import { AppProvider } from '../../context/AppContext';
import { ToastProvider } from '../../components/Toast';

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../../lib/funnelEngine', () => ({
  calculateFunnel: vi.fn().mockReturnValue([
    { name: 'signup', users: 100, rate: 100, dropoff: 0 },
    { name: 'activate', users: 60, rate: 60, dropoff: 40 },
  ]),
  loadFunnelTemplate: vi.fn().mockReturnValue(['signup', 'activate', 'purchase']),
}));

vi.mock('../../lib/insightsEngine', () => ({
  generateInsights: vi.fn().mockReturnValue([]),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
    notifications: [],
    unreadCount: 0,
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AppProvider>
  );
}

describe('useFunnelAnalysis', () => {
  it('returns funnelSteps from state', () => {
    const { result } = renderHook(() => useFunnelAnalysis(), { wrapper });
    expect(result.current.funnelSteps).toEqual([]);
  });

  it('setFunnelSteps dispatches SET_FUNNEL_STEPS', () => {
    const { result } = renderHook(() => useFunnelAnalysis(), { wrapper });

    act(() => {
      result.current.setFunnelSteps(['step1', 'step2']);
    });

    expect(result.current.funnelSteps).toEqual(['step1', 'step2']);
  });

  it('runFunnelAnalysis shows warning when < 2 steps', () => {
    const { result } = renderHook(() => useFunnelAnalysis(), { wrapper });

    // No steps set, so < 2
    act(() => {
      result.current.runFunnelAnalysis();
    });

    // funnelResults should still be null (no analysis run)
    expect(result.current.funnelResults).toBeNull();
  });

  it('runFunnelAnalysis dispatches results when >= 2 steps', () => {
    const { result } = renderHook(() => useFunnelAnalysis(), { wrapper });

    act(() => {
      result.current.setFunnelSteps(['signup', 'activate']);
    });
    act(() => {
      result.current.runFunnelAnalysis();
    });

    expect(result.current.funnelResults).not.toBeNull();
    expect(result.current.funnelResults).toHaveLength(2);
  });

  it('applyTemplate dispatches template steps', () => {
    const { result } = renderHook(() => useFunnelAnalysis(), { wrapper });

    act(() => {
      result.current.applyTemplate('ecommerce');
    });

    // Template steps are applied (may be filtered, but loadFunnelTemplate returns 3 items)
    expect(result.current.funnelSteps.length).toBeGreaterThan(0);
  });

  it('hasData reflects processedData presence', () => {
    const { result } = renderHook(() => useFunnelAnalysis(), { wrapper });
    expect(result.current.hasData).toBe(false);
  });
});
