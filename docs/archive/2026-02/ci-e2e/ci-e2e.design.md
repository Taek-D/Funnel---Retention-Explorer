# CI E2E Integration - Design Document

## Overview

GitHub Actions CI에 Playwright E2E 테스트 4개 step을 추가합니다.
단일 파일 `.github/workflows/ci.yml` 수정.

## References

- Plan: `docs/01-plan/features/ci-e2e.plan.md`
- Current CI: `.github/workflows/ci.yml`
- Playwright Config: `funnel-&-retention-explorer frontend/playwright.config.ts`

---

## CI-1: Playwright 브라우저 캐싱

### Step: Cache Playwright browsers

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
```

**설계 포인트**:
- `package-lock.json` 해시 기반 캐시 키 (Playwright 버전 변경 시 자동 무효화)
- `id: playwright-cache`로 캐시 히트 여부 참조 가능
- Build step 이전에 배치 (Install dependencies 이후)

---

## CI-2: Playwright Chromium 설치

### Step: Install Playwright Chromium

```yaml
- name: Install Playwright Chromium
  run: npx playwright install --with-deps chromium
```

**설계 포인트**:
- `--with-deps`: Ubuntu 시스템 라이브러리(libgbm, libnss3 등) 자동 설치
- `chromium`만 지정 (Firefox/WebKit 불필요)
- 캐시 히트 시에도 실행 (시스템 deps는 캐시되지 않음)

---

## CI-3: E2E 테스트 실행

### Step: Run E2E tests

```yaml
- name: Run E2E tests
  run: npx playwright test
```

**설계 포인트**:
- 기존 "Run tests" (Vitest) + "Build" 이후에 배치
- `playwright.config.ts`의 `webServer`가 자동으로 Vite dev server 시작
- CI 환경에서 자동 적용: `forbidOnly: true`, `retries: 1`, `reuseExistingServer: false`
- Build step 이후에 배치하여 빌드 실패 시 E2E 스킵

---

## CI-4: 테스트 아티팩트 업로드

### Step: Upload Playwright report

```yaml
- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-report
    path: './funnel-&-retention-explorer frontend/playwright-report/'
    retention-days: 7
```

**설계 포인트**:
- `if: ${{ !cancelled() }}`: 테스트 실패 시에도 업로드 (디버깅용)
- `retention-days: 7`: 7일 보관 (저장 공간 절약)
- `path`에 working-directory prefix 필요 (upload-artifact는 defaults.run.working-directory 무시)

---

## 전체 워크플로우

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

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: Run unit tests
        run: npx vitest run

      - name: Build
        run: npx vite build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: './funnel-&-retention-explorer frontend/playwright-report/'
          retention-days: 7
```

## 변경 사항 요약

| Step 이름 | 변경 | 위치 |
|-----------|------|------|
| "Run tests" → "Run unit tests" | RENAME | 기존 step |
| Cache Playwright browsers | ADD | Install deps 이후 |
| Install Playwright Chromium | ADD | Cache 이후 |
| Run E2E tests | ADD | Build 이후 |
| Upload Playwright report | ADD | 마지막 |

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `.github/workflows/ci.yml` | MODIFY | 4 steps 추가 + 1 step 이름 변경 |

## 성공 기준

- [ ] PR 생성 시 unit tests → build → e2e tests 순서 실행
- [ ] Playwright 브라우저 캐싱 작동
- [ ] E2E 실패 시 playwright-report 아티팩트 업로드
- [ ] 기존 CI 동작 (Vitest + Build) 영향 없음
