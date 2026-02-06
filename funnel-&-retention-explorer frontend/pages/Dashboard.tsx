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
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Signups', value: '1,240', change: '+12%', positive: true },
          { label: 'Active Users', value: '4,203', change: '-1.5%', positive: false },
          { label: 'Churn Rate', value: '2.1%', change: '-0.4%', positive: true },
          { label: 'Revenue', value: '$45.2k', change: '+8%', positive: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-2">
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
      <div className="bg-surface border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Funnel Drop-off Analysis
              <Info size={16} className="text-slate-500 cursor-help" />
            </h3>
            <p className="text-slate-400 text-sm">Conversion tracking from Signup to Purchase</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">45.2%</div>
            <div className="text-emerald-500 text-sm font-medium">Overall Conversion</div>
          </div>
        </div>

        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} barSize={60}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`rgba(99, 102, 241, ${1 - (index * 0.15)})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Recent Alerts</h3>
            <button className="text-xs text-primary font-medium hover:text-primary/80">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Checkout Drop-off Spike', desc: 'Rate increased by 5% in last hour', time: '2m ago', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
              { title: 'Goal Reached: 1k Signups', desc: 'Weekly target achieved', time: '1h ago', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { title: 'New Enterprise User', desc: 'Acme Corp signed up', time: '3h ago', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className={`p-2 rounded-lg ${alert.bg} ${alert.color}`}>
                  <alert.icon size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white group-hover:text-primary transition-colors">{alert.title}</h4>
                  <p className="text-xs text-slate-400">{alert.desc}</p>
                </div>
                <span className="text-xs text-slate-500">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Retention Chart */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">User Retention</h3>
            <button className="text-slate-400 hover:text-white"><MoreHorizontal size={20} /></button>
          </div>
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retentionData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-xs text-slate-400">This Week</span>
          </div>
        </div>
      </div>
    </div>
  );
};