import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { cancelSubscription, fetchBillingHistory, switchPlan, BILLING_PRICES } from '../lib/planManager';
import type { BillingRecord } from '../lib/planManager';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { BillingHistory } from '../components/BillingHistory';
import { Modal } from '../components/Modal';
import { Zap } from '../components/Icons';

declare const TossPayments: (clientKey: string) => {
  requestBillingAuth: (params: {
    method: string;
    successUrl: string;
    failUrl: string;
    customerKey: string;
    customerEmail?: string;
  }) => Promise<void>;
};

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const { user, session, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [cancelResult, setCancelResult] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBillingHistory(user.id).then(setBillingHistory);
    }
  }, [user]);

  const handleCancel = useCallback(async () => {
    if (!session?.access_token) return;
    setCancelling(true);
    setCancelResult(null);

    const result = await cancelSubscription(session.access_token);

    if (result.success) {
      setCancelResult(result.message);
      await refreshProfile();
      if (user) {
        const updated = await fetchBillingHistory(user.id);
        setBillingHistory(updated);
      }
    } else {
      setCancelResult(result.error ?? result.message);
    }

    setCancelling(false);
    setShowCancelModal(false);
  }, [session, refreshProfile, user]);

  const handleChangeBillingKey = useCallback(async () => {
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    if (!clientKey || !userProfile?.toss_customer_key) return;
    try {
      const tossPayments = TossPayments(clientKey);
      await tossPayments.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/app/billing/success?mode=change`,
        failUrl: `${window.location.origin}/app/billing/fail`,
        customerKey: userProfile.toss_customer_key,
        customerEmail: user?.email ?? undefined,
      });
    } catch {
      // User cancelled TossPayments popup
    }
  }, [userProfile, user]);

  const handleSwitchPlan = useCallback(async () => {
    if (!session?.access_token || !userProfile) return;
    const targetCycle = userProfile.billing_cycle === 'monthly' ? 'annual' : 'monthly';

    setSwitching(true);
    setCancelResult(null);

    const result = await switchPlan(session.access_token, targetCycle);

    if (result.success) {
      setCancelResult(result.message);
      await refreshProfile();
      if (user) {
        const updated = await fetchBillingHistory(user.id);
        setBillingHistory(updated);
      }
    } else {
      setCancelResult(result.message);
    }

    setSwitching(false);
    setShowSwitchModal(false);
  }, [session, userProfile, refreshProfile, user]);

  const isPro = userProfile?.plan === 'pro';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white">{t('subscriptionPage.title')}</h2>

      {cancelResult && (
        <div className="p-3 bg-accent/5 border border-accent/10 rounded-md text-sm text-accent">
          {cancelResult}
        </div>
      )}

      {userProfile ? (
        <>
          {isPro ? (
            <SubscriptionStatus
              userProfile={userProfile}
              onCancel={() => setShowCancelModal(true)}
              cancelling={cancelling}
              onChangeBillingKey={handleChangeBillingKey}
              onSwitchPlan={() => setShowSwitchModal(true)}
            />
          ) : (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap size={20} className="text-accent" />
                <h3 className="text-lg font-semibold text-white">{t('subscriptionPage.proTitle')}</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                {t('subscriptionPage.proDesc')}
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
              >
                {t('subscriptionPage.proUpgrade')}
              </button>
            </div>
          )}

          <BillingHistory records={billingHistory} />
        </>
      ) : (
        <div className="text-center py-12 text-slate-500">
          {t('subscriptionPage.loginRequired')}
        </div>
      )}

      {/* Cancel subscription confirmation modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('subscriptionPage.cancelTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {t('subscriptionPage.cancelConfirm')}
          </p>
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-md">
            <p className="text-sm text-amber-300">
              {t('subscriptionPage.cancelDesc', { date: userProfile?.next_billing_date ?? '-' })}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t('subscriptionPage.cancel')}
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors disabled:opacity-50"
            >
              {cancelling ? t('subscriptionPage.cancelling') : t('subscriptionPage.cancelConfirmButton')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Plan switch confirmation modal */}
      <Modal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        title={userProfile?.billing_cycle === 'monthly' ? t('subscriptionPage.switchToAnnual') : t('subscriptionPage.switchToMonthly')}
      >
        <div className="space-y-4">
          {userProfile?.billing_cycle === 'monthly' ? (
            <>
              <p className="text-sm text-slate-300">
                {t('subscriptionPage.switchAnnualDesc')}
              </p>
              <div className="p-3 bg-accent/5 border border-accent/10 rounded-md text-sm text-accent">
                {t('pricing.annualBilling')}: ₩{BILLING_PRICES.annual.toLocaleString()}/{t('pricing.annual')} (₩{Math.round(BILLING_PRICES.annual / 12).toLocaleString()}/{t('pricing.monthly')}, 20% off)
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                {t('subscriptionPage.switchMonthlyDesc', { price: BILLING_PRICES.monthly.toLocaleString() })}
              </p>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-md text-sm text-amber-300">
                {t('subscriptionPage.switchMonthlyNote', { date: userProfile?.next_billing_date ?? '-' })}
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowSwitchModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {t('subscriptionPage.cancel')}
            </button>
            <button
              onClick={handleSwitchPlan}
              disabled={switching}
              className="px-4 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50"
            >
              {switching ? t('subscriptionPage.cancelling') : t('subscriptionPage.switchConfirm')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
