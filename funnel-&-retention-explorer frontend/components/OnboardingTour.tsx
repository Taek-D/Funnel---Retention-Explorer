import React, { useEffect, useState, useCallback } from 'react';
import type { OnboardingTourAPI } from '../hooks/useOnboardingTour';

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

function calcTooltipStyle(
  rect: TargetRect,
  placement: 'top' | 'bottom' | 'left' | 'right'
): React.CSSProperties {
  const gap = 12;
  const tooltipWidth = 300;

  switch (placement) {
    case 'bottom':
      return {
        top: rect.top + rect.height + gap,
        left: Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
        width: tooltipWidth,
      };
    case 'top':
      return {
        top: rect.top - gap,
        left: Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
        width: tooltipWidth,
        transform: 'translateY(-100%)',
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + gap,
        width: tooltipWidth,
        transform: 'translateY(-50%)',
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - gap - tooltipWidth,
        width: tooltipWidth,
        transform: 'translateY(-50%)',
      };
  }
}

export const OnboardingTour: React.FC<OnboardingTourAPI> = ({
  isActive,
  currentStep,
  steps,
  nextStep,
  skipTour,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const updateRect = useCallback(() => {
    if (!isActive || !steps[currentStep]) return;
    const rect = getTargetRect(steps[currentStep].target);
    setTargetRect(rect);
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep >= steps.length - 1;
  const padding = 6;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-auto"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={skipTour}
      />

      {/* Target highlight */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            border: '2px solid rgba(0, 212, 170, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      {targetRect && (
        <div
          className="fixed z-[10000]"
          style={calcTooltipStyle(targetRect, step.placement)}
        >
          <div className="bg-surface border border-accent/30 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent font-mono text-xs font-bold">{currentStep + 1}/{steps.length}</span>
              <h4 className="text-white font-bold text-sm">{step.title}</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">{step.description}</p>
            <div className="flex justify-between items-center">
              <button
                onClick={skipTour}
                className="text-slate-500 text-xs hover:text-white transition-colors"
              >
                건너뛰기
              </button>
              <button
                onClick={nextStep}
                className="px-4 py-1.5 bg-accent text-background text-xs font-semibold rounded-md hover:bg-accent/90 transition-colors"
              >
                {isLastStep ? '완료' : '다음'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: no target found → skip to next or show centered */}
      {!targetRect && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="bg-surface border border-accent/30 rounded-lg p-6 shadow-2xl max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent font-mono text-xs font-bold">{currentStep + 1}/{steps.length}</span>
              <h4 className="text-white font-bold text-sm">{step.title}</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">{step.description}</p>
            <div className="flex justify-between items-center">
              <button onClick={skipTour} className="text-slate-500 text-xs hover:text-white transition-colors">
                건너뛰기
              </button>
              <button onClick={nextStep} className="px-4 py-1.5 bg-accent text-background text-xs font-semibold rounded-md hover:bg-accent/90 transition-colors">
                {isLastStep ? '완료' : '다음'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
