# Gap Analysis: Security & Trust

> **Feature**: security-trust
> **Design Reference**: `docs/02-design/features/security-trust.design.md`
> **Analyzed**: 2026-02-09
> **Match Rate**: 100% (54/54)

---

## Summary

| Category | Items | Passed | Failed | Rate |
|----------|:-----:|:------:|:------:|:----:|
| ST-1 (API Proxy) | 15 | 15 | 0 | 100% |
| ST-2 (Privacy Page) | 6 | 6 | 0 | 100% |
| ST-3 (Terms Page) | 6 | 6 | 0 | 100% |
| ST-4 (Footer Links) | 5 | 5 | 0 | 100% |
| ST-5 (Sentry) | 9 | 9 | 0 | 100% |
| ST-6 (Fake Stats) | 5 | 5 | 0 | 100% |
| RT (Routing & Build) | 8 | 8 | 0 | 100% |
| **Total** | **54** | **54** | **0** | **100%** |

---

## Detailed Results

### ST-1: Gemini API Proxy

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| ST-1.1 | `supabase/functions/ai-proxy/index.ts` exists | PASS | File confirmed at `supabase/functions/ai-proxy/index.ts` |
| ST-1.2 | CORS preflight (OPTIONS) handled | PASS | `req.method === 'OPTIONS'` at line 10 |
| ST-1.3 | JWT verified via `supabase.auth.getUser()` | PASS | Line 27: `await supabase.auth.getUser()` |
| ST-1.4 | Server-side key via `Deno.env.get('GEMINI_API_KEY')` | PASS | Line 37: `Deno.env.get('GEMINI_API_KEY')` |
| ST-1.5 | Body proxied to Gemini API | PASS | Lines 48-52: `fetch(geminiUrl, { body: JSON.stringify(body) })` |
| ST-1.6 | `VITE_GEMINI_API_KEY` removed from geminiClient.ts | PASS | grep returns 0 matches in all .ts/.tsx files |
| ST-1.7 | `GEMINI_API_URL` (direct Google URL) removed | PASS | grep returns 0 matches in all .ts/.tsx files |
| ST-1.8 | Fetches Supabase Edge Function URL | PASS | `AI_PROXY_URL = \`\${SUPABASE_URL}/functions/v1/ai-proxy\`` at line 4 |
| ST-1.9 | Session token in Authorization header | PASS | Line 51: `'Authorization': \`Bearer \${session.access_token}\`` |
| ST-1.10 | Error message for unauthenticated users | PASS | Line 27: `'AI 인사이트를 사용하려면 로그인이 필요합니다.'` |
| ST-1.11 | `process.env.API_KEY` define removed from vite.config.ts | PASS | No `define` block exists in vite.config.ts |
| ST-1.12 | `process.env.GEMINI_API_KEY` define removed | PASS | No `define` block exists in vite.config.ts |
| ST-1.13 | `GeminiMessage`, `GeminiResponse` interfaces retained | PASS | Both exported at lines 6-14 |
| ST-1.14 | `buildAnalysisPrompt` function unchanged | PASS | Function exists at line 69, signature and logic intact |
| ST-1.15 | `generateContent` signature preserved | PASS | `(prompt, systemInstruction?, history?)` at line 16 |

### ST-2: Privacy Page

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| ST-2.1 | `pages/PrivacyPage.tsx` exists | PASS | File confirmed |
| ST-2.2 | Named export `PrivacyPage` | PASS | `export const PrivacyPage: React.FC` at line 5 |
| ST-2.3 | Privacy collection section exists | PASS | "1. 개인정보 수집 항목" section present |
| ST-2.4 | Third-party provision section (Supabase, Gemini) | PASS | Table with "Supabase (미국)" and "Google Gemini AI (미국)" |
| ST-2.5 | Uses LandingHeader | PASS | `import { LandingHeader }` at line 3, `<LandingHeader />` at line 8 |
| ST-2.6 | Dark theme style (`bg-background`) | PASS | `className="min-h-screen bg-background"` at line 7 |

### ST-3: Terms Page

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| ST-3.1 | `pages/TermsPage.tsx` exists | PASS | File confirmed |
| ST-3.2 | Named export `TermsPage` | PASS | `export const TermsPage: React.FC` at line 5 |
| ST-3.3 | Service usage section exists | PASS | "3. 서비스 이용" with subsections 3-1, 3-2 |
| ST-3.4 | Data ownership section exists | PASS | "5. 데이터 소유권" section present |
| ST-3.5 | Uses LandingHeader | PASS | `import { LandingHeader }` at line 3, `<LandingHeader />` at line 8 |
| ST-3.6 | Dark theme style (`bg-background`) | PASS | `className="min-h-screen bg-background"` at line 7 |

### ST-4: Footer Links

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| ST-4.1 | Privacy link to `/privacy` | PASS | `<Link to="/privacy"` at line 281 |
| ST-4.2 | Terms link to `/terms` | PASS | `<Link to="/terms"` at line 282 |
| ST-4.3 | No `href="#"` dummy links | PASS | grep returns 0 matches |
| ST-4.4 | Uses react-router-dom `Link` | PASS | `import { Link } from 'react-router-dom'` at line 2 |
| ST-4.5 | GitHub link has `target="_blank"` + `rel="noopener noreferrer"` | PASS | Line 283: both attributes present |

### ST-5: Sentry Error Monitoring

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| ST-5.1 | `@sentry/react` in package.json | PASS | `"@sentry/react": "^10.38.0"` in dependencies |
| ST-5.2 | `lib/sentry.ts` exists | PASS | File confirmed |
| ST-5.3 | `initSentry` calls `Sentry.init()` | PASS | Line 7: `Sentry.init({ dsn, ... })` |
| ST-5.4 | DSN from `VITE_SENTRY_DSN` | PASS | Line 4: `import.meta.env.VITE_SENTRY_DSN` |
| ST-5.5 | Graceful skip when no DSN | PASS | Line 5: `if (!dsn) return` |
| ST-5.6 | Production-only (`enabled: import.meta.env.PROD`) | PASS | Line 10: `enabled: import.meta.env.PROD` |
| ST-5.7 | `initSentry()` called before rendering | PASS | index.tsx lines 1-2: import + call before React imports |
| ST-5.8 | `Sentry.captureException` in ErrorBoundary | PASS | `componentDidCatch` with dynamic import at lines 23-27 |
| ST-5.9 | `vendor-monitoring` manualChunk | PASS | vite.config.ts line 34: `if (id.includes('@sentry')) return 'vendor-monitoring'` |

### ST-6: Fake Stats Removal

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| ST-6.1 | `stats` array (fake numbers) removed | PASS | grep `1,000만` returns 0 matches |
| ST-6.2 | `500+` active users removed | PASS | grep `500+` returns 0 matches |
| ST-6.3 | Stats bar rendering removed | PASS | grep `stats.map` returns 0 matches |
| ST-6.4 | "Early access" replacement text exists | PASS | Line 130: "얼리 액세스 — CSV 분석을 더 쉽게 만드는 중입니다" |
| ST-6.5 | "수백 개의 프로덕트 팀" CTA removed | PASS | grep returns 0 matches; replaced with "CSV 데이터에서 퍼널과 리텐션을 분석하세요" |

### RT: Routing & Build

| ID | Check Item | Status | Evidence |
|----|-----------|:------:|---------|
| RT-1 | `/privacy` route in router.tsx | PASS | Line 27: `path: '/privacy'` |
| RT-2 | `/terms` route in router.tsx | PASS | Line 31: `path: '/terms'` |
| RT-3 | PrivacyPage uses React.lazy | PASS | Line 17: `lazy(() => import('./pages/PrivacyPage')...)` |
| RT-4 | TermsPage uses React.lazy | PASS | Line 18: `lazy(() => import('./pages/TermsPage')...)` |
| RT-5 | `vite build` succeeds (exit code 0) | PASS | Built in 4.12s, 23 chunks, no errors |
| RT-6 | No 500KB chunk warning | PASS | Largest chunk: vendor-monitoring 423.62KB (< 500KB) |
| RT-7 | All 98 tests pass | PASS | 14 files, 98/98 passed |
| RT-8 | No `GEMINI_API_KEY` in build output | PASS | grep returns 0 matches in dist/ |

---

## Build Output

```
23 chunks, built in 4.12s
Largest: vendor-monitoring-CffpnmGS.js (423.62 KB)
No 500KB warning
No API keys in dist/
```

## Test Output

```
14 test files, 98/98 passed
Duration: 537ms
```

---

## Conclusion

**Match Rate: 100% (54/54)**

All design check items pass. The security-trust feature is fully implemented as designed:

1. **API Key Security**: Gemini API key moved server-side via Supabase Edge Function proxy. No API key leaked in client bundle.
2. **Legal Compliance**: PIPA-compliant privacy policy and SaaS terms of service pages created.
3. **Footer Links**: All dummy `href="#"` links replaced with functional routes.
4. **Error Monitoring**: Sentry integration with graceful degradation, production-only, separate vendor chunk.
5. **Honest Marketing**: Fake stats removed, replaced with honest "early access" messaging.

Ready for `/pdca report security-trust`.
