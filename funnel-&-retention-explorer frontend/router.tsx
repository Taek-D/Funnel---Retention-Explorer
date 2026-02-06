import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';

import { Dashboard } from './pages/Dashboard';
import { DataImport } from './pages/DataImport';
import { FunnelAnalysis } from './pages/FunnelAnalysis';
import { FunnelEditor } from './pages/FunnelEditor';
import { RetentionAnalysis } from './pages/RetentionAnalysis';
import { SegmentComparison } from './pages/SegmentComparison';
import { Insights } from './pages/Insights';
import { MobilePreview } from './pages/MobilePreview';
import { ProjectsPage } from './pages/ProjectsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'upload', element: <DataImport /> },
          { path: 'funnels', element: <FunnelAnalysis /> },
          { path: 'editor', element: <FunnelEditor /> },
          { path: 'retention', element: <RetentionAnalysis /> },
          { path: 'segments', element: <SegmentComparison /> },
          { path: 'insights', element: <Insights /> },
          { path: 'mobile', element: <MobilePreview /> },
          { path: 'projects', element: <ProjectsPage /> },
        ],
      },
    ],
  },
]);
