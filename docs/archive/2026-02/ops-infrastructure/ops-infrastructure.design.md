# Phase 5: Operations & Growth Infrastructure — Design

> **Feature**: ops-infrastructure
> **Phase**: Design
> **Created**: 2026-02-10
> **Plan Reference**: `docs/01-plan/features/ops-infrastructure.plan.md`

---

## OI-4: GitHub Actions CI

### File: `.github/workflows/ci.yml` (NEW)

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: './funnel-&-retention-explorer frontend'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: './funnel-&-retention-explorer frontend/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npx vitest run

      - name: Build
        run: npx vite build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Key Design Decisions**:
- `working-directory` with `&` character: GitHub Actions uses bash by default, and `&` in quoted strings within `defaults.run.working-directory` is handled correctly by the YAML parser (not by the shell)
- `cache-dependency-path` ensures npm cache hit for the nested directory
- Env vars only for build step (not tests — tests use vitest mocks)
- No `push` trigger — Vercel already handles deployment on push to main

---

## OI-1: Google Analytics 4 Integration

### File: `lib/analytics.ts` (NEW)

```typescript
// GA4 analytics wrapper — zero-dependency, uses global gtag

type GTagEvent = {
  page_view: { page_path: string };
  csv_upload: { file_name: string; row_count: number };
  sample_data_load: { sample_type: string };
  funnel_analysis: { step_count: number };
  retention_analysis: { retention_type: string };
  ai_insight_request: Record<string, never>;
  report_export: { format: 'png' | 'pdf' };
  upgrade_modal_open: { reason: string };
  pro_conversion: { billing_cycle: string };
  signup_complete: Record<string, never>;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initGA(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || !import.meta.env.PROD) return;

  // Create dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We send page views manually
  });

  // Load gtag.js script async
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  initialized = true;
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  window.gtag('event', 'page_view', { page_path: path });
}

export function trackEvent<K extends keyof GTagEvent>(
  eventName: K,
  params?: GTagEvent[K]
): void {
  if (!initialized) return;
  window.gtag('event', eventName, params ?? {});
}
```

**Key Design Decisions**:
- `GTagEvent` typed map ensures type-safe event tracking (no arbitrary strings)
- `initGA()` — dynamic script injection (not in index.html) for better control
- `send_page_view: false` — page views are tracked manually via `trackPageView` on route change
- `import.meta.env.PROD` guard — GA4 completely disabled in dev/preview
- No npm dependency — uses global `gtag()` function from Google's script
- `Record<string, never>` for events with no parameters

### File: `index.html` (MODIFY)

No change needed — `initGA()` dynamically injects the gtag script. This avoids polluting index.html and allows conditional loading.

### File: `index.tsx` (MODIFY — GA4 init)

Add after Sentry init, before React render:

```typescript
import { initGA } from './lib/analytics';
initGA();
```

**Position**: After `initSentry()` call (line 2), before `import React` (line 4).

### File: `components/AppShell.tsx` (MODIFY — page tracking)

Add `useEffect` that tracks page views on route changes:

```typescript
import { trackPageView } from '../lib/analytics';

// Inside AppShell component, after existing useEffect hooks:
useEffect(() => {
  trackPageView(location.pathname);
}, [location.pathname]);
```

**Position**: After the `useEffect` for Ctrl+K shortcut (line 35-44), add a new `useEffect`.

### File: `hooks/useCSVUpload.ts` (MODIFY — csv_upload + sample_data_load events)

In `handleFileUpload`, after successful upload (after `SET_PROCESSING` progress: 100):

```typescript
import { trackEvent } from '../lib/analytics';

// After line 60 (SET_PROCESSING progress: 100):
trackEvent('csv_upload', { file_name: file.name, row_count: result.data.length });
```

In `loadSampleData`, after successful load (after progress: 100):

```typescript
// After line 178 (SET_PROCESSING progress: 100):
trackEvent('sample_data_load', { sample_type: type });
```

### File: `hooks/useFunnelAnalysis.ts` (MODIFY — funnel_analysis event)

In `runFunnelAnalysis`, after `SET_FUNNEL_RESULTS`:

```typescript
import { trackEvent } from '../lib/analytics';

// After line 34 (SET_FUNNEL_RESULTS):
trackEvent('funnel_analysis', { step_count: state.funnelSteps.length });
```

### File: `hooks/useRetentionAnalysis.ts` (MODIFY — retention_analysis event)

In `runRetentionAnalysis`, after dispatching results (both branches):

```typescript
import { trackEvent } from '../lib/analytics';

// After line 38 (SET_RETENTION_RESULTS in paid branch) and after line 50 (activity branch):
trackEvent('retention_analysis', { retention_type: state.retentionType });
```

**Placement**: Single call after the if/else block (before the insights regeneration block, around line 53).

### File: `hooks/useAIInsights.ts` (MODIFY — ai_insight_request event)

In `generateSummary`, after successful AI response:

```typescript
import { trackEvent } from '../lib/analytics';

// After line 61 (SET_AI_SUMMARY dispatch):
trackEvent('ai_insight_request');
```

### File: `hooks/useExportReport.ts` (MODIFY — report_export event)

In `exportReport`, after successful export:

```typescript
import { trackEvent } from '../lib/analytics';

// After line 39 (success toast):
trackEvent('report_export', { format });
```

### File: `components/UpgradeModal.tsx` (MODIFY — upgrade_modal_open event)

Track when modal becomes visible:

```typescript
import { trackEvent } from '../lib/analytics';

// Inside UpgradeModal component, add useEffect:
useEffect(() => {
  if (isOpen) {
    trackEvent('upgrade_modal_open', { reason });
  }
}, [isOpen, reason]);
```

**Import**: Add `useEffect` to the existing React import (line 1).

### File: `pages/BillingSuccessPage.tsx` (MODIFY — pro_conversion event)

In the `processBilling` function, after successful subscription (not change-billing-key):

```typescript
import { trackEvent } from '../../lib/analytics';

// After line 85 (setStatus('success') in subscription flow):
trackEvent('pro_conversion', { billing_cycle: billingCycle });
```

### File: `context/AuthContext.tsx` (MODIFY — signup_complete event)

In `signUp`, after successful signup:

```typescript
import { trackEvent } from '../lib/analytics';

// In signUp function, after the supabase call, when no error:
// After line 78, when error is null:
if (!error) {
  trackEvent('signup_complete');
}
```

---

## OI-2: Vercel Analytics (Web Vitals)

### Dependencies (package.json)

```
npm install @vercel/analytics @vercel/speed-insights
```

### File: `index.tsx` (MODIFY — Analytics components)

Add Vercel Analytics and Speed Insights components:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Inside the render, add as siblings of RouterProvider (inside providers):
<NotificationProvider>
  <RouterProvider router={router} />
  <Analytics />
  <SpeedInsights />
</NotificationProvider>
```

**Position**: `<Analytics />` and `<SpeedInsights />` as last children inside the `<NotificationProvider>` block, after `<RouterProvider>`.

**Key Design Decisions**:
- Components auto-detect Vercel deployment — no configuration needed
- Both are self-contained, no props required
- ~1KB each (tree-shakeable)
- Only send data when deployed on Vercel (silent noop locally)

### File: `vite.config.ts` (MODIFY — optional vendor chunk)

Add Vercel packages to vendor chunk for caching:

```typescript
if (id.includes('@vercel')) {
  return 'vendor-monitoring';
}
```

**Position**: After the `@sentry` chunk check (line 34-36). Since both Sentry and Vercel are monitoring tools, grouping them into the same `vendor-monitoring` chunk makes sense.

---

## OI-3: Supabase Auth Email Templates

### File: `docs/email-templates/confirm-signup.html` (NEW — backup)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0f14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e2e8f0;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: #00d4aa;
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    .card {
      background-color: #14181f;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 32px 24px;
      margin-top: 24px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 16px;
    }
    .btn {
      display: inline-block;
      background-color: #00d4aa;
      color: #0c0f14;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      margin: 8px 0 16px;
    }
    .footer {
      font-size: 11px;
      color: #475569;
      margin-top: 32px;
      text-align: center;
    }
    .footer a {
      color: #00d4aa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="{{ .SiteURL }}" class="logo">FRE Analytics</a>
    <div class="card">
      <h1>이메일 확인</h1>
      <p>FRE Analytics에 가입해주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 주소를 확인해주세요.</p>
      <a href="{{ .ConfirmationURL }}" class="btn">이메일 확인하기</a>
      <p>버튼이 작동하지 않으면 아래 링크를 브라우저에 복사하세요:</p>
      <p style="word-break: break-all; font-size: 12px; color: #64748b;">{{ .ConfirmationURL }}</p>
    </div>
    <div class="footer">
      <p>이 이메일은 FRE Analytics 회원가입 요청에 의해 발송되었습니다.</p>
      <p><a href="{{ .SiteURL }}/privacy">개인정보처리방침</a> · <a href="{{ .SiteURL }}/terms">이용약관</a></p>
    </div>
  </div>
</body>
</html>
```

**Subject**: `FRE Analytics — 이메일 확인`

### File: `docs/email-templates/reset-password.html` (NEW — backup)

Same base template with:
- **h1**: `비밀번호 재설정`
- **body**: `비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.`
- **btn text**: `비밀번호 재설정`
- **URL variable**: `{{ .ConfirmationURL }}`
- **Subject**: `FRE Analytics — 비밀번호 재설정`

### File: `docs/email-templates/magic-link.html` (NEW — backup)

Same base template with:
- **h1**: `로그인 링크`
- **body**: `아래 버튼을 클릭하여 FRE Analytics에 로그인하세요. 이 링크는 1시간 동안 유효합니다.`
- **btn text**: `로그인하기`
- **URL variable**: `{{ .ConfirmationURL }}`
- **Subject**: `FRE Analytics — 로그인 링크`

### Supabase Dashboard Configuration

- Navigate to: Authentication > Email Templates
- Update 3 templates: Confirm signup, Reset password, Magic link
- Paste the HTML content from `docs/email-templates/` files
- Update Subject lines as specified above

**Key Design Decisions**:
- Inline styles only (email clients don't support external CSS)
- Dark theme matching the app (#0c0f14 background, #00d4aa accent)
- System font stack (no external fonts in email)
- `{{ .SiteURL }}` and `{{ .ConfirmationURL }}` are Supabase template variables
- Templates stored in `docs/email-templates/` as backup (not deployed as code)
- No code changes in the React app required

---

## Implementation Order

```
OI-4 (CI)     →  1st  (safety net for remaining changes)
OI-1 (GA4)    →  2nd  (most files touched)
OI-2 (Vercel) →  3rd  (2 lines of code)
OI-3 (Email)  →  4th  (templates only, no code)
```

## Complete File Change Summary

| # | Task | File | Action | Lines |
|---|------|------|--------|-------|
| 1 | OI-4 | `.github/workflows/ci.yml` | NEW | ~30 |
| 2 | OI-1 | `lib/analytics.ts` | NEW | ~55 |
| 3 | OI-1 | `index.tsx` | MODIFY | +2 |
| 4 | OI-1 | `components/AppShell.tsx` | MODIFY | +5 |
| 5 | OI-1 | `hooks/useCSVUpload.ts` | MODIFY | +4 |
| 6 | OI-1 | `hooks/useFunnelAnalysis.ts` | MODIFY | +3 |
| 7 | OI-1 | `hooks/useRetentionAnalysis.ts` | MODIFY | +3 |
| 8 | OI-1 | `hooks/useAIInsights.ts` | MODIFY | +3 |
| 9 | OI-1 | `hooks/useExportReport.ts` | MODIFY | +3 |
| 10 | OI-1 | `components/UpgradeModal.tsx` | MODIFY | +6 |
| 11 | OI-1 | `pages/BillingSuccessPage.tsx` | MODIFY | +3 |
| 12 | OI-1 | `context/AuthContext.tsx` | MODIFY | +4 |
| 13 | OI-2 | `package.json` | MODIFY | +2 deps |
| 14 | OI-2 | `index.tsx` | MODIFY | +4 |
| 15 | OI-2 | `vite.config.ts` | MODIFY | +3 |
| 16 | OI-3 | `docs/email-templates/confirm-signup.html` | NEW | ~65 |
| 17 | OI-3 | `docs/email-templates/reset-password.html` | NEW | ~65 |
| 18 | OI-3 | `docs/email-templates/magic-link.html` | NEW | ~65 |

**Total**: 18 files (4 new, 14 modify), ~320 lines

## Test Impact

- All existing 98 tests remain unchanged
- `lib/analytics.ts` calls are no-ops when `VITE_GA_MEASUREMENT_ID` is missing (tests unaffected)
- Vercel Analytics components render nothing outside Vercel (tests unaffected)
- No new test files required (infrastructure code, not business logic)

## Bundle Impact

| Package | Size | Chunk |
|---------|------|-------|
| `@vercel/analytics` | ~1KB | vendor-monitoring |
| `@vercel/speed-insights` | ~1KB | vendor-monitoring |
| `lib/analytics.ts` | ~0.5KB | main |
| **Total** | **~2.5KB** | — |
