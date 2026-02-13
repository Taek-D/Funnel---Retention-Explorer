import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Plus, Trash2, Check, AlertCircle, CheckCircle } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { usePlanGate } from '../hooks/usePlanGate';
import { listScheduledReports, createScheduledReport, updateScheduledReport, deleteScheduledReport, listWebhooks } from '../lib/supabaseData';
import type { ScheduledReport, ReportFrequency, WebhookConfig } from '../types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleFormData {
  name: string;
  frequency: ReportFrequency;
  day_of_week: number;
  day_of_month: number;
  hour_utc: number;
  webhook_ids: string[];
}

const EMPTY_FORM: ScheduleFormData = {
  name: '',
  frequency: 'weekly',
  day_of_week: 1,
  day_of_month: 1,
  hour_utc: 9,
  webhook_ids: [],
};

export const ScheduledReports: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPro, openUpgradeModal } = usePlanGate();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [s, w] = await Promise.all([listScheduledReports(), listWebhooks()]);
      setSchedules(s);
      setWebhooks(w);
    } catch {
      toast('error', t('error'));
    } finally {
      setLoading(false);
    }
  }, [user, toast, t]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/50">{t('auth.loginRequired')}</p>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={22} className="text-accent" />
          {t('pages:scheduledReport.title')}
        </h1>
        <div className="bg-surface border border-white/[0.06] rounded-xl p-8 text-center">
          <p className="text-white/60 mb-4">{t('pages:scheduledReport.proOnly')}</p>
          <button
            onClick={() => openUpgradeModal(t('pages:scheduledReport.proOnly'))}
            className="px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-accent/90"
          >
            {t('pricing.upgrade')}
          </button>
        </div>
      </div>
    );
  }

  const localTimeFromUtc = (utcHour: number): string => {
    const d = new Date();
    d.setUTCHours(utcHour, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = (schedule: ScheduledReport) => {
    setEditId(schedule.id);
    setForm({
      name: schedule.name,
      frequency: schedule.frequency,
      day_of_week: schedule.day_of_week ?? 1,
      day_of_month: schedule.day_of_month ?? 1,
      hour_utc: schedule.hour_utc,
      webhook_ids: schedule.webhook_ids,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || form.webhook_ids.length === 0) return;
    setSaving(true);
    try {
      const params = {
        name: form.name.trim(),
        frequency: form.frequency,
        day_of_week: form.frequency === 'weekly' ? form.day_of_week : null,
        day_of_month: form.frequency === 'monthly' ? form.day_of_month : null,
        hour_utc: form.hour_utc,
        webhook_ids: form.webhook_ids,
      };

      if (editId) {
        await updateScheduledReport(editId, params);
      } else {
        await createScheduledReport(params);
      }
      toast('success', t('pages:scheduledReport.saved'));
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      toast('error', t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduledReport(id);
      toast('success', t('pages:scheduledReport.deleted'));
      setDeleteConfirmId(null);
      await load();
    } catch {
      toast('error', t('error'));
    }
  };

  const handleToggle = async (schedule: ScheduledReport) => {
    try {
      await updateScheduledReport(schedule.id, { active: !schedule.active });
      await load();
    } catch {
      toast('error', t('error'));
    }
  };

  const toggleWebhookId = (id: string) => {
    setForm(prev => ({
      ...prev,
      webhook_ids: prev.webhook_ids.includes(id)
        ? prev.webhook_ids.filter(w => w !== id)
        : [...prev.webhook_ids, id],
    }));
  };

  return (
    <div className="flex-1 p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock size={22} className="text-accent" />
          {t('pages:scheduledReport.title')}
        </h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90"
        >
          <Plus size={16} /> {t('pages:scheduledReport.create')}
        </button>
      </div>

      <p className="text-white/50 text-sm mb-6">{t('pages:scheduledReport.description')}</p>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-4">
            {editId ? t('pages:scheduledReport.edit') : t('pages:scheduledReport.create')}
          </h2>

          {/* Name */}
          <label className="block mb-3">
            <span className="text-white/60 text-xs">{t('pages:scheduledReport.name')}</span>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={t('pages:scheduledReport.namePlaceholder')}
              className="mt-1 w-full bg-background border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50"
            />
          </label>

          {/* Frequency */}
          <div className="mb-3">
            <span className="text-white/60 text-xs">{t('pages:scheduledReport.frequency')}</span>
            <div className="flex gap-2 mt-1">
              {(['daily', 'weekly', 'monthly'] as ReportFrequency[]).map(f => (
                <button
                  key={f}
                  onClick={() => setForm(p => ({ ...p, frequency: f }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    form.frequency === f
                      ? 'bg-accent/20 border-accent/50 text-accent'
                      : 'bg-background border-white/[0.08] text-white/60 hover:border-white/20'
                  }`}
                >
                  {t(`pages:scheduledReport.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week (weekly) */}
          {form.frequency === 'weekly' && (
            <label className="block mb-3">
              <span className="text-white/60 text-xs">{t('pages:scheduledReport.dayOfWeek')}</span>
              <select
                value={form.day_of_week}
                onChange={e => setForm(p => ({ ...p, day_of_week: parseInt(e.target.value) }))}
                className="mt-1 w-full bg-background border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent/50"
              >
                {DAYS_OF_WEEK.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </label>
          )}

          {/* Day of month (monthly) */}
          {form.frequency === 'monthly' && (
            <label className="block mb-3">
              <span className="text-white/60 text-xs">{t('pages:scheduledReport.dayOfMonth')}</span>
              <select
                value={form.day_of_month}
                onChange={e => setForm(p => ({ ...p, day_of_month: parseInt(e.target.value) }))}
                className="mt-1 w-full bg-background border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent/50"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          )}

          {/* Hour UTC */}
          <label className="block mb-3">
            <span className="text-white/60 text-xs">{t('pages:scheduledReport.hourUtc')}</span>
            <select
              value={form.hour_utc}
              onChange={e => setForm(p => ({ ...p, hour_utc: parseInt(e.target.value) }))}
              className="mt-1 w-full bg-background border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent/50"
            >
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>{`${h.toString().padStart(2, '0')}:00 UTC`}</option>
              ))}
            </select>
            <span className="text-white/40 text-xs mt-1 block">
              {t('pages:scheduledReport.localTimeHint', { time: localTimeFromUtc(form.hour_utc) })}
            </span>
          </label>

          {/* Target Webhooks */}
          <div className="mb-4">
            <span className="text-white/60 text-xs">{t('pages:scheduledReport.targetWebhooks')}</span>
            {webhooks.length === 0 ? (
              <p className="text-amber-400/80 text-xs mt-1">{t('pages:scheduledReport.noWebhooks')}</p>
            ) : (
              <div className="mt-1 space-y-1">
                {webhooks.map(w => (
                  <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.webhook_ids.includes(w.id)}
                      onChange={() => toggleWebhookId(w.id)}
                      className="accent-accent"
                    />
                    <span className="text-white text-sm">{w.name}</span>
                    <span className="text-white/30 text-xs">({w.format})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name.trim() || form.webhook_ids.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              {saving ? '...' : editId ? t('pages:scheduledReport.edit') : t('pages:scheduledReport.create')}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2 text-white/50 text-sm hover:text-white/80"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Schedule List */}
      {loading ? (
        <div className="text-white/40 text-sm">{t('loading')}</div>
      ) : schedules.length === 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-xl p-8 text-center text-white/40 text-sm">
          {t('pages:scheduledReport.description')}
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <div
              key={schedule.id}
              className="bg-surface border border-white/[0.06] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(schedule)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      schedule.active ? 'bg-accent' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      schedule.active ? 'left-[18px]' : 'left-0.5'
                    }`} />
                  </button>
                  <span className="text-white font-medium text-sm">{schedule.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    schedule.active ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/40'
                  }`}>
                    {schedule.active ? t('pages:scheduledReport.active') : t('pages:scheduledReport.inactive')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-1.5 text-white/40 hover:text-white/80 rounded"
                  >
                    <Clock size={14} />
                  </button>
                  {deleteConfirmId === schedule.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="p-1.5 text-red-400 hover:text-red-300"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1.5 text-white/40 hover:text-white/80"
                      >
                        <AlertCircle size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(schedule.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-white/50">
                <span>{t(`pages:scheduledReport.${schedule.frequency}`)}</span>
                {schedule.frequency === 'weekly' && schedule.day_of_week !== null && (
                  <span>{DAYS_OF_WEEK[schedule.day_of_week]}</span>
                )}
                {schedule.frequency === 'monthly' && schedule.day_of_month !== null && (
                  <span>{schedule.day_of_month}th</span>
                )}
                <span>{`${schedule.hour_utc.toString().padStart(2, '0')}:00 UTC (${localTimeFromUtc(schedule.hour_utc)})`}</span>
                <span>
                  {t('pages:scheduledReport.lastRun')}:{' '}
                  {schedule.last_run_at
                    ? new Date(schedule.last_run_at).toLocaleString()
                    : t('pages:scheduledReport.neverRun')}
                </span>
              </div>

              {schedule.webhook_ids.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {schedule.webhook_ids.map(wid => {
                    const w = webhooks.find(wh => wh.id === wid);
                    return w ? (
                      <span key={wid} className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">
                        {w.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
