import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { ConnectorFormGA4 } from './ConnectorFormGA4';
import { ConnectorFormMixpanel } from './ConnectorFormMixpanel';
import { ConnectorFormDB } from './ConnectorFormDB';
import { CONNECTORS } from '../lib/connectors';
import { Loader2, CheckCircle, AlertCircle } from './Icons';
import { usePlanGate } from '../hooks/usePlanGate';
import * as Icons from './Icons';
import type { ConnectorType, ConnectorConfigData, SyncSchedule, ConnectorInstance } from '../types';

type ProConnectorType = 'ga4-api' | 'mixpanel-api' | 'postgresql' | 'mysql';

interface ConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: ConnectorType, name: string, config: ConnectorConfigData, syncSchedule: SyncSchedule) => Promise<unknown>;
  onTest: (type: string, config: ConnectorConfigData) => Promise<{ success: boolean; message: string } | null>;
  onStartOAuth?: () => void;
  editingConnector?: ConnectorInstance | null;
}

const SYNC_OPTIONS: { value: SyncSchedule; labelKey: string }[] = [
  { value: null, labelKey: 'connector.scheduleLabel.none' },
  { value: 'daily', labelKey: 'connector.scheduleLabel.daily' },
  { value: 'weekly', labelKey: 'connector.scheduleLabel.weekly' },
  { value: 'hourly', labelKey: 'connector.scheduleLabel.hourly' },
];

const CONNECTOR_TYPES: ProConnectorType[] = ['ga4-api', 'mixpanel-api', 'postgresql', 'mysql'];

function getDefaultConfig(type: ProConnectorType): ConnectorConfigData {
  switch (type) {
    case 'ga4-api': return { type: 'ga4-api', propertyId: '', isConnected: false };
    case 'mixpanel-api': return { type: 'mixpanel-api', projectId: '', apiSecret: '' };
    case 'postgresql': return { type: 'postgresql', host: '', port: 5432, database: '', username: '', password: '', ssl: true, query: '' };
    case 'mysql': return { type: 'mysql', host: '', port: 3306, database: '', username: '', password: '', query: '' };
  }
}

export const ConnectorModal: React.FC<ConnectorModalProps> = ({ isOpen, onClose, onSave, onTest, onStartOAuth, editingConnector }) => {
  const { t } = useTranslation('pages');
  const planGate = usePlanGate();

  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedType, setSelectedType] = useState<ProConnectorType>('ga4-api');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<ConnectorConfigData>(getDefaultConfig('ga4-api'));
  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule>(null);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (editingConnector) {
      setStep('configure');
      setSelectedType(editingConnector.type as ProConnectorType);
      setName(editingConnector.name);
      setConfig(editingConnector.config);
      setSyncSchedule(editingConnector.sync_schedule);
    } else {
      setStep('select');
      setName('');
      setConfig(getDefaultConfig('ga4-api'));
      setSyncSchedule(null);
      setTestResult(null);
    }
  }, [editingConnector, isOpen]);

  const handleSelectType = (type: ProConnectorType) => {
    if (!planGate.canUseConnector(type)) {
      planGate.openUpgradeModal('connector_type');
      return;
    }
    setSelectedType(type);
    setConfig(getDefaultConfig(type));
    setName(CONNECTORS[type] ? t(CONNECTORS[type].labelKey) : type);
    setStep('configure');
    setTestResult(null);
  };

  const handleTest = async () => {
    setTestResult(null);
    const result = await onTest(selectedType, config);
    if (result) setTestResult(result);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(selectedType, name.trim(), config, syncSchedule);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleStartOAuth = async () => {
    setOauthLoading(true);
    try {
      onStartOAuth?.();
    } finally {
      setOauthLoading(false);
    }
  };

  const allowedSchedules = SYNC_OPTIONS.filter(opt => {
    if (!opt.value) return true;
    if (!planGate.maxSyncSchedule) return false;
    const order = { hourly: 3, daily: 2, weekly: 1 };
    return (order[opt.value] ?? 0) <= (order[planGate.maxSyncSchedule] ?? 0);
  });

  const title = editingConnector ? t('connector.editTitle') : step === 'select' ? t('connector.addTitle') : t('connector.configureTitle');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {step === 'select' ? (
        <div className="grid grid-cols-2 gap-3">
          {CONNECTOR_TYPES.map(type => {
            const cfg = CONNECTORS[type];
            if (!cfg) return null;
            const Icon = (Icons as Record<string, React.ElementType>)[cfg.iconName] ?? Icons.FileText;
            const locked = !planGate.canUseConnector(type);

            return (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  locked
                    ? 'border-white/[0.04] opacity-50 cursor-not-allowed'
                    : 'border-white/[0.06] hover:border-accent/30 hover:bg-accent/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-accent" />
                  <span className="text-sm font-medium text-white">{t(cfg.labelKey)}</span>
                </div>
                <p className="text-[11px] text-slate-500">{t(cfg.descKey)}</p>
                {locked && (
                  <span className="inline-block mt-2 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {cfg.planGate === 'enterprise' ? 'Team' : 'Pro'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">{t('connector.name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
            />
          </div>

          {selectedType === 'ga4-api' && config.type === 'ga4-api' && (
            <ConnectorFormGA4
              config={config}
              onChange={c => setConfig({ ...c, type: 'ga4-api' })}
              onStartOAuth={handleStartOAuth}
              oauthLoading={oauthLoading}
            />
          )}
          {selectedType === 'mixpanel-api' && config.type === 'mixpanel-api' && (
            <ConnectorFormMixpanel
              config={config}
              onChange={c => setConfig({ ...c, type: 'mixpanel-api' })}
            />
          )}
          {(selectedType === 'postgresql' || selectedType === 'mysql') && (config.type === 'postgresql' || config.type === 'mysql') && (
            <ConnectorFormDB
              dbType={selectedType}
              config={config}
              onChange={c => setConfig({ ...c, type: selectedType } as ConnectorConfigData)}
            />
          )}

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">{t('connector.syncSchedule')}</label>
            <select
              value={syncSchedule ?? ''}
              onChange={e => setSyncSchedule((e.target.value || null) as SyncSchedule)}
              className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white focus:border-accent/50 focus:outline-none"
            >
              {allowedSchedules.map(opt => (
                <option key={opt.value ?? 'none'} value={opt.value ?? ''}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
              testResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {testResult.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!editingConnector && (
              <button
                onClick={() => { setStep('select'); setTestResult(null); }}
                className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t('connector.back')}
              </button>
            )}
            <button
              onClick={handleTest}
              className="px-3 py-2 text-sm rounded-md border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.12] transition-colors"
            >
              {t('connector.testConnection')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="ml-auto px-4 py-2 text-sm rounded-md bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : t('connector.save')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
