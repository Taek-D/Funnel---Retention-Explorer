import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from '../Icons';
import { isBetaActive } from '../../lib/betaConfig';

const FLOAT_TAGS = [
  { key: 'floatFunnel', top: '18%', left: '8%', delay: '0s' },
  { key: 'floatCohort', top: '30%', right: '10%', delay: '1.5s' },
  { key: 'floatAI', top: '60%', left: '5%', delay: '3s' },
  { key: 'floatSegment', top: '55%', right: '7%', delay: '4.5s' },
] as const;

export const HeroSection: React.FC = () => {
  const { t } = useTranslation('pages');

  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section aria-label="Hero" className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-accent/20 rounded-full blur-[200px] pointer-events-none animate-glow-pulse" />
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-sky-400/15 rounded-full blur-[150px] pointer-events-none animate-float" />

      {/* Floating tags */}
      {FLOAT_TAGS.map((tag) => (
        <div
          key={tag.key}
          className="absolute hidden lg:block px-3 py-1 text-[10px] font-mono font-medium text-accent/60 bg-accent/5 border border-accent/10 rounded-full pointer-events-none animate-float"
          style={{
            top: tag.top,
            left: 'left' in tag ? tag.left : undefined,
            right: 'right' in tag ? tag.right : undefined,
            animationDelay: tag.delay,
          }}
        >
          {t(`landing.${tag.key}`)}
        </div>
      ))}

      <div className="relative max-w-4xl mx-auto">
        {isBetaActive() && (
          <div className="inline-block px-4 py-1.5 mb-3 text-[11px] font-mono font-bold uppercase tracking-wider text-background bg-accent rounded-full animate-fade-up">
            {t('landing.betaOpen')}
          </div>
        )}
        <div className="inline-block px-4 py-1.5 mb-6 text-[11px] font-mono font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-full animate-fade-up">
          {t('landing.heroBadge')}
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tightest mb-6 animate-fade-up delay-100 whitespace-pre-line">
          {t('landing.heroTitle')}
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
          {t('landing.heroSubtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
          <Link
            to="/app/dashboard"
            className="group px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {t('landing.heroCta')}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#demo"
            onClick={scrollToDemo}
            className="px-8 py-3.5 text-base font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5"
          >
            {t('landing.heroCtaSecondary')}
          </a>
        </div>

        <p className="text-slate-500 text-sm mt-8 animate-fade-up delay-400">
          {t('landing.earlyAccess')}
        </p>
      </div>
    </section>
  );
};
