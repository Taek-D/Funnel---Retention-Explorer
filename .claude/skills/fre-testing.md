---
name: fre-testing
description: 테스트 작성 및 실행 패턴. Use when writing tests, debugging test failures, or improving test coverage.
---

# FRE Testing

## 테스트 도구

- **Vitest** (vitest.config.ts)
- 환경: `node` (DOM 불필요한 테스트)
- 별칭: `@/` → 프로젝트 루트

## 테스트 구조

```
__tests__/
├── unit/          # lib/ 모듈 단위 테스트
├── integration/   # 모듈 간 통합 테스트
├── fixtures/      # CSV 샘플, mock 데이터
└── helpers/       # 테스트 유틸리티 함수
```

## 실행 명령어

```bash
# 전체 테스트
cd 'E:/프로젝트/데이터분석/Funnel---Retention-Explorer/funnel-&-retention-explorer frontend'
npx vitest run

# 감시 모드
npx vitest

# 특정 파일
npx vitest run __tests__/unit/dataProcessor.test.ts
```

## 테스트 작성 패턴

### lib/ 단위 테스트 (순수 함수)

```typescript
import { describe, it, expect } from 'vitest';
import { autoDetectColumns } from '../../lib/dataProcessor';

describe('autoDetectColumns', () => {
  it('should match standard English headers', () => {
    const headers = ['timestamp', 'user_id', 'event_name'];
    const result = autoDetectColumns(headers);
    expect(result.timestamp).toBe('timestamp');
    expect(result.userid).toBe('user_id');
    expect(result.eventname).toBe('event_name');
  });
});
```

### 테스트 데이터 (fixtures/)

CSV 파싱 결과와 동일한 `RawRow[]` 형태로 생성:

```typescript
const mockData: RawRow[] = [
  { date: '2025-01-01', user: 'u_001', action: 'view_item' },
  { date: '2025-01-02', user: 'u_002', action: 'add_to_cart' },
];
```

## 테스트 우선순위

| 우선순위 | 대상 | 이유 |
|---------|------|------|
| 1 | `lib/dataProcessor.ts` | 자동 컬럼 매핑 정확도 |
| 2 | `lib/columnValueDetector.ts` | 값 기반 추론 정확도 |
| 3 | `lib/funnelEngine.ts` | 퍼널 계산 정확성 |
| 4 | `lib/retentionEngine.ts` | 코호트 계산 정확성 |
| 5 | `lib/segmentEngine.ts` | 세그먼트 비교 정확성 |
| 6 | `context/reducer.ts` | 상태 전이 정확성 |

## 주의사항

- `lib/` 모듈은 React 의존 없으므로 바로 import 가능
- Hook 테스트 시 `@testing-library/react-hooks` 필요 (현재 미설치)
- 컴포넌트 테스트 시 `jsdom` 환경 + `@testing-library/react` 필요 (현재 미설치)
