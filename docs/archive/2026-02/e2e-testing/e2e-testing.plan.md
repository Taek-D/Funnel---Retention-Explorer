# E2E Testing - Plan Document

## Feature Overview

Playwright E2E 테스트를 도입하여 주요 사용자 플로우를 자동화 검증합니다.
기존 Vitest 310개 단위/통합 테스트 + Playwright E2E로 테스트 피라미드를 완성합니다.

## Background

- 현재: Vitest + jsdom + @testing-library/react (310 tests, 단위/통합/컴포넌트)
- 부족: 실제 브라우저 환경 E2E 테스트 없음 (라우팅, 네비게이션, 실제 렌더링 검증 불가)
- 목표: 핵심 사용자 플로우 5개를 Playwright로 자동화

## Scope

### E2E-1: Playwright 인프라 설정
- `@playwright/test` 패키지 설치
- `playwright.config.ts` 설정 (baseURL: localhost:3000, Chromium only)
- `e2e/` 디렉토리 구조 생성
- package.json에 `test:e2e` 스크립트 추가
- `.gitignore`에 Playwright 아티팩트 추가

### E2E-2: 랜딩 & 네비게이션 테스트
- 랜딩 페이지 렌더링 확인
- "시작하기" 버튼 → /app/dashboard 이동
- 사이드바 네비게이션 (각 메뉴 클릭 → 올바른 페이지)
- 404 페이지 표시

### E2E-3: 데이터 업로드 & 샘플 데이터 플로우
- /app/upload 페이지 렌더링
- "이커머스 샘플" 버튼 클릭 → 데이터 로드 → 대시보드 이동
- 대시보드 KPI 카드 값 표시 확인
- "SaaS 샘플" 버튼 → 구독 분석 데이터 로드

### E2E-4: 퍼널 분석 플로우
- 샘플 데이터 로드 후 /app/funnels 이동
- 이벤트 선택 → "퍼널 계산" 클릭
- 퍼널 차트 렌더링 확인
- 전환율 표시 확인

### E2E-5: 리텐션 분석 플로우
- 샘플 데이터 로드 후 /app/retention 이동
- 코호트 이벤트 선택 → "리텐션 계산" 클릭
- 히트맵/테이블 렌더링 확인

## Out of Scope

- 로그인/회원가입 E2E (Supabase Auth 의존, mock 필요)
- 결제 플로우 E2E (TossPayments 외부 의존)
- Admin 페이지 E2E (role 의존)
- CI 연동 (추후 GitHub Actions에 추가)
- 크로스 브라우저 (Chromium only로 시작)

## Implementation Order

```
E2E-1 → E2E-2 → E2E-3 → E2E-4 → E2E-5
```

## Success Criteria

- Playwright 테스트 5개 스펙 파일, 15+ 테스트 케이스
- `npm run test:e2e` 로 전체 실행 가능
- 기존 Vitest 310 테스트 영향 없음
- 헤드리스 모드에서 전체 통과

## Dependencies

- `@playwright/test` (devDependency)
- Vite dev server (port 3000)
- 샘플 데이터 생성 (lib/sampleData.ts — 이미 존재)

## Risks

- Dev server 시작/종료 타이밍 (webServer 설정으로 해결)
- 비동기 데이터 처리 대기 (적절한 waitFor/locator 사용)
- CI 환경 Chromium 설치 (추후 `npx playwright install` CI step 추가)
