import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from './Icons';
import { useAuth } from '../context/AuthContext';

export const PastDueBanner: React.FC = () => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  if (!userProfile || userProfile.subscription_status !== 'past_due') {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        <p className="text-sm text-amber-200 truncate">
          {t('pastDue.message')}
          {userProfile.grace_period_end && (
            <span className="text-amber-400 ml-1">
              {t('pastDue.gracePeriod', { date: userProfile.grace_period_end })}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={() => navigate('/app/subscription')}
        className="shrink-0 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap"
      >
        {t('pastDue.action')} &rarr;
      </button>
    </div>
  );
};
