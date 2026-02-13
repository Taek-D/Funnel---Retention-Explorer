# Design: Retention Comparison

## RC-1: Engine (retentionEngine.ts)

### Types
```typescript
type RetentionComparisonDay = { day: string; rateA: number; rateB: number; diff: number; direction: 'up'|'down'|'same' }
type RetentionComparisonResult = { days: RetentionComparisonDay[]; cohortsA: number; cohortsB: number; totalUsersA: number; totalUsersB: number }
```

### Function
- `compareRetention(resultA: RetentionCohort[], resultB: RetentionCohort[]): RetentionComparisonResult`
- 코호트별 평균 리텐션율 계산, diff = rateB - rateA, 0.5pp 임계값

## RC-2: Page (RetentionComparison.tsx)

### UI Components
- 코호트 이벤트 드롭다운 (uniqueEvents)
- 활성 이벤트 멀티셀렉트 (Plus/X)
- Period A/B 날짜 입력
- 비교 실행 버튼
- KPI 카드 4개 (cohortsA/B, totalUsersA/B)
- 비교 테이블 (Day, A rate, B rate, diff, direction)
- LineChart (두 리텐션 곡선)
- ChartDownloadButton
- 빈 상태 (Diff 아이콘)

## RC-3: Route/Nav/Icons
- Icons.tsx: Diff 추가
- router.tsx: /app/retention-compare lazy route
- Sidebar.tsx: retentionCompare 메뉴 아이템

## RC-4: i18n
- nav.retentionCompare (common.json)
- 17 retentionCompare.* 키 (pages.json)

## Verification Checklist (25 items)
1. RetentionComparisonDay type exported
2. RetentionComparisonResult type exported
3. compareRetention function exported
4. dayKeys collected from both results
5. sortedDays numeric sort
6. avgRate per day across cohorts
7. diff = rateB - rateA
8. direction threshold 0.5pp
9. cohortsA/B count
10. totalUsersA/B sum
11. cohortEvent dropdown
12. activeEvents multi-select
13. Period A/B date inputs
14. compare button with validation
15. KPI cards 4
16. comparison table
17. direction indicators (TrendingUp/Down/same)
18. LineChart two curves
19. ChartDownloadButton
20. empty state Diff icon
21. Diff icon in Icons.tsx
22. /app/retention-compare route
23. Sidebar menu item
24. nav.retentionCompare i18n
25. 17 retentionCompare.* i18n keys
