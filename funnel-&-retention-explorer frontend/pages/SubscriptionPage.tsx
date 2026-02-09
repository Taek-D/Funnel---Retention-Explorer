import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <h2 className="text-2xl font-bold text-white">구독 관리</h2>

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
                <h3 className="text-lg font-semibold text-white">Pro 플랜</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Pro 플랜으로 업그레이드하면 CSV 50만 행, AI 하루 50회, 무제한 프로젝트를 이용할 수 있습니다.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
              >
                Pro 업그레이드
              </button>
            </div>
          )}

          <BillingHistory records={billingHistory} />
        </>
      ) : (
        <div className="text-center py-12 text-slate-500">
          로그인 후 이용할 수 있습니다.
        </div>
      )}

      {/* 구독 취소 확인 모달 */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="구독 취소"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            정말 구독을 취소하시겠습니까?
          </p>
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-md">
            <p className="text-sm text-amber-300">
              다음 결제일({userProfile?.next_billing_date ?? '-'})까지 Pro 기능을 계속 이용할 수 있습니다.
              이후 Free 플랜으로 자동 전환됩니다.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors disabled:opacity-50"
            >
              {cancelling ? '처리 중...' : '구독 취소 확인'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 플랜 전환 확인 모달 */}
      <Modal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        title={userProfile?.billing_cycle === 'monthly' ? '연간 구독으로 전환' : '월간 구독으로 전환'}
      >
        <div className="space-y-4">
          {userProfile?.billing_cycle === 'monthly' ? (
            <>
              <p className="text-sm text-slate-300">
                연간 구독으로 전환하시겠습니까? 남은 월간 기간의 크레딧이 차감되어 차액만 결제됩니다.
              </p>
              <div className="p-3 bg-accent/5 border border-accent/10 rounded-md text-sm text-accent">
                연간 결제: ₩{BILLING_PRICES.annual.toLocaleString()}/년 (₩{Math.round(BILLING_PRICES.annual / 12).toLocaleString()}/월, 20% 할인)
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                월간 구독으로 전환하시겠습니까? 다음 갱신일부터 월간 금액(₩{BILLING_PRICES.monthly.toLocaleString()}/월)으로 적용됩니다.
              </p>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-md text-sm text-amber-300">
                현재 결제 기간({userProfile?.next_billing_date ?? '-'})까지는 연간 구독이 유지됩니다.
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowSwitchModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSwitchPlan}
              disabled={switching}
              className="px-4 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50"
            >
              {switching ? '처리 중...' : '전환 확인'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
