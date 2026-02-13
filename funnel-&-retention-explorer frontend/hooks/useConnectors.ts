import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { listConnectors, saveConnector, updateConnector, deleteConnector, listSyncLogs, triggerSync, testConnectorConnection } from '../lib/supabaseData';
import type { ConnectorInstance, ConnectorConfigData, SyncSchedule, SyncLog } from '../types';

export function useConnectors() {
  const { user } = useAuth();
  const [connectors, setConnectors] = useState<ConnectorInstance[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listConnectors();
      setConnectors(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSyncLogs = useCallback(async () => {
    if (!connectors.length) {
      setSyncLogs([]);
      return;
    }
    const allLogs: SyncLog[] = [];
    for (const c of connectors) {
      const logs = await listSyncLogs(c.id);
      allLogs.push(...logs);
    }
    allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setSyncLogs(allLogs.slice(0, 50));
  }, [connectors]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  useEffect(() => {
    if (connectors.length > 0) {
      fetchSyncLogs();
    }
  }, [connectors.length, fetchSyncLogs]);

  const addConnector = useCallback(async (
    type: ConnectorInstance['type'],
    name: string,
    config: ConnectorConfigData,
    syncSchedule: SyncSchedule,
  ) => {
    if (!user) return null;
    const result = await saveConnector({ type, name, config, syncSchedule });
    await fetchConnectors();
    return result;
  }, [user, fetchConnectors]);

  const editConnector = useCallback(async (
    id: string,
    updates: Partial<Pick<ConnectorInstance, 'name' | 'config' | 'sync_schedule' | 'is_active'>>,
  ) => {
    await updateConnector(id, {
      name: updates.name,
      config: updates.config,
      syncSchedule: updates.sync_schedule,
      isActive: updates.is_active,
    });
    await fetchConnectors();
  }, [fetchConnectors]);

  const removeConnector = useCallback(async (id: string) => {
    await deleteConnector(id);
    setConnectors(prev => prev.filter(c => c.id !== id));
  }, []);

  const syncConnector = useCallback(async (connectorId: string) => {
    setSyncing(connectorId);
    try {
      const result = await triggerSync(connectorId);
      await fetchConnectors();
      await fetchSyncLogs();
      return result;
    } finally {
      setSyncing(null);
    }
  }, [fetchConnectors, fetchSyncLogs]);

  const testConnection = useCallback(async (type: string, config: ConnectorConfigData) => {
    setTesting(type);
    try {
      return await testConnectorConnection(type, config);
    } finally {
      setTesting(null);
    }
  }, []);

  return {
    connectors,
    syncLogs,
    loading,
    syncing,
    testing,
    addConnector,
    editConnector,
    removeConnector,
    syncConnector,
    testConnection,
    refresh: fetchConnectors,
  };
}
