import React from 'react';
import { Calendar, Download, Users, Zap, CreditCard, ArrowRight, TrendingUp, TrendingDown } from '../components/Icons';

export const FunnelAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Funnel Analysis</h1>
          <p className="text-slate-400 text-sm mt-1">Comprehensive funnel visualization and drop-off analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-colors">
            <Calendar size={16} /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors', value: '125,430', change: '12%', icon: Users, color: 'text-primary' },
          { label: 'Sign-up Rate', value: '45.2%', change: '5%', icon: Users, color: 'text-primary' },
          { label: 'Activation Rate', value: '32.1%', change: '2%', icon: Zap, color: 'text-primary', trend: 'down' },
          { label: 'Revenue / User', value: '$12.50', change: '8%', icon: CreditCard, color: 'text-primary' },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-xl flex flex-col gap-1 hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <div className="p-1.5 rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <stat.icon size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <span className={`text-xs font-medium flex items-center ${stat.trend === 'down' ? 'text-orange-400' : 'text-emerald-400'}`}>
                {stat.trend === 'down' ? <TrendingDown size={14} /> : <TrendingUp size={14} />} {stat.change}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">vs. previous period</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Funnel Chart Area */}
        <div className="glass rounded-xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Conversion Funnel</h3>
              <p className="text-sm text-slate-400">User journey from visit to purchase</p>
            </div>
            <button className="text-primary hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
               View Details <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex-1 flex items-end justify-between px-4 pb-4 gap-4 min-h-[320px] relative">
             {/* Background Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20 px-4">
                {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-slate-500 border-t border-dashed border-slate-400"></div>)}
             </div>

             {[
               { name: 'Visit', val: '125k', pct: '100%', h: '100%' },
               { name: 'Sign Up', val: '56.6k', pct: '45%', h: '60%' },
               { name: 'Activation', val: '40.2k', pct: '71%', h: '45%' },
               { name: 'Revenue', val: '30.7k', pct: '76%', h: '35%' },
             ].map((step, idx) => (
               <div key={idx} className="flex flex-col items-center gap-3 w-full group relative z-10">
                 <div className="w-full max-w-[120px] bg-gradient-to-t from-primary/80 to-primary/20 rounded-t-lg relative group-hover:from-primary group-hover:to-primary/40 transition-all duration-300" style={{ height: step.h }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       {idx === 0 ? 'Start' : 'Conv.'}
                    </div>
                 </div>
                 <div className="text-center">
                   <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">{step.name}</span>
                   <span className="text-white font-bold text-sm">{step.val}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Sidebar stats */}
        <div className="flex flex-col gap-4">
          <div className="glass rounded-xl p-6 flex flex-col gap-4 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Zap className="text-primary" size={24} />
              <h3 className="text-lg font-semibold text-white">AI Insight</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
               Significant drop-off detected between <strong>Sign Up</strong> and <strong>Activation</strong> steps for mobile users. Consider optimizing the onboarding flow for smaller screens.
            </p>
            <button className="text-xs font-bold uppercase tracking-wider text-primary hover:text-white self-start transition-colors mt-2">
               Investigate Segment
            </button>
          </div>

          <div className="glass rounded-xl flex-1 flex flex-col overflow-hidden">
             <div className="p-5 border-b border-white/5">
               <h3 className="text-base font-semibold text-white">Top Channels</h3>
             </div>
             <div className="flex-1 overflow-auto">
               <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-300">
                   <tr>
                     <th className="px-5 py-3">Channel</th>
                     <th className="px-5 py-3 text-right">Conv.</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {[
                     { name: 'Organic', val: '4.2%', color: 'text-emerald-400' },
                     { name: 'Direct', val: '3.8%', color: 'text-emerald-400' },
                     { name: 'Social Ads', val: '2.1%', color: 'text-orange-400' },
                     { name: 'Referral', val: '5.5%', color: 'text-emerald-400' }
                   ].map((row, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors">
                       <td className="px-5 py-3 font-medium text-white">{row.name}</td>
                       <td className={`px-5 py-3 text-right ${row.color}`}>{row.val}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};