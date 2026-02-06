import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Filter, Users, BarChart2, Zap, CheckCircle, ArrowRight, ChevronDown } from '../components/Icons';

const features = [
  {
    icon: Filter,
    title: 'Funnel Analysis',
    desc: 'Build multi-step conversion funnels from any CSV data. Identify drop-off points and optimize user journeys.',
    gradient: 'from-accent to-teal-500',
  },
  {
    icon: Users,
    title: 'Retention Cohorts',
    desc: 'Visualize user retention with cohort tables. Understand when and why users leave.',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    icon: BarChart2,
    title: 'Segment Comparison',
    desc: 'Compare segments by platform, channel, or custom dimensions with statistical significance.',
    gradient: 'from-amber to-orange-500',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    desc: 'Get instant, actionable insights powered by Gemini AI. No need to dig through data manually.',
    gradient: 'from-coral to-pink-500',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 project', 'CSV upload up to 50K rows', 'Funnel & Retention analysis', 'Basic insights'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited projects', 'CSV upload up to 1M rows', 'AI-powered insights', 'Segment comparison', 'Export to PDF', 'Priority support'],
    cta: 'Coming Soon',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    features: ['Everything in Pro', 'Team collaboration', 'Shared dashboards', 'API access', 'Custom integrations', 'Dedicated support'],
    cta: 'Coming Soon',
    highlight: false,
  },
];

const faqs = [
  { q: 'Do I need to set up a database?', a: 'No. FRE works with CSV files. Just upload your data and start analyzing. For persistent storage, create an account and your data is securely saved.' },
  { q: 'What data formats are supported?', a: 'Currently CSV files with timestamp, user ID, and event name columns. We auto-detect column mappings for both e-commerce and subscription data.' },
  { q: 'Is my data secure?', a: 'Yes. Your data is processed in-browser. When you save to the cloud, it is stored encrypted with row-level security — only you can access your data.' },
  { q: 'Can I try it without signing up?', a: 'Absolutely. Go to the app and upload a CSV. No account needed for basic analysis.' },
];

const stats = [
  { label: 'Data Points Analyzed', value: '10M+' },
  { label: 'Active Users', value: '500+' },
  { label: 'Avg. Setup Time', value: '<2min' },
];

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const featuresView = useInView();
  const pricingView = useInView();
  const faqView = useInView();

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-accent/20 rounded-full blur-[200px] opacity-40 pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-sky-400/15 rounded-full blur-[150px] opacity-30 pointer-events-none animate-float" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-6 text-[11px] font-mono font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-full animate-fade-up">
            Open Analytics Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tightest mb-6 animate-fade-up delay-100">
            Funnel & Retention
            <br />
            <span className="text-accent">
              Explorer
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            Upload any CSV. Build funnels, analyze retention cohorts, compare segments, and get AI-powered insights — all in one powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <Link
              to="/app/dashboard"
              className="group px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Try without signup
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 text-base font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 animate-fade-up delay-400">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-mono font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" ref={featuresView.ref}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 ${featuresView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">Everything you need to analyze user behavior</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">From raw CSV to actionable insights in minutes. No SQL, no ETL, no engineering team required.</p>
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
      <section id="pricing" className="py-24 px-6" ref={pricingView.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 ${pricingView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400 text-sm">Start free. Upgrade when you need more power.</p>
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
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-mono font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle size={16} className="text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.cta === 'Coming Soon' ? (
                  <button
                    disabled
                    className="w-full py-3 text-sm font-medium text-slate-600 bg-white/[0.03] border border-white/[0.06] rounded-lg cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className={`w-full py-3 text-sm font-semibold text-center rounded-lg transition-colors ${
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
      <section id="faq" className="py-24 px-6" ref={faqView.ref}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-extrabold text-white text-center tracking-tightest mb-12 ${faqView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            Frequently Asked Questions
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
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openFaq === i ? '200px' : '0px',
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-surface border border-white/[0.06] rounded-lg p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">Ready to explore your data?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">Join hundreds of product teams using FRE Analytics to understand their users better.</p>
            <Link
              to="/app/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
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
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
