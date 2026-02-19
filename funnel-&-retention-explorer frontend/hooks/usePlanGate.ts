import { useCallback, useMemo } from 'react';
import type { ConnectorType, SyncSchedule } from '../types';

export function usePlanGate() {
  const canUseConnector = useCallback((_type: ConnectorType): boolean => true, []);

  const planInfo = useMemo(() => ({
    isPro: true,
    canUseAI: true,
    csvRowLimit: 1_000_000,
    aiCallsRemaining: 999,
    connectorLimit: 999,
    maxSyncSchedule: 'hourly' as SyncSchedule,
    isBeta: false,
  }), []);

  return {
    ...planInfo,
    canUseConnector,
    showUpgradeModal: false,
    openUpgradeModal: (_reason: string) => {},
    closeUpgradeModal: () => {},
    upgradeReason: '',
  };
}
