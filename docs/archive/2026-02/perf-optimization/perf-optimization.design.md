# Performance Optimization - Design Document

## Overview

React 렌더링 최적화 설계. AppContext 메모이제이션 + React.memo + useMemo.

## References
- Plan: `docs/01-plan/features/perf-optimization.plan.md`

---

## PERF-1: AppContext value 메모이제이션

### context/AppContext.tsx

```typescript
import React, { createContext, useContext, useReducer, useMemo } from 'react';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

**효과**: dispatch 호출로 state가 변경되지 않을 경우 consumer 리렌더 방지. `dispatch`는 useReducer에서 안정적 참조이므로 deps에 포함 불필요.

---

## PERF-2: React.memo 적용

### components/DashboardWidget.tsx

```typescript
export const DashboardWidget: React.FC<DashboardWidgetProps> = React.memo(({ ... }) => {
  // existing implementation
});
```

함수를 React.memo로 래핑. props가 동일하면 리렌더 스킵.

### components/Sidebar.tsx

```typescript
export const Sidebar: React.FC = React.memo(() => {
  // existing implementation
});
```

Sidebar는 route 변경(useLocation) 또는 auth 변경(useAuth)에만 리렌더 필요.

### components/ExportDropdown.tsx

```typescript
export const ExportDropdown: React.FC<ExportDropdownProps> = React.memo(({ ... }) => {
  // existing implementation
});
```

### components/PlanBadge.tsx

```typescript
export const PlanBadge: React.FC<PlanBadgeProps> = React.memo(({ ... }) => {
  // existing implementation
});
```

### components/ChartSkeleton.tsx

```typescript
export const ChartSkeleton: React.FC<ChartSkeletonProps> = React.memo(({ ... }) => {
  // existing implementation
});
```

---

## PERF-3: Dashboard widgetContent 메모이제이션

### pages/Dashboard.tsx

현재 `widgetContent` 객체가 매 렌더마다 재생성됨. 각 위젯을 개별 `useMemo`로 분리.

```typescript
const kpiWidget = useMemo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {kpiCards.map((kpi, i) => (...))}
  </div>
), [kpiCards, navigate]);

const funnelWidget = useMemo(() => (
  funnelChartData.length > 0 ? (...) : (...)
), [funnelChartData, overallConversion, funnelResults?.length, t]);

const retentionWidget = useMemo(() => (...), [retentionCurveData, t]);

const dataQualityWidget = useMemo(() => (...), [dataQualityReport, t]);

const quickActionsWidget = useMemo(() => (...), [navigate, t]);

const recentInsightsWidget = useMemo(() => (...), [insights, t]);

const savedAnalysesWidget = useMemo(() => (...), [snapshots, restoreSnapshot, removeSnapshot, t]);

const widgetContent: Record<WidgetId, React.ReactNode> = useMemo(() => ({
  'kpi-cards': kpiWidget,
  'funnel-chart': funnelWidget,
  'retention-chart': retentionWidget,
  'data-quality': dataQualityWidget,
  'quick-actions': quickActionsWidget,
  'recent-insights': recentInsightsWidget,
  'saved-analyses': savedAnalysesWidget,
}), [kpiWidget, funnelWidget, retentionWidget, dataQualityWidget, quickActionsWidget, recentInsightsWidget, savedAnalysesWidget]);
```

---

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `context/AppContext.tsx` | MODIFY | useMemo on Provider value |
| `components/DashboardWidget.tsx` | MODIFY | React.memo 래핑 |
| `components/Sidebar.tsx` | MODIFY | React.memo 래핑 |
| `components/ExportDropdown.tsx` | MODIFY | React.memo 래핑 |
| `components/PlanBadge.tsx` | MODIFY | React.memo 래핑 |
| `components/ChartSkeleton.tsx` | MODIFY | React.memo 래핑 |
| `pages/Dashboard.tsx` | MODIFY | widgetContent useMemo 분리 |

## 구현 순서

1. AppContext.tsx — useMemo
2. 5개 컴포넌트 — React.memo
3. Dashboard.tsx — widgetContent useMemo
4. 빌드 + 테스트

## 성공 기준

- [ ] AppContext Provider value `useMemo` 적용
- [ ] DashboardWidget React.memo
- [ ] Sidebar React.memo
- [ ] ExportDropdown React.memo
- [ ] PlanBadge React.memo
- [ ] ChartSkeleton React.memo
- [ ] Dashboard widgetContent 개별 useMemo (7개)
- [ ] widgetContent Record useMemo
- [ ] 310/310 테스트 통과
