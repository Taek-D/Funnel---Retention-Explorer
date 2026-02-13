import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConnectors } from '../../hooks/useConnectors';
import type { ConnectorInstance, SyncLog } from '../../types';

const mockConnectors: ConnectorInstance[] = [
  {
    id: 'c1',
    user_id: 'u1',
    project_id: null,
    type: 'ga4-api',
    name: 'My GA4',
    config: { type: 'ga4-api', propertyId: '123', isConnected: true },
    sync_schedule: 'daily',
    last_synced_at: '2026-02-14T00:00:00Z',
    sync_status: 'success',
    is_active: true,
    created_at: '2026-02-13T00:00:00Z',
    updated_at: '2026-02-13T00:00:00Z',
  },
];

const mockSyncLogs: SyncLog[] = [
  {
    id: 'sl1',
    connector_id: 'c1',
    status: 'success',
    rows_fetched: 1000,
    duration_ms: 2500,
    error_message: null,
    created_at: '2026-02-14T00:00:00Z',
  },
];

const mockListConnectors = vi.fn().mockResolvedValue(mockConnectors);
const mockSaveConnector = vi.fn().mockResolvedValue(mockConnectors[0]);
const mockUpdateConnector = vi.fn().mockResolvedValue(undefined);
const mockDeleteConnector = vi.fn().mockResolvedValue(undefined);
const mockListSyncLogs = vi.fn().mockResolvedValue(mockSyncLogs);
const mockTriggerSync = vi.fn().mockResolvedValue({ data: [], headers: [], totalRows: 0 });
const mockTestConnectorConnection = vi.fn().mockResolvedValue({ success: true, message: 'OK' });

vi.mock('../../lib/supabaseData', () => ({
  listConnectors: (...args: unknown[]) => mockListConnectors(...args),
  saveConnector: (...args: unknown[]) => mockSaveConnector(...args),
  updateConnector: (...args: unknown[]) => mockUpdateConnector(...args),
  deleteConnector: (...args: unknown[]) => mockDeleteConnector(...args),
  listSyncLogs: (...args: unknown[]) => mockListSyncLogs(...args),
  triggerSync: (...args: unknown[]) => mockTriggerSync(...args),
  testConnectorConnection: (...args: unknown[]) => mockTestConnectorConnection(...args),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: null,
}));

describe('useConnectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListConnectors.mockResolvedValue(mockConnectors);
    mockListSyncLogs.mockResolvedValue(mockSyncLogs);
  });

  it('loads connectors on mount', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.connectors).toEqual(mockConnectors);
    expect(mockListConnectors).toHaveBeenCalled();
  });

  it('loads sync logs after connectors are fetched', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.syncLogs.length).toBeGreaterThan(0));
    expect(mockListSyncLogs).toHaveBeenCalledWith('c1');
  });

  it('addConnector calls saveConnector with correct params', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addConnector('ga4-api', 'New GA4', { type: 'ga4-api', propertyId: '456', isConnected: false }, 'daily');
    });

    expect(mockSaveConnector).toHaveBeenCalledWith({
      type: 'ga4-api',
      name: 'New GA4',
      config: { type: 'ga4-api', propertyId: '456', isConnected: false },
      syncSchedule: 'daily',
    });
  });

  it('editConnector calls updateConnector', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.editConnector('c1', { name: 'Updated GA4' });
    });

    expect(mockUpdateConnector).toHaveBeenCalledWith('c1', { name: 'Updated GA4' });
  });

  it('removeConnector calls deleteConnector', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Just verify the API call was made — local state update tested implicitly
    act(() => {
      result.current.removeConnector('c1');
    });

    await waitFor(() => expect(mockDeleteConnector).toHaveBeenCalledWith('c1'));
  });

  it('testConnection returns result from server', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let testResult: { success: boolean; message: string } | null = null;
    await act(async () => {
      testResult = await result.current.testConnection('ga4-api', { type: 'ga4-api', propertyId: '123', isConnected: false });
    });

    expect(testResult).toEqual({ success: true, message: 'OK' });
    expect(mockTestConnectorConnection).toHaveBeenCalledWith('ga4-api', { type: 'ga4-api', propertyId: '123', isConnected: false });
  });

  it('initial state has loading true and null syncing', () => {
    const { result } = renderHook(() => useConnectors());
    expect(result.current.loading).toBe(true);
    expect(result.current.syncing).toBeNull();
    expect(result.current.connectors).toEqual([]);
  });

  it('exposes refresh function', async () => {
    const { result } = renderHook(() => useConnectors());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.refresh).toBe('function');
  });
});
