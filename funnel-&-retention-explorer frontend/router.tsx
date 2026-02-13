import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
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
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })));
const SharedReport = lazy(() => import('./pages/SharedReport').then(m => ({ default: m.SharedReport })));
const WebhookSettings = lazy(() => import('./pages/WebhookSettings').then(m => ({ default: m.WebhookSettings })));
const ScheduledReports = lazy(() => import('./pages/ScheduledReports').then(m => ({ default: m.ScheduledReports })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CustomEventsPage = lazy(() => import('./pages/CustomEventsPage'));
const ABTestPage = lazy(() => import('./pages/ABTestPage'));
const UserJourneyFlow = lazy(() => import('./pages/UserJourneyFlow').then(m => ({ default: m.UserJourneyFlow })));
const FunnelComparison = lazy(() => import('./pages/FunnelComparison').then(m => ({ default: m.FunnelComparison })));
const RetentionComparison = lazy(() => import('./pages/RetentionComparison').then(m => ({ default: m.RetentionComparison })));
const StickinessPage = lazy(() => import('./pages/StickinessPage').then(m => ({ default: m.StickinessPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminBilling = lazy(() => import('./pages/AdminBilling').then(m => ({ default: m.AdminBilling })));

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
    path: '/shared/:token',
    element: <Suspense fallback={<PageLoader />}><SharedReport /></Suspense>,
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
          { path: 'team', element: <Suspense fallback={<PageLoader />}><TeamPage /></Suspense> },
          { path: 'billing/success', element: <Suspense fallback={<PageLoader />}><BillingSuccessPage /></Suspense> },
          { path: 'subscription', element: <Suspense fallback={<PageLoader />}><SubscriptionPage /></Suspense> },
          { path: 'webhooks', element: <Suspense fallback={<PageLoader />}><WebhookSettings /></Suspense> },
          { path: 'scheduled-reports', element: <Suspense fallback={<PageLoader />}><ScheduledReports /></Suspense> },
          { path: 'notifications', element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense> },
          { path: 'events', element: <Suspense fallback={<PageLoader />}><CustomEventsPage /></Suspense> },
          { path: 'ab-test', element: <Suspense fallback={<PageLoader />}><ABTestPage /></Suspense> },
          { path: 'journey', element: <Suspense fallback={<PageLoader />}><UserJourneyFlow /></Suspense> },
          { path: 'funnel-compare', element: <Suspense fallback={<PageLoader />}><FunnelComparison /></Suspense> },
          { path: 'retention-compare', element: <Suspense fallback={<PageLoader />}><RetentionComparison /></Suspense> },
          { path: 'stickiness', element: <Suspense fallback={<PageLoader />}><StickinessPage /></Suspense> },
          {
            path: 'admin',
            element: <AdminRoute />,
            children: [
              { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
              { path: 'users', element: <Suspense fallback={<PageLoader />}><AdminUsers /></Suspense> },
              { path: 'billing', element: <Suspense fallback={<PageLoader />}><AdminBilling /></Suspense> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>,
  },
]);
