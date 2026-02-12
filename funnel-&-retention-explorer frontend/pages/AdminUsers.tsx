import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowLeft, ArrowRight } from '../components/Icons';
import { AdminNav } from '../components/AdminNav';
import { UserDetailModal } from '../components/UserDetailModal';
import { fetchAdminUsers } from '../lib/adminApi';
import type { AdminUser } from '../lib/adminApi';

export function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsers(page, search || undefined, planFilter || undefined);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '-';

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/10 text-green-400',
      cancelled: 'bg-red-500/10 text-red-400',
      past_due: 'bg-amber-500/10 text-amber-400',
      none: 'bg-slate-500/10 text-slate-400',
    };
    return styles[status] || styles.none;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AdminNav />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchEmail')}
            className="w-full bg-surface border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">{t('admin.allPlans')}</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="team">Team</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs text-slate-400 uppercase">
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">{t('admin.plan')}</th>
              <th className="text-left px-4 py-3">{t('admin.status')}</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">{t('admin.joined')}</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">{t('admin.lastLogin')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.03]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-white/[0.06] rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('admin.noData')}</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white truncate max-w-[200px]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.plan === 'pro' ? 'bg-accent/10 text-accent' :
                      user.plan === 'team' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(user.subscription_status)}`}>
                      {user.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{formatDate(user.last_sign_in_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-slate-500">
          {t('admin.page', { page })}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs bg-surface border border-white/[0.06] rounded-lg text-slate-300 hover:bg-white/[0.03] disabled:opacity-30 transition-colors"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={users.length < 20}
            className="px-3 py-1.5 text-xs bg-surface border border-white/[0.06] rounded-lg text-slate-300 hover:bg-white/[0.03] disabled:opacity-30 transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
}
