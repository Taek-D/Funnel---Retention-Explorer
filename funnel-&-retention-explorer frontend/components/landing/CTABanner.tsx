import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from '../Icons';
import { useInView } from '../../hooks/useInView';

export const CTABanner: React.FC = () => {
  const { t } = useTranslation('pages');
  const { ref, visible } = useInView();

  return (
    <section aria-label={t('landing.ctaSection')} className="py-20 px-6" ref={ref}>
      <div className={`max-w-4xl mx-auto text-center bg-surface border border-white/[0.06] rounded-xl p-12 md:p-16 relative overflow-hidden ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
        {/* Background effects */}
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">
            {t('landing.ctaBannerTitle')}
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">{t('landing.ctaBannerDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app/dashboard"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5"
            >
              {t('landing.ctaBannerCta')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5"
            >
              {t('landing.ctaBannerSecondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
