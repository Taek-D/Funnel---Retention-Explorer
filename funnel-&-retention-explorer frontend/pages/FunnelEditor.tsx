import React from 'react';
import { Plus, X, Zap } from '../components/Icons';
import { useFunnelAnalysis } from '../hooks/useFunnelAnalysis';

export const FunnelEditor: React.FC = () => {
  const {
    funnelSteps, funnelResults, uniqueEvents, detectedType, hasData,
    setFunnelSteps, applyTemplate, runFunnelAnalysis
  } = useFunnelAnalysis();

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
        <p className="text-slate-400">Upload a CSV file in the Data Import tab first.</p>
      </div>
    );
  }

  const addStep = () => setFunnelSteps([...funnelSteps, '']);
  const removeStep = (index: number) => setFunnelSteps(funnelSteps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const newSteps = [...funnelSteps];
    newSteps[index] = value;
    setFunnelSteps(newSteps);
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="flex justify-between items-center bg-accent/5 border border-accent/20 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent/10 rounded-lg text-accent"><Zap size={20} /></div>
          <div>
            <p className="text-white font-bold">Quick Templates</p>
            <p className="text-slate-400 text-sm">Apply a pre-built funnel template based on your data type.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => applyTemplate('ecommerce')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detectedType === 'ecommerce' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white border border-white/10'}`}
          >
            E-commerce
          </button>
          <button
            onClick={() => applyTemplate('subscription')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${detectedType === 'subscription' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white border border-white/10'}`}
          >
            Subscription
          </button>
          {detectedType === 'subscription' && (
            <button
              onClick={() => applyTemplate('lifecycle')}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white border border-white/10 transition-all"
            >
              Lifecycle
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-lg border border-white/[0.06] bg-surface p-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Funnel Steps</h3>
              <span className="text-[10px] text-slate-600 font-mono">{funnelSteps.length} steps</span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
              {funnelSteps.map((step, i) => (
                <div key={i} className="group flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-background hover:border-accent/50 transition-colors">
                  <div className="bg-accent/10 text-accent w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                  <select
                    className="flex-1 bg-transparent text-white text-sm border-none outline-none"
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                  >
                    <option value="" className="bg-[#14181f]">이벤트 선택...</option>
                    {uniqueEvents.map(event => (
                      <option key={event} value={event} className="bg-[#14181f]">{event}</option>
                    ))}
                  </select>
                  {i > 0 && (
                    <button onClick={() => removeStep(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addStep}
                className="mt-2 w-full py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Step
              </button>
            </div>

            <button
              onClick={runFunnelAnalysis}
              className="mt-4 w-full py-3 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-all"
            >
              Calculate Funnel
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 rounded-lg border border-white/[0.06] bg-surface p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Conversion Funnel Preview</h3>
              <p className="text-sm text-slate-400">
                {funnelResults ? <><span className="font-mono">{funnelResults[0]?.users.toLocaleString()}</span> users analyzed</> : 'Configure steps and click Calculate'}
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between px-10 pb-4 gap-4 min-h-[400px]">
            {funnelResults && funnelResults.length > 0 ? (
              funnelResults.map((step, i) => {
                const heightPct = funnelResults[0].users > 0
                  ? (step.users / funnelResults[0].users) * 100
                  : 0;
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full flex-1 gap-2 group">
                    <div
                      className="w-full bg-accent rounded-t-lg relative hover:brightness-110 transition-all"
                      style={{ height: `${Math.max(heightPct, 3)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">
                        {step.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block truncate max-w-[100px]">{step.step}</span>
                      <span className="text-white font-bold text-sm font-mono">{step.users.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              funnelSteps.filter(Boolean).map((step, i) => (
                <div key={i} className="flex flex-col items-center justify-end h-full flex-1 gap-2">
                  <div className="w-full bg-white/5 rounded-t-lg" style={{ height: `${100 - i * 15}%` }} />
                  <div className="text-center">
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block truncate max-w-[100px]">{step}</span>
                    <span className="text-slate-600 text-sm">--</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
