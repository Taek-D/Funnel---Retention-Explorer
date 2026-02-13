import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataExport } from '../../hooks/useDataExport';
import { AppProvider, useAppContext } from '../../context/AppContext';
import { ToastProvider } from '../../components/Toast';
import type { FunnelStep, RetentionCohort, SegmentResult } from '../../types';

// Mock exportUtils
const mockExportFunnelCSV = vi.fn();
const mockExportRetentionCSV = vi.fn();
const mockExportSegmentCSV = vi.fn();
vi.mock('../../lib/exportUtils', () => ({
  exportFunnelCSV: (...args: unknown[]) => mockExportFunnelCSV(...args),
  exportRetentionCSV: (...args: unknown[]) => mockExportRetentionCSV(...args),
  exportSegmentCSV: (...args: unknown[]) => mockExportSegmentCSV(...args),
}));

// Mock excelExport (dynamic import)
const mockExportFunnelExcel = vi.fn().mockResolvedValue(undefined);
const mockExportRetentionExcel = vi.fn().mockResolvedValue(undefined);
const mockExportSegmentExcel = vi.fn().mockResolvedValue(undefined);
const mockExportAllAsExcel = vi.fn().mockResolvedValue(undefined);
vi.mock('../../lib/excelExport', () => ({
  exportFunnelExcel: (...args: unknown[]) => mockExportFunnelExcel(...args),
  exportRetentionExcel: (...args: unknown[]) => mockExportRetentionExcel(...args),
  exportSegmentExcel: (...args: unknown[]) => mockExportSegmentExcel(...args),
  exportAllAsExcel: (...args: unknown[]) => mockExportAllAsExcel(...args),
}));

// Mock NotificationContext
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

// Mock usePlanGate
const mockOpenUpgradeModal = vi.fn();
let mockIsPro = false;
vi.mock('../../hooks/usePlanGate', () => ({
  usePlanGate: () => ({
    isPro: mockIsPro,
    openUpgradeModal: mockOpenUpgradeModal,
    closeUpgradeModal: vi.fn(),
    showUpgradeModal: false,
    upgradeReason: '',
    canUseAI: true,
    csvRowLimit: 10_000,
  }),
}));

// Mock analytics
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Fixture data
const funnelData: FunnelStep[] = [
  { step: 'view', stepNumber: 1, users: 100, conversionRate: 100, dropOff: 0 },
  { step: 'click', stepNumber: 2, users: 50, conversionRate: 50, dropOff: 50 },
];

const retentionData: RetentionCohort[] = [
  { cohortDate: '2025-01', cohortSize: 100, days: { '0': 100, '1': 80, '7': 50 } },
];

const segmentData: SegmentResult[] = [
  { name: 'Mobile', type: 'platform', population: 200, conversion: 30, uplift: 5, pValue: 0.05, stepByStep: [] },
];

// Component that injects state and then renders hook
function StateInjector({
  overrides,
  children,
}: {
  overrides: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const { dispatch } = useAppContext();
  const injectedRef = React.useRef(false);

  React.useEffect(() => {
    if (injectedRef.current) return;
    injectedRef.current = true;

    if (overrides.funnelResults) {
      dispatch({ type: 'SET_FUNNEL_RESULTS', payload: overrides.funnelResults as FunnelStep[] });
    }
    if (overrides.retentionResults) {
      dispatch({ type: 'SET_RETENTION_RESULTS', payload: overrides.retentionResults as RetentionCohort[] });
    }
    if (overrides.segmentResults) {
      dispatch({ type: 'SET_SEGMENT_RESULTS', payload: overrides.segmentResults as SegmentResult[] });
    }
  }, [dispatch, overrides]);

  return <>{children}</>;
}

function createWrapper(stateOverrides: Record<string, unknown> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppProvider>
        <ToastProvider>
          <StateInjector overrides={stateOverrides}>
            {children}
          </StateInjector>
        </ToastProvider>
      </AppProvider>
    );
  };
}

describe('useDataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPro = false;
  });

  describe('exportCSV', () => {
    it('exports funnel CSV when funnel data exists', () => {
      const wrapper = createWrapper({ funnelResults: funnelData });
      const { result } = renderHook(() => useDataExport(), { wrapper });

      // Allow state injection to complete
      act(() => {});

      act(() => {
        result.current.exportCSV('funnel');
      });

      expect(mockExportFunnelCSV).toHaveBeenCalledWith(funnelData);
    });

    it('exports retention CSV when retention data exists', () => {
      const wrapper = createWrapper({ retentionResults: retentionData });
      const { result } = renderHook(() => useDataExport(), { wrapper });
      act(() => {});

      act(() => {
        result.current.exportCSV('retention');
      });

      expect(mockExportRetentionCSV).toHaveBeenCalledWith(retentionData);
    });

    it('exports segment CSV when segment data exists', () => {
      const wrapper = createWrapper({ segmentResults: segmentData });
      const { result } = renderHook(() => useDataExport(), { wrapper });
      act(() => {});

      act(() => {
        result.current.exportCSV('segment');
      });

      expect(mockExportSegmentCSV).toHaveBeenCalledWith(segmentData);
    });

    it('does not call export when no data available', () => {
      const wrapper = createWrapper({});
      const { result } = renderHook(() => useDataExport(), { wrapper });

      act(() => {
        result.current.exportCSV('funnel');
      });

      expect(mockExportFunnelCSV).not.toHaveBeenCalled();
    });
  });

  describe('exportExcel', () => {
    it('opens upgrade modal for free users', async () => {
      mockIsPro = false;
      const wrapper = createWrapper({ funnelResults: funnelData });
      const { result } = renderHook(() => useDataExport(), { wrapper });

      await act(async () => {
        await result.current.exportExcel('funnel');
      });

      expect(mockOpenUpgradeModal).toHaveBeenCalled();
      expect(mockExportFunnelExcel).not.toHaveBeenCalled();
    });

    it('exports funnel Excel for pro users', async () => {
      mockIsPro = true;
      const wrapper = createWrapper({ funnelResults: funnelData });
      const { result } = renderHook(() => useDataExport(), { wrapper });
      act(() => {});

      await act(async () => {
        await result.current.exportExcel('funnel');
      });

      expect(mockExportFunnelExcel).toHaveBeenCalledWith(funnelData);
    });

    it('exports all as Excel for pro users', async () => {
      mockIsPro = true;
      const wrapper = createWrapper({
        funnelResults: funnelData,
        retentionResults: retentionData,
        segmentResults: segmentData,
      });
      const { result } = renderHook(() => useDataExport(), { wrapper });
      act(() => {});

      await act(async () => {
        await result.current.exportExcel('all');
      });

      expect(mockExportAllAsExcel).toHaveBeenCalled();
    });

    it('sets exporting flag during export', async () => {
      mockIsPro = true;
      let resolveExport: () => void;
      mockExportFunnelExcel.mockReturnValue(new Promise<void>(r => { resolveExport = r; }));

      const wrapper = createWrapper({ funnelResults: funnelData });
      const { result } = renderHook(() => useDataExport(), { wrapper });
      act(() => {});

      expect(result.current.exporting).toBe(false);

      let exportPromise: Promise<void>;
      act(() => {
        exportPromise = result.current.exportExcel('funnel');
      });

      expect(result.current.exporting).toBe(true);

      await act(async () => {
        resolveExport!();
        await exportPromise!;
      });

      expect(result.current.exporting).toBe(false);
    });
  });

  describe('isPro', () => {
    it('returns false when user is free', () => {
      mockIsPro = false;
      const wrapper = createWrapper({});
      const { result } = renderHook(() => useDataExport(), { wrapper });
      expect(result.current.isPro).toBe(false);
    });

    it('returns true when user is pro', () => {
      mockIsPro = true;
      const wrapper = createWrapper({});
      const { result } = renderHook(() => useDataExport(), { wrapper });
      expect(result.current.isPro).toBe(true);
    });
  });
});
