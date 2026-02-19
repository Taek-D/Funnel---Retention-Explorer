import React from 'react';
import { LandingHeader } from '../components/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { LogoBar } from '../components/landing/LogoBar';
import { ProductDemo } from '../components/landing/ProductDemo';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { HowItWorks } from '../components/landing/HowItWorks';
import { MetricsBanner } from '../components/landing/MetricsBanner';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTABanner } from '../components/landing/CTABanner';
import { FooterSection } from '../components/landing/FooterSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <main>
        <HeroSection />
        <LogoBar />
        <ProductDemo />
        <FeaturesGrid />
        <HowItWorks />
        <MetricsBanner />
        <TestimonialsSection />
        <FAQSection />
        <CTABanner />
      </main>

      <FooterSection />
    </div>
  );
};
