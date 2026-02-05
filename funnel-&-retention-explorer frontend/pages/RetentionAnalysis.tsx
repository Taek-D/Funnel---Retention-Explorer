import React from 'react';
import { Calendar, Download, Plus, TrendingUp, TrendingDown, MoreHorizontal } from '../components/Icons';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const cohortData = [
  { date: 'Nov 01', size: 1240, rates: [100, 65, 50, 45, 40, 38, 35, 30, 20] },
  { date: 'Nov 02', size: 1100, rates: [100, 62, 48, 42, 38, 35, 32, 28, 18] },
  { date: 'Nov 03', size: 1350, rates: [100, 68, 52, 48, 45, 42, 40, 35, 22] },
  { date: 'Nov 04', size: 980, rates: [100, 60, 45, 40, 35, 32, 30, 25, 15] },
  { date: 'Nov 05', size: 1050, rates: [100, 64, 49, 44, 39, 36, 33, 29, 19] },
  { date: 'Nov 06', size: 1120, rates: [100, 66, 51, 46, 42, 39, 36, 32, 21] },
];

const curveData = [
  { day: 0, value: 100 },
  { day: 2, value: 65 },
  { day: 4, value: 50 },
  { day: 7, value: 35 },
  { day: 10, value: 28 },
  { day: 14, value: 20 },
];

export const RetentionAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Cohort Analysis
          </div>
          <h1 className="text-3xl font-bold text-white">Retention Analysis</h1>
          <p className="text-slate-400 text-sm max-w-xl mt-1">
            Analyze user engagement over time via cohort heatmaps. Track how effectively you are retaining customers across different time periods.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-lg shadow-primary/25 transition-colors">
            <Plus size={16} /> New Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Day 1 Retention', value: '42%', change: '2.4%', icon: Calendar, trend: 'up', color: 'text-primary' },
          { title: 'Day 7 Retention', value: '28%', change: '0.5%', icon: Calendar, trend: 'up', color: 'text-blue-400' },
          { title: 'Day 14 Retention', value: '15%', change: '1.2%', icon: Calendar, trend: 'down', color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-6 relative group overflow-hidden">
             <div className={`absolute -right-6 -top-6 w-32 h-32 ${i===0 ? 'bg-primary/20' : i===1 ? 'bg-blue-500/20' : 'bg-orange-500/20'} blur-[50px] rounded-full`}></div>
             <div className="flex justify-between items-start relative z-10">
               <div>
                 <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                 <div className="flex items-baseline gap-3">
                   <h3 className="text-4xl font-bold text-white">{stat.value}</h3>
                   <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${stat.trend === 'up' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                     {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {stat.change}
                   </span>
                 </div>
               </div>
               <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                 <stat.icon size={24} />
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-surface/50 border border-white/5 p-2 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center rounded-full bg-black/20 p-1">
             <button className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/5 text-sm text-slate-300 transition-colors">
               <span className="text-slate-500 text-[10px] font-bold uppercase">Start</span> Sign Up
             </button>
             <div className="w-px h-4 bg-white/10 mx-1"></div>
             <button className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/5 text-sm text-slate-300 transition-colors">
               <span className="text-slate-500 text-[10px] font-bold uppercase">Return</span> Login
             </button>
        </div>
      </div>

      {/* Cohort Table */}
      <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/5">
            <tr>
              <th className="px-6 py-4 min-w-[140px] sticky left-0 bg-[#151a2d]">Cohort Date</th>
              <th className="px-4 py-4 text-center">Size</th>
              {[0, 1, 2, 3, 4, 5, 6, 7, 14].map(day => (
                <th key={day} className="px-2 py-4 text-center min-w-[60px]">Day {day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cohortData.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-3 font-medium text-white sticky left-0 bg-[#151a2d] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">{row.date}</td>
                <td className="px-4 py-3 text-center text-slate-400">{row.size.toLocaleString()}</td>
                {row.rates.map((rate, rIdx) => {
                  const opacity = rate / 100;
                  const bg = `rgba(99, 102, 241, ${opacity})`;
                  return (
                    <td key={rIdx} className="px-2 py-2 text-center">
                      <div 
                        className="rounded py-1.5 text-xs font-medium w-full border border-white/5 text-white"
                        style={{ backgroundColor: bg, color: rate > 50 ? 'white' : 'rgba(255,255,255,0.7)' }}
                      >
                        {rate}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Curve Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp size={20} /></div>
             <div>
               <h3 className="text-lg font-bold text-white">Average Retention Curve</h3>
               <p className="text-xs text-slate-400">Aggregated retention rate across all selected cohorts</p>
             </div>
           </div>
           <button className="text-slate-400 hover:text-white"><MoreHorizontal size={20} /></button>
        </div>
        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={curveData}>
               <defs>
                 <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#curveGradient)" />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};