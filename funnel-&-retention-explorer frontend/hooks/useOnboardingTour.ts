import { useState, useEffect, useCallback } from 'react';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'fre_onboarding_completed';

interface TourStep {
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

function getTourSteps(): TourStep[] {
  return [
    {
      target: '[data-tour="upload"]',
      title: i18n.t('onboarding.step1Title'),
      description: i18n.t('onboarding.step1Desc'),
      placement: 'bottom',
    },
    {
      target: '[data-tour="analysis"]',
      title: i18n.t('onboarding.step2Title'),
      description: i18n.t('onboarding.step2Desc'),
      placement: 'right',
    },
    {
      target: '[data-tour="retention"]',
      title: i18n.t('onboarding.step3Title'),
      description: i18n.t('onboarding.step3Desc'),
      placement: 'right',
    },
    {
      target: '[data-tour="insights"]',
      title: i18n.t('onboarding.step4Title'),
      description: i18n.t('onboarding.step4Desc'),
      placement: 'right',
    },
    {
      target: '[data-tour="dashboard"]',
      title: i18n.t('onboarding.step5Title'),
      description: i18n.t('onboarding.step5Desc'),
      placement: 'right',
    },
  ];
}

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
    if (currentStep >= getTourSteps().length - 1) {
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
    steps: getTourSteps(),
    startTour,
    nextStep,
    skipTour,
    isCompleted,
  };
}
