import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from './Icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/90 text-background text-xs font-medium text-center py-1.5 flex items-center justify-center gap-1.5">
      <WifiOff size={14} />
      {t('pwa.offlineMode')}
    </div>
  );
};
