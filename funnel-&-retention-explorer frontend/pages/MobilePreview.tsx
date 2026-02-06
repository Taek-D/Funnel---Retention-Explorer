import React from 'react';
import { Users, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowRight, Home, Filter, PieChart, FileText, Settings } from '../components/Icons';

export const MobilePreview: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8">
      <div className="relative w-[390px] h-[844px] bg-[#0c0f14] rounded-[40px] shadow-2xl border-[8px] border-gray-800 overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-12 w-full flex items-center justify-between px-6 pt-2 shrink-0 z-20 bg-[#0c0f14]/95 backdrop-blur">
          <span className="text-white text-xs font-semibold">9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-full bg-white/20"></div>
            <div className="w-4 h-4 rounded-full bg-white/20"></div>
          </div>
        </div>

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3 bg-[#0c0f14]/95 sticky top-0 z-10 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-white text-lg font-bold">Retention</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24 bg-[#0c0f14] p-4 space-y-4 scrollbar-hide">
          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-[#14181f] p-4 rounded-lg">
               <div className="flex justify-between items-start mb-1">
                 <span className="text-gray-400 text-xs">Total Users</span>
                 <Users size={16} className="text-accent" />
               </div>
               <p className="text-white text-2xl font-bold font-mono">12.5k</p>
               <span className="text-accent text-xs font-medium flex items-center gap-1"><TrendingUp size={12}/> +5%</span>
             </div>
             <div className="bg-[#14181f] p-4 rounded-lg">
               <div className="flex justify-between items-start mb-1">
                 <span className="text-gray-400 text-xs">Conversion</span>
                 <PieChart size={16} className="text-accent" />
               </div>
               <p className="text-white text-2xl font-bold font-mono">3.2%</p>
               <span className="text-coral text-xs font-medium flex items-center gap-1"><TrendingDown size={12}/> -1%</span>
             </div>
          </div>

          {/* Alert */}
          <div className="flex items-center gap-3 bg-[#14181f] p-4 rounded-lg border border-white/5">
            <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center text-coral shrink-0">
               <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="text-white text-sm font-medium truncate">Spike in churn detected</h3>
               <p className="text-gray-400 text-xs truncate">Cohort A showing unusual drop-off</p>
            </div>
            <span className="text-gray-500 text-xs whitespace-nowrap">2m ago</span>
          </div>

          {/* Chart Area */}
          <div className="bg-[#14181f] rounded-lg p-5">
             <div className="flex justify-between items-end mb-4">
                <div>
                   <h3 className="text-white text-sm font-medium">Acquisition Funnel</h3>
                   <p className="text-2xl font-bold text-white font-mono">3.2% <span className="text-gray-400 text-sm font-normal">Conv.</span></p>
                </div>
                <div className="bg-white/5 px-2 py-1 rounded text-xs text-gray-300">Last 30 days</div>
             </div>
             <div className="h-40 w-full relative pt-4">
               {/* Simple SVG Chart simulation */}
               <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                 <path d="M0,80 Q75,80 150,40 T300,20 V120 H0 Z" fill="rgba(0, 212, 170, 0.2)" />
                 <path d="M0,80 Q75,80 150,40 T300,20" fill="none" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round" />
               </svg>
             </div>
          </div>
        </main>

        {/* Bottom Nav */}
        <nav className="bg-[#14181f] border-t border-white/5 px-6 pb-8 pt-3 absolute bottom-0 w-full z-30">
           <ul className="flex justify-between items-center w-full">
             {[{icon: Home, l: 'Home', a: true}, {icon: Filter, l: 'Funnels'}, {icon: Users, l: 'Segments'}, {icon: FileText, l: 'Reports'}, {icon: Settings, l: 'Settings'}].map((item, i) => (
                <li key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                   <div className={`p-1 ${item.a ? 'text-accent bg-accent/10 rounded-full' : 'text-gray-400'}`}>
                      <item.icon size={24} />
                   </div>
                   <span className={`text-[10px] font-medium ${item.a ? 'text-accent' : 'text-gray-400'}`}>{item.l}</span>
                </li>
             ))}
           </ul>
        </nav>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-40"></div>
      </div>
    </div>
  );
};
