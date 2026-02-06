import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Info, AlertTriangle, TrendingUp, Users, Zap, CreditCard } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import { useAIInsights } from '../hooks/useAIInsights';
import { formatNum, formatPct, formatCurrency } from '../lib/formatters';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { aiSummary, aiLoading, generateSummary } = useAIInsights();
  const { processedData, funnelResults, retentionResults, insights, subscriptionKPIs, detectedType, dataQualityReport } = state;

  const hasData = processedData.length > 0;

  // KPIs
  const uniqueUsers = dataQualityReport?.uniqueUsers || 0;
  const totalEvents = processedData.length;

  // Build funnel chart data
  const funnelChartData = funnelResults
    ? funnelResults.map(s => ({ name: s.step, value: s.users }))
    : [];

  const overallConversion = funnelResults && funnelResults.length > 1
    ? ((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100)
    : null;

  // Build retention curve data
  const retentionCurveData = retentionResults && retentionResults.length > 0
    ? (() => {
        const dayKeys = Object.keys(retentionResults[0].days).sort((a, b) => {
          const numA = parseInt(a.replace('D', ''));
          const numB = parseInt(b.replace('D', ''));
          return numA - numB;
        });
        return dayKeys.map(day => {
          const avg = retentionResults.reduce((sum, r) => sum + (r.days[day] || 0), 0) / retentionResults.length;
          return { name: day, value: parseFloat(avg.toFixed(1)) };
        });
      })()
    : [];

  // KPI cards
  const kpiCards = subscriptionKPIs
    ? [
        { label: 'Total Users', value: formatNum(subscriptionKPIs.users_total), change: detectedType === 'subscription' ? 'Subscription' : 'E-commerce', positive: true },
        { label: 'Paid Users', value: formatNum(subscriptionKPIs.paid_user_count), change: formatPct(subscriptionKPIs.users_total > 0 ? (subscriptionKPIs.paid_user_count / subscriptionKPIs.users_total) * 100 : 0), positive: true },
        { label: 'Churn Rate', value: formatPct(subscriptionKPIs.cancel_rate_paid), change: `${subscriptionKPIs.cancel_events} events`, positive: subscriptionKPIs.cancel_rate_paid < 10 },
        { label: 'Revenue', value: formatCurrency(subscriptionKPIs.gross_revenue), change: `ARPPU: ${formatCurrency(subscriptionKPIs.arppu)}`, positive: true },
      ]
    : [
        { label: 'Unique Users', value: formatNum(uniqueUsers), change: hasData ? 'Active' : 'No data', positive: hasData },
        { label: 'Total Events', value: formatNum(totalEvents), change: hasData ? `${state.uniqueEvents.length} types` : 'No data', positive: hasData },
        { label: 'Conversion', value: overallConversion != null ? overallConversion.toFixed(1) + '%' : 'N/A', change: funnelResults ? `${funnelResults.length} steps` : 'Not calculated', positive: overallConversion != null && overallConversion > 20 },
        { label: 'Data Type', value: detectedType === 'ecommerce' ? 'E-commerce' : detectedType === 'subscription' ? 'Subscription' : 'N/A', change: hasData ? 'Detected' : 'Upload data', positive: detectedType !== null },
      ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className={`bg-surface border border-white/5 rounded-2xl p-6 hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-200 animate-fade-up delay-${(i + 1) * 100}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-slate-400 text-sm font-medium">{kpi.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${kpi.positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Funnel Section */}
      {funnelChartData.length > 0 ? (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Funnel Drop-off Analysis
                <Info size={16} className="text-slate-500 cursor-help" />
              </h3>
              <p className="text-slate-400 text-sm">{funnelResults?.length || 0}-step funnel analysis</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{overallConversion?.toFixed(1)}%</div>
              <div className="text-emerald-500 text-sm font-medium">Overall Conversion</div>
            </div>
          </div>

          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelChartData} barSize={60}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  formatter={(value: number) => [value.toLocaleString(), 'Users']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(99, 102, 241, ${1 - (index * 0.15)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
      ) : (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
          <Zap size={32} className="text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">{hasData ? 'Calculate a funnel in the Editor tab to see results here.' : 'Upload data to get started.'}</p>
        </div>
      )}

      {/* AI Summary Card */}
      {hasData && (
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 text-primary flex items-center justify-center">
                <Zap size={16} />
              </div>
              <h3 className="font-bold text-white">AI Quick Summary</h3>
            </div>
            <div className="flex items-center gap-2">
              {!aiSummary && (
                <button
                  onClick={generateSummary}
                  disabled={aiLoading}
                  className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all disabled:opacity-50"
                >
                  {aiLoading ? 'Analyzing...' : 'Generate'}
                </button>
              )}
              <button
                onClick={() => navigate('/app/insights')}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                View All Insights
              </button>
            </div>
          </div>
          {aiLoading && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Analyzing...</span>
            </div>
          )}
          {aiSummary && !aiLoading && (
            <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">{aiSummary}</p>
          )}
          {!aiSummary && !aiLoading && (
            <p className="text-slate-500 text-sm">Generate an AI-powered summary of your analytics data.</p>
          )}
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Insights */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Recent Insights</h3>
            <span className="text-xs text-slate-500">{insights.length} total</span>
          </div>
          <div className="space-y-4">
            {insights.length === 0 ? (
              <p className="text-slate-500 text-sm">No insights yet. Process data to generate insights.</p>
            ) : (
              insights.slice(0, 4).map((insight, i) => {
                const colors: Record<string, { text: string; bg: string }> = {
                  danger: { text: 'text-red-500', bg: 'bg-red-500/10' },
                  warning: { text: 'text-orange-500', bg: 'bg-orange-500/10' },
                  success: { text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  info: { text: 'text-blue-500', bg: 'bg-blue-500/10' },
                };
                const c = colors[insight.type] || colors.info;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                      <span className="text-sm">{insight.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{insight.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{insight.body}</p>
                    </div>
                    {insight.metric && (
                      <span className="text-xs text-primary font-bold shrink-0">{insight.metric}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* User Retention Chart */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Retention Curve</h3>
          </div>
          {retentionCurveData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={retentionCurveData}>
                  <defs>
                    <linearGradient id="colorValueDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Retention']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValueDash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-500 text-sm">{hasData ? 'Calculate retention to see the curve.' : 'Upload data to get started.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
