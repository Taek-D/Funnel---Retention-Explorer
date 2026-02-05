import React from 'react';
import { Smartphone, Monitor, AlertTriangle, ChevronDown } from '../components/Icons';

export const SegmentComparison: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Segment Comparison</h1>
        <p className="text-slate-400 text-lg">Deep dive into performance differences across user segments.</p>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex flex-wrap items-end gap-5">
           <div className="flex flex-col flex-1 min-w-[240px]">
             <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Comparison Dimension</label>
             <div className="relative">
               <select className="w-full appearance-none rounded-lg bg-black/20 border border-white/10 text-white py-2.5 px-4 pr-10">
                 <option>Platform (OS)</option>
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500"><ChevronDown size={16} /></div>
             </div>
           </div>
           <button className="h-[42px] px-6 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary/20">Compare Segments</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-lg">
            <h3 className="text-white font-bold text-lg mb-6">Conversion Rate by Segment</h3>
            <div className="space-y-6">
              {[
                { label: 'Mobile (iOS)', icon: Smartphone, val: '12.5%', pct: 65, color: 'bg-gradient-to-r from-primary to-purple-500' },
                { label: 'Desktop (Web)', icon: Monitor, val: '8.2%', pct: 42, color: 'bg-slate-600' },
                { label: 'Mobile (Android)', icon: Smartphone, val: '6.8%', pct: 35, color: 'bg-slate-600' },
              ].map((item, i) => (
                <div key={i} className="group">
                   <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300 font-medium flex items-center gap-2">
                         <item.icon size={18} className="text-slate-400" /> {item.label}
                      </span>
                      <span className="text-white font-bold">{item.val}</span>
                   </div>
                   <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{width: `${item.pct}%`}}></div>
                   </div>
                </div>
              ))}
              
              <div className="group opacity-70">
                 <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                       <AlertTriangle size={18} className="text-slate-400" /> Unknown Source <AlertTriangle size={14} className="text-amber-500" />
                    </span>
                    <span className="text-white font-bold">2.1%</span>
                 </div>
                 <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500/50" style={{width: '10%'}}></div>
                 </div>
              </div>
            </div>
         </div>

         <div className="glass rounded-2xl p-1 shadow-lg flex flex-col relative overflow-hidden">
            <div className="flex-1 bg-surface/50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
               <h3 className="text-white font-bold text-lg mb-6">Top Performer</h3>
               <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 border border-emerald-500/20 flex items-center justify-center mb-6">
                 <span className="text-4xl">🏆</span>
               </div>
               <p className="text-slate-400 text-sm font-medium mb-2 uppercase">Highest Conversion</p>
               <h2 className="text-3xl font-bold text-white mb-2">iOS Mobile</h2>
               <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20">
                  +4.3% vs Avg
               </span>
            </div>
         </div>
      </div>
    </div>
  );
};