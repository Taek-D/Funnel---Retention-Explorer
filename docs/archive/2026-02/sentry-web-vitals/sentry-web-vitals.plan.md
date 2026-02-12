# Sentry Web Vitals - Plan Document

## Overview

Sentry Performance Monitoring + Core Web Vitals 추적 활성화.
현재 Sentry는 에러 캡처만 수행(`tracesSampleRate: 0`). 브라우저 트레이싱 + Web Vitals 측정을 추가하여 실제 사용자 성능 데이터를 수집한다.

## Current State

- `@sentry/react` v10.38.0 설치 완료
- `lib/sentry.ts`: `tracesSampleRate: 0`, 에러 전용
- `ErrorBoundary`: `Sentry.captureException` 연동
- `@vercel/analytics` + `@vercel/speed-insights`: 렌더링 중 (별도 경로)
- `vite.config.ts`: `vendor-monitoring` chunk으로 Sentry/Vercel 번들 분리됨

## Scope

### SWV-1: Sentry Performance Tracing 활성화

`lib/sentry.ts`에서 `browserTracingIntegration` 추가.

- `tracesSampleRate`: 0.1 (프로덕션 10% 샘플링)
- `tracePropagationTargets`: Supabase API URL만 허용
- `browserTracingIntegration()` integration 등록
- react-router v7 연동 (`reactRouterV7BrowserTracingIntegration` 대신 기본 `browserTracingIntegration` 사용 — data router 방식)

### SWV-2: Sentry Source Maps 업로드

Vite 빌드 시 source map을 Sentry에 업로드하여 프로덕션 스택 트레이스를 readable하게.

- `@sentry/vite-plugin` 설치
- `vite.config.ts`에 `sentryVitePlugin` 추가
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` 환경 변수 필요
- `build.sourcemap` 활성화 (hidden source maps)
- CI/CD (GitHub Actions)에서 환경 변수 설정

### SWV-3: Custom Performance Spans

주요 사용자 작업에 커스텀 span 추가.

- CSV 파싱 (`csvParser.ts` parseCSV)
- 데이터 프로세싱 (`dataProcessor.ts` processData)
- 퍼널 분석 (`funnelEngine.ts` calculateFunnel)
- 리텐션 분석 (`retentionEngine.ts` calculateRetention)
- AI 인사이트 요청 (`geminiClient.ts`)

### SWV-4: Sentry ErrorBoundary 전환

현재 커스텀 `ErrorBoundary`를 `Sentry.ErrorBoundary` 래퍼로 전환.

- `Sentry.withErrorBoundary` 또는 `<Sentry.ErrorBoundary>` 사용
- 기존 fallback UI 유지
- `componentDidCatch` 수동 호출 제거 (Sentry가 자동 처리)

## Out of Scope

- Sentry Session Replay (비용 고려, 추후 검토)
- Sentry Profiling (React 프로파일링은 dev tools로 충분)
- 커스텀 대시보드/알림 규칙 (Sentry 웹 UI에서 수동 설정)
- `@vercel/analytics` / `@vercel/speed-insights` 제거 (병행 유지)

## Dependencies

- `@sentry/vite-plugin` (신규 설치)
- Sentry 프로젝트 DSN (이미 `VITE_SENTRY_DSN` 환경 변수 존재)
- Sentry Auth Token (source map 업로드용, CI 환경 변수)

## Estimation

- Complexity: Small (기존 인프라 확장)
- Files: ~6개 수정
- Risk: Low (기존 에러 캡처 유지, 성능 측정만 추가)

## Success Criteria

- [ ] Sentry Performance 대시보드에 트랜잭션 표시
- [ ] Core Web Vitals (LCP, CLS, INP, TTFB) 데이터 수집
- [ ] CSV 파싱/분석 커스텀 span 측정
- [ ] 프로덕션 빌드에 source map 업로드
- [ ] 기존 에러 캡처 동작 유지
- [ ] 번들 사이즈 증가 50KB 이하
