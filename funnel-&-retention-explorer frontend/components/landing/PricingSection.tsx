import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CheckCircle } from '../Icons';
import { BILLING_PRICES } from '../../lib/planManager';
import { useInView } from '../../hooks/useInView';

const FREE_FEATURES = ['pricingFreeFeat1', 'pricingFreeFeat2', 'pricingFreeFeat3', 'pricingFreeFeat4', 'pricingFreeFeat5'] as const;
const PRO_FEATURES = ['pricingProFeat1', 'pricingProFeat2', 'pricingProFeat3', 'pricingProFeat4', 'pricingProFeat5'] as const;
const TEAM_FEATURES = ['pricingTeamFeat1', 'pricingTeamFeat2', 'pricingTeamFeat3', 'pricingTeamFeat4', 'pricingTeamFeat5'] as const;

function formatPrice(n: number) {
  return `₩${n.toLocaleString()}`;
}

export const PricingSection: React.FC = () => {
  const { t } = useTranslation('pages');
  const [annual, setAnnual] = useState(false);
  const { ref, visible } = useInView();

  const proPrice = annual
    ? formatPrice(Math.round(BILLING_PRICES.annual / 12))
    : formatPrice(BILLING_PRICES.monthly);
  const teamPrice = annual
    ? formatPrice(Math.round(BILLING_PRICES.teamAnnual / 12))
    : formatPrice(BILLING_PRICES.teamMonthly);

  const plans = [
    {
      name: t('landing.pricingFreeName'),
      price: t('landing.pricingFreePrice'),
      period: t('landing.pricingFreePeriod'),
      features: FREE_FEATURES,
      cta: t('landing.planFreeStart'),
      ctaLink: '/signup',
      highlight: false,
      border: 'border-white/[0.06] hover:border-white/10',
    },
    {
      name: t('landing.pricingProName'),
      price: proPrice,
      period: annual ? t('landing.pricingAnnual') : t('landing.pricingMonthly'),
      features: PRO_FEATURES,
      cta: t('landing.planProStart'),
      ctaLink: '/pricing',
      highlight: true,
      border: 'border-2 border-accent/30',
    },
    {
      name: t('landing.pricingTeamName'),
      price: teamPrice,
      period: annual ? t('landing.pricingAnnual') : t('landing.pricingMonthly'),
      features: TEAM_FEATURES,
      cta: t('landing.planTeamSoon'),
      ctaLink: '',
      highlight: false,
      border: 'border border-violet-500/30',
    },
  ];

  return (
    <section id="pricing" aria-label={t('landing.pricingSection')} className="py-24 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className={`text-center mb-10 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">
            {t('landing.pricingTitle')}
          </h2>
          <p className="text-slate-400 text-sm">{t('landing.pricingDesc')}</p>
        </div>

        {/* Toggle */}
        <div className={`flex items-center justify-center gap-3 mb-12 ${visible ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
          <span className={`text-sm ${!annual ? 'text-white font-semibold' : 'text-slate-500'}`}>
            {t('landing.pricingMonthly')}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-accent' : 'bg-white/10'}`}
            aria-label="Toggle annual billing"
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-white font-semibold' : 'text-slate-500'}`}>
            {t('landing.pricingAnnual')}
          </span>
          {annual && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full">
              {t('landing.pricingAnnualDiscount')}
            </span>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 flex flex-col bg-surface ${plan.border} relative transition-all duration-300 hover:-translate-y-1 ${visible ? `animate-fade-up delay-${(i + 2) * 100}` : 'opacity-0'}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent text-background rounded-full">
                  {t('landing.mostPopular')}
                </span>
              )}
              <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-mono font-bold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((fk) => (
                  <li key={fk} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle size={16} className="text-accent shrink-0" />
                    {t(`landing.${fk}`)}
                  </li>
                ))}
              </ul>
              {!plan.ctaLink ? (
                <button
                  disabled
                  className="w-full py-3 text-sm font-medium text-slate-600 bg-white/[0.03] border border-white/[0.06] rounded-lg cursor-not-allowed"
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  to={plan.ctaLink}
                  className={`w-full py-3 text-sm font-semibold text-center rounded-lg transition-colors block ${
                    plan.highlight
                      ? 'bg-accent text-background hover:bg-accent/90'
                      : 'bg-white/[0.05] text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
