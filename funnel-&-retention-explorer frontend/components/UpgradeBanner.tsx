import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from './Icons';
import { useAuth } from '../context/AuthContext';
import { isPro as checkIsPro, isTrialing } from '../lib/planManager';
import { trackEvent } from '../lib/analytics';

interface UpgradeBannerProps {
  messageKey: string;
  page: string;
  onUpgrade: () => void;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ messageKey, page, onUpgrade }) => {
  const { t } = useTranslation('pages');
  const { user, userProfile } = useAuth();

  if (!user) return null;
  if (userProfile && (checkIsPro(userProfile) || isTrialing(userProfile))) return null;

  const handleClick = () => {
    trackEvent('upgrade_banner_click', { page });
    onUpgrade();
  };

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-center gap-3">
      <Zap size={16} className="text-accent shrink-0" />
      <p className="text-xs text-slate-300 flex-1">{t(messageKey)}</p>
      <button
        onClick={handleClick}
        className="px-3 py-1.5 text-xs font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors whitespace-nowrap"
      >
        {t('upgradeBanner.cta')}
      </button>
    </div>
  );
};
