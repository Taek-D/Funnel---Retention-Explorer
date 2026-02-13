import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, AlertTriangle, TrendingUp, CreditCard, Users, ArrowRight } from '../components/Icons';
import { UpgradeBanner } from '../components/UpgradeBanner';
import { useAppContext } from '../context/AppContext';
import { useAIInsights } from '../hooks/useAIInsights';
import { AskAIPanel } from '../components/AskAIPanel';
import { FilterPanel } from '../components/FilterPanel';
import { formatNum, formatPct, formatCurrency } from '../lib/formatters';
import type { InsightType } from '../types';

const TYPE_STYLES: Record<string, { border: string; iconBg: string; iconColor: string; badge: string; badgeBg: string }> = {
  danger: { border: 'border-l-coral', iconBg: 'bg-coral/10', iconColor: 'text-coral', badge: 'text-coral', badgeBg: 'bg-coral/10 border-coral/20' },
  warning: { border: 'border-l-amber', iconBg: 'bg-amber/10', iconColor: 'text-amber', badge: 'text-amber', badgeBg: 'bg-amber/10 border-amber/20' },
  success: { border: 'border-l-accent', iconBg: 'bg-accent/10', iconColor: 'text-accent', badge: 'text-accent', badgeBg: 'bg-accent/10 border-accent/20' },
  info: { border: 'border-l-sky-400', iconBg: 'bg-sky-400/10', iconColor: 'text-sky-400', badge: 'text-sky-400', badgeBg: 'bg-sky-400/10 border-sky-400/20' },
};

export const Insights: React.FC = () => {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { insights, subscriptionKPIs, trialAnalysis, churnAnalysis, detectedType, processedData } = state;
  const hasData = processedData.length > 0;
  const { aiSummary, aiLoading, aiError, generateSummary } = useAIInsights();
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<InsightType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInsights = useMemo(() => {
    let result = insights;
    if (typeFilter.length > 0) {
      result = result.filter(i => typeFilter.includes(i.type));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [insights, typeFilter, searchQuery]);

  const toggleType = (type: InsightType) => {
    setTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('insights.noData')}</h2>
        <p className="text-slate-400">{t('insights.noDataDesc')}</p>
      </div>
    );
  }

  const insightTypes: InsightType[] = ['success', 'warning', 'danger', 'info'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">{t('insights.title')}</h1>
          <span className="bg-accent/10 text-accent border border-accent/20 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
            {detectedType === 'subscription' ? t('insights.subscription') : detectedType === 'ecommerce' ? t('insights.ecommerce') : t('insights.general')}
          </span>
        </div>
        <button
          onClick={() => setAskAIOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:opacity-90 transition-all"
        >
          <Zap size={16} />
          {t('insights.askAI')}
        </button>
      </div>

      {/* AI Summary Section */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6 border-l-2 border-l-accent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 text-accent flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('insights.aiSummary')}</h3>
              <p className="text-xs text-slate-500">Powered by Gemini 2.0 Flash</p>
            </div>
          </div>
          <button
            onClick={generateSummary}
            disabled={aiLoading}
            className="px-4 py-2 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg transition-all disabled:opacity-50"
          >
            {aiLoading ? t('insights.analyzing') : aiSummary ? t('insights.regenerate') : t('insights.generateSummary')}
          </button>
        </div>

        {aiError && (
          <div className="p-3 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm mb-4">
            {aiError}
          </div>
        )}

        {aiLoading && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">{t('insights.aiAnalyzing')}</span>
          </div>
        )}

        {aiSummary && !aiLoading && (
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
          </div>
        )}

        {!aiSummary && !aiLoading && !aiError && (
          <p className="text-slate-500 text-sm">{t('insights.aiHint')}</p>
        )}
      </div>

      {/* KPI Summary Cards */}
      {subscriptionKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: t('insights.totalUsers'), val: formatNum(subscriptionKPIs.users_total), icon: Users },
            { label: t('insights.paidUsers'), val: formatNum(subscriptionKPIs.paid_user_count), icon: CreditCard },
            { label: t('insights.revenue'), val: formatCurrency(subscriptionKPIs.gross_revenue), icon: CreditCard },
            { label: t('insights.churnRate'), val: formatPct(subscriptionKPIs.cancel_rate_paid), icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="bg-surface border border-white/[0.06] rounded-lg p-5 flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase">{stat.label}</span>
                <div className="p-2 bg-white/5 rounded-lg text-slate-400"><stat.icon size={18} /></div>
              </div>
              <span className="text-3xl font-bold font-mono text-white">{stat.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trial & Churn Summary */}
      {trialAnalysis && trialAnalysis.overall.trial_users > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
            <h3 className="text-white font-bold mb-3">{t('insights.trialConversion')}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">{t('insights.trialUsers')}</span><p className="text-white font-bold font-mono">{trialAnalysis.overall.trial_users.toLocaleString()}</p></div>
              <div><span className="text-slate-400">{t('insights.trialConversionRate')}</span><p className="text-white font-bold font-mono">{trialAnalysis.overall.conversion_rate.toFixed(1)}%</p></div>
            </div>
            {trialAnalysis.by_trial_days.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-500"><tr><th className="text-left py-1">{t('insights.trialPeriod')}</th><th className="text-right">{t('insights.users')}</th><th className="text-right">{t('insights.trialConversionRate')}</th></tr></thead>
                  <tbody>{trialAnalysis.by_trial_days.map((row, i) => (
                    <tr key={i} className="text-slate-300"><td className="py-1">{row.trial_days}{t('insights.days')}</td><td className="text-right font-mono">{row.trial_users}</td><td className="text-right font-mono">{row.conversion_rate.toFixed(1)}%</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
          {churnAnalysis && churnAnalysis.churn_users > 0 && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
              <h3 className="text-white font-bold mb-3">{t('insights.churnSummary')}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">{t('insights.churnedUsers')}</span><p className="text-white font-bold font-mono">{churnAnalysis.churn_users.toLocaleString()}</p></div>
                <div><span className="text-slate-400">{t('insights.churnRate')}</span><p className="text-white font-bold font-mono">{churnAnalysis.churn_rate_paid.toFixed(1)}%</p></div>
              </div>
              {churnAnalysis.cancel_reason_top.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-bold">{t('insights.topCancelReasons')}</p>
                  {churnAnalysis.cancel_reason_top.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                      <span>{r.reason}</span><span className="font-medium font-mono">{r.share.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <FilterPanel />

      {/* Insights Title + Filters */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-4">
          <Zap size={24} className="text-accent" /> {t('insights.latestInsights')}
          <span className="text-sm text-slate-500 font-normal ml-2">{t('insights.insightCount', { count: filteredInsights.length })}</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('filter.searchInsights')}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50 w-48"
          />
          {insightTypes.map(type => {
            const active = typeFilter.includes(type);
            const style = TYPE_STYLES[type];
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                  active
                    ? `${style.badgeBg} ${style.badge}`
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insight Cards */}
      {filteredInsights.length === 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-8 text-center">
          <p className="text-slate-400">{t('insights.noInsightsHint')}</p>
        </div>
      ) : (
        filteredInsights.map((insight, i) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info;
          return (
            <div key={i} className={`bg-surface border border-white/[0.06] rounded-lg p-6 border-l-2 ${style.border} flex flex-col lg:flex-row gap-6`}>
              <div className="hidden sm:flex flex-col items-center pt-1">
                <div className={`w-12 h-12 rounded-lg ${style.iconBg} flex items-center justify-center ${style.iconColor} ring-1 ring-white/10`}>
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
                  <div className="inline-flex gap-4 p-4 rounded-lg bg-black/20 border border-white/5 w-fit">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">{t('insights.keyMetrics')}</span>
                      <span className="text-2xl font-bold font-mono text-white">{insight.metric}</span>
                    </div>
                  </div>
                )}

                <p className="text-slate-300 text-sm">{insight.body}</p>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">{t('insights.recommendations')}</p>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec, j) => (
                        <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                          <ArrowRight size={12} className="text-accent mt-0.5 shrink-0" />
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

      {/* Upgrade Banner */}
      <UpgradeBanner
        messageKey="upgradeBanner.insights"
        page="insights"
        onUpgrade={() => navigate('/app/subscription')}
      />

      {/* Ask AI Panel */}
      <AskAIPanel isOpen={askAIOpen} onClose={() => setAskAIOpen(false)} />
    </div>
  );
};
