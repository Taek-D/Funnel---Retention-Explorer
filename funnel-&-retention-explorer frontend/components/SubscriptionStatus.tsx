import React from 'react';
import { Zap, AlertTriangle, X as XIcon } from './Icons';
import { BILLING_PRICES } from '../lib/planManager';
import type { UserProfile } from '../lib/planManager';

interface SubscriptionStatusProps {
  userProfile: UserProfile;
  onCancel: () => void;
  cancelling: boolean;
  onChangeBillingKey?: () => void;
  onSwitchPlan?: () => void;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: '취소됨', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  past_due: { label: '결제 실패', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  none: { label: '미구독', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  userProfile,
  onCancel,
  cancelling,
  onChangeBillingKey,
  onSwitchPlan,
}) => {
  const plan = userProfile.plan;
  const status = userProfile.subscription_status;
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.none;

  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">구독 상태</h3>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">현재 플랜</span>
          <div className="flex items-center gap-1.5">
            {plan === 'pro' && <Zap size={14} className="text-accent" />}
            <span className="text-sm font-semibold text-white">
              {plan === 'pro' ? 'Pro' : 'Free'}
            </span>
          </div>
        </div>

        {plan === 'pro' && userProfile.next_billing_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">다음 결제일</span>
            <span className="text-sm font-medium text-white">
              {userProfile.next_billing_date}
            </span>
          </div>
        )}

        {plan === 'pro' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">결제 주기</span>
            <span className="text-sm font-medium text-white">
              {userProfile.billing_cycle === 'annual' ? '연간 구독' : '월간 구독'}
            </span>
          </div>
        )}

        {plan === 'pro' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">결제 금액</span>
            <span className="text-sm font-medium text-white">
              {userProfile.billing_cycle === 'annual'
                ? `₩${BILLING_PRICES.annual.toLocaleString()}/년`
                : `₩${BILLING_PRICES.monthly.toLocaleString()}/월`}
            </span>
          </div>
        )}

        {status === 'past_due' && userProfile.grace_period_end && (
          <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-md">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <div className="text-xs text-red-300">
              <span className="font-medium">Grace Period:</span>{' '}
              {userProfile.grace_period_end}까지 Pro 기능이 유지됩니다.
              이후 Free 플랜으로 전환됩니다.
            </div>
          </div>
        )}

        {status === 'cancelled' && userProfile.next_billing_date && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-md">
            <XIcon size={16} className="text-amber-400 shrink-0" />
            <div className="text-xs text-amber-300">
              구독이 취소되었습니다. {userProfile.next_billing_date}까지 Pro 기능을 이용할 수 있습니다.
            </div>
          </div>
        )}
      </div>

      {status === 'active' && (
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
          {onChangeBillingKey && (
            <button
              onClick={onChangeBillingKey}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/[0.05] hover:bg-white/10 border border-white/[0.06] rounded-md transition-colors"
            >
              결제 수단 변경
            </button>
          )}
          {onSwitchPlan && (
            <button
              onClick={onSwitchPlan}
              className="px-4 py-2 text-sm font-medium text-accent bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-md transition-colors"
            >
              {userProfile.billing_cycle === 'annual' ? '월간 전환' : '연간 전환'}
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-md transition-colors disabled:opacity-50"
          >
            {cancelling ? '처리 중...' : '구독 취소'}
          </button>
        </div>
      )}
    </div>
  );
};
