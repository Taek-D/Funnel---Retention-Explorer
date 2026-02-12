import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2 } from './Icons';
import { fetchAdminUserDetail, updateAdminUser } from '../lib/adminApi';
import type { AdminUserDetail } from '../lib/adminApi';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAdminUserDetail(userId);
        setDetail(data);
        setPlan((data.profile?.plan as string) || 'free');
        setRole((data.profile?.role as string) || 'user');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateAdminUser(userId, { plan, role });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString() : '-';
  const formatAmount = (a: unknown) => typeof a === 'number' ? `₩${a.toLocaleString()}` : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-elevated border border-white/[0.06] rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-white truncate">
            {detail?.user.email || t('admin.userDetail')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          ) : detail ? (
            <>
              {/* Profile */}
              <section>
                <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">{t('admin.profile')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.plan')}</label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="team">Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.role')}</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">{t('admin.status')}</span>
                    <p className="text-sm text-white">{(detail.profile?.subscription_status as string) || 'none'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">{t('admin.joined')}</span>
                    <p className="text-sm text-white">{formatDate(detail.user.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">{t('admin.lastLogin')}</span>
                    <p className="text-sm text-white">{formatDate(detail.user.last_sign_in_at)}</p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-3 px-4 py-1.5 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : t('admin.save')}
                </button>
              </section>

              {/* Billing History */}
              {detail.billing.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
                    {t('admin.billingHistory')}
                  </h3>
                  <div className="space-y-1">
                    {detail.billing.map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.03]">
                        <span className="text-slate-400">{formatDate(b.created_at as string)}</span>
                        <span className="text-white">{formatAmount(b.amount)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          b.status === 'success' ? 'bg-green-500/10 text-green-400' :
                          b.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {b.status as string}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects */}
              {detail.projects.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
                    {t('admin.projects')} ({detail.projects.length})
                  </h3>
                  <div className="space-y-1">
                    {detail.projects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.03]">
                        <span className="text-white">{p.name}</span>
                        <span className="text-slate-500">{formatDate(p.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
