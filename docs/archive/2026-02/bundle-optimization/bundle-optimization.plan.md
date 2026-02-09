# Bundle Optimization Planning Document

> **Summary**: Vite code splitting + manualChunks로 1,013KB 단일 번들을 최적화
>
> **Project**: Funnel & Retention Explorer
> **Version**: 0.0.0
> **Author**: PDCA Phase 3
> **Date**: 2026-02-09
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 프로덕션 빌드가 **단일 JS 파일 1,013KB** (gzip 298KB)로 출력됩니다. Vite 500KB 경고를 초과하며, 초기 로드 성능과 캐시 효율이 낮습니다. Code splitting과 lazy loading을 통해 번들을 분할하고 초기 로드 크기를 줄입니다.

### 1.2 Background

- Phase 1 (Stability & Security): 87→95/100
- Phase 2 (Code Quality): 95→98/100
- Phase 3: **번들 최적화**로 성능 및 배포 효율성 개선
- 현재 모든 페이지, 라이브러리, 차트가 하나의 번들에 포함되어 있음
- 랜딩 페이지 방문자도 앱 전체 코드를 다운로드하는 비효율 구조

### 1.3 Related Documents

- Phase 1 Report: `docs/archive/2026-02/stability-security/stability-security.report.md`
- Phase 2 Report: `docs/archive/2026-02/code-quality/code-quality.report.md`

---

## 2. Scope

### 2.1 In Scope

- [x] B1: Vite `manualChunks` 설정으로 vendor 라이브러리 분리
- [x] B2: React Router lazy loading으로 페이지 단위 code splitting
- [x] B3: 무거운 lib 모듈 dynamic import (reportEngine, geminiClient)
- [x] B4: 빌드 검증 및 성능 측정

### 2.2 Out of Scope

- Tree shaking 개별 라이브러리 최적화 (recharts 등은 이미 tree-shakable)
- CDN 캐싱 정책 변경 (Vercel 기본값 사용)
- SSR/SSG 전환
- 이미지/폰트 최적화
- Tailwind CSS 최적화 (CDN 사용 중이므로 빌드에 미포함)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | vendor 라이브러리를 별도 chunk로 분리 (recharts, supabase, papaparse, react-router) | High | Pending |
| FR-02 | /app/* 페이지를 lazy loading으로 전환 | High | Pending |
| FR-03 | reportEngine.ts를 dynamic import로 전환 | Medium | Pending |
| FR-04 | geminiClient.ts를 dynamic import로 전환 | Medium | Pending |
| FR-05 | Suspense fallback UI 추가 | Medium | Pending |
| FR-06 | 기존 모든 테스트 통과 유지 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 초기 로드 JS < 500KB (메인 chunk) | `vite build` 출력 확인 |
| Performance | 각 chunk < 500KB | `vite build` 출력 확인 |
| Caching | vendor chunk는 라이브러리 변경 시에만 갱신 | content hash 기반 파일명 |
| Compatibility | 기존 라우팅, 인증, 상태관리 동작 유지 | 수동 테스트 + Vitest |

---

## 4. Current State Analysis

### 4.1 Bundle Composition (1,013KB single chunk)

```
현재 번들 구성 (추정):
┌─────────────────────────────────────────┐
│ recharts          ~400KB (39%)          │ → vendor-charts chunk
│ @supabase/supabase-js ~150KB (15%)     │ → vendor-supabase chunk
│ react + react-dom ~140KB (14%)         │ → vendor-react chunk
│ react-router-dom  ~50KB (5%)           │ → vendor-react chunk
│ papaparse         ~50KB (5%)           │ → vendor-data chunk
│ lucide-react      ~30KB (3%)           │ → vendor-ui chunk
│ App code          ~193KB (19%)         │ → page chunks
└─────────────────────────────────────────┘
Total: 1,013KB minified / 298KB gzip
```

### 4.2 Import Dependency Map

| Module | Imported By | Lazy Loadable? |
|--------|-------------|:--------------:|
| recharts | Dashboard, FunnelAnalysis, RetentionAnalysis | Yes (page-level) |
| papaparse | csvParser.ts → useCSVUpload → DataImport | Yes (page-level) |
| @supabase/supabase-js | supabase.ts → AuthContext (global) | No (auth needed at init) |
| reportEngine.ts (393 lines) | useExportReport hook only | Yes (on-demand) |
| geminiClient.ts (115 lines) | useAIInsights hook only | Yes (on-demand) |
| lucide-react | Icons.tsx (centralized re-export) | No (used everywhere) |

### 4.3 Route Structure (Lazy Loading Candidates)

| Route | Page Component | Heavy Dependencies | Lazy? |
|-------|---------------|-------------------|:-----:|
| `/` | LandingPage | None | No (entry point) |
| `/login` | LoginPage | None | Yes |
| `/signup` | SignupPage | None | Yes |
| `/app/dashboard` | Dashboard | recharts | Yes |
| `/app/upload` | DataImport | papaparse (via csvParser) | Yes |
| `/app/funnels` | FunnelAnalysis | recharts | Yes |
| `/app/retention` | RetentionAnalysis | recharts | Yes |
| `/app/segments` | SegmentComparison | None | Yes |
| `/app/insights` | Insights | None | Yes |

---

## 5. Optimization Strategy

### 5.1 Task B1: Vite manualChunks (vendor splitting)

`vite.config.ts`에 `build.rollupOptions.output.manualChunks` 추가:

```
vendor-react:    react, react-dom, react-router-dom
vendor-charts:   recharts
vendor-supabase: @supabase/supabase-js
vendor-data:     papaparse
```

**Expected Result**: vendor 라이브러리가 별도 파일로 분리 → 코드 변경 시 vendor cache 유지

### 5.2 Task B2: Route-level Lazy Loading

`router.tsx`에서 `React.lazy()` + `<Suspense>` 적용:
- LandingPage: 즉시 로드 (entry point)
- LoginPage, SignupPage: lazy load
- AppShell 하위 모든 페이지: lazy load

### 5.3 Task B3: Dynamic Import for Heavy Libs

- `reportEngine.ts`: useExportReport에서 `await import()` 사용
- `geminiClient.ts`: useAIInsights에서 `await import()` 사용

### 5.4 Task B4: Build Verification

- `vite build` 실행 후 각 chunk 크기 확인
- 모든 chunk < 500KB 목표
- `npx vitest run` 전체 테스트 통과 확인

---

## 6. Success Criteria

### 6.1 Definition of Done

- [x] manualChunks 설정으로 vendor 분리
- [x] Route-level lazy loading 적용 (8개 페이지)
- [x] reportEngine + geminiClient dynamic import
- [x] Suspense fallback UI 추가
- [x] 모든 chunk < 500KB
- [x] 기존 테스트 98/98 통과
- [x] 빌드 성공

### 6.2 Target Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Total chunks | 1 | 6~10 |
| Largest chunk | 1,013KB | < 500KB |
| Initial load JS | 1,013KB | < 300KB |
| Gzip total | 298KB | < 300KB (유지, 분할로 초기 감소) |
| Vite warning | Yes (>500KB) | No |
| Tests passing | 98/98 | 98/98 |

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Lazy loading으로 페이지 전환 시 깜빡임 | Medium | Medium | Suspense fallback에 스피너 추가 |
| manualChunks 설정 오류로 빌드 실패 | High | Low | chunk 함수에서 node_modules path 기반 분류 |
| Dynamic import로 타입 에러 | Medium | Low | 기존 export 인터페이스 유지, 호출부만 변경 |
| Supabase chunk 분리 시 AuthContext 초기화 지연 | High | Low | Supabase는 별도 chunk이되 lazy load하지 않음 |
| 테스트에서 lazy component mock 필요 | Medium | Medium | Vitest에서 직접 import하므로 영향 없음 |

---

## 8. Architecture Considerations

### 8.1 Project Level

| Level | Selected |
|-------|:--------:|
| **Dynamic** | ✅ |

### 8.2 Key Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Chunk strategy | manualChunks (함수형) | 라이브러리별 세밀한 제어 가능 |
| Lazy loading method | React.lazy + Suspense | React 표준, 추가 라이브러리 불필요 |
| Dynamic import target | reportEngine, geminiClient | 사용 빈도 낮고 용량 큰 모듈 |
| Fallback UI | Tailwind 스피너 | 기존 디자인 시스템 활용 |

---

## 9. Next Steps

1. [ ] Design document 작성 (`/pdca design bundle-optimization`)
2. [ ] 구현 (`/pdca do bundle-optimization`)
3. [ ] Gap analysis (`/pdca analyze bundle-optimization`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-09 | Initial draft | PDCA Phase 3 |
