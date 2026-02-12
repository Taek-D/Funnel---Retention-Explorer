# CI E2E Integration - Plan Document

## Feature Overview

GitHub Actions CI 파이프라인에 Playwright E2E 테스트를 추가합니다.
기존 Vitest 단위 테스트 + 빌드에 이어 E2E 테스트까지 PR 자동 검증을 완성합니다.

## Background

- 현재: `.github/workflows/ci.yml` — Vitest run + Vite build (PR 시 자동)
- 추가: Playwright 13개 E2E 테스트를 CI에서 실행
- `playwright.config.ts`에 이미 CI 분기 설정 완료 (forbidOnly, retries:1, reuseExistingServer:false)

## Scope

### CI-1: Playwright 브라우저 설치 step 추가
- `npx playwright install --with-deps chromium` step
- Chromium만 설치 (Firefox/WebKit 불필요)
- `--with-deps`로 Ubuntu 시스템 의존성 포함

### CI-2: E2E 테스트 실행 step 추가
- `npx playwright test` step (Vitest + Build 이후)
- webServer가 자동으로 Vite dev server 시작
- CI 환경변수 자동 인식 (`process.env.CI`)

### CI-3: 테스트 아티팩트 업로드
- 실패 시 `playwright-report/` 아티팩트 업로드
- `actions/upload-artifact@v4` 사용
- `if: ${{ !cancelled() }}` 조건으로 실패/취소 시에도 업로드

### CI-4: Playwright 브라우저 캐싱 (선택)
- `~/.cache/ms-playwright` 디렉토리 캐싱
- `actions/cache@v4` 사용
- `@playwright/test` 버전 기반 캐시 키

## Out of Scope

- 병렬 E2E job (현재 13 테스트로 불필요)
- Sharding (테스트 분할 실행)
- 크로스 브라우저 CI (Chromium only)
- Vercel Preview Deploy 후 E2E (향후 고려)
- main 브랜치 push 시 E2E 실행 (PR only 유지)

## Implementation Order

```
CI-1 (Chromium 설치) → CI-2 (E2E 실행) → CI-3 (아티팩트) → CI-4 (캐싱)
```

모두 단일 파일 `.github/workflows/ci.yml` 수정.

## Success Criteria

- PR 생성 시 Vitest + Build + E2E 순서로 실행
- E2E 13/13 통과
- 실패 시 playwright-report 아티팩트 다운로드 가능
- 기존 CI 시간 대비 +2분 이내 증가

## Dependencies

- `@playwright/test` (이미 devDependency)
- `actions/upload-artifact@v4`
- `actions/cache@v4` (선택)

## Risks

- Ubuntu CI에서 Chromium 시스템 의존성 누락 → `--with-deps` 플래그로 해결
- Vite dev server 시작 타임아웃 → webServer timeout 60초 설정 완료
- CI 실행 시간 증가 → 브라우저 캐싱으로 완화
