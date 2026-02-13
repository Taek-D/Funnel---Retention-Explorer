import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt: React.FC = () => {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-surface border border-white/[0.08] rounded-xl p-4 shadow-lg max-w-xs">
      <p className="text-sm text-white mb-3">{t('pwa.updateAvailable')}</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-4 py-1.5 text-xs font-semibold bg-accent text-background rounded-md hover:bg-accent/90"
      >
        {t('pwa.updateNow')}
      </button>
    </div>
  );
};
