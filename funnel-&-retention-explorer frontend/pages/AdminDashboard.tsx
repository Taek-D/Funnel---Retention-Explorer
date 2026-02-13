import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, CreditCard, TrendingUp, UserPlus } from '../components/Icons';
import { AdminNav } from '../components/AdminNav';
import { fetchAdminStats, fetchAdminRevenue } from '../lib/adminApi';
import type { AdminStats, RevenueData } from '../lib/adminApi';
import { CHART_COLORS } from '../lib/constants';

const PIE_COLORS = ['#64748b', '#00d4aa', '#f59e0b'];

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `₩${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₩${(value / 1_000).toFixed(0)}K`;
  return `₩${value}`;
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsData, revenueData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminRevenue(),
        ]);
        setStats(statsData);
        setRevenue(revenueData.revenue);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpiCards = [
    { label: t('admin.totalUsers'), value: stats?.totalUsers ?? '-', icon: Users, color: 'text-blue-400' },
    { label: t('admin.proUsers'), value: stats?.proUsers ?? '-', icon: TrendingUp, color: 'text-accent' },
    { label: t('admin.mrr'), value: stats ? formatCurrency(stats.mrr) : '-', icon: CreditCard, color: 'text-amber-400' },
    { label: t('admin.todaySignups'), value: stats?.todaySignups ?? '-', icon: UserPlus, color: 'text-purple-400' },
  ];

  const planPieData = stats ? [
    { name: 'Free', value: Math.max(0, (stats.totalUsers ?? 0) - (stats.proUsers ?? 0)) },
    { name: 'Pro', value: stats.proUsers ?? 0 },
  ] : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <AdminNav />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-surface border border-white/[0.06] rounded-xl p-4">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-white/[0.06] rounded w-20" />
                <div className="h-8 bg-white/[0.06] rounded w-16" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <card.icon size={16} className={card.color} />
                  <span className="text-xs text-slate-400">{card.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{card.value}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">{t('admin.monthlyRevenue')}</h3>
          {loading ? (
            <div className="h-64 animate-pulse bg-white/[0.03] rounded" />
          ) : revenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">{t('admin.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
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

        {/* Plan Distribution */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-4">{t('admin.planDistribution')}</h3>
          {loading ? (
            <div className="h-64 animate-pulse bg-white/[0.03] rounded" />
          ) : planPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">{t('admin.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={planPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {planPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.axisText }} />
                <Tooltip
                  contentStyle={{ background: CHART_COLORS.tooltipBg, border: `1px solid ${CHART_COLORS.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
