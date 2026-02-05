import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Info, MoreHorizontal, AlertTriangle, TrendingUp, Users } from '../components/Icons';

const retentionData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 4500 },
  { name: 'Fri', value: 6000 },
  { name: 'Sat', value: 5500 },
  { name: 'Sun', value: 7000 },
];

const funnelData = [
  { name: 'Visit', value: 100 },
  { name: 'Signup', value: 78 },
  { name: 'Cart', value: 55 },
  { name: 'Purchase', value: 45 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Signups', value: '1,240', change: '+12%', positive: true, icon: Users },
          { label: 'Active Users', value: '4,203', change: '-1.5%', positive: false, icon: TrendingUp },
          { label: 'Churn Rate', value: '2.1%', change: '-0.4%', positive: true, icon: AlertTriangle },
          { label: 'Revenue', value: '$45.2k', change: '+8%', positive: true, icon: TrendingUp },
        ].map((kpi, i) => (
          <div
            key={i}
            className="group bg-surface border border-white/5 rounded-2xl p-5 hover:bg-surface-elevated hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-md relative overflow-hidden cursor-pointer animate-scale-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <kpi.icon size={18} className="text-primary" />
                  </div>
                  <span className="text-slate-400 text-sm font-medium group-hover:text-slate-300 transition-colors">{kpi.label}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  kpi.positive
                    ? 'bg-emerald-500/15 text-emerald-400 group-hover:shadow-glow-success group-hover:scale-105'
                    : 'bg-red-500/15 text-red-400 group-hover:shadow-glow-danger group-hover:scale-105'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel Section */}
      <div className="group bg-surface border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden hover:border-white/10 transition-all duration-300">
        {/* Background Gradient Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent/10 to-transparent blur-[100px] rounded-full pointer-events-none opacity-30" />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 relative z-10 gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              Funnel Drop-off Analysis
              <div className="relative group/tooltip">
                <Info size={18} className="text-slate-500 cursor-help hover:text-primary transition-colors" />
                <div className="absolute left-0 top-full mt-2 hidden group-hover/tooltip:block z-50">
                  <div className="bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap shadow-xl">
                    Track user conversion through each funnel stage
                  </div>
                </div>
              </div>
            </h3>
            <p className="text-slate-400 text-sm">Conversion tracking from Signup to Purchase</p>
          </div>
          <div className="text-left md:text-right">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">45.2%</div>
            <div className="text-emerald-400 text-sm font-semibold flex items-center gap-1 md:justify-end mt-1">
              <TrendingUp size={14} />
              Overall Conversion
            </div>
          </div>
        </div>

        <div className="h-72 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} barSize={70} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                contentStyle={{
                  backgroundColor: '#1a2035',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                }}
                labelStyle={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '4px' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="url(#barGradient)"
                    opacity={1 - (index * 0.15)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Alerts</h3>
            <button className="text-xs text-primary font-semibold hover:text-primary-light transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Checkout Drop-off Spike', desc: 'Rate increased by 5% in last hour', time: '2m ago', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15', borderColor: 'border-red-500/30' },
              { title: 'Goal Reached: 1k Signups', desc: 'Weekly target achieved', time: '1h ago', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15', borderColor: 'border-emerald-500/30' },
              { title: 'New Enterprise User', desc: 'Acme Corp signed up', time: '3h ago', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', borderColor: 'border-blue-500/30' },
            ].map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl hover:bg-surface-elevated transition-all duration-200 cursor-pointer group border ${alert.borderColor} border-opacity-0 hover:border-opacity-100`}
              >
                <div className={`p-2.5 rounded-xl ${alert.bg} ${alert.color} group-hover:scale-110 transition-transform duration-200`}>
                  <alert.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.desc}</p>
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Retention Chart */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold text-white">User Retention</h3>
            <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="h-52 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a2035',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
                  }}
                  labelStyle={{ color: '#cbd5e1', fontWeight: 600, fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary-light shadow-glow-sm"></div>
              <span className="text-xs text-slate-400 font-medium">This Week</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">5,127</div>
              <div className="text-xs text-slate-500">Avg. Daily Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};