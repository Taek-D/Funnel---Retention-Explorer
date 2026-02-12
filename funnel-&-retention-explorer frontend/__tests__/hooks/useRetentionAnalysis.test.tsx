import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRetentionAnalysis } from '../../hooks/useRetentionAnalysis';
import { AppProvider } from '../../context/AppContext';
import { ToastProvider } from '../../components/Toast';

vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../../lib/retentionEngine', () => ({
  calculateActivityRetention: vi.fn().mockReturnValue([
    { cohortDate: '2025-01', cohortSize: 50, days: { D0: 100, D7: 60 } },
  ]),
  calculatePaidRetention: vi.fn().mockReturnValue([]),
}));

vi.mock('../../lib/insightsEngine', () => ({
  generateInsights: vi.fn().mockReturnValue([]),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
    notifications: [],
    unreadCount: 0,
    loading: false,
    markAsRead: vi.fn(),
    removeNotification: vi.fn(),
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

describe('useRetentionAnalysis', () => {
  it('returns retentionType from state', () => {
    const { result } = renderHook(() => useRetentionAnalysis(), { wrapper });
    expect(result.current.retentionType).toBe('activity');
  });

  it('setRetentionType dispatches SET_RETENTION_TYPE', () => {
    const { result } = renderHook(() => useRetentionAnalysis(), { wrapper });

    act(() => {
      result.current.setRetentionType('paid');
    });

    expect(result.current.retentionType).toBe('paid');
  });

  it('runRetentionAnalysis shows warning when no cohortEvent', () => {
    const { result } = renderHook(() => useRetentionAnalysis(), { wrapper });

    act(() => {
      result.current.runRetentionAnalysis('', ['active_event']);
    });

    // No results dispatched
    expect(result.current.retentionResults).toBeNull();
  });

  it('runRetentionAnalysis shows warning when no activeEvents', () => {
    const { result } = renderHook(() => useRetentionAnalysis(), { wrapper });

    act(() => {
      result.current.runRetentionAnalysis('signup', []);
    });

    expect(result.current.retentionResults).toBeNull();
  });

  it('runRetentionAnalysis dispatches results for activity type', () => {
    const { result } = renderHook(() => useRetentionAnalysis(), { wrapper });

    act(() => {
      result.current.runRetentionAnalysis('signup', ['login']);
    });

    expect(result.current.retentionResults).not.toBeNull();
  });

  it('hasData reflects processedData presence', () => {
    const { result } = renderHook(() => useRetentionAnalysis(), { wrapper });
    expect(result.current.hasData).toBe(false);
  });
});
