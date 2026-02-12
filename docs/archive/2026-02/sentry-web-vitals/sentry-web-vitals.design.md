# Sentry Web Vitals - Design Document

## Overview

Sentry Performance Monitoring + Core Web Vitals + Source Maps + Custom Spans 설계.

## References
- Plan: `docs/01-plan/features/sentry-web-vitals.plan.md`
- Current: `lib/sentry.ts`, `components/ErrorBoundary.tsx`, `vite.config.ts`

---

## SWV-1: Performance Tracing 활성화

### lib/sentry.ts 수정

```typescript
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

export { Sentry };
```

**변경 사항:**
- `tracesSampleRate`: `0` → `0.1`
- `integrations`: `browserTracingIntegration()` 추가
- `tracePropagationTargets`: Supabase API만 trace propagation

---

## SWV-2: Source Maps 업로드

### vite.config.ts 수정

```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(() => {
  return {
    build: {
      sourcemap: 'hidden',
      rollupOptions: { /* existing manualChunks */ }
    },
    plugins: [
      react(),
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
        disable: !process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
  };
});
```

**주요 포인트:**
- `sourcemap: 'hidden'` — source map 생성하되 브라우저에 노출 안 함
- `filesToDeleteAfterUpload` — 업로드 후 .map 파일 삭제 (배포 번들에 포함 안 됨)
- `disable: !process.env.SENTRY_AUTH_TOKEN` — 로컬 빌드 시 플러그인 비활성화

### CI 환경 변수 (GitHub Actions)

`.github/workflows/ci.yml`에 secrets 참조 추가:

```yaml
- name: Build
  run: node node_modules/vite/bin/vite.js build
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
    SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
```

---

## SWV-3: Custom Performance Spans

### lib/sentry.ts에 헬퍼 함수 추가

```typescript
export function startSpan<T>(name: string, op: string, fn: () => T): T {
  return Sentry.startSpan({ name, op }, fn);
}

export async function startSpanAsync<T>(name: string, op: string, fn: () => Promise<T>): Promise<T> {
  return Sentry.startSpan({ name, op }, fn);
}
```

### 적용 위치

| 파일 | 함수 | span name | op |
|------|------|-----------|-----|
| `lib/csvParser.ts` | `parseCSV` | `csv.parse` | `parse` |
| `lib/dataProcessor.ts` | `processData` | `data.process` | `process` |
| `lib/funnelEngine.ts` | `calculateFunnel` | `analysis.funnel` | `compute` |
| `lib/retentionEngine.ts` | `calculateRetention` | `analysis.retention` | `compute` |
| `lib/geminiClient.ts` | `getAIInsight` | `ai.insight` | `http.client` |

### 예시 — csvParser.ts

```typescript
import { startSpan } from './sentry';

export function parseCSV(file: File): Promise<ParseResult> {
  return startSpan('csv.parse', 'parse', () => {
    // existing implementation
  });
}
```

**참고:** 각 함수의 내부 로직은 변경하지 않고, 최외곽을 `startSpan`으로 래핑.

---

## SWV-4: Sentry ErrorBoundary 전환

### components/ErrorBoundary.tsx 수정

```tsx
import React from 'react';
import * as Sentry from '@sentry/react';
import i18n from '../lib/i18n';
import { AlertTriangle } from './Icons';

function FallbackUI({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-coral" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          {i18n.t('error.title')}
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          {i18n.t('error.description')}
        </p>
        {error && (
          <pre className="text-left text-xs text-slate-600 bg-surface rounded-lg p-3 mb-6 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors"
          >
            {i18n.t('error.retry')}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-white rounded-md transition-all"
          >
            {i18n.t('error.reload')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <FallbackUI error={error as Error} resetError={resetError} />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

**변경 사항:**
- class component → Sentry.ErrorBoundary 래퍼 + FallbackUI 함수 컴포넌트
- `componentDidCatch` 수동 호출 제거 (Sentry가 자동 처리)
- 기존 fallback UI 100% 동일 유지
- export는 `ErrorBoundary` 이름 유지 (하위 호환)

---

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `lib/sentry.ts` | MODIFY | browserTracingIntegration + tracesSampleRate + startSpan 헬퍼 |
| `vite.config.ts` | MODIFY | sentryVitePlugin + sourcemap: 'hidden' |
| `components/ErrorBoundary.tsx` | REWRITE | Sentry.ErrorBoundary로 전환 |
| `lib/csvParser.ts` | MODIFY | startSpan 래핑 |
| `lib/dataProcessor.ts` | MODIFY | startSpan 래핑 |
| `lib/funnelEngine.ts` | MODIFY | startSpan 래핑 |
| `lib/retentionEngine.ts` | MODIFY | startSpan 래핑 |
| `lib/geminiClient.ts` | MODIFY | startSpanAsync 래핑 |

### 신규 의존성

| 패키지 | 용도 |
|--------|------|
| `@sentry/vite-plugin` | 빌드 시 source map 업로드 |

## 구현 순서

1. `@sentry/vite-plugin` 설치
2. `lib/sentry.ts` 수정 (tracing + 헬퍼)
3. `vite.config.ts` 수정 (source map plugin)
4. `components/ErrorBoundary.tsx` 전환
5. 5개 lib 파일 startSpan 래핑
6. 빌드 + 테스트 검증

## 성공 기준

- [ ] `Sentry.init` integrations에 browserTracingIntegration 포함
- [ ] `tracesSampleRate` > 0
- [ ] `startSpan` 헬퍼 함수 export
- [ ] 5개 lib 모듈에 커스텀 span 적용
- [ ] `sentryVitePlugin` 빌드 파이프라인 등록
- [ ] `sourcemap: 'hidden'` 활성화
- [ ] `Sentry.ErrorBoundary` 사용
- [ ] 기존 fallback UI 동일
- [ ] 310/310 테스트 통과
