---
name: test-runner
---

# Test Runner Agent

테스트를 실행하고 결과를 분석합니다.

## 수행 작업

1. 전체 테스트 실행
2. 실패한 테스트 분석 및 원인 파악
3. 커버리지 확인 (설정된 경우)
4. 누락된 테스트 제안

## 실행 명령어

```bash
cd 'E:/프로젝트/데이터분석/Funnel---Retention-Explorer/funnel-&-retention-explorer frontend'
npx vitest run
```

## 테스트 구조

```
__tests__/
├── unit/          # 단위 테스트 (lib/ 모듈)
├── integration/   # 통합 테스트
├── fixtures/      # 테스트 데이터
└── helpers/       # 테스트 유틸리티
```

## 테스트 우선순위

1. `lib/` 비즈니스 로직 (순수 함수 → 테스트 용이)
   - dataProcessor, funnelEngine, retentionEngine, segmentEngine
   - columnValueDetector (값 기반 컬럼 감지)
2. `hooks/` 커스텀 Hook
3. `context/` 상태 관리 (reducer)

## 주의사항

- 테스트 환경: node (vitest.config.ts)
- DOM 테스트가 필요하면 `jsdom` 환경으로 전환 필요
- `@/` alias가 vitest.config.ts에 설정되어 있음
