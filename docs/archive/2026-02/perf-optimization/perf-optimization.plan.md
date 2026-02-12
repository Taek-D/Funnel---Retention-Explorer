# Performance Optimization - Plan Document

## Overview

React 렌더링 최적화: AppContext value 메모이제이션, 고빈도 컴포넌트 React.memo, 위젯 콘텐츠 useMemo.

## Current State

- AppContext.Provider value가 매 렌더마다 새 객체 생성 → 모든 consumer 불필요 리렌더
- `React.memo` 사용 0개 (전체 코드베이스)
- DashboardWidget이 부모 state 변경마다 리렌더 (7개 위젯 × 매 상태 변경)
- Sidebar가 AppShell 리렌더 시 함께 리렌더 (route 변경 외에는 불필요)
- Dashboard의 widgetContent 객체가 매 렌더마다 재생성

## Scope

### PERF-1: AppContext value 메모이제이션

`AppContext.tsx`에서 Provider value를 `useMemo`로 래핑.

### PERF-2: React.memo 적용 (고빈도 컴포넌트)

- `DashboardWidget` — 편집 모드에서 7+개 인스턴스, 하나 변경 시 전체 리렌더 방지
- `Sidebar` — route 변경 외 불필요 리렌더 방지
- `ExportDropdown` — prop 불변 시 리렌더 방지
- `PlanBadge` — 단순 표시 컴포넌트

### PERF-3: Dashboard widgetContent 메모이제이션

Dashboard.tsx의 `widgetContent` 객체를 개별 `useMemo`로 분리. 각 위젯이 의존하는 데이터가 변경될 때만 재생성.

### PERF-4: Recharts lazy loading 개선

차트가 없는 빈 상태에서도 Recharts가 로드됨. 차트가 필요한 시점에만 렌더.

## Out of Scope

- Context 분리 (AppContext를 여러 Context로 분할 — 리팩토링 규모 큼)
- Virtualization (리스트가 충분히 작음)
- Web Worker (이미 CSV 파싱에 사용 중)

## Success Criteria

- [ ] AppContext value `useMemo` 적용
- [ ] React.memo 4개+ 컴포넌트 적용
- [ ] Dashboard widgetContent 메모이제이션
- [ ] 310/310 테스트 통과
- [ ] 번들 사이즈 증가 없음
