import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { canUseAI as checkCanUseAI, getAICallsRemaining, getEffectivePlan, getEffectiveLimits, PLAN_LIMITS } from '../lib/planManager';
import { isBetaActive } from '../lib/betaConfig';
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

  const betaActive = isBetaActive();
  const effectivePlan = getEffectivePlan(userProfile);

  const canUseConnector = useCallback((type: ConnectorType): boolean => {
    if (betaActive) return !ENTERPRISE_CONNECTORS.includes(type);
    if (PRO_CONNECTORS.includes(type)) return effectivePlan === 'pro' || effectivePlan === 'team';
    if (ENTERPRISE_CONNECTORS.includes(type)) return effectivePlan === 'team';
    return true;
  }, [effectivePlan, betaActive]);

  const planInfo = useMemo(() => {
    const limits = getEffectiveLimits(userProfile);
    if (!userProfile) {
      return {
        isPro: betaActive,
        canUseAI: true,
        csvRowLimit: limits.csvRows,
        aiCallsRemaining: limits.aiCallsPerDay,
        connectorLimit: limits.connectors,
        maxSyncSchedule: limits.syncSchedule as SyncSchedule,
        isBeta: betaActive,
      };
    }
    return {
      isPro: effectivePlan === 'pro' || effectivePlan === 'team',
      canUseAI: betaActive || checkCanUseAI(userProfile),
      csvRowLimit: limits.csvRows,
      aiCallsRemaining: betaActive ? limits.aiCallsPerDay : getAICallsRemaining(userProfile),
      connectorLimit: limits.connectors,
      maxSyncSchedule: limits.syncSchedule as SyncSchedule,
      isBeta: betaActive,
    };
  }, [userProfile, betaActive, effectivePlan]);

  return {
    ...planInfo,
    canUseConnector,
    showUpgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    upgradeReason,
  };
}
