---
name: fre-data-engine
description: CSV 파싱, 컬럼 매핑, 퍼널/리텐션/세그먼트 분석 엔진. Use when working with data processing, analysis logic, or CSV handling.
---

# FRE Data Engine

## 데이터 파이프라인

```
CSV File → csvParser.ts → RawRow[]
  → dataProcessor.autoDetectColumns() → ColumnMapping
    Phase 1: 이름 매칭 (AUTO_COLUMN_MAPPING)
    Phase 2: 값 분석 (columnValueDetector.ts) — fallback
  → dataProcessor.processData() → ProcessedEvent[]
  → detectDatasetType() → 'ecommerce' | 'subscription' | null
```

## 핵심 타입

```typescript
RawRow = { [key: string]: string }          // CSV 원본 행
ColumnMapping = { timestamp?, userid?, eventname?, sessionid?, platform?, channel? }
ProcessedEvent = { timestamp: Date, userId: string, eventName: string, ... }
```

## 분석 엔진

| 엔진 | 파일 | 입력 → 출력 |
|------|------|------------|
| 퍼널 | `funnelEngine.ts` | ProcessedEvent[] + steps → FunnelStep[] |
| 리텐션 | `retentionEngine.ts` | ProcessedEvent[] → RetentionCohort[] |
| 세그먼트 | `segmentEngine.ts` | ProcessedEvent[] + steps → SegmentResult[] |
| 인사이트 | `insightsEngine.ts` | ProcessedEvent[] + 분석결과 → Insight[] |
| 구독 | `subscriptionEngine.ts` | RawRow[] + mapping → SubscriptionKPIs |

## 컬럼 값 감지 (columnValueDetector.ts)

6개 scorer 함수가 0.0~1.0 점수 반환:
- `scoreTimestamp` — 날짜 regex + Date 파싱 (숫자 전용 컬럼은 epoch만 체크)
- `scoreUserId` — 중간 cardinality + ID 패턴
- `scoreEventName` — 낮은 cardinality + EVENT_PATTERNS 매칭
- `scoreSessionId` — 높은 cardinality + UUID/영숫자
- `scorePlatform` — 매우 낮은 cardinality + KNOWN_PLATFORMS
- `scoreChannel` — 낮은 cardinality + KNOWN_CHANNELS

Threshold: 0.25 이상만 할당. Greedy 1:1 매칭.

## 상수 (constants.ts)

- `EVENT_PATTERNS` — 이커머스/구독 이벤트 이름 패턴
- `AUTO_COLUMN_MAPPING` — 컬럼명 이름 매칭 (한국어 포함)
- `KNOWN_PLATFORMS`, `KNOWN_CHANNELS` — 값 분석용

## 수정 시 주의사항

- `lib/` 모듈은 순수 TypeScript (React import 금지)
- 새 분석 타입 추가 시 `types/index.ts`에 타입 먼저 정의
- 엔진 함수는 항상 빈 배열/null 입력에 대한 방어 코드 포함
