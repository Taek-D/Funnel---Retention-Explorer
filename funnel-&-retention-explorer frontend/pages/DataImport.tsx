import React from 'react';
import { UploadCloud, CheckCircle, FileText, ChevronDown, Zap, ArrowRight, RefreshCw, Smartphone, Monitor } from '../components/Icons';

export const DataImport: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between pb-2 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-white text-3xl font-bold tracking-tight mb-2">Data Upload</h1>
          <p className="text-slate-400 text-sm">Upload and map your data for retention analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-surface hover:bg-white/5 text-white text-sm font-medium transition-all flex items-center gap-2 border border-white/10">
            History
          </button>
          <button className="px-4 py-2 rounded-lg bg-surface hover:bg-white/5 text-white text-sm font-medium transition-all flex items-center gap-2 border border-white/10">
             Guide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass rounded-2xl p-8 flex flex-col gap-8 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">File Upload</h2>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 tracking-wide uppercase">Step 2/3</span>
            </div>

            <div className="relative w-full rounded-xl border-2 border-dashed border-primary bg-primary/5 p-10 flex flex-col items-center justify-center gap-4 transition-all hover:bg-primary/10 cursor-pointer">
              <div className="absolute top-4 left-4 text-green-400 flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                <CheckCircle size={14} /> <span className="text-xs font-bold">Verified</span>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-2">
                <UploadCloud size={36} />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Q3_Retention_Data.csv</p>
                <p className="text-slate-400 text-sm mt-1">12.5 MB • Ready for mapping</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="text-white font-medium flex items-center gap-2">
                   <RefreshCw size={14} className="animate-spin text-primary" /> Processing Data...
                </span>
                <span className="text-primary font-bold font-mono">100%</span>
              </div>
              <div className="h-2 w-full bg-surface rounded-full overflow-hidden shadow-inner">
                 <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full w-full"></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                 <span>Upload: 100%</span>
                 <span>Validation: <span className="text-green-400">Complete</span></span>
                 <span>Mapping: <span className="text-yellow-400">Pending Action</span></span>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-8 flex flex-col gap-6">
             <div className="flex items-center gap-2 text-white mb-2">
               <h3 className="font-bold text-lg">Column Mapping</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Timestamp', 'User ID', 'Event Name'].map((label) => (
                  <div key={label} className="flex flex-col gap-2">
                    <label className="text-slate-400 text-xs uppercase font-bold tracking-wider pl-1">{label}</label>
                    <div className="relative">
                      <select className="w-full appearance-none bg-background border border-white/10 text-white text-sm rounded-lg block p-3 pr-10 hover:border-white/20">
                         <option>Select Column...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                ))}
             </div>

             <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
               <Zap size={16} className="text-primary mt-0.5" />
               <p className="text-xs text-slate-300 leading-relaxed font-medium">
                 AI has automatically mapped <span className="text-white font-bold">85%</span> of columns based on your historical data schema.
               </p>
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button className="px-6 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-all">Cancel</button>
                <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
                   Confirm Mapping <ArrowRight size={16} />
                </button>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="glass rounded-2xl p-6 flex flex-col gap-4">
             <div className="flex items-center justify-between">
               <h3 className="text-white font-bold text-lg">Recent Files</h3>
               <button className="text-slate-400 hover:text-white text-xs font-medium">View All</button>
             </div>
             <div className="flex flex-col gap-3">
               {[
                 { name: 'Q3_Retention.csv', size: '12.5 MB', time: 'Just now', status: 'Processing', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                 { name: 'user_logs_v2.json', size: '45.2 MB', time: '2h ago', status: 'Mapped', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                 { name: 'august_raw.csv', size: '8.1 MB', time: 'Yesterday', status: 'Mapped', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
               ].map((file, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-white/5 hover:border-primary/50 transition-all cursor-pointer">
                   <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-slate-400">
                     <FileText size={20} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-white truncate">{file.name}</p>
                     <p className="text-xs text-slate-400">{file.time} • {file.size}</p>
                   </div>
                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${file.bg} ${file.color} ${file.border} border`}>
                     {file.status}
                   </span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};