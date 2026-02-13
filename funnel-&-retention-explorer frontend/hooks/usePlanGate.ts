import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { canUseAI as checkCanUseAI, getAICallsRemaining, getCSVRowLimit, isPro as checkIsPro, PLAN_LIMITS } from '../lib/planManager';
import type { ConnectorType, SyncSchedule } from '../types';

const PRO_CONNECTORS: ConnectorType[] = ['ga4-api', 'mixpanel-api'];
const ENTERPRISE_CONNECTORS: ConnectorType[] = ['postgresql', 'mysql'];

export function usePlanGate() {
  const { userProfile } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const openUpgradeModal = useCallback((reason: string) => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setUpgradeReason('');
  }, []);

  const plan = userProfile?.plan ?? 'free';

  const canUseConnector = useCallback((type: ConnectorType): boolean => {
    if (PRO_CONNECTORS.includes(type)) return plan === 'pro' || plan === 'team';
    if (ENTERPRISE_CONNECTORS.includes(type)) return plan === 'team';
    return true;
  }, [plan]);

  const planInfo = useMemo(() => {
    if (!userProfile) {
      return {
        isPro: false,
        canUseAI: true,
        csvRowLimit: PLAN_LIMITS.free.csvRows,
        aiCallsRemaining: PLAN_LIMITS.free.aiCallsPerDay,
        connectorLimit: PLAN_LIMITS.free.connectors,
        maxSyncSchedule: PLAN_LIMITS.free.syncSchedule as SyncSchedule,
      };
    }
    return {
      isPro: checkIsPro(userProfile),
      canUseAI: checkCanUseAI(userProfile),
      csvRowLimit: getCSVRowLimit(userProfile),
      aiCallsRemaining: getAICallsRemaining(userProfile),
      connectorLimit: PLAN_LIMITS[userProfile.plan].connectors,
      maxSyncSchedule: PLAN_LIMITS[userProfile.plan].syncSchedule as SyncSchedule,
    };
  }, [userProfile]);

  return {
    ...planInfo,
    canUseConnector,
    showUpgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    upgradeReason,
  };
}
