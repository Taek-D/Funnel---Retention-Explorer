# Design: DAU/MAU Stickiness (스티키니스 분석)

## ST-1: Engine (lib/stickinessEngine.ts)

### Types
```typescript
export type StickinessDay = {
  date: string;       // YYYY-MM-DD
  dau: number;        // 해당일 고유 사용자 수
  mau: number;        // 직전 windowDays일 고유 사용자 수
  ratio: number;      // DAU/MAU * 100 (0~100)
};

export type StickinessSummary = {
  avgDAU: number;
  avgMAU: number;
  avgRatio: number;   // 평균 DAU/MAU %
  peakRatio: number;  // 최고 DAU/MAU %
  lowRatio: number;   // 최저 DAU/MAU %
  totalDays: number;  // 분석 일수
};

export type StickinessResult = {
  summary: StickinessSummary;
  daily: StickinessDay[];
};
```

### Function
```typescript
export function calculateStickiness(
  processedData: ProcessedEvent[],
  windowDays: number = 28
): StickinessResult
```

### Algorithm
1. processedData에서 각 이벤트의 날짜(YYYY-MM-DD)와 userId 추출
2. Map<string, Set<string>> 구조로 날짜별 고유 사용자 집합 생성
3. 날짜를 정렬하여 순회
4. 각 날짜마다:
   - DAU = 해당 날짜의 고유 사용자 수
   - MAU = 직전 windowDays일간의 합집합 사용자 수
   - ratio = MAU > 0 ? (DAU / MAU) * 100 : 0
5. summary 통계 계산 (avg, peak, low)

## ST-2: Page (pages/StickinessPage.tsx)

### Layout
```
┌──────────────────────────────────────────┐
│ Stickiness Analysis                       │
│ DAU/MAU 비율로 제품 활용도를 측정합니다    │
├──────────────────────────────────────────┤
│ [KPI: 평균] [KPI: 피크] [KPI: 로우]       │
├──────────────────────────────────────────┤
│ AreaChart: Daily Stickiness Trend         │
│ (X=날짜, Y=DAU/MAU %, fill=accent/20)    │
├──────────────────────────────────────────┤
│ Table: Date | DAU | MAU | Ratio           │
└──────────────────────────────────────────┘
```

### Components used
- useAppContext (processedData)
- FilterPanel (optional date range)
- AreaChart + XAxis + YAxis + Tooltip + ResponsiveContainer (Recharts)
- ChartDownloadButton (chartRef)
- ChartSkeleton (loading placeholder)
- Empty state: Activity icon

### KPI Cards
1. **평균 DAU/MAU**: `summary.avgRatio.toFixed(1)%`
2. **피크**: `summary.peakRatio.toFixed(1)%`
3. **로우**: `summary.lowRatio.toFixed(1)%`

### AreaChart
- dataKey="ratio", fill=CHART_COLORS.palette[0] opacity 0.2, stroke same
- XAxis dataKey="date", YAxis domain=[0, 100] unit="%"
- Tooltip: date + DAU + MAU + ratio

### Table
- Scrollable, max 50 rows (most recent first)
- Columns: Date, DAU, MAU, Ratio(%)
- Ratio cell color: >=30% green, >=15% yellow, <15% red

## ST-3: Route / Sidebar / Icons

### router.tsx
```typescript
const StickinessPage = lazy(() => import('./pages/StickinessPage').then(m => ({ default: m.StickinessPage })));
// route: { path: 'stickiness', element: <StickinessPage /> }
```

### Sidebar.tsx
```typescript
{ path: '/app/stickiness', icon: Activity, labelKey: 'nav.stickiness' }
```
- After retention-compare entry

### Icons.tsx
- Activity already exported? Check, add if missing

## ST-4: Dashboard Widget

### types/index.ts
- Add `'stickiness-chart'` to WidgetId union

### constants.ts
```typescript
'stickiness-chart': { labelKey: 'dashboard.widgets.stickinessChart', icon: 'Activity', defaultWidth: 'half', minWidth: 'half' },
```

### DEFAULT_LAYOUT
- Add at order 7 (after saved-analyses), visible: false by default

### PRESET_TEMPLATES
- Add to 'saas' preset (visible: true, width: 'half')

### Dashboard.tsx
- Add stickiness widget: mini AreaChart using calculateStickiness
- height: 200px, simplified (no table)

## ST-5: i18n

### ko/pages.json (stickiness section)
```json
"stickiness": {
  "title": "스티키니스 분석",
  "desc": "DAU/MAU 비율로 제품 활용도를 측정합니다",
  "noData": "데이터를 먼저 업로드하세요",
  "noDataDesc": "CSV 파일을 업로드하면 스티키니스 분석을 시작할 수 있습니다",
  "avgRatio": "평균 DAU/MAU",
  "peakRatio": "피크 DAU/MAU",
  "lowRatio": "로우 DAU/MAU",
  "trendTitle": "일별 스티키니스 추이",
  "date": "날짜",
  "dau": "DAU",
  "mau": "MAU",
  "ratio": "DAU/MAU"
}
```

### en/pages.json (stickiness section)
```json
"stickiness": {
  "title": "Stickiness Analysis",
  "desc": "Measure product engagement with DAU/MAU ratio",
  "noData": "Upload data first",
  "noDataDesc": "Upload a CSV file to start stickiness analysis",
  "avgRatio": "Avg DAU/MAU",
  "peakRatio": "Peak DAU/MAU",
  "lowRatio": "Low DAU/MAU",
  "trendTitle": "Daily Stickiness Trend",
  "date": "Date",
  "dau": "DAU",
  "mau": "MAU",
  "ratio": "DAU/MAU"
}
```

### ko/common.json
```json
"stickiness": "스티키니스"
```

### en/common.json
```json
"stickiness": "Stickiness"
```

### dashboard widget i18n
- ko: `"stickinessChart": "스티키니스"`
- en: `"stickinessChart": "Stickiness"`

## Verification Checklist (22 items)

### ST-1: Engine (5)
1. stickinessEngine.ts 파일 존재
2. calculateStickiness 함수 export
3. StickinessResult 타입 export
4. daily 배열에 date/dau/mau/ratio 필드
5. summary에 avgRatio/peakRatio/lowRatio/avgDAU/avgMAU/totalDays

### ST-2: Page (6)
6. StickinessPage 컴포넌트 export
7. KPI 카드 3개 (avg/peak/low ratio)
8. AreaChart with ratio dataKey
9. 테이블 (date/dau/mau/ratio 컬럼)
10. ChartDownloadButton 포함
11. 빈 상태 (processedData 없을 때)

### ST-3: Route/Sidebar (3)
12. /app/stickiness lazy route in router.tsx
13. Sidebar에 stickiness 메뉴 항목
14. Activity 아이콘 사용

### ST-4: Dashboard Widget (5)
15. 'stickiness-chart' in WidgetId union
16. DASHBOARD_WIDGETS에 stickiness-chart 항목
17. DEFAULT_LAYOUT에 추가 (visible: false)
18. PRESET_TEMPLATES saas에 추가
19. Dashboard.tsx에 스티키니스 위젯 렌더링

### ST-5: i18n (3)
20. 12 stickiness.* keys in ko/en pages.json
21. nav.stickiness in ko/en common.json
22. dashboard.widgets.stickinessChart in ko/en pages.json
