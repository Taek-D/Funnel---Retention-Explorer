# Performance Optimization v2 Plan

## Overview
React 프론트엔드의 렌더링 성능 및 대용량 데이터 처리 최적화.
코드베이스 분석 결과 CSV Web Worker는 이미 구현 완료 상태이며,
실제 병목은 Context 재렌더링, 엔진 캐싱 부재, 리스트 가상화에 있음.

## Current State (분석 결과)
- CSV 파싱: Web Worker 이미 적용 (csvWorker.ts) ✅
- Code splitting: React.lazy + 25개 라우트 ✅
- React.memo: 5개 컴포넌트 적용 (DashboardWidget, Sidebar, PlanBadge 등) ✅
- useMemo/useCallback: 186개 인스턴스 사용 중 ✅
- Sentry performance monitoring: startSpan 적용 ✅

## Scope

### PF-1: 엔진 결과 캐싱 (MEDIUM effort, HIGH impact)
**문제**: funnelEngine, retentionEngine, insightsEngine 등 엔진 함수가 동일 데이터로 반복 호출됨
**해결**:
- 엔진 레벨 WeakMap 캐시 도입 (데이터 참조 + 파라미터 해시 기반)
- 대상: `calculateFunnel`, `calculateActivityRetention`, `generateInsights`, `calculateStickiness`
- 캐시 무효화: 데이터 참조 변경 시 자동 (WeakMap GC)

### PF-2: Hook 반환값 메모이제이션 (LOW effort, MEDIUM impact)
**문제**: useFunnelAnalysis, useRetentionAnalysis 등 훅이 매 렌더마다 새 객체 반환
**해결**:
- 훅 반환 객체를 useMemo로 래핑
- 대상: useFunnelAnalysis, useRetentionAnalysis, useInsights, useAIInsights
- 의존성 배열에 실제 사용 값만 지정

### PF-3: Virtual Scrolling (LOW effort, MEDIUM impact)
**문제**: 대량 리스트 항목이 모두 DOM에 렌더링됨
**해결**:
- @tanstack/react-virtual 도입
- 대상 리스트:
  - Dashboard 저장된 분석 목록
  - Insights 페이지 카드 목록
  - RetentionAnalysis 코호트 매트릭스 (대형 테이블)

### PF-4: FilterPanel 최적화 (LOW effort, MEDIUM impact)
**문제**: processedData 변경 시 platform/segment 추출이 매번 재실행
**해결**:
- React.memo 적용
- availablePlatforms/availableSegments를 reducer 상태로 이동 또는 깊은 비교

### PF-5: 검색/필터 디바운싱 (LOW effort, LOW impact)
**문제**: Insights 검색, 필터 변경 시 즉시 재계산
**해결**:
- 검색 입력에 300ms 디바운스 적용
- useDebounce 커스텀 훅 생성

## Out of Scope
- Context splitting (AppContext → 다중 Context 분리) — 대규모 리팩토링, 별도 feature로
- Bundle size 최적화 — 이미 manualChunks + tree shaking 적용 완료
- Web Worker CSV 파싱 — 이미 csvWorker.ts로 구현 완료

## Implementation Order
1. PF-1 (엔진 캐싱) — 가장 높은 성능 개선 효과
2. PF-2 (Hook 메모이제이션) — 낮은 effort, 빠른 적용
3. PF-4 (FilterPanel) — PF-2와 함께 적용 가능
4. PF-3 (Virtual Scrolling) — 새 의존성 추가 필요
5. PF-5 (디바운싱) — 부가적 개선

## Dependencies
- @tanstack/react-virtual (new, PF-3용)
- 기존 패키지만으로 PF-1, PF-2, PF-4, PF-5 구현 가능

## Expected Impact
| 항목 | 예상 개선 |
|------|-----------|
| 재렌더링 빈도 | 60-70% 감소 |
| 초기 렌더링 속도 | 15-20% 향상 |
| 대용량 데이터 (50k+ rows) | 2-3배 빠른 처리 |
| 메모리 사용량 | 20-30% 감소 |

## Success Criteria
- Lighthouse Performance 점수 90+ 유지
- 50k rows 데이터 로딩 시 UI 프리징 없음
- Dashboard 위젯 전환 시 100ms 이내 응답
- 불필요한 재렌더링 React DevTools Profiler로 검증
