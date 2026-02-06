import React from 'react';
import { Users, Zap, ArrowRight, TrendingUp, TrendingDown } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFunnelAnalysis } from '../hooks/useFunnelAnalysis';
import { formatTime } from '../lib/formatters';

export const FunnelAnalysis: React.FC = () => {
  const { funnelResults, hasData, detectedType } = useFunnelAnalysis();

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
        <p className="text-slate-400">Upload a CSV file in the Data Import tab to begin funnel analysis.</p>
      </div>
    );
  }

  if (!funnelResults || funnelResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Configure Funnel Steps</h2>
        <p className="text-slate-400">Go to the Funnel Editor tab to set up and calculate your funnel.</p>
      </div>
    );
  }

  const overallConversion = funnelResults.length > 1
    ? ((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100)
    : 100;

  const chartData = funnelResults.map(s => ({
    name: s.step,
    value: s.users,
    rate: s.conversionRate
  }));

  const totalUsers = funnelResults[0]?.users || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Funnel Analysis</h1>
          <p className="text-slate-400 text-sm mt-1">
            {detectedType === 'ecommerce' ? 'E-commerce' : detectedType === 'subscription' ? 'Subscription' : 'Custom'} funnel visualization and drop-off analysis.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entry', value: totalUsers.toLocaleString(), icon: Users },
          { label: 'Overall Conversion', value: overallConversion.toFixed(1) + '%', icon: TrendingUp },
          { label: 'Final Step Users', value: funnelResults[funnelResults.length - 1].users.toLocaleString(), icon: Users },
          { label: 'Steps', value: String(funnelResults.length), icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-white/[0.06] rounded-lg p-5 flex flex-col gap-1 hover:border-accent/20 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <div className="p-1.5 rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <stat.icon size={18} />
              </div>
            </div>
            <h3 className="text-2xl font-bold font-mono text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Funnel Chart */}
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Conversion Funnel</h3>
              <p className="text-sm text-slate-400">User journey step by step</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-white">{overallConversion.toFixed(1)}%</div>
              <div className="text-accent text-sm font-medium">Overall Conversion</div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={60}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1f28', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '6px' }}
                  formatter={(value: number) => [value.toLocaleString(), 'Users']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(0, 212, 170, ${1 - (index * 0.15)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step Details Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-white/[0.06] rounded-lg flex-1 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">Step Details</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Step</th>
                    <th className="px-4 py-3 text-right">Users</th>
                    <th className="px-4 py-3 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {funnelResults.map((step, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">{step.stepNumber}</span>
                          <span className="font-medium text-white text-xs">{step.step}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium font-mono">{step.users.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono ${step.conversionRate >= 50 ? 'text-accent' : step.conversionRate >= 25 ? 'text-amber-400' : 'text-coral'}`}>
                          {step.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Median Time */}
          {funnelResults.some(s => s.medianTime) && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Median Time Between Steps</h3>
              <div className="space-y-2">
                {funnelResults.slice(1).map((step, i) => (
                  step.medianTime ? (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{funnelResults[i].step} <ArrowRight size={10} className="inline" /> {step.step}</span>
                      <span className="text-white font-medium font-mono">{formatTime(step.medianTime)}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
