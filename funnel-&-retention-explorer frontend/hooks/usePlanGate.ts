import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { canUseAI as checkCanUseAI, getAICallsRemaining, getCSVRowLimit, isPro as checkIsPro, PLAN_LIMITS } from '../lib/planManager';

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

  const planInfo = useMemo(() => {
    if (!userProfile) {
      return {
        isPro: false,
        canUseAI: true,
        csvRowLimit: PLAN_LIMITS.free.csvRows,
        aiCallsRemaining: PLAN_LIMITS.free.aiCallsPerDay,
      };
    }
    return {
      isPro: checkIsPro(userProfile),
      canUseAI: checkCanUseAI(userProfile),
      csvRowLimit: getCSVRowLimit(userProfile),
      aiCallsRemaining: getAICallsRemaining(userProfile),
    };
  }, [userProfile]);

  return {
    ...planInfo,
    showUpgradeModal,
    openUpgradeModal,
    closeUpgradeModal,
    upgradeReason,
  };
}
