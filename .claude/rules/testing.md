---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "__tests__/**/*"
---

# Testing Rules

## 테스트 도구
- Vitest (vitest.config.ts) + @testing-library/react
- Playwright (E2E)

## 테스트 구조
```
__tests__/
  unit/          # lib/ 모듈 단위 테스트
  integration/   # 모듈 간 통합 테스트
  fixtures/      # CSV 샘플, mock 데이터
  helpers/       # 테스트 유틸리티
```

## 실행
- 전체: `npx vitest run`
- 감시: `npx vitest`
- 특정: `npx vitest run __tests__/unit/파일명.test.ts`

## 작성 규칙
- lib/ 모듈은 React 의존 없이 직접 import
- describe/it/expect 패턴 사용
- 테스트 데이터는 fixtures/에 RawRow[] 형태로
- 빈 배열, null, 0 등 엣지 케이스 반드시 포함
- 테스트명은 영어 ("should ..." 패턴)

## 우선순위
1. lib/dataProcessor.ts (자동 컬럼 매핑)
2. lib/columnValueDetector.ts (값 기반 추론)
3. lib/funnelEngine.ts (퍼널 계산)
4. lib/retentionEngine.ts (코호트 계산)
5. context/reducer.ts (상태 전이)
