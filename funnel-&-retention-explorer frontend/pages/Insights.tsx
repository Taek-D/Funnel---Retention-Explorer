import React, { useState } from 'react';
import { Zap, AlertTriangle, TrendingUp, CreditCard, Users, ArrowRight } from '../components/Icons';
import { useInsights } from '../hooks/useInsights';
import { useAIInsights } from '../hooks/useAIInsights';
import { AskAIPanel } from '../components/AskAIPanel';
import { formatNum, formatPct, formatCurrency } from '../lib/formatters';

const TYPE_STYLES: Record<string, { border: string; iconBg: string; iconColor: string; badge: string; badgeBg: string }> = {
  danger: { border: 'border-l-red-500', iconBg: 'bg-red-500/10', iconColor: 'text-red-500', badge: 'text-red-400', badgeBg: 'bg-red-500/10 border-red-500/20' },
  warning: { border: 'border-l-orange-500', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500', badge: 'text-orange-400', badgeBg: 'bg-orange-500/10 border-orange-500/20' },
  success: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', badge: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
  info: { border: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', badge: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/20' },
};

export const Insights: React.FC = () => {
  const { insights, subscriptionKPIs, trialAnalysis, churnAnalysis, detectedType, hasData } = useInsights();
  const { aiSummary, aiLoading, aiError, generateSummary } = useAIInsights();
  const [askAIOpen, setAskAIOpen] = useState(false);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
        <p className="text-slate-400">Upload a CSV file and confirm mapping to generate insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-white">AI Insights</h1>
          <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
            {detectedType === 'subscription' ? 'Subscription' : detectedType === 'ecommerce' ? 'E-commerce' : 'General'}
          </span>
        </div>
        <button
          onClick={() => setAskAIOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Zap size={16} />
          Ask AI
        </button>
      </div>

      {/* AI Summary Section */}
      <div className="glass rounded-2xl p-6 border-l-[6px] border-l-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Analysis Summary</h3>
              <p className="text-xs text-slate-500">Powered by Gemini 2.0 Flash</p>
            </div>
          </div>
          <button
            onClick={generateSummary}
            disabled={aiLoading}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all disabled:opacity-50"
          >
            {aiLoading ? 'Analyzing...' : aiSummary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>

        {aiError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
            {aiError}
          </div>
        )}

        {aiLoading && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Analyzing your data with AI...</span>
          </div>
        )}

        {aiSummary && !aiLoading && (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
          </div>
        )}

        {!aiSummary && !aiLoading && !aiError && (
          <p className="text-slate-500 text-sm">Click "Generate Summary" to get an AI-powered analysis of your data.</p>
        )}
      </div>

      {/* KPI Summary Cards */}
      {subscriptionKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', val: formatNum(subscriptionKPIs.users_total), icon: Users },
            { label: 'Paid Users', val: formatNum(subscriptionKPIs.paid_user_count), icon: CreditCard },
            { label: 'Revenue', val: formatCurrency(subscriptionKPIs.gross_revenue), icon: CreditCard },
            { label: 'Churn Rate', val: formatPct(subscriptionKPIs.cancel_rate_paid), icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="glass p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase">{stat.label}</span>
                <div className="p-2 bg-white/5 rounded-lg text-slate-400"><stat.icon size={18} /></div>
              </div>
              <span className="text-3xl font-black text-white">{stat.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trial & Churn Summary */}
      {trialAnalysis && trialAnalysis.overall.trial_users > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass p-5 rounded-2xl">
            <h3 className="text-white font-bold mb-3">Trial Conversion</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">Trial Users</span><p className="text-white font-bold">{trialAnalysis.overall.trial_users.toLocaleString()}</p></div>
              <div><span className="text-slate-400">Conversion Rate</span><p className="text-white font-bold">{trialAnalysis.overall.conversion_rate.toFixed(1)}%</p></div>
            </div>
            {trialAnalysis.by_trial_days.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-500"><tr><th className="text-left py-1">Trial Period</th><th className="text-right">Users</th><th className="text-right">Conv.</th></tr></thead>
                  <tbody>{trialAnalysis.by_trial_days.map((row, i) => (
                    <tr key={i} className="text-slate-300"><td className="py-1">{row.trial_days}일</td><td className="text-right">{row.trial_users}</td><td className="text-right">{row.conversion_rate.toFixed(1)}%</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
          {churnAnalysis && churnAnalysis.churn_users > 0 && (
            <div className="glass p-5 rounded-2xl">
              <h3 className="text-white font-bold mb-3">Churn Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Churned Users</span><p className="text-white font-bold">{churnAnalysis.churn_users.toLocaleString()}</p></div>
                <div><span className="text-slate-400">Churn Rate</span><p className="text-white font-bold">{churnAnalysis.churn_rate_paid.toFixed(1)}%</p></div>
              </div>
              {churnAnalysis.cancel_reason_top.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-bold">Top Cancel Reasons</p>
                  {churnAnalysis.cancel_reason_top.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                      <span>{r.reason}</span><span className="font-medium">{r.share.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insights Title */}
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-4">
        <Zap size={24} className="text-primary" /> Latest Intelligence
        <span className="text-sm text-slate-500 font-normal ml-2">{insights.length} insights</span>
      </h3>

      {/* Insight Cards */}
      {insights.length === 0 ? (
        <div className="glass p-8 rounded-2xl text-center">
          <p className="text-slate-400">아직 인사이트가 없습니다. 데이터를 업로드하고 매핑을 확인하면 자동으로 인사이트가 생성됩니다.</p>
        </div>
      ) : (
        insights.map((insight, i) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
          return (
            <div key={i} className={`glass p-6 rounded-2xl border-l-[6px] ${style.border} flex flex-col lg:flex-row gap-6`}>
              <div className="hidden sm:flex flex-col items-center pt-1">
                <div className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center ${style.iconColor} ring-1 ring-white/10`}>
                  <span className="text-xl">{insight.icon}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-bold text-white">{insight.title}</h4>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${style.badgeBg} ${style.badge} border`}>
                    {insight.type}
                  </span>
                </div>

                {insight.metric && (
                  <div className="inline-flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5 w-fit">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Key Metric</span>
                      <span className="text-2xl font-black text-white">{insight.metric}</span>
                    </div>
                  </div>
                )}

                <p className="text-slate-300 text-sm">{insight.body}</p>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Recommended Actions</p>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec, j) => (
                        <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                          <ArrowRight size={12} className="text-primary mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Ask AI Panel */}
      <AskAIPanel isOpen={askAIOpen} onClose={() => setAskAIOpen(false)} />
    </div>
  );
};
