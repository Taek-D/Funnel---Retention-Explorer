import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fre_onboarding_completed';

interface TourStep {
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="upload"]',
    title: '데이터 업로드',
    description: 'CSV 파일을 업로드하거나 샘플 데이터를 로드하세요. 이커머스와 SaaS 샘플이 준비되어 있습니다.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="analysis"]',
    title: '분석 시작',
    description: '퍼널 분석, 리텐션 코호트, 세그먼트 비교 — 사이드바에서 원하는 분석을 선택하세요.',
    placement: 'right',
  },
  {
    target: '[data-tour="insights"]',
    title: 'AI 인사이트',
    description: 'Gemini AI가 데이터를 분석하여 실행 가능한 인사이트를 자동 생성합니다.',
    placement: 'right',
  },
];

export interface OnboardingTourAPI {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  isCompleted: boolean;
}

export function useOnboardingTour(hasData: boolean): OnboardingTourAPI {
  const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-start on first visit (no data, not completed)
  useEffect(() => {
    if (!isCompleted && !hasData) {
      const timer = setTimeout(() => setIsActive(true), 500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setIsCompleted(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      completeTour();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, completeTour]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return {
    isActive,
    currentStep,
    steps: TOUR_STEPS,
    startTour,
    nextStep,
    skipTour,
    isCompleted,
  };
}
