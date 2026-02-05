import React from 'react';
import { Zap, AlertTriangle, TrendingUp, CreditCard, Users, ArrowRight } from '../components/Icons';

export const Insights: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-black text-white">AI Insights</h1>
        <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Beta</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', val: '12,450', change: '+5.2%', good: true, icon: Users },
          { label: 'Revenue (MRR)', val: '$48,200', change: '+12%', good: true, icon: CreditCard },
          { label: 'Churn Rate', val: '2.1%', change: '0.5%', good: true, icon: TrendingUp, downIsGood: true },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex flex-col gap-3">
             <div className="flex justify-between">
               <span className="text-slate-400 text-xs font-bold uppercase">{stat.label}</span>
               <div className="p-2 bg-white/5 rounded-lg text-slate-400"><stat.icon size={20} /></div>
             </div>
             <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-white">{stat.val}</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-bold border border-emerald-500/10">{stat.change}</span>
             </div>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-4"><Zap size={24} className="text-primary" /> Latest Intelligence</h3>

      {/* Critical Alert */}
      <div className="glass p-6 rounded-2xl border-l-[6px] border-l-red-500 flex flex-col lg:flex-row gap-6">
         <div className="hidden sm:flex flex-col items-center pt-1">
            <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 ring-1 ring-red-500/20">
               <AlertTriangle size={24} />
            </div>
         </div>
         <div className="flex-1 flex flex-col gap-5">
            <div className="flex items-center gap-3">
               <h4 className="text-lg font-bold text-white">Unexpected Churn Spike</h4>
               <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-500/10 text-red-400 border border-red-500/20">Critical</span>
            </div>
            <div className="flex gap-6 p-5 rounded-xl bg-black/20 border border-white/5">
               <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Spike Magnitude</span>
                  <span className="text-2xl font-black text-white">15% <span className="text-xs font-medium text-slate-500">vs last week</span></span>
               </div>
               <div className="w-px bg-white/10"></div>
               <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Revenue at Risk</span>
                  <span className="text-2xl font-black text-white">~$2,400 <span className="text-sm font-medium text-slate-500">MRR</span></span>
               </div>
            </div>
            <p className="text-slate-300 text-sm">Churn rate spiked by 15% last week across all user bases, likely due to recent pricing changes or service outages.</p>
            <div className="flex gap-3">
               <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">Apply Fix</button>
               <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">Details</button>
            </div>
         </div>
      </div>

      {/* Info Insight */}
      <div className="glass p-6 rounded-2xl border-l-[6px] border-l-blue-500 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-3">
             <div className="flex items-center gap-3">
               <h4 className="text-lg font-bold text-white">Viral Growth Detected</h4>
               <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">Info</span>
             </div>
             <p className="text-slate-300 text-sm pl-4 border-l-2 border-primary/20">
               <span className="font-bold text-primary">Insight:</span> Surge in new referral traffic detected from Twitter. Suggest expanding viral campaign.
             </p>
          </div>
          <button className="text-primary hover:text-white text-sm font-bold flex items-center gap-1 self-center">View Source <ArrowRight size={16} /></button>
      </div>
    </div>
  );
};