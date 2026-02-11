import React from 'react';
import { useTranslation } from 'react-i18next';

export const PageLoader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-xs text-slate-500">{t('loading')}</span>
      </div>
    </div>
  );
};
