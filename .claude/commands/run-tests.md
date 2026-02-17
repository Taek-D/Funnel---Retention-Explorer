$ARGUMENTS 범위의 테스트를 실행합니다.

## 사용법

- `/run-tests` — 전체 테스트 (Vitest)
- `/run-tests unit` — 단위 테스트만
- `/run-tests e2e` — E2E 테스트 (Playwright)
- `/run-tests 파일명` — 특정 파일 테스트

## 작업 순서

1. 인자 분석:
   - 없음 → `npx vitest run` (전체)
   - `unit` → `npx vitest run __tests__/unit`
   - `integration` → `npx vitest run __tests__/integration`
   - `e2e` → `npx playwright test`
   - 파일명 → `npx vitest run __tests__/**/*파일명*`
2. 테스트 실행
3. 결과 요약 (통과/실패/스킵 수)
4. 실패 테스트가 있으면 원인 분석 및 수정 제안

## 실행 위치

```bash
cd 'E:/프로젝트/데이터분석/Funnel---Retention-Explorer/funnel-&-retention-explorer frontend'
```

## 주의사항

- 전체 테스트: 362+ 유닛 + 13 E2E
- E2E는 Playwright Chromium 필요 (CI에서는 자동 설치)
