import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ArrowRight } from '../components/Icons';
import { AdminNav } from '../components/AdminNav';
import { fetchAdminBilling, fetchAdminRevenue } from '../lib/adminApi';
import type { AdminBillingRecord, RevenueData } from '../lib/adminApi';
import { CHART_COLORS } from '../lib/constants';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `₩${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₩${(value / 1_000).toFixed(0)}K`;
  return `₩${value}`;
}

export function AdminBilling() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<AdminBillingRecord[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [billingData, revenueData] = await Promise.all([
        fetchAdminBilling(page, statusFilter || undefined),
        fetchAdminRevenue(),
      ]);
      setRecords(billingData.records);
      setRevenue(revenueData.revenue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: 'bg-green-500/10 text-green-400',
      failed: 'bg-red-500/10 text-red-400',
      refunded: 'bg-amber-500/10 text-amber-400',
    };
    return styles[status] || 'bg-slate-500/10 text-slate-400';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AdminNav />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">{t('admin.monthlyRevenue')}</h3>
        {loading ? (
          <div className="h-48 animate-pulse bg-white/[0.03] rounded" />
        ) : revenue.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">{t('admin.noData')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={revenue}>
              <XAxis dataKey="month" tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }} />
              <YAxis tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ background: CHART_COLORS.tooltipBg, border: `1px solid ${CHART_COLORS.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), t('admin.billing')]}
              />
              <Bar dataKey="revenue" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">{t('admin.allStatus')}</option>
          <option value="success">{t('billing.success')}</option>
          <option value="failed">{t('billing.failed')}</option>
          <option value="refunded">{t('billing.refunded')}</option>
        </select>
      </div>

      {/* Billing Table */}
      <div className="bg-surface border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs text-slate-400 uppercase">
              <th className="text-left px-4 py-3">{t('billing.date')}</th>
              <th className="text-left px-4 py-3">User ID</th>
              <th className="text-right px-4 py-3">{t('billing.amount')}</th>
              <th className="text-left px-4 py-3">{t('billing.status')}</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">{t('billing.orderId')}</th>
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
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('admin.noData')}</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-300">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-[120px] font-mono text-xs">{r.user_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-white text-right">₩{r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden sm:table-cell truncate max-w-[150px]">{r.order_id}</td>
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
            disabled={records.length < 20}
            className="px-3 py-1.5 text-xs bg-surface border border-white/[0.06] rounded-lg text-slate-300 hover:bg-white/[0.03] disabled:opacity-30 transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
