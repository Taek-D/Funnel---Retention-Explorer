import React from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Zap, Sparkles } from '../Icons';
import { useInView } from '../../hooks/useInView';
import type { LucideIcon } from 'lucide-react';

type Step = { icon: LucideIcon; titleKey: string; descKey: string; gradient: string };

const STEPS: Step[] = [
  { icon: UploadCloud, titleKey: 'howStep1Title', descKey: 'howStep1Desc', gradient: 'from-accent to-teal-500' },
  { icon: Zap, titleKey: 'howStep2Title', descKey: 'howStep2Desc', gradient: 'from-amber to-orange-500' },
  { icon: Sparkles, titleKey: 'howStep3Title', descKey: 'howStep3Desc', gradient: 'from-violet-500 to-purple-600' },
];

export const HowItWorks: React.FC = () => {
  const { t } = useTranslation('pages');
  const { ref, visible } = useInView();

  return (
    <section id="how-it-works" aria-label="How it works" className="py-24 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <h2 className={`text-3xl md:text-4xl font-extrabold text-white text-center tracking-tightest mb-16 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          {t('landing.howTitle')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Dashed connector (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] border-t-2 border-dashed border-white/[0.08]" />

          {STEPS.map((step, i) => (
            <div
              key={step.titleKey}
              className={`relative text-center ${visible ? `animate-fade-up delay-${(i + 1) * 200}` : 'opacity-0'}`}
            >
              <div className="flex items-center justify-center mb-6">
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                  <step.icon size={28} className="text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-white/[0.08] text-[11px] font-mono font-bold text-white flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t(`landing.${step.titleKey}`)}</h3>
              <p className="text-sm text-slate-400">{t(`landing.${step.descKey}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
