import React from 'react';
import { GripVertical, MoreVertical, Plus, Calendar } from '../components/Icons';

export const FunnelEditor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-xl border border-primary/20">
         <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-lg text-primary"><span className="material-symbols-outlined">auto_fix_high</span></div>
            <div>
              <p className="text-white font-bold">Automatic Template Applied</p>
              <p className="text-slate-400 text-sm">This funnel was auto-generated based on your most frequent user paths.</p>
            </div>
         </div>
         <div className="flex gap-3">
           <button className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">Discard</button>
           <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">Edit Template</button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        {/* Editor Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="rounded-xl border border-white/10 bg-surface p-5 h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Configuration</h3>
            </div>
            
            <div className="flex justify-between items-end mb-2">
               <label className="text-xs text-slate-400 font-medium uppercase">Funnel Steps</label>
               <span className="text-[10px] text-slate-600">Drag to reorder</span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {['Website Visit', 'Product View', 'Add to Cart', 'Checkout Start', 'Purchase'].map((step, i) => (
                <div key={i} className="group flex flex-col gap-2 p-3 rounded-lg border border-white/10 bg-background hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-slate-600" />
                      <div className="bg-primary/20 text-primary w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                      <span className="font-medium text-sm text-white">{step}</span>
                    </div>
                    <MoreVertical size={16} className="text-slate-600 hover:text-white cursor-pointer" />
                  </div>
                </div>
              ))}
              <button className="mt-2 w-full py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-center gap-2">
                 <Plus size={16} /> Add Step
              </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-9 rounded-xl border border-white/10 bg-surface p-6 flex flex-col">
           <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-white">Conversion Funnel Preview</h3>
                <p className="text-sm text-slate-400">Users who completed the checkout flow (Last 30 Days)</p>
              </div>
           </div>
           
           <div className="flex-1 flex items-end justify-between px-10 pb-4 gap-4">
              {[100, 85, 55, 30, 12].map((h, i) => (
                 <div key={i} className="flex flex-col items-center justify-end h-full flex-1 gap-2 group">
                    <div className="w-full bg-gradient-to-t from-primary/60 to-primary rounded-t-lg relative hover:brightness-110 transition-all" style={{height: `${h}%`}}></div>
                    <p className="text-sm font-bold text-white text-center mt-2">{['45k', '38k', '24k', '13k', '5.6k'][i]}</p>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};