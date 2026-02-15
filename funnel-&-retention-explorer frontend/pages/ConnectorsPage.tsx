import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Loader2, Zap } from '../components/Icons';
import { ConnectorCard } from '../components/ConnectorCard';
import { ConnectorModal } from '../components/ConnectorModal';
import { useConnectors } from '../hooks/useConnectors';
import { usePlanGate } from '../hooks/usePlanGate';
import { useCSVUpload } from '../hooks/useCSVUpload';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import type { ConnectorInstance, ConnectorConfigData, ConnectorType, SyncSchedule } from '../types';

export function ConnectorsPage() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const { toast } = useToast();
  const planGate = usePlanGate();
  const { handleAPIImport } = useCSVUpload();
  const {
    connectors,
    syncLogs,
    loading,
    syncing,
    addConnector,
    editConnector,
    removeConnector,
    syncConnector,
    testConnection,
  } = useConnectors();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ConnectorInstance | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const oauthResult = searchParams.get('oauth');
    if (oauthResult === 'success') {
      toast('success', t('connector.oauthSuccess'));
    } else if (oauthResult === 'error') {
      const message = searchParams.get('message') ?? '';
      toast('error', t('connector.oauthError'), message);
    }
  }, [searchParams, toast, t]);

  const handleSave = async (type: ConnectorType, name: string, config: ConnectorConfigData, syncSchedule: SyncSchedule) => {
    if (editingConnector) {
      return editConnector(editingConnector.id, { name, config, sync_schedule: syncSchedule });
    }

    // Check connector limit
    const limit = planGate.connectorLimit;
    if (limit >= 0 && connectors.length >= limit) {
      planGate.openUpgradeModal('connector_limit');
      return null;
    }

    return addConnector(type, name, config, syncSchedule);
  };

  const handleTest = async (type: string, config: ConnectorConfigData) => {
    return testConnection(type, config);
  };

  const handleSync = async (connector: ConnectorInstance) => {
    try {
      await handleAPIImport(connector.id);
      toast('success', t('connector.syncSuccess'));
    } catch (err) {
      toast('error', t('connector.syncFailed'), err instanceof Error ? err.message : '');
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await removeConnector(id);
    setDeleteConfirm(null);
    toast('info', t('connector.deleted'));
  };

  const handleEdit = (connector: ConnectorInstance) => {
    setEditingConnector(connector);
    setModalOpen(true);
  };

  const handleStartOAuth = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || !session?.access_token) return;

    fetch(`${supabaseUrl}/functions/v1/connector-oauth`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(r => r.json())
      .then(data => {
        if (data.authUrl) {
          try {
            const parsed = new URL(data.authUrl);
            const allowedHosts = ['accounts.google.com', 'github.com'];
            if (!allowedHosts.includes(parsed.hostname)) {
              toast('error', t('connector.oauthError'));
              return;
            }
            window.location.href = data.authUrl;
          } catch {
            toast('error', t('connector.oauthError'));
          }
        }
      })
      .catch(() => toast('error', t('connector.oauthError')));
  };

  const isFreeUser = planGate.connectorLimit === 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{t('connector.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('connector.subtitle')}</p>
        </div>
        {!isFreeUser && (
          <button
            onClick={() => { setEditingConnector(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            <Plus size={14} />
            {t('connector.addNew')}
          </button>
        )}
      </div>

      {/* Free user upgrade prompt */}
      {isFreeUser && (
        <div className="mb-8 p-6 rounded-lg border border-accent/20 bg-accent/5 text-center">
          <Zap size={24} className="text-accent mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white mb-2">{t('connector.upgradeTitle')}</h2>
          <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">{t('connector.upgradeDesc')}</p>
          <button
            onClick={() => navigate('/app/subscription')}
            className="px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            {t('connector.upgradeCta')}
          </button>
        </div>
      )}

      {/* Connectors grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : connectors.length === 0 && !isFreeUser ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">{t('connector.empty')}</p>
          <button
            onClick={() => { setEditingConnector(null); setModalOpen(true); }}
            className="mt-3 text-sm text-accent hover:underline"
          >
            {t('connector.addFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {connectors.map(c => (
            <ConnectorCard
              key={c.id}
              connector={c}
              syncing={syncing === c.id}
              onSync={() => handleSync(c)}
              onEdit={() => handleEdit(c)}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </div>
      )}

      {/* Sync logs */}
      {syncLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">{t('connector.syncHistory')}</h2>
          <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-500 text-[11px]">
                  <th className="text-left px-4 py-2">{t('connector.logTime')}</th>
                  <th className="text-left px-4 py-2">{t('connector.logConnector')}</th>
                  <th className="text-left px-4 py-2">{t('connector.logStatus')}</th>
                  <th className="text-right px-4 py-2">{t('connector.logRows')}</th>
                  <th className="text-right px-4 py-2">{t('connector.logDuration')}</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.slice(0, 20).map(log => {
                  const connector = connectors.find(c => c.id === log.connector_id);
                  return (
                    <tr key={log.id} className="border-b border-white/[0.03] text-slate-400 text-[12px]">
                      <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2">{connector?.name ?? log.connector_id.slice(0, 8)}</td>
                      <td className="px-4 py-2">
                        <span className={`${
                          log.status === 'success' ? 'text-emerald-400' :
                          log.status === 'error' ? 'text-red-400' :
                          'text-amber-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{log.rows_fetched.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{(log.duration_ms / 1000).toFixed(1)}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <ConnectorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingConnector(null); }}
        onSave={handleSave}
        onTest={handleTest}
        onStartOAuth={handleStartOAuth}
        editingConnector={editingConnector}
      />
    </div>
  );
}

export default ConnectorsPage;
