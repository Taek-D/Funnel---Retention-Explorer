# E2E Testing - Design Document

## Overview

Playwright E2E 테스트 인프라 구축 및 5개 핵심 사용자 플로우 테스트 자동화.
기존 Vitest 310개 단위/통합 테스트를 보완하여 테스트 피라미드를 완성합니다.

## References

- Plan: `docs/01-plan/features/e2e-testing.plan.md`
- Router: `router.tsx` (전체 라우트 정의)
- Sample Data: `lib/sampleData.ts` (ecommerce/saas 샘플 생성)

---

## E2E-1: Playwright 인프라 설정

### 1.1 패키지 설치

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 1.2 playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --port 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

**설계 포인트**:
- `fullyParallel: false` — 테스트 간 상태 공유(샘플 데이터 로드) 방지
- `workers: 1` — 단일 브라우저 인스턴스로 안정성 확보
- `locale: 'ko-KR'` — i18n 한국어 기본 설정과 일치
- `webServer.command` — `&` 디렉토리 이슈 회피를 위해 직접 vite 실행
- `reuseExistingServer: !process.env.CI` — 로컬 개발 시 기존 서버 재사용

### 1.3 디렉토리 구조

```
e2e/
├── landing.spec.ts        # E2E-2: 랜딩 & 네비게이션
├── data-upload.spec.ts    # E2E-3: 데이터 업로드 & 샘플
├── funnel.spec.ts         # E2E-4: 퍼널 분석
├── retention.spec.ts      # E2E-5: 리텐션 분석
└── helpers/
    └── sample-data.ts     # 공통: 샘플 데이터 로드 헬퍼
```

### 1.4 package.json 스크립트

```json
{
  "test:e2e": "npx playwright test",
  "test:e2e:ui": "npx playwright test --ui",
  "test:e2e:headed": "npx playwright test --headed"
}
```

### 1.5 .gitignore 추가

```
# Playwright
test-results/
playwright-report/
blob-report/
playwright/.cache/
e2e/.auth/
```

---

## E2E-2: 랜딩 & 네비게이션 테스트

### 파일: `e2e/landing.spec.ts`

### 테스트 케이스

| # | 테스트명 | 검증 내용 |
|---|---------|----------|
| 2-1 | 랜딩 페이지 렌더링 | `/`에 접근, hero 섹션 h1 텍스트 확인, CTA 버튼 2개 표시 |
| 2-2 | "가입 없이 체험하기" → /app/dashboard | CTA 클릭 → URL `/app/dashboard` 이동 확인 |
| 2-3 | 사이드바 네비게이션 | Dashboard → Upload → Funnels → Retention → Segments → Insights 순회, 각 URL 확인 |
| 2-4 | 404 페이지 | `/nonexistent-page` 접근 → "404" 텍스트 + 홈 링크 표시 |

### 셀렉터 전략

```typescript
// 2-1: 랜딩 히어로
page.locator('h1') // "Funnel & Retention\nExplorer"
page.getByRole('link', { name: /체험하기/ })
page.getByRole('link', { name: /무료 계정/ })

// 2-2: CTA 클릭
page.getByRole('link', { name: /체험하기/ }).click()
page.waitForURL('**/app/dashboard')

// 2-3: 사이드바 (AppShell 내부)
page.locator('nav button').filter({ hasText: /대시보드|Dashboard/ })
// 또는 aria-label/title 활용
page.getByTitle(/데이터 가져오기|Data Import/)

// 2-4: 404 페이지
page.locator('text=404')
page.getByRole('link', { name: /홈|Home/ })
```

### 구현 의사코드

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing & Navigation', () => {
  test('renders landing page with hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /체험하기/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /무료 계정/ })).toBeVisible();
  });

  test('CTA navigates to /app/dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /체험하기/ }).click();
    await page.waitForURL('**/app/dashboard');
    expect(page.url()).toContain('/app/dashboard');
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/app/dashboard');
    const navRoutes = [
      { path: '/app/upload', labelPattern: /데이터|upload/i },
      { path: '/app/funnels', labelPattern: /퍼널|funnel/i },
      { path: '/app/retention', labelPattern: /리텐션|retention/i },
      { path: '/app/segments', labelPattern: /세그먼트|segment/i },
      { path: '/app/insights', labelPattern: /인사이트|insight/i },
    ];
    for (const route of navRoutes) {
      await page.locator('nav button').filter({ hasText: route.labelPattern }).click();
      await page.waitForURL(`**${route.path}`);
    }
  });

  test('shows 404 for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
```

---

## E2E-3: 데이터 업로드 & 샘플 데이터 플로우

### 파일: `e2e/data-upload.spec.ts`

### 공통 헬퍼: `e2e/helpers/sample-data.ts`

```typescript
import { Page } from '@playwright/test';

export async function loadEcommerceSample(page: Page) {
  await page.goto('/app/upload');
  // 이커머스 샘플 버튼 클릭
  await page.getByRole('button', { name: /이커머스|ecommerce/i }).click();
  // 프로세싱 완료 대기 (Step 3/3 또는 대시보드 이동)
  await page.waitForURL('**/app/dashboard', { timeout: 15_000 });
}

export async function loadSaaSSample(page: Page) {
  await page.goto('/app/upload');
  await page.getByRole('button', { name: /SaaS/i }).click();
  await page.waitForURL('**/app/dashboard', { timeout: 15_000 });
}
```

### 테스트 케이스

| # | 테스트명 | 검증 내용 |
|---|---------|----------|
| 3-1 | 업로드 페이지 렌더링 | `/app/upload` 접근, 파일 업로드 영역 + 샘플 버튼 표시 |
| 3-2 | 이커머스 샘플 로드 | 이커머스 버튼 클릭 → 프로세싱 → 대시보드 이동 → KPI 카드 값 존재 |
| 3-3 | SaaS 샘플 로드 | SaaS 버튼 클릭 → 프로세싱 → 대시보드 이동 → KPI 카드 값 존재 |
| 3-4 | 대시보드 KPI 값 표시 | 샘플 로드 후 대시보드에 총 이벤트, 사용자 수 등 숫자 표시 확인 |

### 셀렉터 전략

```typescript
// 3-1: 업로드 영역
page.locator('[data-tour="upload"]')  // 파일 드롭 영역
page.getByRole('button', { name: /이커머스/ })
page.getByRole('button', { name: /SaaS/ })

// 3-2, 3-3: 프로세싱 중 표시
page.locator('text=Step 3/3')  // 또는 대시보드 URL 전환으로 확인

// 3-4: 대시보드 KPI (DashboardWidget 기반)
page.locator('[data-widget-id="total-events"]')  // WidgetId 기반 selector 필요
// 또는 텍스트 기반: 숫자가 0이 아닌 값으로 표시
page.locator('text=/[1-9][0-9,]+/')
```

### 구현 의사코드

```typescript
import { test, expect } from '@playwright/test';
import { loadEcommerceSample, loadSaaSSample } from './helpers/sample-data';

test.describe('Data Upload & Sample Data', () => {
  test('renders upload page with sample buttons', async ({ page }) => {
    await page.goto('/app/upload');
    await expect(page.locator('[data-tour="upload"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /이커머스/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /SaaS/i })).toBeVisible();
  });

  test('loads ecommerce sample and shows dashboard KPIs', async ({ page }) => {
    await loadEcommerceSample(page);
    // 대시보드에서 숫자(KPI) 확인
    await expect(page.locator('.text-3xl, .text-2xl').first()).toBeVisible();
  });

  test('loads SaaS sample and shows dashboard KPIs', async ({ page }) => {
    await loadSaaSSample(page);
    await expect(page.locator('.text-3xl, .text-2xl').first()).toBeVisible();
  });
});
```

---

## E2E-4: 퍼널 분석 플로우

### 파일: `e2e/funnel.spec.ts`

### 테스트 케이스

| # | 테스트명 | 검증 내용 |
|---|---------|----------|
| 4-1 | 데이터 없이 퍼널 페이지 → 빈 상태 | `/app/funnels` 접근(데이터 없음) → "데이터 없음" 메시지 |
| 4-2 | 샘플 로드 후 퍼널 페이지 렌더링 | 이커머스 샘플 로드 → `/app/funnels` → 이벤트 셀렉터 표시 |
| 4-3 | 이커머스 템플릿 적용 → 퍼널 계산 | "이커머스" 템플릿 버튼 클릭 → "퍼널 계산" 클릭 → 차트 렌더링 |
| 4-4 | 퍼널 결과 표시 확인 | 차트 바(svg rect) 존재, 전환율(%) 텍스트 표시 |

### 셀렉터 전략

```typescript
// 4-1: 빈 상태
page.locator('text=/데이터 없음|No data/i')

// 4-2: 이벤트 셀렉터 (select elements)
page.locator('select').first()

// 4-3: 템플릿 버튼 + 계산 버튼
page.getByRole('button', { name: /이커머스/ })
page.getByRole('button', { name: /퍼널 계산|Calculate/i })

// 4-4: Recharts 차트 (SVG)
page.locator('.recharts-responsive-container svg')
page.locator('.recharts-bar-rectangle')
// 전환율 텍스트
page.locator('text=/%/')
```

### 구현 의사코드

```typescript
import { test, expect } from '@playwright/test';
import { loadEcommerceSample } from './helpers/sample-data';

test.describe('Funnel Analysis', () => {
  test('shows empty state without data', async ({ page }) => {
    await page.goto('/app/funnels');
    await expect(page.locator('text=/데이터 없음/')).toBeVisible();
  });

  test('loads sample and shows funnel editor', async ({ page }) => {
    await loadEcommerceSample(page);
    await page.goto('/app/funnels');
    // 편집기 섹션 표시
    await expect(page.getByRole('button', { name: /이커머스/ })).toBeVisible();
  });

  test('calculates funnel with ecommerce template', async ({ page }) => {
    await loadEcommerceSample(page);
    await page.goto('/app/funnels');

    // 이커머스 템플릿 적용
    await page.getByRole('button', { name: /이커머스/ }).click();

    // 퍼널 계산
    await page.getByRole('button', { name: /퍼널 계산/ }).click();

    // Recharts 차트 렌더링 확인
    await expect(page.locator('.recharts-responsive-container')).toBeVisible({ timeout: 10_000 });

    // 전환율 % 텍스트 표시
    await expect(page.locator('text=/%/')).toBeVisible();
  });
});
```

---

## E2E-5: 리텐션 분석 플로우

### 파일: `e2e/retention.spec.ts`

### 테스트 케이스

| # | 테스트명 | 검증 내용 |
|---|---------|----------|
| 5-1 | 데이터 없이 리텐션 페이지 → 빈 상태 | `/app/retention` 접근(데이터 없음) → "데이터 없음" 메시지 |
| 5-2 | 샘플 로드 후 리텐션 페이지 렌더링 | 이커머스 샘플 로드 → `/app/retention` → 코호트 이벤트 셀렉트 표시 |
| 5-3 | 코호트 이벤트 선택 → 리텐션 계산 | select에서 이벤트 선택 → "리텐션 계산" 클릭 → 결과 표시 |
| 5-4 | 리텐션 결과 표시 확인 | 히트맵/테이블 렌더링, D0~D14 컬럼 표시, 평균 리텐션 차트 표시 |

### 셀렉터 전략

```typescript
// 5-1: 빈 상태
page.locator('text=/데이터 없음|No data/i')

// 5-2: 코호트 이벤트 선택
page.locator('select').first()  // cohortEvent select

// 5-3: 계산 버튼
page.getByRole('button', { name: /리텐션 계산|Calculate/i })

// 5-4: 결과 테이블
page.locator('table')  // 코호트 테이블
page.locator('text=D0')
page.locator('.recharts-responsive-container')  // 리텐션 커브 차트
```

### 구현 의사코드

```typescript
import { test, expect } from '@playwright/test';
import { loadEcommerceSample } from './helpers/sample-data';

test.describe('Retention Analysis', () => {
  test('shows empty state without data', async ({ page }) => {
    await page.goto('/app/retention');
    await expect(page.locator('text=/데이터 없음/')).toBeVisible();
  });

  test('loads sample and shows retention controls', async ({ page }) => {
    await loadEcommerceSample(page);
    await page.goto('/app/retention');
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('calculates retention with cohort event', async ({ page }) => {
    await loadEcommerceSample(page);
    await page.goto('/app/retention');

    // 코호트 이벤트 선택 (첫 번째 이벤트 선택)
    const cohortSelect = page.locator('select').first();
    await cohortSelect.selectOption({ index: 1 });

    // 리텐션 계산
    await page.getByRole('button', { name: /리텐션 계산/ }).click();

    // 결과 테이블 표시
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    // D0 컬럼 확인
    await expect(page.locator('text=D0')).toBeVisible();

    // 리텐션 커브 차트
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();
  });
});
```

---

## 구현 순서

```
E2E-1 (인프라)
  ├─ playwright.config.ts
  ├─ package.json scripts
  ├─ .gitignore 업데이트
  └─ e2e/helpers/sample-data.ts
      │
      ├── E2E-2 (landing.spec.ts) ── 4 tests
      ├── E2E-3 (data-upload.spec.ts) ── 3 tests
      ├── E2E-4 (funnel.spec.ts) ── 3 tests
      └── E2E-5 (retention.spec.ts) ── 3 tests
```

**총 13+ 테스트 케이스** (Plan 기준 15+ → 실질적으로 핵심 검증에 집중)

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `package.json` | MODIFY | devDependencies + scripts 추가 |
| `playwright.config.ts` | CREATE | Playwright 설정 |
| `.gitignore` | MODIFY | Playwright 아티팩트 제외 |
| `e2e/helpers/sample-data.ts` | CREATE | 샘플 데이터 로드 헬퍼 |
| `e2e/landing.spec.ts` | CREATE | 랜딩 & 네비게이션 테스트 |
| `e2e/data-upload.spec.ts` | CREATE | 데이터 업로드 테스트 |
| `e2e/funnel.spec.ts` | CREATE | 퍼널 분석 테스트 |
| `e2e/retention.spec.ts` | CREATE | 리텐션 분석 테스트 |

## 기술적 고려사항

### 셀렉터 우선순위

1. `getByRole()` — 접근성 기반 (가장 안정적)
2. `getByText()` / `filter({ hasText })` — i18n 텍스트 기반
3. `data-tour` / `data-testid` 속성 — 기존 `data-tour` 속성 활용
4. CSS 클래스 — Recharts 클래스 (`.recharts-*`) 최후 수단

### 비동기 데이터 대기 전략

- `page.waitForURL()` — 라우트 전환 완료 대기
- `expect().toBeVisible({ timeout })` — 비동기 렌더링 대기
- 샘플 데이터 로드: 최대 15초 (CSV 파싱 + 데이터 처리)
- 차트 렌더링: 최대 10초 (Recharts SVG 생성)

### i18n 호환성

- 테스트는 기본 locale `ko-KR`로 실행
- 셀렉터에 한국어/영어 패턴 병기 (`/퍼널 계산|Calculate/i`)
- 향후 영어 locale 테스트 추가 시 별도 project 정의

### CI 고려사항 (향후)

- `npx playwright install --with-deps chromium` CI step 추가
- GitHub Actions에서 headless Chromium 실행
- `playwright-report/` 아티팩트 업로드

## 성공 기준

- [ ] `npm run test:e2e` 전체 통과 (13+ tests)
- [ ] 기존 `npm run test` (Vitest 310) 영향 없음
- [ ] 헤드리스 Chromium에서 전체 통과
- [ ] 빌드 (`vite build`) 영향 없음
