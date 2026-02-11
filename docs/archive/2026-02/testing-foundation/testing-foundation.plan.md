# Plan: Testing Foundation (Phase 8)

## 1. Overview

FRE Analytics의 컴포넌트/훅 테스트 인프라를 구축하고 핵심 모듈 테스트를 추가합니다.
현재 14개 테스트 파일(lib 유닛 + 통합 테스트)만 존재하며, React 컴포넌트/훅 테스트는 0개입니다.
jsdom 환경, React Testing Library, 테스트 셋업 파일이 모두 미구성 상태입니다.

## 2. Problem Statement

| 문제 | 현재 상태 | 목표 |
|------|----------|------|
| 테스트 환경 | Node 전용 (jsdom 없음) | jsdom + React Testing Library |
| 컴포넌트 테스트 | 0개 | 핵심 컴포넌트 테스트 추가 |
| 훅 테스트 | 0개 | 핵심 커스텀 훅 테스트 추가 |
| 미테스트 lib | 13/20 모듈 | 주요 모듈 테스트 추가 |
| 테스트 패턴 | .ts만 지원 | .tsx 테스트 파일 지원 |
| 셋업 파일 | 없음 | setupTests.ts 생성 |
| 테스트 수 | 98개 | 150+ |

## 3. Requirements

### TF-1: React Testing Infrastructure Setup
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` 설치
- `vitest.config.ts` 환경을 `jsdom`으로 변경, `.tsx` 테스트 포함
- `setupTests.ts` 생성 (jest-dom matchers, 글로벌 mock)
- 기존 98개 테스트 통과 유지

### TF-2: Context & Reducer 테스트
- `context/reducer.ts` — 모든 액션 타입별 상태 변환 테스트
- `context/actions.ts` — 액션 생성 함수 테스트
- Provider 래퍼 유틸리티 (테스트용 renderWithProviders)

### TF-3: Custom Hook 테스트
- `usePlanGate` — 플랜별 기능 제한 로직 테스트
- `useColumnMapping` — 컬럼 매핑 로직 테스트
- `useClickOutside` — 외부 클릭 감지 테스트
- `useFunnelAnalysis` — 퍼널 분석 결과 생성 테스트
- `useRetentionAnalysis` — 리텐션 분석 결과 생성 테스트

### TF-4: UI 컴포넌트 테스트
- `Modal` — 열기/닫기, Escape 키, 오버레이 클릭
- `Toast` — 표시/자동 닫기, 타입별 스타일
- `PlanBadge` — 플랜별 텍스트/색상 렌더링
- `PageLoader` — 로딩 상태 렌더링
- `ErrorBoundary` — 에러 캐치 및 폴백 UI

### TF-5: Lib 모듈 테스트 확장
- `planManager.ts` — 플랜 유틸리티 함수 테스트
- `recentFiles.ts` — localStorage 기반 최근 파일 관리 테스트
- `eventUtils.ts` — 이벤트 유틸리티 함수 테스트
- `constants.ts` — 상수 값 무결성 테스트

### TF-6: 테스트 유틸리티 & 모킹
- `renderWithProviders` — AppContext + AuthContext 래핑 유틸리티
- Supabase mock — `vi.mock` 기반 Supabase 클라이언트 모킹
- localStorage mock — `vi.stubGlobal` 기반 localStorage 모킹
- Router mock — `MemoryRouter` 래핑 유틸리티

## 4. Scope

### In Scope
- React Testing Library + jsdom 인프라 구축
- 핵심 훅 5개 테스트
- 핵심 컴포넌트 5개 테스트
- 미테스트 lib 모듈 4개 테스트
- 테스트 유틸리티/모킹 헬퍼

### Out of Scope
- E2E 브라우저 테스트 (Playwright/Cypress) — 별도 Phase
- 페이지 전체 렌더링 테스트 — 복잡도 높아 별도 진행
- Supabase/Gemini 실제 API 테스트 — mock만 사용
- 스냅샷 테스트 — 유지보수 부담 큼
- 코드 커버리지 리포팅 — 인프라 구축 후 별도 추가

## 5. Success Criteria

| Metric | Target |
|--------|--------|
| 기존 테스트 | 98/98 유지 |
| 신규 테스트 | 50+ 추가 |
| 총 테스트 수 | 148+ |
| 테스트 파일 수 | 14 → 25+ |
| 빌드 | 깨지지 않음 |
| 테스트 실행 시간 | < 30초 |

## 6. Implementation Order

1. TF-1: Infrastructure Setup (vitest.config, setupTests, dependencies)
2. TF-6: Test Utilities & Mocks (renderWithProviders, mock helpers)
3. TF-5: Lib Module Tests (planManager, recentFiles, eventUtils, constants)
4. TF-2: Context & Reducer Tests
5. TF-3: Custom Hook Tests
6. TF-4: UI Component Tests

## 7. Files to Modify/Create

| File | Type | Changes |
|------|------|---------|
| `package.json` | MODIFY | devDependencies 추가 |
| `vitest.config.ts` | MODIFY | jsdom, include .tsx, setupFiles |
| `__tests__/setupTests.ts` | **NEW** | jest-dom, global mocks |
| `__tests__/helpers/renderWithProviders.tsx` | **NEW** | Provider 래핑 유틸리티 |
| `__tests__/helpers/mocks.ts` | **NEW** | Supabase/localStorage mock |
| `__tests__/unit/reducer.test.ts` | **NEW** | Reducer 테스트 |
| `__tests__/unit/actions.test.ts` | **NEW** | Actions 테스트 |
| `__tests__/unit/planManager.test.ts` | **NEW** | planManager 테스트 |
| `__tests__/unit/recentFiles.test.ts` | **NEW** | recentFiles 테스트 |
| `__tests__/unit/eventUtils.test.ts` | **NEW** | eventUtils 테스트 |
| `__tests__/unit/constants.test.ts` | **NEW** | constants 테스트 |
| `__tests__/hooks/usePlanGate.test.tsx` | **NEW** | usePlanGate 테스트 |
| `__tests__/hooks/useColumnMapping.test.tsx` | **NEW** | useColumnMapping 테스트 |
| `__tests__/hooks/useClickOutside.test.tsx` | **NEW** | useClickOutside 테스트 |
| `__tests__/hooks/useFunnelAnalysis.test.tsx` | **NEW** | useFunnelAnalysis 테스트 |
| `__tests__/hooks/useRetentionAnalysis.test.tsx` | **NEW** | useRetentionAnalysis 테스트 |
| `__tests__/components/Modal.test.tsx` | **NEW** | Modal 테스트 |
| `__tests__/components/Toast.test.tsx` | **NEW** | Toast 테스트 |
| `__tests__/components/PlanBadge.test.tsx` | **NEW** | PlanBadge 테스트 |
| `__tests__/components/PageLoader.test.tsx` | **NEW** | PageLoader 테스트 |
| `__tests__/components/ErrorBoundary.test.tsx` | **NEW** | ErrorBoundary 테스트 |

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| jsdom 환경 변경으로 기존 테스트 실패 | High | 기존 테스트에 `@vitest-environment node` 주석 추가 |
| React Testing Library 버전 호환 | Medium | React 19 호환 최신 버전 사용 |
| 테스트 실행 시간 증가 | Low | jsdom은 필요한 테스트에만 사용 |
| Mock 누락으로 테스트 불안정 | Medium | setupTests.ts에서 일괄 mock |
