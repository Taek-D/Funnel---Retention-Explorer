# Advanced Filter/Search — Design

> **Feature**: advanced-filter
> **Plan**: [advanced-filter.plan.md](../../01-plan/features/advanced-filter.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
AppState
  └─ dateRange: { start: string | null; end: string | null }
  └─ activeFilters: { platforms: string[]; channels: string[] }

useFilteredData() hook
  └─ useMemo: processedData → filtered by dateRange + activeFilters
  └─ Returns: filteredData, filterCount, clearFilters

FilterPanel component (collapsible)
  ├─ DateRangePicker (start/end + presets)
  ├─ Platform checkboxes
  ├─ Channel checkboxes
  └─ Clear filters button

Pages: Dashboard, FunnelAnalysis, RetentionAnalysis, SegmentComparison, Insights
  └─ Use filteredData from useFilteredData() instead of raw processedData
```

## 2. Implementation Tasks

### AF-1: Filter Types & State (`types/index.ts` + `context/`)

Add to `types/index.ts`:

```typescript
// ===== Filters =====

export interface DateRange {
  start: string | null;  // ISO date string (YYYY-MM-DD)
  end: string | null;
}

export interface ActiveFilters {
  platforms: string[];
  channels: string[];
}
```

Add to `AppState`:

```typescript
dateRange: DateRange;
activeFilters: ActiveFilters;
```

Add to `initialState` in `reducer.ts`:

```typescript
dateRange: { start: null, end: null },
activeFilters: { platforms: [], channels: [] },
```

Add actions in `actions.ts`:

```typescript
| { type: 'SET_DATE_RANGE'; payload: DateRange }
| { type: 'SET_PLATFORM_FILTER'; payload: string[] }
| { type: 'SET_CHANNEL_FILTER'; payload: string[] }
| { type: 'CLEAR_FILTERS' }
```

Add reducer cases:

```typescript
case 'SET_DATE_RANGE':
  return { ...state, dateRange: action.payload };
case 'SET_PLATFORM_FILTER':
  return { ...state, activeFilters: { ...state.activeFilters, platforms: action.payload } };
case 'SET_CHANNEL_FILTER':
  return { ...state, activeFilters: { ...state.activeFilters, channels: action.payload } };
case 'CLEAR_FILTERS':
  return { ...state, dateRange: { start: null, end: null }, activeFilters: { platforms: [], channels: [] } };
```

### AF-2: useFilteredData Hook (`hooks/useFilteredData.ts`)

```typescript
export function useFilteredData() {
  const { state, dispatch } = useAppContext();
  const { processedData, dateRange, activeFilters } = state;

  const filteredData = useMemo(() => {
    let data = processedData;

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      data = data.filter(e => e.timestamp >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      data = data.filter(e => e.timestamp <= endDate);
    }

    // Platform filter
    if (activeFilters.platforms.length > 0) {
      data = data.filter(e => e.platform && activeFilters.platforms.includes(e.platform));
    }

    // Channel filter
    if (activeFilters.channels.length > 0) {
      data = data.filter(e => e.channel && activeFilters.channels.includes(e.channel));
    }

    return data;
  }, [processedData, dateRange, activeFilters]);

  const filterCount = useMemo(() => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    count += activeFilters.platforms.length;
    count += activeFilters.channels.length;
    return count;
  }, [dateRange, activeFilters]);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, [dispatch]);

  const setDateRange = useCallback((range: DateRange) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range });
  }, [dispatch]);

  const setPlatformFilter = useCallback((platforms: string[]) => {
    dispatch({ type: 'SET_PLATFORM_FILTER', payload: platforms });
  }, [dispatch]);

  const setChannelFilter = useCallback((channels: string[]) => {
    dispatch({ type: 'SET_CHANNEL_FILTER', payload: channels });
  }, [dispatch]);

  return {
    filteredData, filterCount, clearFilters,
    setDateRange, setPlatformFilter, setChannelFilter,
    dateRange, activeFilters
  };
}
```

### AF-3: FilterPanel Component (`components/FilterPanel.tsx`)

```typescript
interface FilterPanelProps {
  availablePlatforms: string[];
  availableChannels: string[];
  minDate: string | null;   // from dataQualityReport
  maxDate: string | null;
}
```

Features:
- Collapsible panel (ChevronDown/ChevronUp toggle)
- DateRangePicker section: two `<input type="date">` + preset buttons (7d, 30d, 90d, All)
- Platform section: checkbox list from availablePlatforms
- Channel section: checkbox list from availableChannels
- Active filter count badge on collapse header
- "Clear all" button
- Tailwind styling consistent with existing cards

Date presets:
- 7d: end=today, start=today-7
- 30d: end=today, start=today-30
- 90d: end=today, start=today-90
- All: start=null, end=null

### AF-4: Page Integration

Pages that use `useFilteredData()` instead of raw `state.processedData`:

| Page | Current Source | New Source |
|------|---------------|-----------|
| Dashboard.tsx | `state.processedData` | `filteredData` (for uniqueUsers, totalEvents) |
| FunnelAnalysis.tsx | `state.processedData` | `filteredData` |
| RetentionAnalysis.tsx | `state.processedData` | `filteredData` |
| SegmentComparison.tsx | `state.processedData` | `filteredData` |
| Insights.tsx | `state.processedData` | `filteredData` |

Each page adds `<FilterPanel>` above the main content area.

Available platforms/channels are derived from full `processedData` (not filtered), using `useMemo`:
```typescript
const availablePlatforms = useMemo(() =>
  [...new Set(state.processedData.map(e => e.platform).filter(Boolean))] as string[],
  [state.processedData]
);
```

### AF-5: Insights Filter (Insights.tsx)

Add above insight cards:
- Type filter: 4 toggle buttons (success/warning/danger/info)
- Search input: filter insights by title or body text
- Both are local state (not global)

```typescript
const [typeFilter, setTypeFilter] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState('');

const filteredInsights = useMemo(() => {
  let result = insights;
  if (typeFilter.length > 0) {
    result = result.filter(i => typeFilter.includes(i.type));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(i =>
      i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q)
    );
  }
  return result;
}, [insights, typeFilter, searchQuery]);
```

### AF-6: i18n Keys

Add to `locales/ko/pages.json` under `filter`:

```json
{
  "filter": {
    "title": "필터",
    "dateRange": "날짜 범위",
    "startDate": "시작일",
    "endDate": "종료일",
    "preset7d": "7일",
    "preset30d": "30일",
    "preset90d": "90일",
    "presetAll": "전체",
    "platform": "플랫폼",
    "channel": "채널",
    "clearAll": "필터 초기화",
    "activeFilters": "활성 필터 {{count}}개",
    "noFilters": "필터 없음",
    "searchInsights": "인사이트 검색...",
    "filterByType": "유형별 필터",
    "allTypes": "전체",
    "filtered": "필터 적용됨"
  }
}
```

Corresponding English keys in `locales/en/pages.json`.

## 3. Dependencies

- **New npm**: None (native date inputs, no external date picker)
- **Existing**: useAppContext, useMemo, useCallback

## 4. Implementation Order

1. AF-1: Types + State + Actions + Reducer (foundation)
2. AF-2: useFilteredData hook (core logic)
3. AF-3: FilterPanel component
4. AF-6: i18n keys (needed by FilterPanel)
5. AF-4: Page integration (Dashboard, Funnel, Retention, Segment, Insights)
6. AF-5: Insights type/search filter

## 5. Verification Checklist

- [ ] AF-1: DateRange, ActiveFilters types in types/index.ts
- [ ] AF-1: dateRange, activeFilters in AppState + initialState
- [ ] AF-1: SET_DATE_RANGE, SET_PLATFORM_FILTER, SET_CHANNEL_FILTER, CLEAR_FILTERS actions
- [ ] AF-2: useFilteredData hook returns filteredData, filterCount, setters, clearFilters
- [ ] AF-2: Filters by date range, platform, channel using useMemo
- [ ] AF-3: FilterPanel with collapsible UI, date inputs, presets, checkboxes, clear button
- [ ] AF-4: 5 pages use filteredData instead of raw processedData
- [ ] AF-4: FilterPanel rendered on all 5 pages
- [ ] AF-5: Insights type toggle + search input
- [ ] AF-6: i18n keys added (ko + en)
