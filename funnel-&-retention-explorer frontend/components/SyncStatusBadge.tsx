import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SyncStatus } from '../types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

const statusStyles: Record<SyncStatus, string> = {
  idle: 'bg-slate-500/10 text-slate-400',
  running: 'bg-blue-500/10 text-blue-400 animate-pulse',
  success: 'bg-emerald-500/10 text-emerald-400',
  error: 'bg-red-500/10 text-red-400',
};

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation('pages');

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${statusStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'idle' ? 'bg-slate-400' :
        status === 'running' ? 'bg-blue-400' :
        status === 'success' ? 'bg-emerald-400' :
        'bg-red-400'
      }`} />
      {t(`connector.status.${status}`)}
    </span>
  );
};
