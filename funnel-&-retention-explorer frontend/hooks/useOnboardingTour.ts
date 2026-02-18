import { useState, useEffect, useCallback } from 'react';
import type { TourStep, OnboardingTourAPI } from '../types/index';

const STORAGE_KEY = 'fre_onboarding_completed';

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    target: '[data-tour="dashboard"]',
    titleKey: 'onboarding.step1Title',
    descriptionKey: 'onboarding.step1Desc',
    placement: 'right',
    icon: 'LayoutDashboard',
  },
  {
    id: 'upload',
    target: '[data-tour="upload"]',
    titleKey: 'onboarding.step2Title',
    descriptionKey: 'onboarding.step2Desc',
    placement: 'right',
    icon: 'UploadCloud',
  },
  {
    id: 'analysis',
    target: '[data-tour="analysis"]',
    titleKey: 'onboarding.step3Title',
    descriptionKey: 'onboarding.step3Desc',
    placement: 'right',
    icon: 'Filter',
  },
  {
    id: 'retention',
    target: '[data-tour="retention"]',
    titleKey: 'onboarding.step4Title',
    descriptionKey: 'onboarding.step4Desc',
    placement: 'right',
    icon: 'Users',
  },
  {
    id: 'insights',
    target: '[data-tour="insights"]',
    titleKey: 'onboarding.step5Title',
    descriptionKey: 'onboarding.step5Desc',
    placement: 'right',
    icon: 'BarChart2',
  },
  {
    id: 'advanced',
    target: '[data-tour="advanced"]',
    titleKey: 'onboarding.step6Title',
    descriptionKey: 'onboarding.step6Desc',
    placement: 'right',
    icon: 'Plug',
  },
  {
    id: 'comparison',
    target: '[data-tour="comparison"]',
    titleKey: 'onboarding.step7Title',
    descriptionKey: 'onboarding.step7Desc',
    placement: 'right',
    icon: 'GitCompareArrows',
  },
  {
    id: 'team',
    target: '[data-tour="team"]',
    titleKey: 'onboarding.step8Title',
    descriptionKey: 'onboarding.step8Desc',
    placement: 'right',
    icon: 'Shield',
  },
];

export function useOnboardingTour(hasData: boolean): OnboardingTourAPI {
  const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return {
    isActive,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    steps: TOUR_STEPS,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    isCompleted,
  };
}
