import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

const METRICS = [
  { valueKey: 'metricRows', labelKey: 'metricRowsLabel' },
  { valueKey: 'metricFeatures', labelKey: 'metricFeaturesLabel' },
  { valueKey: 'metricTime', labelKey: 'metricTimeLabel' },
  { valueKey: 'metricBrowser', labelKey: 'metricBrowserLabel' },
] as const;

export const MetricsBanner: React.FC = () => {
  const { t } = useTranslation('pages');
  const { ref, visible } = useInView();

  return (
    <section aria-label="Metrics" className="py-16 px-6 bg-surface/50" ref={ref}>
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {METRICS.map((m, i) => (
          <div
            key={m.valueKey}
            className={`text-center ${visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'}`}
          >
            <div className="text-3xl md:text-4xl font-extrabold font-mono text-accent mb-1">
              {t(`landing.${m.valueKey}`)}
            </div>
            <div className="text-sm text-slate-400">{t(`landing.${m.labelKey}`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
