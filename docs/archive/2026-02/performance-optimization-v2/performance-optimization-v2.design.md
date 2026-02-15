# Performance Optimization v2 - Design Document

## Overview
Plan 문서의 PF-1~PF-5 항목을 구체적으로 설계한다.
코드베이스 분석 결과를 바탕으로 정확한 파일, 함수, 변경 범위를 정의한다.

---

## PF-1: 엔진 결과 캐싱

### 목표
동일 데이터+파라미터 조합에 대한 엔진 반복 계산 제거

### 설계

**새 파일**: `lib/engineCache.ts`

```typescript
// 범용 엔진 캐시 유틸리티
// WeakMap<데이터 참조, Map<파라미터 해시, 결과>>
type EngineCache<T> = WeakMap<ReadonlyArray<unknown>, Map<string, T>>;

export function createEngineCache<T>(): EngineCache<T>;
export function getCached<T>(cache: EngineCache<T>, data: ReadonlyArray<unknown>, key: string): T | undefined;
export function setCached<T>(cache: EngineCache<T>, data: ReadonlyArray<unknown>, key: string, value: T): void;
```

**변경 파일**:

| 파일 | 함수 | 캐시 키 |
|------|------|---------|
| `lib/funnelEngine.ts` | `calculateFunnel` | `steps.join('|')` |
| `lib/funnelEngine.ts` | `calculateFullDataFunnel` | `detectedType` |
| `lib/retentionEngine.ts` | `calculateActivityRetention` | `cohortEvent|activeEvents.join(',')|grouping` |
| `lib/retentionEngine.ts` | `calculateFullDataRetention` | `'full'` |
| `lib/insightsEngine.ts` | `generateInsights` | `detectedType|subscriptionKPIs?.mrr|trialAnalysis?.rate` |

**구현 패턴**:
```typescript
// funnelEngine.ts 예시
const funnelCache = createEngineCache<FunnelStep[]>();

export function calculateFunnel(processedData: ProcessedEvent[], steps: string[]): FunnelStep[] {
  const key = steps.join('|');
  const cached = getCached(funnelCache, processedData, key);
  if (cached) return cached;

  const result = startSpan('analysis.funnel', 'compute', () => _calculateFunnel(processedData, steps));
  setCached(funnelCache, processedData, key, result);
  return result;
}
```

**캐시 무효화**: WeakMap이므로 processedData 참조가 바뀌면 자동 GC.

---

## PF-2: Hook 반환값 메모이제이션

### 목표
훅 반환 객체의 참조 안정성 확보 → 하위 컴포넌트 불필요 재렌더링 방지

### 변경 파일 및 구현

**1. `hooks/useFunnelAnalysis.ts`**

현재 (문제):
```typescript
return {
  funnelSteps: state.funnelSteps,
  funnelResults: state.funnelResults,
  ...  // 매 렌더마다 새 객체
};
```

변경:
```typescript
return useMemo(() => ({
  funnelSteps: state.funnelSteps,
  funnelResults: state.funnelResults,
  uniqueEvents: state.uniqueEvents,
  detectedType: state.detectedType,
  hasData: state.processedData.length > 0,
  setFunnelSteps,
  applyTemplate,
  runFunnelAnalysis,
}), [
  state.funnelSteps, state.funnelResults, state.uniqueEvents,
  state.detectedType, state.processedData.length,
  setFunnelSteps, applyTemplate, runFunnelAnalysis,
]);
```

**2. `hooks/useRetentionAnalysis.ts`**

동일 패턴 적용:
```typescript
return useMemo(() => ({
  retentionResults: state.retentionResults,
  retentionType: state.retentionType,
  uniqueEvents: state.uniqueEvents,
  detectedType: state.detectedType,
  hasData: state.processedData.length > 0,
  cohortGrouping,
  setRetentionType,
  setCohortGrouping,
  runRetentionAnalysis,
}), [
  state.retentionResults, state.retentionType, state.uniqueEvents,
  state.detectedType, state.processedData.length, cohortGrouping,
  setRetentionType, setCohortGrouping, runRetentionAnalysis,
]);
```

**3. `hooks/useAIInsights.ts`**

```typescript
return useMemo(() => ({
  aiSummary, aiLoading, aiError,
  generateSummary, chatMessages, askQuestion, clearChat,
  hasData: state.processedData.length > 0,
  planGate,
}), [
  aiSummary, aiLoading, aiError,
  generateSummary, chatMessages, askQuestion, clearChat,
  state.processedData.length, planGate,
]);
```

**4. `hooks/useInsights.ts`** (있다면 동일 패턴)

---

## PF-3: Virtual Scrolling

### 목표
20개 이상 항목을 가진 리스트에 가상 스크롤링 적용

### 의존성
```bash
npm install @tanstack/react-virtual
```

### 대상 컴포넌트

**1. `pages/Insights.tsx` - Insight 카드 목록**

현재: `filteredInsights.map(...)` 으로 전체 렌더링
변경: `useVirtualizer` 적용 (estimateSize: 200px per card)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: filteredInsights.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
  overscan: 3,
});
```

**2. `pages/Dashboard.tsx` - 저장된 분석 목록**

현재: `snapshots.map(...)` + `max-h-64 overflow-y-auto`
변경: `useVirtualizer` 적용 (estimateSize: 56px per item)
- snapshots.length > 10일 때만 가상화 적용 (적은 경우 오버헤드)

**3. `pages/RetentionAnalysis.tsx` - 코호트 테이블**

현재: `retentionResults.slice(0, 10).map(...)` — 이미 10개로 제한됨
변경: 불필요 (이미 제한, 가상화 효과 미미). **스킵**.

---

## PF-4: FilterPanel 최적화

### 목표
FilterPanel 불필요 재렌더링 방지

### 변경

**`components/FilterPanel.tsx`**:

1. `React.memo` 래핑:
```typescript
export const FilterPanel = React.memo<FilterPanelProps>(({ showPlatform = true, showChannel = true }) => {
  // ... existing implementation
});
FilterPanel.displayName = 'FilterPanel';
```

2. availablePlatforms/availableChannels의 useMemo 의존성은 이미 `[state.processedData]`로 올바름.
   React.memo 래핑만으로 props 변경 없을 때 재렌더링 방지.

---

## PF-5: 디바운싱

### 목표
검색/필터 입력 시 불필요한 즉시 재계산 방지

### 새 파일: `hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

### 적용 대상

**`pages/Insights.tsx`**: 검색 입력에 300ms 디바운스
```typescript
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);
// filteredInsights는 debouncedSearch 기반으로 필터링
```

---

## 구현 순서

| 순서 | 항목 | 파일 수 | 예상 영향도 |
|------|------|---------|-------------|
| 1 | PF-1: engineCache.ts + 엔진 3개 수정 | 4 files (new + 3 modify) | HIGH |
| 2 | PF-2: Hook 메모이제이션 | 3 files (modify) | MEDIUM |
| 3 | PF-4: FilterPanel memo | 1 file (modify) | MEDIUM |
| 4 | PF-5: useDebounce + Insights | 2 files (new + 1 modify) | LOW |
| 5 | PF-3: Virtual Scrolling | 2 files (modify) + npm install | MEDIUM |

## 테스트 전략

1. 기존 351개 Vitest 테스트 모두 통과 확인
2. 엔진 캐시: 동일 입력 2회 호출 시 동일 참조 반환 테스트
3. 가상 스크롤: 대량 항목(50+) 렌더링 시 DOM 노드 수 검증
4. React DevTools Profiler로 재렌더링 횟수 비교 (수동)

## 영향받는 파일 전체 목록

| 파일 | 변경 유형 |
|------|-----------|
| `lib/engineCache.ts` | **NEW** |
| `hooks/useDebounce.ts` | **NEW** |
| `lib/funnelEngine.ts` | MODIFY (캐시 추가) |
| `lib/retentionEngine.ts` | MODIFY (캐시 추가) |
| `lib/insightsEngine.ts` | MODIFY (캐시 추가) |
| `hooks/useFunnelAnalysis.ts` | MODIFY (return useMemo) |
| `hooks/useRetentionAnalysis.ts` | MODIFY (return useMemo) |
| `hooks/useAIInsights.ts` | MODIFY (return useMemo) |
| `components/FilterPanel.tsx` | MODIFY (React.memo) |
| `pages/Insights.tsx` | MODIFY (virtual scroll + debounce) |
| `pages/Dashboard.tsx` | MODIFY (virtual scroll) |
