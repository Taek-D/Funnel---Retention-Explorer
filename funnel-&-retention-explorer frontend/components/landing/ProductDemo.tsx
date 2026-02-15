import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from '../Icons';
import { useInView } from '../../hooks/useInView';

type DemoTab = 'funnel' | 'retention' | 'ai';

const FUNNEL_BARS = [
  { key: 'demoFunnelStep1', pct: 100 },
  { key: 'demoFunnelStep2', pct: 72 },
  { key: 'demoFunnelStep3', pct: 45 },
  { key: 'demoFunnelStep4', pct: 28 },
] as const;

const HEATMAP_OPACITIES = [
  [0.9, 0.7, 0.55, 0.4, 0.3, 0.2],
  [0.85, 0.65, 0.5, 0.35, 0.25, 0.15],
  [0.8, 0.6, 0.45, 0.3, 0.2, 0.1],
  [0.75, 0.55, 0.4, 0.25, 0.15, 0.08],
  [0.7, 0.5, 0.35, 0.2, 0.1, 0.06],
  [0.65, 0.45, 0.3, 0.18, 0.08, 0.05],
];

export const ProductDemo: React.FC = () => {
  const { t } = useTranslation('pages');
  const [tab, setTab] = useState<DemoTab>('funnel');
  const { ref, visible } = useInView();

  const tabs: { id: DemoTab; label: string }[] = [
    { id: 'funnel', label: t('landing.demoTabFunnel') },
    { id: 'retention', label: t('landing.demoTabRetention') },
    { id: 'ai', label: t('landing.demoTabAI') },
  ];

  return (
    <section id="demo" aria-label="Product Demo" className="py-24 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <div className={`text-center mb-12 ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">
            {t('landing.demoTitle')}
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">{t('landing.demoDesc')}</p>
        </div>

        <div className={`relative ${visible ? 'animate-fade-up delay-200' : 'opacity-0'}`}>
          {/* Glow behind */}
          <div className="absolute -inset-10 bg-accent/10 rounded-3xl blur-[100px] pointer-events-none" />

          {/* Window chrome */}
          <div className="relative bg-surface border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-elevated border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-[11px] text-slate-500 font-mono ml-2">FRE Analytics</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              {tabs.map((t_) => (
                <button
                  key={t_.id}
                  onClick={() => setTab(t_.id)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    tab === t_.id
                      ? 'text-accent border-b-2 border-accent bg-accent/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t_.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 min-h-[280px]">
              {tab === 'funnel' && <FunnelMockup t={t} />}
              {tab === 'retention' && <RetentionMockup />}
              {tab === 'ai' && <AIMockup t={t} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function FunnelMockup({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      {FUNNEL_BARS.map((bar) => (
        <div key={bar.key} className="flex items-center gap-4">
          <span className="text-xs text-slate-400 w-24 shrink-0 text-right">
            {t(`landing.${bar.key}`)}
          </span>
          <div className="flex-1 bg-white/[0.03] rounded-md h-8 overflow-hidden">
            <div
              className="h-full rounded-md bg-gradient-to-r from-accent to-teal-500 animate-grow-bar"
              style={{ width: `${bar.pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-300 w-10">{bar.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function RetentionMockup() {
  return (
    <div className="grid grid-cols-7 gap-1">
      <div />
      {['D0', 'D1', 'D3', 'D7', 'D14', 'D30'].map((d) => (
        <div key={d} className="text-center text-[10px] text-slate-500 font-mono py-1">{d}</div>
      ))}
      {HEATMAP_OPACITIES.map((row, ri) => (
        <React.Fragment key={ri}>
          <div className="text-[10px] text-slate-500 font-mono py-1 text-right pr-2">W{ri + 1}</div>
          {row.map((opacity, ci) => (
            <div
              key={ci}
              className="aspect-square rounded-sm"
              style={{ backgroundColor: `rgba(0, 212, 170, ${opacity})` }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function AIMockup({ t }: { t: (k: string) => string }) {
  const lines = [
    t('landing.demoAiLine1'),
    t('landing.demoAiLine2'),
    t('landing.demoAiLine3'),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white">AI Insights</span>
      </div>
      {lines.map((line, i) => (
        <div
          key={i}
          className="pl-4 border-l-2 border-accent/30 py-2"
        >
          <p className="text-sm text-slate-300">{line}</p>
        </div>
      ))}
      <div className="flex items-center gap-1 mt-2">
        <div className="w-1.5 h-4 bg-accent/60 animate-typing-cursor" />
        <span className="text-xs text-slate-500">분석 중...</span>
      </div>
    </div>
  );
}
