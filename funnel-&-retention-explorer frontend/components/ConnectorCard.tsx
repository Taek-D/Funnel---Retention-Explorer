import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Pencil, Trash2, Loader2 } from './Icons';
import { SyncStatusBadge } from './SyncStatusBadge';
import { CONNECTORS } from '../lib/connectors';
import * as Icons from './Icons';
import type { ConnectorInstance } from '../types';

interface ConnectorCardProps {
  connector: ConnectorInstance;
  syncing: boolean;
  onSync: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ConnectorCard: React.FC<ConnectorCardProps> = ({ connector, syncing, onSync, onEdit, onDelete }) => {
  const { t } = useTranslation('pages');
  const config = CONNECTORS[connector.type];
  const IconComponent = (Icons as Record<string, React.ElementType>)[config?.iconName ?? 'FileText'] ?? Icons.FileText;

  const lastSynced = connector.last_synced_at
    ? new Date(connector.last_synced_at).toLocaleString()
    : t('connector.neverSynced');

  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center text-accent">
            <IconComponent size={16} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">{connector.name}</h3>
            <p className="text-[11px] text-slate-500">{config ? t(config.labelKey) : connector.type}</p>
          </div>
        </div>
        <SyncStatusBadge status={connector.sync_status} />
      </div>

      <div className="text-[11px] text-slate-500 space-y-1">
        <div>{t('connector.lastSync')}: {lastSynced}</div>
        {connector.sync_schedule && (
          <div>{t('connector.schedule')}: {t(`connector.scheduleLabel.${connector.sync_schedule}`)}</div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {t('connector.syncNow')}
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Pencil size={12} />
          {t('connector.edit')}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-colors ml-auto"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
