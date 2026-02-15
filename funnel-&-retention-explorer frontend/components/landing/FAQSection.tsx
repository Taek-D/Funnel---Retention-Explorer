import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from '../Icons';
import { useInView } from '../../hooks/useInView';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const FAQSection: React.FC = () => {
  const { t } = useTranslation('pages');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { ref, visible } = useInView();

  return (
    <section id="faq" aria-label={t('landing.faqSection')} className="py-24 px-6" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-3xl md:text-4xl font-extrabold text-white text-center tracking-tightest mb-12 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          {t('landing.faqTitle')}
        </h2>

        <div className="space-y-3">
          {FAQ_KEYS.map((n, i) => (
            <div
              key={n}
              className={`bg-surface border border-white/[0.06] rounded-lg overflow-hidden ${visible ? `animate-fade-up delay-${Math.min((i + 1) * 100, 700)}` : 'opacity-0'}`}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="text-white font-medium pr-4">{t(`landing.faq${n}Q`)}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIdx === i ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{t(`landing.faq${n}A`)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
