import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Filter, Users, BarChart2, Zap, CheckCircle, ArrowRight, ChevronDown } from '../components/Icons';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export const LandingPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const featuresView = useInView();
  const pricingView = useInView();
  const faqView = useInView();

  const features = [
    {
      icon: Filter,
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
      gradient: 'from-accent to-teal-500',
    },
    {
      icon: Users,
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
      gradient: 'from-sky-400 to-blue-500',
    },
    {
      icon: BarChart2,
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
      gradient: 'from-amber to-orange-500',
    },
    {
      icon: Zap,
      title: t('landing.feature4Title'),
      desc: t('landing.feature4Desc'),
      gradient: 'from-coral to-pink-500',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '\u20A90',
      period: t('landing.planFree'),
      features: [
        t('landing.planFreeStart') === t('landing.planFreeStart') ? undefined : undefined,
      ].filter(Boolean),
      cta: t('landing.planFreeStart'),
      ctaLink: '/signup',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '\u20A929,000',
      period: t('plan.perMonth'),
      features: [],
      cta: t('landing.planProStart'),
      ctaLink: '/pricing',
      highlight: true,
    },
    {
      name: 'Team',
      price: '\u20A999,000',
      period: t('plan.perMonth'),
      features: [],
      cta: t('landing.planTeamSoon'),
      ctaLink: '',
      highlight: false,
    },
  ];

  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
  ];

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <main>
      {/* Hero */}
      <section aria-label={t('landing.ctaSection')} className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-accent/20 rounded-full blur-[200px] opacity-40 pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-sky-400/15 rounded-full blur-[150px] opacity-30 pointer-events-none animate-float" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-6 text-[11px] font-mono font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-full animate-fade-up">
            {t('landing.openPlatform')}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tightest mb-6 animate-fade-up delay-100">
            {t('landing.funnelRetention')}
            <br />
            <span className="text-accent">
              {t('landing.explorer')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            {t('landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <Link
              to="/app/dashboard"
              className="group px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {t('landing.tryWithoutSignup')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 text-base font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5"
            >
              {t('landing.createFreeAccount')}
            </Link>
          </div>

          <p className="text-slate-500 text-sm mt-8 animate-fade-up delay-400">
            {t('landing.earlyAccess')}
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-label={t('landing.keyFeatures')} className="py-24 px-6" ref={featuresView.ref}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 ${featuresView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">{t('landing.featuresDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`bg-surface border border-white/[0.06] p-8 rounded-lg hover:bg-white/[0.03] transition-all duration-300 group hover:-translate-y-1 ${
                  featuresView.visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-label={t('landing.pricingSection')} className="py-24 px-6" ref={pricingView.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 ${pricingView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">{t('landing.pricingTitle')}</h2>
            <p className="text-slate-400 text-sm">{t('landing.pricingDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-surface border-2 border-accent/30 relative'
                    : 'bg-surface border border-white/[0.06] hover:border-white/10'
                } ${pricingView.visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent text-background rounded-full">
                    {t('landing.mostPopular')}
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-mono font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                </div>
                <div className="mb-8 flex-1" />
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

      {/* FAQ */}
      <section id="faq" aria-label={t('landing.faqSection')} className="py-24 px-6" ref={faqView.ref}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-extrabold text-white text-center tracking-tightest mb-12 ${faqView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            {t('landing.faqTitle')}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`bg-surface border border-white/[0.06] rounded-lg overflow-hidden ${faqView.visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'}`}
              >
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
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section aria-label={t('landing.ctaSection')} className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-surface border border-white/[0.06] rounded-lg p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">{t('landing.ctaTitle')}</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">{t('landing.ctaDesc')}</p>
            <Link
              to="/app/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5"
            >
              {t('landing.ctaButton')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} FRE Analytics. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('landing.privacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('landing.terms')}</Link>
            <a href="https://github.com/castletaek/Funnel---Retention-Explorer" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
