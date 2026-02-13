import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Zap } from './Icons';
import { PLAN_LIMITS, getAIUsagePercent, getAICallsRemaining, isTrialing, getTrialDaysRemaining } from '../lib/planManager';

export const UsageIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  const plan = userProfile.plan;
  const isPro = plan === 'pro' || plan === 'team';
  const trialing = isTrialing(userProfile);

  if (isPro && !trialing) return null;

  const usagePercent = getAIUsagePercent(userProfile);
  const remaining = getAICallsRemaining(userProfile);
  const limit = PLAN_LIMITS[plan].aiCallsPerDay;
  const used = limit - remaining;

  const barColor = usagePercent >= 100 ? 'bg-red-400' : usagePercent >= 80 ? 'bg-yellow-400' : 'bg-accent';
  const showNudge = usagePercent >= 80 && !trialing;

  return (
    <div className="w-12 flex flex-col items-center gap-1.5">
      {trialing && (
        <span className="text-[9px] font-mono font-semibold text-accent">
          {t('trial.badge', { days: getTrialDaysRemaining(userProfile) })}
        </span>
      )}
      <div className="w-full" title={`${t('usage.aiCalls')} ${used}/${limit}`}>
        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, usagePercent)}%` }}
          />
        </div>
        <span className="text-[8px] font-mono text-slate-500 mt-0.5 block text-center">
          {used}/{limit}
        </span>
      </div>
      {showNudge && (
        <span className="text-[8px] text-accent/80 hover:text-accent cursor-pointer transition-colors text-center leading-tight">
          <Zap size={8} className="inline mr-0.5" />
          {t('usage.upgradeNudge')}
        </span>
      )}
    </div>
  );
};
