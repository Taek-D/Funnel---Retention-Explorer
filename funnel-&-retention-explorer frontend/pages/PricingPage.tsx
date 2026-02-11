import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { CheckCircle, X, ArrowRight, ChevronDown } from '../components/Icons';
import { PLAN_LIMITS, BILLING_PRICES } from '../lib/planManager';
import { useAuth } from '../context/AuthContext';
import type { BillingCycle } from '../types';

const monthlyPerMonth = BILLING_PRICES.monthly;
const annualPerMonth = Math.round(BILLING_PRICES.annual / 12);
const annualSavings = monthlyPerMonth * 12 - BILLING_PRICES.annual;
const teamMonthlyPerMonth = BILLING_PRICES.teamMonthly;
const teamAnnualPerMonth = Math.round(BILLING_PRICES.teamAnnual / 12);
const teamAnnualSavings = teamMonthlyPerMonth * 12 - BILLING_PRICES.teamAnnual;

export const PricingPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const isAnnual = billingCycle === 'annual';

  const comparisonFeatures = [
    { name: t('pricing.csvRows'), free: `${PLAN_LIMITS.free.csvRows.toLocaleString()}${t('pricing.rows')}`, pro: `${PLAN_LIMITS.pro.csvRows.toLocaleString()}${t('pricing.rows')}`, team: `${PLAN_LIMITS.team.csvRows.toLocaleString()}${t('pricing.rows')}` },
    { name: t('pricing.aiDaily'), free: `${PLAN_LIMITS.free.aiCallsPerDay}${t('pricing.calls')}`, pro: `${PLAN_LIMITS.pro.aiCallsPerDay}${t('pricing.calls')}`, team: `${PLAN_LIMITS.team.aiCallsPerDay}${t('pricing.calls')}` },
    { name: t('pricing.projectCount'), free: `${PLAN_LIMITS.free.projects}${t('pricing.count')}`, pro: t('pricing.unlimited'), team: t('pricing.unlimited') },
    { name: t('pricing.savedAnalyses'), free: `${PLAN_LIMITS.free.savedAnalyses}${t('pricing.count')}`, pro: t('pricing.unlimited'), team: t('pricing.unlimited') },
    { name: t('pricing.teamMembers'), free: `1${t('pricing.people')}`, pro: `1${t('pricing.people')}`, team: `${PLAN_LIMITS.team.teamMembers}${t('pricing.people')}` },
    { name: t('pricing.funnelAnalysis'), free: true, pro: true, team: true },
    { name: t('pricing.retentionCohort'), free: true, pro: true, team: true },
    { name: t('pricing.segmentCompare'), free: true, pro: true, team: true },
    { name: t('pricing.pdfExport'), free: false, pro: true, team: true },
    { name: t('pricing.sharedProjects'), free: false, pro: false, team: true },
    { name: t('pricing.teamAdmin'), free: false, pro: false, team: true },
    { name: t('pricing.prioritySupport'), free: false, pro: true, team: true },
  ];

  const faqs = [
    { q: t('pricing.faq1Q'), a: t('pricing.faq1A') },
    { q: t('pricing.faq2Q'), a: t('pricing.faq2A') },
    { q: t('pricing.faq3Q'), a: t('pricing.faq3A') },
    { q: t('pricing.faq4Q', { csvRows: PLAN_LIMITS.free.csvRows.toLocaleString(), aiCalls: PLAN_LIMITS.free.aiCallsPerDay, projects: PLAN_LIMITS.free.projects }), a: t('pricing.faq4A', { csvRows: PLAN_LIMITS.free.csvRows.toLocaleString(), aiCalls: PLAN_LIMITS.free.aiCallsPerDay, projects: PLAN_LIMITS.free.projects }) },
    { q: t('pricing.faq5Q'), a: t('pricing.faq5A') },
  ];

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tightest mb-4">{t('pricing.title')}</h1>
        <p className="text-slate-400 max-w-xl mx-auto">{t('pricing.desc')}</p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>{t('pricing.monthly')}</span>
          <button
            onClick={() => setBillingCycle(isAnnual ? 'monthly' : 'annual')}
            className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-accent' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>{t('pricing.annual')}</span>
          {isAnnual && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent/10 text-accent rounded-full">20% OFF</span>
          )}
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-surface border border-white/[0.06] rounded-lg p-8 flex flex-col">
            <h3 className="text-2xl font-bold text-white">Free</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-mono font-bold text-white">{'\u20A9'}0</span>
              <span className="text-slate-400 text-sm ml-1">{t('pricing.free')}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {comparisonFeatures.filter(f => f.free).map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle size={16} className="text-accent shrink-0" />
                  {f.name}{typeof f.free === 'string' ? `: ${f.free}` : ''}
                </li>
              ))}
            </ul>
            <Link
              to={user ? '/app/dashboard' : '/signup'}
              className="w-full py-3 text-sm font-semibold text-center bg-white/[0.05] text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {user ? t('pricing.goToDashboard') : t('pricing.startFree')}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-surface border-2 border-accent/30 rounded-lg p-8 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent text-background rounded-full">
              {t('pricing.recommended')}
            </span>
            <h3 className="text-2xl font-bold text-white">Pro</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-mono font-bold text-white">
                {'\u20A9'}{(isAnnual ? annualPerMonth : monthlyPerMonth).toLocaleString()}
              </span>
              <span className="text-slate-400 text-sm ml-1">{t('plan.perMonth')}</span>
              {isAnnual && (
                <div className="text-slate-500 text-xs mt-1">{'\u20A9'}{BILLING_PRICES.annual.toLocaleString()} {t('pricing.annualBilling')}</div>
              )}
            </div>
            {isAnnual && (
              <div className="mb-4 px-3 py-1.5 bg-accent/5 border border-accent/10 rounded-md text-xs text-accent font-medium text-center">
                {t('pricing.annualSaving', { amount: annualSavings.toLocaleString() })}
              </div>
            )}
            <ul className="space-y-3 mb-8 flex-1">
              {comparisonFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  {f.pro ? (
                    <CheckCircle size={16} className="text-accent shrink-0" />
                  ) : (
                    <X size={16} className="text-slate-600 shrink-0" />
                  )}
                  {f.name}{typeof f.pro === 'string' ? `: ${f.pro}` : ''}
                </li>
              ))}
            </ul>
            <Link
              to={user ? `/app/dashboard?billingCycle=${billingCycle}` : '/signup'}
              className="w-full py-3 text-sm font-semibold text-center bg-accent text-background hover:bg-accent/90 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {t('pricing.startPro')}
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Team */}
          <div className="bg-surface border border-violet-500/30 rounded-lg p-8 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-violet-500 text-white rounded-full">
              {t('pricing.teamPlan')}
            </span>
            <h3 className="text-2xl font-bold text-white">Team</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-mono font-bold text-white">
                {'\u20A9'}{(isAnnual ? teamAnnualPerMonth : teamMonthlyPerMonth).toLocaleString()}
              </span>
              <span className="text-slate-400 text-sm ml-1">{t('plan.perMonth')}</span>
              {isAnnual && (
                <div className="text-slate-500 text-xs mt-1">{'\u20A9'}{BILLING_PRICES.teamAnnual.toLocaleString()} {t('pricing.annualBilling')}</div>
              )}
            </div>
            {isAnnual && (
              <div className="mb-4 px-3 py-1.5 bg-violet-500/5 border border-violet-500/10 rounded-md text-xs text-violet-400 font-medium text-center">
                {t('pricing.teamAnnualSaving', { amount: teamAnnualSavings.toLocaleString() })}
              </div>
            )}
            <ul className="space-y-3 mb-8 flex-1">
              {comparisonFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  {f.team ? (
                    <CheckCircle size={16} className="text-violet-400 shrink-0" />
                  ) : (
                    <X size={16} className="text-slate-600 shrink-0" />
                  )}
                  {f.name}{typeof f.team === 'string' ? `: ${f.team}` : ''}
                </li>
              ))}
            </ul>
            <Link
              to={user ? '/app/team' : '/signup'}
              className="w-full py-3 text-sm font-semibold text-center bg-violet-500 text-white hover:bg-violet-500/90 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {t('pricing.startTeam')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">{t('pricing.detailComparison')}</h2>
          <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">{t('pricing.feature')}</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">Free</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-accent">Pro</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-violet-400">Team</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((f, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-6 py-3 text-sm text-slate-300">{f.name}</td>
                    <td className="px-6 py-3 text-sm text-center">
                      {typeof f.free === 'string' ? (
                        <span className="text-slate-400">{f.free}</span>
                      ) : f.free ? (
                        <CheckCircle size={16} className="text-accent mx-auto" />
                      ) : (
                        <X size={16} className="text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      {typeof f.pro === 'string' ? (
                        <span className="text-white font-medium">{f.pro}</span>
                      ) : f.pro ? (
                        <CheckCircle size={16} className="text-accent mx-auto" />
                      ) : (
                        <X size={16} className="text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      {typeof f.team === 'string' ? (
                        <span className="text-violet-300 font-medium">{f.team}</span>
                      ) : f.team ? (
                        <CheckCircle size={16} className="text-violet-400 mx-auto" />
                      ) : (
                        <X size={16} className="text-slate-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">{t('pricing.faq')}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} FRE Analytics. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('pricing.privacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('pricing.terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
