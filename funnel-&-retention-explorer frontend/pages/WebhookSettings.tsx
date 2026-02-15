import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Webhook, Plus, Trash2, Send, ChevronDown, ChevronUp, Copy, Check, AlertCircle, CheckCircle } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { listWebhooks, createWebhook, updateWebhook, deleteWebhook, listWebhookLogs } from '../lib/supabaseData';
import { detectWebhookFormat } from '../lib/webhookFormatters';
import { invalidateWebhookCache } from '../lib/webhookDispatcher';
import type { WebhookConfig, WebhookLog, WebhookFormat, WebhookEventType } from '../types';

const EVENT_TYPES: WebhookEventType[] = ['analysis', 'import', 'ai', 'export'];

const FORMAT_OPTIONS: { value: WebhookFormat; labelKey: string }[] = [
  { value: 'json', labelKey: 'pages:webhook.formatJson' },
  { value: 'slack', labelKey: 'pages:webhook.formatSlack' },
  { value: 'discord', labelKey: 'pages:webhook.formatDiscord' },
];

const EVENT_LABEL_KEYS: Record<WebhookEventType, string> = {
  analysis: 'pages:webhook.eventAnalysis',
  import: 'pages:webhook.eventImport',
  ai: 'pages:webhook.eventAI',
  export: 'pages:webhook.eventExport',
};

interface WebhookFormData {
  name: string;
  url: string;
  format: WebhookFormat;
  events: WebhookEventType[];
}

const EMPTY_FORM: WebhookFormData = { name: '', url: '', format: 'json', events: ['analysis'] };

export const WebhookSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebhookFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, WebhookLog[]>>({});
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadWebhooks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listWebhooks();
      setWebhooks(data);
    } catch {
      toast('error', t('common:error'));
    } finally {
      setLoading(false);
    }
  }, [user, toast, t]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const handleUrlChange = (url: string) => {
    const detectedFormat = detectWebhookFormat(url);
    setForm(prev => ({
      ...prev,
      url,
      format: detectedFormat !== 'json' ? detectedFormat : prev.format,
    }));
    if (detectedFormat !== 'json') {
      toast('info', t('pages:webhook.formatAutoDetected', { format: detectedFormat.toUpperCase() }));
    }
  };

  const handleToggleEvent = (event: WebhookEventType) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateWebhook(editingId, {
          name: form.name,
          url: form.url,
          format: form.format,
          events: form.events,
        });
      } else {
        await createWebhook({
          name: form.name,
          url: form.url,
          format: form.format,
          events: form.events,
        });
      }
      invalidateWebhookCache();
      await loadWebhooks();
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch {
      toast('error', t('common:error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setForm({
      name: webhook.name,
      url: webhook.url,
      format: webhook.format,
      events: webhook.events,
    });
    setEditingId(webhook.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('pages:webhook.deleteConfirm'))) return;
    try {
      await deleteWebhook(id);
      invalidateWebhookCache();
      setWebhooks(prev => prev.filter(w => w.id !== id));
    } catch {
      toast('error', t('common:error'));
    }
  };

  const handleToggleActive = async (webhook: WebhookConfig) => {
    try {
      await updateWebhook(webhook.id, { active: !webhook.active });
      invalidateWebhookCache();
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? { ...w, active: !w.active } : w));
    } catch {
      toast('error', t('common:error'));
    }
  };

  const handleTest = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          webhookId: webhook.id,
          payload: {
            eventType: 'test',
            title: 'Test Webhook',
            message: 'This is a test notification from FRE Analytics',
            timestamp: new Date().toISOString(),
          },
        }),
      });
      if (res.ok) {
        toast('success', t('pages:webhook.testSuccess'));
      } else {
        toast('error', t('pages:webhook.testFailed'));
      }
    } catch {
      toast('error', t('pages:webhook.testFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleLogs = async (webhookId: string) => {
    if (expandedLogs === webhookId) {
      setExpandedLogs(null);
      return;
    }
    setExpandedLogs(webhookId);
    if (!logs[webhookId]) {
      try {
        const data = await listWebhookLogs(webhookId);
        setLogs(prev => ({ ...prev, [webhookId]: data }));
      } catch {
        setLogs(prev => ({ ...prev, [webhookId]: [] }));
      }
    }
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(secret);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>{t('common:loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook size={22} className="text-accent" />
            {t('pages:webhook.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('pages:webhook.description')}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-accent text-background rounded-md hover:bg-accent/90 transition-colors"
          >
            <Plus size={16} />
            {t('pages:webhook.addWebhook')}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-5 rounded-xl bg-surface border border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white mb-4">
            {editingId ? t('pages:webhook.editWebhook') : t('pages:webhook.addWebhook')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('pages:webhook.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('pages:webhook.namePlaceholder')}
                maxLength={100}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-md text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('pages:webhook.url')}</label>
              <input
                type="url"
                value={form.url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder={t('pages:webhook.urlPlaceholder')}
                maxLength={2048}
                className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-md text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('pages:webhook.format')}</label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(prev => ({ ...prev, format: opt.value }))}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      form.format === opt.value
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('pages:webhook.events')}</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(event => (
                  <button
                    key={event}
                    onClick={() => handleToggleEvent(event)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      form.events.includes(event)
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    {t(EVENT_LABEL_KEYS[event])}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t('pages:webhook.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.url.trim() || form.events.length === 0}
                className="px-5 py-2 text-sm font-semibold bg-accent text-background rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {t('pages:webhook.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook List */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">{t('common:loading')}</div>
      ) : webhooks.length === 0 && !showForm ? (
        <div className="text-center py-16 text-slate-500">
          <Webhook size={40} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm font-medium">{t('pages:webhook.noWebhooks')}</p>
          <p className="text-xs mt-1">{t('pages:webhook.noWebhooksDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="rounded-xl bg-surface border border-white/[0.06] overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleActive(webhook)}
                    className={`flex-shrink-0 w-10 h-5 rounded-full relative transition-colors ${
                      webhook.active ? 'bg-accent' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      webhook.active ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{webhook.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        webhook.format === 'slack' ? 'bg-purple-500/10 text-purple-400' :
                        webhook.format === 'discord' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {webhook.format.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <button
                    onClick={() => handleTest(webhook)}
                    disabled={testingId === webhook.id}
                    className="p-1.5 text-slate-500 hover:text-accent transition-colors disabled:opacity-50"
                    title={t('pages:webhook.test')}
                  >
                    <Send size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(webhook)}
                    className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    title={t('pages:webhook.editWebhook')}
                  >
                    <Webhook size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title={t('pages:webhook.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleLogs(webhook.id)}
                    className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    title={t('pages:webhook.logs')}
                  >
                    {expandedLogs === webhook.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Event badges */}
              <div className="px-4 pb-3 flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                  {webhook.events.map(event => (
                    <span key={event} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">
                      {t(EVENT_LABEL_KEYS[event])}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleCopySecret(webhook.secret)}
                  className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors ml-auto"
                  title={t('pages:webhook.secretHint')}
                >
                  {copiedSecret === webhook.secret ? <Check size={10} /> : <Copy size={10} />}
                  {t('pages:webhook.secret')}
                </button>
              </div>

              {/* Logs */}
              {expandedLogs === webhook.id && (
                <div className="border-t border-white/[0.04] px-4 py-3">
                  <h4 className="text-xs font-medium text-slate-400 mb-2">{t('pages:webhook.logs')}</h4>
                  {!logs[webhook.id] || logs[webhook.id].length === 0 ? (
                    <p className="text-xs text-slate-600">{t('pages:webhook.noLogs')}</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {logs[webhook.id].map(log => (
                        <div key={log.id} className="flex items-center gap-2 text-xs py-1">
                          {log.status === 'success' ? (
                            <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                          )}
                          <span className="text-slate-400">{log.event_type}</span>
                          {log.response_code && (
                            <span className={`px-1 rounded ${
                              log.response_code < 400 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {log.response_code}
                            </span>
                          )}
                          {log.error_message && (
                            <span className="text-red-400/70 truncate">{log.error_message}</span>
                          )}
                          <span className="text-slate-600 ml-auto flex-shrink-0">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
