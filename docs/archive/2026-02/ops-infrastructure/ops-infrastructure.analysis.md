# Operations & Growth Infrastructure -- Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Funnel & Retention Explorer
> **Version**: 0.0.0
> **Analyst**: gap-detector
> **Date**: 2026-02-10
> **Design Doc**: [ops-infrastructure.design.md](../02-design/features/ops-infrastructure.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the implementation of Phase 5 Operations & Growth Infrastructure (OI-4 GitHub Actions CI, OI-1 GA4 Integration, OI-2 Vercel Analytics, OI-3 Email Templates) matches the design document specification. This is the Check phase of the PDCA cycle for the ops-infrastructure feature.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/ops-infrastructure.design.md`
- **Implementation**: 18 files (4 new, 14 modify) across `.github/`, frontend `lib/`, `hooks/`, `components/`, `pages/`, `context/`, and `docs/email-templates/`
- **Analysis Date**: 2026-02-10
- **Tasks**: OI-4 (CI), OI-1 (GA4), OI-2 (Vercel Analytics), OI-3 (Email Templates)

---

## 2. Gap Analysis (Design vs Implementation)

### OI-4: GitHub Actions CI (1 file)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 1 | File exists | `.github/workflows/ci.yml` NEW | `.github/workflows/ci.yml` exists | PASS | |
| 2 | Workflow name | `name: CI` | `name: CI` | PASS | |
| 3 | Trigger | `on: pull_request: branches: [main]` | `on: pull_request: branches: [main]` | PASS | No push trigger as designed |
| 4 | Runner | `ubuntu-latest` | `ubuntu-latest` | PASS | |
| 5 | working-directory | `'./funnel-&-retention-explorer frontend'` | `'./funnel-&-retention-explorer frontend'` | PASS | Quoted `&` handled by YAML parser |
| 6 | checkout | `actions/checkout@v4` | `actions/checkout@v4` | PASS | |
| 7 | setup-node | `actions/setup-node@v4`, node 20, npm cache | `actions/setup-node@v4`, node-version 20, cache npm | PASS | |
| 8 | cache-dependency-path | `'./funnel-&-retention-explorer frontend/package-lock.json'` | Same path | PASS | |
| 9 | Install step | `npm ci` | `npm ci` | PASS | |
| 10 | Test step | `npx vitest run` | `npx vitest run` | PASS | |
| 11 | Build step | `npx vite build` | `npx vite build` | PASS | |
| 12 | Build env vars | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from secrets | Both present from `${{ secrets.* }}` | PASS | Env vars only on build step |

**OI-4 Subtotal**: 12/12 PASS

---

### OI-1: Google Analytics 4 Integration (11 files)

#### OI-1a: lib/analytics.ts (NEW)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 13 | File exists | `lib/analytics.ts` NEW | `lib/analytics.ts` exists (55 lines) | PASS | |
| 14 | GTagEvent type map | 10 event types with typed params | All 10 types match exactly | PASS | page_view, csv_upload, sample_data_load, funnel_analysis, retention_analysis, ai_insight_request, report_export, upgrade_modal_open, pro_conversion, signup_complete |
| 15 | Window global declare | `dataLayer: unknown[]`, `gtag: (...args: unknown[]) => void` | Exact match | PASS | |
| 16 | initialized flag | `let initialized = false` | Line 21: `let initialized = false` | PASS | |
| 17 | initGA function | VITE_GA_MEASUREMENT_ID check, PROD guard, dataLayer init, script injection | All elements present, exact logic match | PASS | |
| 18 | send_page_view: false | Manual page tracking config | Line 33: `{ send_page_view: false }` | PASS | |
| 19 | trackPageView function | Sends `page_view` event with `page_path` | Line 43-46: exact match | PASS | |
| 20 | trackEvent generic | `<K extends keyof GTagEvent>` with optional params | Line 48-54: exact match with `params ?? {}` | PASS | |
| 21 | No npm dependency | Uses global gtag only | No analytics package in package.json | PASS | |

**OI-1a Subtotal**: 9/9 PASS

#### OI-1b: index.tsx (MODIFY -- GA4 init)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 22 | Import initGA | `import { initGA } from './lib/analytics'` | Line 2: `import { initGA } from './lib/analytics'` | PASS | |
| 23 | Call initGA() | After `initSentry()`, before React imports | Line 4: `initGA()` after `initSentry()` (line 3) | PASS | |

**OI-1b Subtotal**: 2/2 PASS

#### OI-1c: components/AppShell.tsx (MODIFY -- page tracking)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 24 | Import trackPageView | `import { trackPageView } from '../lib/analytics'` | Line 11: exact import | PASS | |
| 25 | useEffect with location.pathname | `trackPageView(location.pathname)` on `[location.pathname]` | Lines 36-38: exact match | PASS | Includes `// GA4 page tracking` comment |

**OI-1c Subtotal**: 2/2 PASS

#### OI-1d: hooks/useCSVUpload.ts (MODIFY -- csv_upload + sample_data_load)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 26 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 12: exact import | PASS | |
| 27 | csv_upload event | `trackEvent('csv_upload', { file_name: file.name, row_count: result.data.length })` after progress 100 | Line 62: exact match, after `SET_PROCESSING progress: 100` (line 61) | PASS | |
| 28 | sample_data_load event | `trackEvent('sample_data_load', { sample_type: type })` after progress 100 | Line 181: exact match, after `SET_PROCESSING progress: 100` (line 180) | PASS | |

**OI-1d Subtotal**: 3/3 PASS

#### OI-1e: hooks/useFunnelAnalysis.ts (MODIFY -- funnel_analysis)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 29 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 7: exact import | PASS | |
| 30 | funnel_analysis event | `trackEvent('funnel_analysis', { step_count: state.funnelSteps.length })` after SET_FUNNEL_RESULTS | Line 36: exact match, after dispatch on line 35 | PASS | |

**OI-1e Subtotal**: 2/2 PASS

#### OI-1f: hooks/useRetentionAnalysis.ts (MODIFY -- retention_analysis)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 31 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 6: exact import | PASS | |
| 32 | retention_analysis event | `trackEvent('retention_analysis', { retention_type: state.retentionType })` after if/else block | Line 54: exact match, after both dispatch branches | PASS | Single call placement as designed |

**OI-1f Subtotal**: 2/2 PASS

#### OI-1g: hooks/useAIInsights.ts (MODIFY -- ai_insight_request)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 33 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 5: exact import | PASS | |
| 34 | ai_insight_request event | `trackEvent('ai_insight_request')` after SET_AI_SUMMARY | Line 63: exact match, after dispatch on line 62 | PASS | |

**OI-1g Subtotal**: 2/2 PASS

#### OI-1h: hooks/useExportReport.ts (MODIFY -- report_export)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 35 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 6: exact import | PASS | |
| 36 | report_export event | `trackEvent('report_export', { format })` after success toast | Line 41: exact match, after success toast on line 40 | PASS | |

**OI-1h Subtotal**: 2/2 PASS

#### OI-1i: components/UpgradeModal.tsx (MODIFY -- upgrade_modal_open)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 37 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 3: exact import | PASS | |
| 38 | Import useEffect | Added to React import | Line 1: `import React, { useState, useEffect } from 'react'` | PASS | |
| 39 | useEffect with isOpen guard | `if (isOpen) trackEvent('upgrade_modal_open', { reason })` deps: `[isOpen, reason]` | Lines 53-57: exact match | PASS | |

**OI-1i Subtotal**: 3/3 PASS

#### OI-1j: pages/BillingSuccessPage.tsx (MODIFY -- pro_conversion)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 40 | Import trackEvent | `import { trackEvent } from '../../lib/analytics'` | Line 5: `import { trackEvent } from '../lib/analytics'` | PASS | Path uses single `../` (pages/ is direct child of frontend root), functionally correct |
| 41 | pro_conversion event | `trackEvent('pro_conversion', { billing_cycle: billingCycle })` in subscription flow after setStatus('success') | Line 85: exact match, after `refreshProfile()` and before `setSuccessMessage()` | PASS | Only fires for new subscription, not change-billing-key |

**OI-1j Subtotal**: 2/2 PASS

#### OI-1k: context/AuthContext.tsx (MODIFY -- signup_complete)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 42 | Import trackEvent | `import { trackEvent } from '../lib/analytics'` | Line 5: exact import | PASS | |
| 43 | signup_complete event | `if (!error) { trackEvent('signup_complete') }` in signUp | Lines 80-82: `if (!error) { trackEvent('signup_complete'); }` | PASS | |

**OI-1k Subtotal**: 2/2 PASS

---

### OI-2: Vercel Analytics (3 files)

#### OI-2a: package.json (MODIFY -- dependencies)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 44 | @vercel/analytics installed | `@vercel/analytics` dependency | Line 18: `"@vercel/analytics": "^1.6.1"` | PASS | |
| 45 | @vercel/speed-insights installed | `@vercel/speed-insights` dependency | Line 19: `"@vercel/speed-insights": "^1.3.1"` | PASS | |

**OI-2a Subtotal**: 2/2 PASS

#### OI-2b: index.tsx (MODIFY -- Analytics components)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 46 | Import Analytics | `import { Analytics } from '@vercel/analytics/react'` | Line 14: exact import | PASS | |
| 47 | Import SpeedInsights | `import { SpeedInsights } from '@vercel/speed-insights/react'` | Line 15: exact import | PASS | |
| 48 | Analytics component rendered | `<Analytics />` inside NotificationProvider | Line 32: `<Analytics />` after RouterProvider | PASS | |
| 49 | SpeedInsights component rendered | `<SpeedInsights />` inside NotificationProvider | Line 33: `<SpeedInsights />` after Analytics | PASS | |

**OI-2b Subtotal**: 4/4 PASS

#### OI-2c: vite.config.ts (MODIFY -- vendor chunk)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 50 | @vercel in vendor-monitoring chunk | `if (id.includes('@vercel')) return 'vendor-monitoring'` | Line 34: `id.includes('@sentry') \|\| id.includes('@vercel')` returns `'vendor-monitoring'` | PASS | Combined with @sentry in single condition -- functionally equivalent, same chunk name |

**OI-2c Subtotal**: 1/1 PASS

---

### OI-3: Supabase Auth Email Templates (3 files)

#### OI-3a: confirm-signup.html (NEW)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 51 | File exists | `docs/email-templates/confirm-signup.html` NEW | File exists (84 lines) | PASS | |
| 52 | Base template structure | DOCTYPE, head, body, container, logo, card, footer | All structural elements present | PASS | |
| 53 | Dark theme colors | `#0c0f14` bg, `#14181f` card, `#00d4aa` accent | All colors match | PASS | |
| 54 | h1 text | `이메일 확인` | Line 72: `이메일 확인` | PASS | |
| 55 | Body text | Korean signup confirmation message | Line 73: exact match | PASS | |
| 56 | Button text | `이메일 확인하기` | Line 74: `이메일 확인하기` | PASS | |
| 57 | Supabase variables | `{{ .SiteURL }}`, `{{ .ConfirmationURL }}` | Lines 70, 74, 76, 80: all present | PASS | |
| 58 | Footer links | Privacy + Terms links | Line 80: both links with `&middot;` separator | PASS | Design uses `·` entity, impl uses `&middot;` -- equivalent |

**OI-3a Subtotal**: 8/8 PASS

#### OI-3b: reset-password.html (NEW)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 59 | File exists | `docs/email-templates/reset-password.html` NEW | File exists (85 lines) | PASS | |
| 60 | h1 text | `비밀번호 재설정` | Line 72: `비밀번호 재설정` | PASS | |
| 61 | Body text | Korean reset password message | Line 73: exact match | PASS | |
| 62 | Button text | `비밀번호 재설정` | Line 74: `비밀번호 재설정` | PASS | |
| 63 | URL variable | `{{ .ConfirmationURL }}` | Lines 74, 76: present | PASS | |
| 64 | Same base template | Same CSS/structure as confirm-signup | Identical base template structure | PASS | |
| 65 | Ignore notice | (not in design) | Line 77: `이 요청을 하지 않으셨다면 이 이메일을 무시해주세요.` | PASS | Positive enhancement -- security best practice |
| 66 | Footer text | Reset-specific footer | Line 80: `비밀번호 재설정 요청에 의해 발송되었습니다.` | PASS | |

**OI-3b Subtotal**: 8/8 PASS

#### OI-3c: magic-link.html (NEW)

| # | Check Item | Design | Implementation | Status | Notes |
|---|-----------|--------|---------------|--------|-------|
| 67 | File exists | `docs/email-templates/magic-link.html` NEW | File exists (85 lines) | PASS | |
| 68 | h1 text | `로그인 링크` | Line 72: `로그인 링크` | PASS | |
| 69 | Body text | Korean magic link message with 1-hour validity | Line 73: exact match | PASS | |
| 70 | Button text | `로그인하기` | Line 74: `로그인하기` | PASS | |
| 71 | URL variable | `{{ .ConfirmationURL }}` | Lines 74, 76: present | PASS | |
| 72 | Same base template | Same CSS/structure as confirm-signup | Identical base template structure | PASS | |
| 73 | Ignore notice | (not in design) | Line 77: `이 요청을 하지 않으셨다면 이 이메일을 무시해주세요.` | PASS | Positive enhancement -- security best practice |
| 74 | Footer text | Magic-link-specific footer | Line 80: `로그인 요청에 의해 발송되었습니다.` | PASS | |

**OI-3c Subtotal**: 8/8 PASS

---

## 3. Implementation Enhancements Beyond Design

These items were found in the implementation but not explicitly specified in the design. All are positive improvements.

| # | File | Enhancement | Impact |
|---|------|------------|--------|
| E1 | `reset-password.html` | Added "ignore this email" security notice (line 77) | Positive -- email security best practice |
| E2 | `magic-link.html` | Added "ignore this email" security notice (line 77) | Positive -- email security best practice |
| E3 | `vite.config.ts` | Combined `@sentry` and `@vercel` in single condition rather than separate if blocks | Positive -- cleaner code, same behavior |
| E4 | `pages/BillingSuccessPage.tsx` | Import path `../lib/analytics` instead of `../../lib/analytics` | Correct for actual directory structure (pages/ is direct child) |

---

## 4. File Change Summary

| # | Task | File | Action | Design | Implementation | Status |
|---|------|------|--------|--------|---------------|--------|
| 1 | OI-4 | `.github/workflows/ci.yml` | NEW | ~30 lines | 34 lines | PASS |
| 2 | OI-1 | `lib/analytics.ts` | NEW | ~55 lines | 55 lines | PASS |
| 3 | OI-1 | `index.tsx` | MODIFY | +2 lines (GA4) | Lines 2, 4 | PASS |
| 4 | OI-1 | `components/AppShell.tsx` | MODIFY | +5 lines | Lines 11, 35-38 | PASS |
| 5 | OI-1 | `hooks/useCSVUpload.ts` | MODIFY | +4 lines | Lines 12, 62, 181 | PASS |
| 6 | OI-1 | `hooks/useFunnelAnalysis.ts` | MODIFY | +3 lines | Lines 7, 36 | PASS |
| 7 | OI-1 | `hooks/useRetentionAnalysis.ts` | MODIFY | +3 lines | Lines 6, 54 | PASS |
| 8 | OI-1 | `hooks/useAIInsights.ts` | MODIFY | +3 lines | Lines 5, 63 | PASS |
| 9 | OI-1 | `hooks/useExportReport.ts` | MODIFY | +3 lines | Lines 6, 41 | PASS |
| 10 | OI-1 | `components/UpgradeModal.tsx` | MODIFY | +6 lines | Lines 1, 3, 53-57 | PASS |
| 11 | OI-1 | `pages/BillingSuccessPage.tsx` | MODIFY | +3 lines | Lines 5, 85 | PASS |
| 12 | OI-1 | `context/AuthContext.tsx` | MODIFY | +4 lines | Lines 5, 80-82 | PASS |
| 13 | OI-2 | `package.json` | MODIFY | +2 deps | Lines 18-19 | PASS |
| 14 | OI-2 | `index.tsx` | MODIFY | +4 lines (Vercel) | Lines 14-15, 32-33 | PASS |
| 15 | OI-2 | `vite.config.ts` | MODIFY | +3 lines | Line 34 (combined condition) | PASS |
| 16 | OI-3 | `docs/email-templates/confirm-signup.html` | NEW | ~65 lines | 84 lines | PASS |
| 17 | OI-3 | `docs/email-templates/reset-password.html` | NEW | ~65 lines | 85 lines | PASS |
| 18 | OI-3 | `docs/email-templates/magic-link.html` | NEW | ~65 lines | 85 lines | PASS |

**All 18 files verified**: 4 new files created, 14 existing files modified.

---

## 5. Match Rate Summary

```
+-------------------------------------------------+
|  Overall Match Rate: 100% (74/74 PASS)          |
+-------------------------------------------------+
|  OI-4  GitHub Actions CI:   12/12  PASS  (100%) |
|  OI-1  GA4 Integration:     31/31  PASS  (100%) |
|  OI-2  Vercel Analytics:     7/7   PASS  (100%) |
|  OI-3  Email Templates:     24/24  PASS  (100%) |
+-------------------------------------------------+
|  PASS:     74 items                              |
|  PARTIAL:   0 items                              |
|  FAIL:      0 items                              |
+-------------------------------------------------+
|  Enhancements beyond design: 4 items (positive)  |
+-------------------------------------------------+
```

---

## 6. Task-Level Summary

| Task | Description | Files | Check Items | PASS | PARTIAL | FAIL | Rate |
|------|------------|:-----:|:-----------:|:----:|:-------:|:----:|:----:|
| OI-4 | GitHub Actions CI | 1 | 12 | 12 | 0 | 0 | 100% |
| OI-1 | GA4 Integration | 11 | 31 | 31 | 0 | 0 | 100% |
| OI-2 | Vercel Analytics | 3 | 7 | 7 | 0 | 0 | 100% |
| OI-3 | Email Templates | 3 | 24 | 24 | 0 | 0 | 100% |
| **Total** | | **18** | **74** | **74** | **0** | **0** | **100%** |

---

## 7. Design Compliance Notes

### 7.1 Bundle Impact

Design specified ~2.5KB total impact:
- `@vercel/analytics`: ~1KB (vendor-monitoring chunk)
- `@vercel/speed-insights`: ~1KB (vendor-monitoring chunk)
- `lib/analytics.ts`: ~0.5KB (main chunk)

Implementation places both @vercel packages in vendor-monitoring alongside @sentry. The analytics.ts file is a lightweight 55-line module with zero npm dependencies. Bundle impact is minimal as designed.

### 7.2 Test Impact

Design specified no new tests needed (infrastructure code, not business logic):
- `lib/analytics.ts` is a no-op when `VITE_GA_MEASUREMENT_ID` is unset (safe for test environment)
- Vercel Analytics components render nothing outside Vercel deployment
- Existing 98 tests remain unaffected

### 7.3 Security Considerations

- GA4 Measurement ID loaded from `VITE_GA_MEASUREMENT_ID` env var (not hardcoded)
- GA4 only active in production (`import.meta.env.PROD` guard)
- Email templates use Supabase `{{ .SiteURL }}` and `{{ .ConfirmationURL }}` template variables (no hardcoded URLs)
- Email templates include "ignore this email" notices (enhancement over design)

---

## 8. Overall Assessment

Design and implementation match well. All 74 check items across 4 tasks and 18 files pass verification. The implementation includes 4 positive enhancements beyond the design (security notices in email templates, cleaner vite.config.ts condition, correct import path). No gaps, no missing features, no deviations requiring action.

**Match Rate: 100% -- No action required.**

---

## 9. Recommended Actions

### 9.1 Immediate Actions

None required. All design items are fully implemented.

### 9.2 Runtime Verification (Deferred)

These items cannot be verified through static code analysis and require runtime/deployment testing:

| # | Item | Verification Method |
|---|------|-------------------|
| R1 | GA4 events appear in Google Analytics dashboard | Deploy to production with `VITE_GA_MEASUREMENT_ID` set, trigger events |
| R2 | Vercel Analytics collects Web Vitals | Deploy to Vercel, check Vercel Analytics dashboard |
| R3 | GitHub Actions CI pipeline passes | Create a PR to main branch, verify workflow runs |
| R4 | Email templates render correctly in email clients | Test via Supabase Dashboard email preview |

### 9.3 Configuration Required

| # | Item | Location | Status |
|---|------|----------|--------|
| C1 | Set `VITE_GA_MEASUREMENT_ID` env var | Vercel Dashboard > Environment Variables | Pending |
| C2 | Upload email templates to Supabase | Supabase Dashboard > Authentication > Email Templates | Pending |
| C3 | Add `VITE_SUPABASE_URL` to GitHub Secrets | GitHub > Settings > Secrets > Actions | Pending |
| C4 | Add `VITE_SUPABASE_ANON_KEY` to GitHub Secrets | GitHub > Settings > Secrets > Actions | Pending |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-10 | Initial analysis -- 100% match rate (74/74 PASS) | gap-detector |
