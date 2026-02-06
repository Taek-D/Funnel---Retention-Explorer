import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Filter, Users, BarChart2, Zap, CheckCircle, ArrowRight } from '../components/Icons';

const features = [
  {
    icon: Filter,
    title: 'Funnel Analysis',
    desc: 'Build multi-step conversion funnels from any CSV data. Identify drop-off points and optimize user journeys.',
  },
  {
    icon: Users,
    title: 'Retention Cohorts',
    desc: 'Visualize user retention with cohort tables. Understand when and why users leave.',
  },
  {
    icon: BarChart2,
    title: 'Segment Comparison',
    desc: 'Compare segments by platform, channel, or custom dimensions with statistical significance.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    desc: 'Get instant, actionable insights powered by AI. No need to dig through data manually.',
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

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[180px] opacity-40 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full">
            Open Analytics Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Funnel & Retention
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Explorer
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Upload any CSV. Build funnels, analyze retention cohorts, compare segments, and get AI-powered insights — all in one powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app/dashboard"
              className="px-8 py-3.5 text-base font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
            >
              Try without signup <ArrowRight size={18} />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 text-base font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Everything you need to analyze user behavior</h2>
            <p className="text-slate-400 max-w-xl mx-auto">From raw CSV to actionable insights in minutes. No SQL, no ETL, no engineering team required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass p-8 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-400">Start free. Upgrade when you need more power.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-primary/20 to-surface border-2 border-primary/40 shadow-lg shadow-primary/10'
                    : 'glass'
                }`}
              >
                {plan.highlight && (
                  <span className="self-start px-3 py-1 text-[10px] font-extrabold uppercase bg-primary/20 text-primary rounded-full mb-4 border border-primary/30">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.cta === 'Coming Soon' ? (
                  <button
                    disabled
                    className="w-full py-3 text-sm font-bold text-slate-500 bg-white/5 rounded-xl cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className={`w-full py-3 text-sm font-bold text-center rounded-xl transition-all ${
                      plan.highlight
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
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
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <span className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
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
