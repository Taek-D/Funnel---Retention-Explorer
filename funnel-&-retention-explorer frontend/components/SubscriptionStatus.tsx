import React from 'react';
import { useTranslation } from 'react-i18next';
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

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  userProfile,
  onCancel,
  cancelling,
  onChangeBillingKey,
  onSwitchPlan,
}) => {
  const { t } = useTranslation();
  const plan = userProfile.plan;

  const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    active: { label: t('subscription.active'), color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    cancelled: { label: t('subscription.cancelled'), color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    past_due: { label: t('subscription.pastDue'), color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    none: { label: t('subscription.none'), color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  };
  const status = userProfile.subscription_status;
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.none;

  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">{t('subscription.title')}</h3>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{t('subscription.currentPlan')}</span>
          <div className="flex items-center gap-1.5">
            {plan === 'pro' && <Zap size={14} className="text-accent" />}
            <span className="text-sm font-semibold text-white">
              {plan === 'pro' ? 'Pro' : 'Free'}
            </span>
          </div>
        </div>

        {plan === 'pro' && userProfile.next_billing_date && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('subscription.nextBilling')}</span>
            <span className="text-sm font-medium text-white">
              {userProfile.next_billing_date}
            </span>
          </div>
        )}

        {plan === 'pro' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('subscription.billingCycle')}</span>
            <span className="text-sm font-medium text-white">
              {userProfile.billing_cycle === 'annual' ? t('subscription.annualSub') : t('subscription.monthlySub')}
            </span>
          </div>
        )}

        {plan === 'pro' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{t('subscription.billingAmount')}</span>
            <span className="text-sm font-medium text-white">
              {userProfile.billing_cycle === 'annual'
                ? `₩${BILLING_PRICES.annual.toLocaleString()}${t('plan.perYear')}`
                : `₩${BILLING_PRICES.monthly.toLocaleString()}${t('plan.perMonth')}`}
            </span>
          </div>
        )}

        {status === 'past_due' && userProfile.grace_period_end && (
          <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-md">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <div className="text-xs text-red-300">
              <span className="font-medium">Grace Period:</span>{' '}
              {t('subscription.gracePeriod', { date: userProfile.grace_period_end })}
            </div>
          </div>
        )}

        {status === 'cancelled' && userProfile.next_billing_date && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-md">
            <XIcon size={16} className="text-amber-400 shrink-0" />
            <div className="text-xs text-amber-300">
              {t('subscription.cancelledNotice', { date: userProfile.next_billing_date })}
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
              {t('subscription.changeBillingKey')}
            </button>
          )}
          {onSwitchPlan && (
            <button
              onClick={onSwitchPlan}
              className="px-4 py-2 text-sm font-medium text-accent bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-md transition-colors"
            >
              {userProfile.billing_cycle === 'annual' ? t('subscription.switchToMonthly') : t('subscription.switchToAnnual')}
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-md transition-colors disabled:opacity-50"
          >
            {cancelling ? t('subscription.cancelling') : t('subscription.cancelSubscription')}
          </button>
        </div>
      )}
    </div>
  );
};
