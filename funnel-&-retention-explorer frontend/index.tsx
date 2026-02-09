import { initSentry } from './lib/sentry';
initSentry();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import { NotificationProvider } from './context/NotificationContext';
import { router } from './router';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <NotificationProvider>
              <RouterProvider router={router} />
            </NotificationProvider>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
