import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Zap } from './Icons';

export const PlanBadge: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const plan = userProfile?.plan ?? 'free';

  if (plan === 'pro') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/20 rounded-md" title={t('plan.proPlan')}>
        <Zap size={12} className="text-accent" />
        <span className="text-[10px] font-mono font-semibold text-accent uppercase">{t('plan.pro')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" title={t('plan.freePlan')}>
      <span className="text-[10px] font-mono font-medium text-slate-500 uppercase">{t('plan.free')}</span>
      <span className="text-[9px] text-accent/70 hover:text-accent cursor-pointer transition-colors">
        {t('plan.upgrade')}
      </span>
    </div>
  );
});
