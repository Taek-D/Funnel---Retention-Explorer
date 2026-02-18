import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { OnboardingTourAPI, TourPlacement } from '../types/index';
import {
  LayoutDashboard, UploadCloud, Plug, Filter, Users, PieChart, BarChart2,
  Tag, FlaskConical, ArrowRightLeft, GitCompareArrows, Diff, Activity,
  Bell, Shield, Webhook, Clock, CreditCard,
} from './Icons';

type IconComponent = React.FC<{ size?: number }>;

const TOUR_ICON_MAP: Record<string, IconComponent> = {
  LayoutDashboard,
  UploadCloud,
  Plug,
  Filter,
  Users,
  PieChart,
  BarChart2,
  Tag,
  FlaskConical,
  ArrowRightLeft,
  GitCompareArrows,
  Diff,
  Activity,
  Bell,
  Shield,
  Webhook,
  Clock,
  CreditCard,
};

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(selector: string): TargetRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function calcSmartPosition(
  rect: TargetRect,
  preferred: TourPlacement,
  tooltipWidth: number,
  tooltipHeight: number
): { style: React.CSSProperties; actualPlacement: TourPlacement } {
  const gap = 12;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const placements: TourPlacement[] = [preferred];
  if (preferred === 'right') placements.push('left', 'bottom', 'top');
  else if (preferred === 'left') placements.push('right', 'bottom', 'top');
  else if (preferred === 'bottom') placements.push('top', 'right', 'left');
  else placements.push('bottom', 'right', 'left');

  for (const placement of placements) {
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left + rect.width + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - gap - tooltipWidth;
        break;
      case 'bottom':
        top = rect.top + rect.height + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - gap - tooltipHeight;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
    }

    if (
      top >= margin &&
      top + tooltipHeight <= vh - margin &&
      left >= margin &&
      left + tooltipWidth <= vw - margin
    ) {
      return { style: { top, left, width: tooltipWidth }, actualPlacement: placement };
    }
  }

  return {
    style: {
      top: Math.max(margin, Math.min(vh - tooltipHeight - margin, rect.top + rect.height + gap)),
      left: Math.max(margin, Math.min(vw - tooltipWidth - margin, rect.left + rect.width / 2 - tooltipWidth / 2)),
      width: tooltipWidth,
    },
    actualPlacement: 'bottom',
  };
}

export const OnboardingTour: React.FC<OnboardingTourAPI> = ({
  isActive,
  currentStep,
  totalSteps,
  steps,
  nextStep,
  prevStep,
  skipTour,
}) => {
  const { t } = useTranslation();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipKey, setTooltipKey] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const updateRect = useCallback(() => {
    if (!isActive || !steps[currentStep]) return;
    const el = document.querySelector(steps[currentStep].target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      requestAnimationFrame(() => {
        const rect = getTargetRect(steps[currentStep].target);
        setTargetRect(rect);
      });
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    updateRect();
    setTooltipKey(prev => prev + 1);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => {
      tooltipRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevStep();
          break;
        case 'Escape':
          e.preventDefault();
          skipTour();
          break;
        case 'Tab': {
          e.preventDefault();
          const focusable = [skipRef.current, prevRef.current, nextRef.current].filter(Boolean) as HTMLElement[];
          const idx = focusable.indexOf(document.activeElement as HTMLElement);
          const next = e.shiftKey
            ? (idx <= 0 ? focusable.length - 1 : idx - 1)
            : (idx >= focusable.length - 1 ? 0 : idx + 1);
          focusable[next]?.focus();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep >= totalSteps - 1;
  const padding = 6;
  const IconComp = step.icon ? TOUR_ICON_MAP[step.icon] : null;

  const tooltipWidth = 320;
  const tooltipHeight = 200;
  const tooltipPos = targetRect
    ? calcSmartPosition(targetRect, step.placement, tooltipWidth, tooltipHeight)
    : null;

  const renderProgressDots = () => (
    <div className="flex items-center gap-1.5 mb-3">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`transition-all duration-300 rounded-full ${
            i === currentStep
              ? 'w-5 h-1.5 bg-accent'
              : i < currentStep
                ? 'w-1.5 h-1.5 bg-accent/60'
                : 'w-1.5 h-1.5 bg-white/20'
          }`}
        />
      ))}
    </div>
  );

  const renderTooltipContent = () => (
    <div
      ref={tooltipRef}
      tabIndex={-1}
      className="bg-surface border border-accent/30 rounded-xl p-5 shadow-2xl outline-none animate-tour-tooltip-enter"
      key={tooltipKey}
    >
      {renderProgressDots()}

      <div className="flex items-center gap-2.5 mb-2">
        {IconComp && (
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <IconComp size={15} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono text-[11px] font-bold">{currentStep + 1}/{totalSteps}</span>
          <h4 className="text-white font-bold text-sm">{t(step.titleKey)}</h4>
        </div>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed mb-4 pl-[38px]">
        {t(step.descriptionKey)}
      </p>

      <div className="flex justify-between items-center">
        <button
          ref={skipRef}
          onClick={skipTour}
          className="text-slate-500 text-xs hover:text-white transition-colors px-2 py-1 rounded"
        >
          {t('onboarding.skip')}
        </button>
        <div className="flex items-center gap-2">
          <button
            ref={prevRef}
            onClick={prevStep}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              isFirstStep
                ? 'text-slate-600 cursor-default opacity-30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            disabled={isFirstStep}
          >
            {t('onboarding.prev')}
          </button>
          <button
            ref={nextRef}
            onClick={nextStep}
            className="px-4 py-1.5 bg-accent text-background text-xs font-semibold rounded-md hover:bg-accent/90 transition-colors"
          >
            {isLastStep ? t('onboarding.done') : t('onboarding.next')}
            {!isLastStep && ' →'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-auto"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={skipTour}
        aria-hidden="true"
      />

      {/* Target highlight with pulse animation */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg animate-tour-pulse"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            transition: 'top 0.3s ease-out, left 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out',
            border: '2px solid rgba(0, 212, 170, 0.5)',
          }}
        />
      )}

      {/* Tooltip positioned near target */}
      {targetRect && tooltipPos && (
        <div
          className="fixed z-[10000] pointer-events-auto"
          style={tooltipPos.style}
          role="dialog"
          aria-label={t(step.titleKey)}
        >
          {renderTooltipContent()}
        </div>
      )}

      {/* Fallback: no target found -> centered */}
      {!targetRect && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto"
          role="dialog"
          aria-label={t(step.titleKey)}
        >
          <div style={{ width: tooltipWidth }}>
            {renderTooltipContent()}
          </div>
        </div>
      )}
    </>
  );
};
