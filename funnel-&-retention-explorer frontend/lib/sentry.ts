import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    tracePropagationTargets: [
      /^https:\/\/.*\.supabase\.co/,
    ],
    maxBreadcrumbs: 50,
  });
}

export function startSpan<T>(name: string, op: string, fn: () => T): T {
  return Sentry.startSpan({ name, op }, fn);
}

export async function startSpanAsync<T>(name: string, op: string, fn: () => Promise<T>): Promise<T> {
  return Sentry.startSpan({ name, op }, fn);
}

export { Sentry };
