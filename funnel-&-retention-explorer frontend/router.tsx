import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { PageLoader } from './components/PageLoader';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DataImport = lazy(() => import('./pages/DataImport').then(m => ({ default: m.DataImport })));
const FunnelAnalysis = lazy(() => import('./pages/FunnelAnalysis').then(m => ({ default: m.FunnelAnalysis })));
const RetentionAnalysis = lazy(() => import('./pages/RetentionAnalysis').then(m => ({ default: m.RetentionAnalysis })));
const SegmentComparison = lazy(() => import('./pages/SegmentComparison').then(m => ({ default: m.SegmentComparison })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const BillingSuccessPage = lazy(() => import('./pages/BillingSuccessPage').then(m => ({ default: m.BillingSuccessPage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/privacy',
    element: <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>,
  },
  {
    path: '/terms',
    element: <Suspense fallback={<PageLoader />}><TermsPage /></Suspense>,
  },
  {
    path: '/pricing',
    element: <Suspense fallback={<PageLoader />}><PricingPage /></Suspense>,
  },
  {
    path: '/login',
    element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
  },
  {
    path: '/signup',
    element: <Suspense fallback={<PageLoader />}><SignupPage /></Suspense>,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
          { path: 'upload', element: <Suspense fallback={<PageLoader />}><DataImport /></Suspense> },
          { path: 'funnels', element: <Suspense fallback={<PageLoader />}><FunnelAnalysis /></Suspense> },
          { path: 'retention', element: <Suspense fallback={<PageLoader />}><RetentionAnalysis /></Suspense> },
          { path: 'segments', element: <Suspense fallback={<PageLoader />}><SegmentComparison /></Suspense> },
          { path: 'insights', element: <Suspense fallback={<PageLoader />}><Insights /></Suspense> },
          { path: 'billing/success', element: <Suspense fallback={<PageLoader />}><BillingSuccessPage /></Suspense> },
        ],
      },
    ],
  },
]);
