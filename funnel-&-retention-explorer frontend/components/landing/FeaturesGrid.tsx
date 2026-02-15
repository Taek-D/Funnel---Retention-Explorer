import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Filter, Users, BarChart2, Sparkles,
  Tag, FlaskConical, ArrowRightLeft, Activity,
  Plug, Clock,
} from '../Icons';
import { useInView } from '../../hooks/useInView';
import type { LucideIcon } from 'lucide-react';

type FeatureItem = {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  gradient: string;
  badge?: string;
};

const CORE: FeatureItem[] = [
  { icon: Filter, titleKey: 'feature1Title', descKey: 'feature1Desc', gradient: 'from-accent to-teal-500' },
  { icon: Users, titleKey: 'feature2Title', descKey: 'feature2Desc', gradient: 'from-sky-400 to-blue-500' },
  { icon: BarChart2, titleKey: 'feature3Title', descKey: 'feature3Desc', gradient: 'from-amber to-orange-500' },
  { icon: Sparkles, titleKey: 'feature4Title', descKey: 'feature4Desc', gradient: 'from-coral to-pink-500' },
];

const ADVANCED: FeatureItem[] = [
  { icon: Tag, titleKey: 'feature5Title', descKey: 'feature5Desc', gradient: 'from-violet-500 to-purple-500', badge: 'featureBadgePro' },
  { icon: FlaskConical, titleKey: 'feature6Title', descKey: 'feature6Desc', gradient: 'from-emerald-500 to-green-500', badge: 'featureBadgePro' },
  { icon: ArrowRightLeft, titleKey: 'feature7Title', descKey: 'feature7Desc', gradient: 'from-cyan-500 to-blue-500', badge: 'featureBadgePro' },
  { icon: Activity, titleKey: 'feature8Title', descKey: 'feature8Desc', gradient: 'from-rose-500 to-pink-500', badge: 'featureBadgePro' },
];

const ENTERPRISE: FeatureItem[] = [
  { icon: Plug, titleKey: 'feature9Title', descKey: 'feature9Desc', gradient: 'from-amber to-orange-500', badge: 'featureBadgeTeam' },
  { icon: Clock, titleKey: 'feature10Title', descKey: 'feature10Desc', gradient: 'from-sky-400 to-blue-500', badge: 'featureBadgeTeam' },
  { icon: Users, titleKey: 'feature11Title', descKey: 'feature11Desc', gradient: 'from-violet-500 to-purple-500', badge: 'featureBadgeTeam' },
];

function FeatureCard({ item, visible, delay, t }: { item: FeatureItem; visible: boolean; delay: number; t: (k: string) => string }) {
  return (
    <div className={`bg-surface border border-white/[0.06] p-6 rounded-lg hover:bg-white/[0.03] transition-all duration-300 group hover:-translate-y-1 ${visible ? `animate-fade-up delay-${delay}` : 'opacity-0'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
          <item.icon size={20} className="text-white" />
        </div>
        {item.badge && (
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-full">
            {t(`landing.${item.badge}`)}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{t(`landing.${item.titleKey}`)}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{t(`landing.${item.descKey}`)}</p>
    </div>
  );
}

export const FeaturesGrid: React.FC = () => {
  const { t } = useTranslation('pages');
  const { ref, visible } = useInView();

  return (
    <section id="features" aria-label={t('landing.keyFeatures')} className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">{t('landing.featuresSubtitle')}</p>
        </div>

        {/* Core 2x2 */}
        <h3 className={`text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 ${visible ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
          {t('landing.featuresCoreTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {CORE.map((f, i) => (
            <FeatureCard key={f.titleKey} item={f} visible={visible} delay={(i + 1) * 100} t={t} />
          ))}
        </div>

        {/* Advanced 2x2 */}
        <h3 className={`text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 ${visible ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
          {t('landing.featuresAdvTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {ADVANCED.map((f, i) => (
            <FeatureCard key={f.titleKey} item={f} visible={visible} delay={(i + 3) * 100} t={t} />
          ))}
        </div>

        {/* Enterprise 1x3 */}
        <h3 className={`text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 ${visible ? 'animate-fade-up delay-500' : 'opacity-0'}`}>
          {t('landing.featuresEntTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ENTERPRISE.map((f, i) => (
            <FeatureCard key={f.titleKey} item={f} visible={visible} delay={(i + 5) * 100} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};
