import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from './Icons';
import { isBetaActive } from '../lib/betaConfig';

export const BetaBanner: React.FC = () => {
  const { t } = useTranslation('pages');
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('fre_beta_banner_dismissed') === 'true',
  );

  if (!isBetaActive() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('fre_beta_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 flex items-center justify-between text-xs" role="banner">
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-accent">BETA</span>
        <span className="text-slate-300">{t('beta.bannerMessage')}</span>
      </div>
      <button
        onClick={handleDismiss}
        aria-label={t('beta.dismiss', { defaultValue: 'Dismiss' })}
        className="text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
};
