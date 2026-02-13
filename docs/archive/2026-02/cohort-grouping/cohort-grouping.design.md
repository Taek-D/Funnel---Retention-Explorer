# Design: Cohort Grouping (코호트 그룹핑)

## CG-1: Types + Constants

### types/index.ts
```typescript
export type CohortGrouping = 'daily' | 'weekly' | 'monthly';
```

### constants.ts
```typescript
export const WEEKLY_RETENTION_MAX_PERIODS = 12;   // W0~W12
export const MONTHLY_RETENTION_MAX_PERIODS = 6;   // M0~M6
```

## CG-2: Engine (retentionEngine.ts)

### New helper function
```typescript
export function groupDateKey(date: Date, grouping: CohortGrouping): string {
  if (grouping === 'weekly') {
    // ISO week: YYYY-W## format
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  if (grouping === 'monthly') {
    return date.toISOString().slice(0, 7); // YYYY-MM
  }
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
```

### Modified calculateActivityRetention signature
```typescript
export function calculateActivityRetention(
  processedData: ProcessedEvent[],
  cohortEvent: string,
  activeEvents: string[],
  grouping: CohortGrouping = 'daily'
): RetentionCohort[]
```

### Key changes in _calculateActivityRetention:
1. Cohort key: `groupDateKey(event.timestamp, grouping)` instead of `toISOString().split('T')[0]`
2. Active events key: `groupDateKey(e.timestamp, grouping)` for eventsByDate map
3. Day loop max: depends on grouping
   - daily: ACTIVITY_RETENTION_MAX_DAYS (14)
   - weekly: WEEKLY_RETENTION_MAX_PERIODS (12)
   - monthly: MONTHLY_RETENTION_MAX_PERIODS (6)
4. Target date offset: depends on grouping
   - daily: `targetDate.setDate(+day)`
   - weekly: `targetDate.setDate(+day*7)`
   - monthly: `targetDate.setMonth(+day)`
5. Day key prefix: `D${day}` for daily, `W${day}` for weekly, `M${day}` for monthly
6. Target date lookup: use `groupDateKey(targetDate, grouping)` to match eventsByDate

## CG-3: Hook (useRetentionAnalysis.ts)

### Changes:
1. Import `CohortGrouping` type
2. Add state: `cohortGrouping` (default 'daily')
3. Add setter: `setCohortGrouping`
4. Pass `cohortGrouping` to `calculateActivityRetention` as 4th arg
5. Return `cohortGrouping` and `setCohortGrouping` from hook

## CG-4: UI (RetentionAnalysis.tsx)

### Grouping toggle UI
- Location: Inside controls card, below cohort/active event selectors
- 3-button toggle: Daily / Weekly / Monthly
- Same style as retention type toggle (bg-surface/50 + accent active)

### dayColumns useMemo update
```typescript
const dayColumns = useMemo(() => {
  if (isPaid) return ['D0', 'D7', 'D14', 'D30', 'D60', 'D90'];
  if (cohortGrouping === 'weekly') return Array.from({ length: 13 }, (_, i) => `W${i}`);
  if (cohortGrouping === 'monthly') return Array.from({ length: 7 }, (_, i) => `M${i}`);
  return Array.from({ length: 15 }, (_, i) => `D${i}`);
}, [isPaid, cohortGrouping]);
```

### handleCalculate update
- Pass `cohortGrouping` through to hook if needed (hook already has state)

## CG-5: RetentionComparison (RetentionComparison.tsx)

### Changes:
1. Add `cohortGrouping` local state (default 'daily')
2. Add 3-button toggle below event selection card
3. Pass `cohortGrouping` as 4th arg to `calculateActivityRetention` calls
4. Day column in chart/table already dynamic (from result.days keys)

## CG-6: i18n

### ko/pages.json (retention section)
```json
"grouping": "코호트 그룹핑",
"daily": "일간",
"weekly": "주간",
"monthly": "월간"
```

### en/pages.json (retention section)
```json
"grouping": "Cohort Grouping",
"daily": "Daily",
"weekly": "Weekly",
"monthly": "Monthly"
```

### ko/pages.json (retentionCompare section)
```json
"grouping": "코호트 그룹핑",
"daily": "일간",
"weekly": "주간",
"monthly": "월간"
```

### en/pages.json (retentionCompare section)
```json
"grouping": "Cohort Grouping",
"daily": "Daily",
"weekly": "Weekly",
"monthly": "Monthly"
```

## Verification Checklist (22 items)

### CG-1: Types + Constants (3)
1. CohortGrouping type exported from types/index.ts
2. WEEKLY_RETENTION_MAX_PERIODS = 12 in constants.ts
3. MONTHLY_RETENTION_MAX_PERIODS = 6 in constants.ts

### CG-2: Engine (7)
4. groupDateKey function exported
5. groupDateKey 'daily' returns YYYY-MM-DD
6. groupDateKey 'weekly' returns YYYY-W## (ISO week)
7. groupDateKey 'monthly' returns YYYY-MM
8. calculateActivityRetention accepts grouping parameter (default 'daily')
9. Day key prefix changes: D/W/M based on grouping
10. Max periods: 14/12/6 for daily/weekly/monthly

### CG-3: Hook (3)
11. cohortGrouping state in useRetentionAnalysis
12. setCohortGrouping setter returned
13. grouping passed to calculateActivityRetention

### CG-4: UI (4)
14. 3-button grouping toggle in RetentionAnalysis
15. dayColumns adapts to grouping (D0-D14 / W0-W12 / M0-M6)
16. Toggle only visible for activity retention (not paid)
17. handleCalculate respects cohortGrouping

### CG-5: RetentionComparison (3)
18. cohortGrouping state in RetentionComparison
19. 3-button grouping toggle
20. calculateActivityRetention called with grouping

### CG-6: i18n (2)
21. 4 retention.* i18n keys (grouping/daily/weekly/monthly) in ko/en
22. 4 retentionCompare.* i18n keys in ko/en
