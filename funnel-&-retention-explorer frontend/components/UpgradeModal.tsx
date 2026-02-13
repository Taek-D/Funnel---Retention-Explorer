import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, Zap } from './Icons';
import { trackEvent } from '../lib/analytics';
import { useAuth } from '../context/AuthContext';
import { PLAN_LIMITS, BILLING_PRICES, hasUsedTrial, startTrial } from '../lib/planManager';
import type { BillingCycle } from '../types';

declare const TossPayments: (clientKey: string) => {
  requestBillingAuth: (params: {
    method: string;
    successUrl: string;
    failUrl: string;
    customerKey: string;
    customerEmail?: string;
  }) => Promise<void>;
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
}

const annualPerMonth = Math.round(BILLING_PRICES.annual / 12);

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, reason }) => {
  const { t } = useTranslation();
  const { user, session, userProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const canTrial = userProfile != null && !hasUsedTrial(userProfile) && userProfile.plan === 'free';

  const REASON_MESSAGES: Record<string, string> = {
    csv_limit: t('plan.csvLimitReason', { limit: PLAN_LIMITS.free.csvRows.toLocaleString() }),
    ai_limit: t('plan.aiLimitReason', { limit: PLAN_LIMITS.free.aiCallsPerDay }),
    general: t('plan.generalReason'),
  };

  const FREE_FEATURES = [
    t('plan.csvRows', { num: PLAN_LIMITS.free.csvRows.toLocaleString() }),
    t('plan.aiCalls', { count: PLAN_LIMITS.free.aiCallsPerDay }),
    t('plan.projectOne'),
    t('plan.funnelRetention'),
  ];

  const PRO_FEATURES = [
    t('plan.csvRows', { num: PLAN_LIMITS.pro.csvRows.toLocaleString() }),
    t('plan.aiCalls', { count: PLAN_LIMITS.pro.aiCallsPerDay }),
    t('plan.projectUnlimited'),
    t('plan.segmentCompare'),
    t('plan.pdfExport'),
    t('plan.prioritySupport'),
  ];

  useEffect(() => {
    if (isOpen) {
      trackEvent('upgrade_modal_open', { reason });
    }
  }, [isOpen, reason]);

  if (!isOpen) return null;

  const displayPrice = billingCycle === 'annual' ? annualPerMonth : BILLING_PRICES.monthly;

  const handleUpgrade = async () => {
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    if (!clientKey || !userProfile?.toss_customer_key) return;

    setIsLoading(true);
    try {
      const tossPayments = TossPayments(clientKey);
      await tossPayments.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/app/billing/success?billingCycle=${billingCycle}`,
        failUrl: `${window.location.origin}/app/billing/fail`,
        customerKey: userProfile.toss_customer_key,
        customerEmail: user?.email ?? undefined,
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-white/[0.06] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-accent" />
            <h2 className="text-lg font-bold text-white">{t('plan.upgradeTitle')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Reason message */}
          <p className="text-slate-400 text-sm mb-6">
            {REASON_MESSAGES[reason] || REASON_MESSAGES.general}
          </p>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Free */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">{t('plan.free')}</h3>
              <ul className="space-y-2">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={14} className="text-slate-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-accent">{t('plan.pro')}</h3>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                  {t('plan.recommended')}
                </span>
              </div>
              <ul className="space-y-2">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle size={14} className="text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trial CTA */}
          {canTrial && (
            <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-accent" />
                <span className="text-sm font-semibold text-white">{t('trial.modalTitle')}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{t('trial.modalDesc')}</p>
              {trialError && (
                <p className="text-xs text-coral mb-2">{trialError}</p>
              )}
              <button
                onClick={async () => {
                  if (!session?.access_token) return;
                  setTrialLoading(true);
                  setTrialError('');
                  const result = await startTrial(session.access_token);
                  setTrialLoading(false);
                  if (result.success) {
                    trackEvent('trial_started');
                    await refreshProfile();
                    onClose();
                  } else {
                    setTrialError(result.message);
                  }
                }}
                disabled={trialLoading}
                className="w-full py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {trialLoading ? t('trial.starting') : t('trial.startCta')}
              </button>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-slate-500 uppercase">{t('trial.orSubscribe')}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </div>
          )}

          {/* Billing Cycle Selection */}
          <div className="mb-4 space-y-2">
            <p className="text-xs text-slate-400 font-medium mb-2">{t('plan.billingCycle')}</p>
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${billingCycle === 'monthly' ? 'border-accent/30 bg-accent/5' : 'border-white/[0.06] hover:border-white/10'}`}>
              <input type="radio" name="cycle" checked={billingCycle === 'monthly'} onChange={() => setBillingCycle('monthly')} className="accent-accent" />
              <div className="flex-1">
                <span className="text-sm text-white font-medium">{t('plan.monthly')}</span>
                <span className="text-xs text-slate-400 ml-2">₩{BILLING_PRICES.monthly.toLocaleString()}{t('plan.perMonth')}</span>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${billingCycle === 'annual' ? 'border-accent/30 bg-accent/5' : 'border-white/[0.06] hover:border-white/10'}`}>
              <input type="radio" name="cycle" checked={billingCycle === 'annual'} onChange={() => setBillingCycle('annual')} className="accent-accent" />
              <div className="flex-1">
                <span className="text-sm text-white font-medium">{t('plan.annual')}</span>
                <span className="text-xs text-slate-400 ml-2">₩{annualPerMonth.toLocaleString()}{t('plan.perMonth')}</span>
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-accent/10 text-accent rounded-full">{t('plan.discount')}</span>
              </div>
              <span className="text-[10px] text-slate-500">₩{BILLING_PRICES.annual.toLocaleString()}{t('plan.perYear')}</span>
            </label>
          </div>

          {/* Price & CTA */}
          <div className="text-center mb-4">
            <span className="text-3xl font-mono font-bold text-white">₩{displayPrice.toLocaleString()}</span>
            <span className="text-slate-400 text-sm ml-1">{t('plan.perMonth')}</span>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isLoading || !userProfile?.toss_customer_key}
            className="w-full py-3 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('plan.processing') : t('plan.proUpgrade')}
          </button>

          {!user && (
            <p className="text-slate-500 text-xs text-center mt-3">
              {t('plan.loginRequired')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
