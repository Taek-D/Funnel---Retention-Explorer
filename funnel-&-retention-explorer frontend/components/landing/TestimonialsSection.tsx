import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const TESTIMONIALS = [
  { quoteKey: 'testimonial1Quote', nameKey: 'testimonial1Name', roleKey: 'testimonial1Role', color: 'bg-accent' },
  { quoteKey: 'testimonial2Quote', nameKey: 'testimonial2Name', roleKey: 'testimonial2Role', color: 'bg-sky-400' },
  { quoteKey: 'testimonial3Quote', nameKey: 'testimonial3Name', roleKey: 'testimonial3Role', color: 'bg-violet-500' },
] as const;

export const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation('pages');
  const { ref, visible } = useInView();

  return (
    <section aria-label="Testimonials" className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl md:text-4xl font-extrabold text-white text-center tracking-tightest mb-16 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          {t('landing.testimonialTitle')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((tm, i) => {
            const name = t(`landing.${tm.nameKey}`);
            const initial = name.charAt(0);
            return (
              <div
                key={tm.quoteKey}
                className={`bg-surface border border-white/[0.06] p-6 rounded-lg ${visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'}`}
              >
                <p className="text-sm text-slate-300 leading-relaxed mb-6 italic">
                  &ldquo;{t(`landing.${tm.quoteKey}`)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${tm.color} flex items-center justify-center text-sm font-bold text-background`}>
                    {initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{name}</div>
                    <div className="text-xs text-slate-500">{t(`landing.${tm.roleKey}`)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
