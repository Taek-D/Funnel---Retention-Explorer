import React from 'react';
import { useTranslation } from 'react-i18next';

const LOGO_KEYS = [
  'logoSaaS', 'logoEcommerce', 'logoMobile',
  'logoSubscription', 'logoFintech', 'logoEdtech',
] as const;

export const LogoBar: React.FC = () => {
  const { t } = useTranslation('pages');

  const badges = LOGO_KEYS.map((k) => t(`landing.${k}`));

  return (
    <section aria-label="Trusted by" className="py-10 px-6 border-y border-white/[0.04] overflow-hidden">
      <p className="text-center text-slate-500 text-xs font-medium uppercase tracking-wider mb-6">
        {t('landing.logoBarText')}
      </p>
      <div className="relative max-w-5xl mx-auto overflow-hidden">
        <div className="flex gap-6 animate-marquee w-max">
          {[...badges, ...badges].map((label, i) => (
            <span
              key={i}
              className="shrink-0 px-5 py-2 text-sm text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-full whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
