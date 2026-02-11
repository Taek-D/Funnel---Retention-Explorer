# Dashboard Customization — Design

> **Feature**: dashboard-customization
> **Plan**: [dashboard-customization.plan.md](../../01-plan/features/dashboard-customization.plan.md)
> **Date**: 2026-02-11

---

## 1. Architecture

```
Dashboard.tsx
  └─ useDashboardLayout() hook
       ├─ reads layout from state (or default)
       ├─ provides reorder / toggle / resize actions
       └─ persists to localStorage + Supabase

AppState.dashboardLayout: WidgetLayout[]
  └─ reducer: SET_DASHBOARD_LAYOUT action

Widget Registry (DASHBOARD_WIDGETS constant)
  └─ maps widgetId → React component + metadata
```

## 2. Implementation Tasks

### DC-1: Layout Type & State (`types/index.ts` + `context/`)

Add types:

```typescript
export type WidgetId =
  | 'kpi-cards'
  | 'funnel-chart'
  | 'retention-chart'
  | 'data-quality'
  | 'quick-actions'
  | 'recent-insights'
  | 'saved-analyses';

export type WidgetWidth = 'full' | 'half';

export interface WidgetLayout {
  widgetId: WidgetId;
  visible: boolean;
  width: WidgetWidth;
  order: number;
}
```

Add to `AppState`:

```typescript
dashboardLayout: WidgetLayout[];
```

Add to `initialState` in `reducer.ts`:

```typescript
dashboardLayout: []  // empty = use DEFAULT_LAYOUT
```

Add action:

```typescript
| { type: 'SET_DASHBOARD_LAYOUT'; payload: WidgetLayout[] }
```

Add reducer case:

```typescript
case 'SET_DASHBOARD_LAYOUT':
  return { ...state, dashboardLayout: action.payload };
```

### DC-2: `useDashboardLayout` Hook (`hooks/useDashboardLayout.ts`)

```typescript
export function useDashboardLayout() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();

  // Resolved layout (state or default)
  const layout: WidgetLayout[];

  // Edit mode toggle
  const [editMode, setEditMode] = useState(false);

  // Actions
  const toggleVisibility: (widgetId: WidgetId) => void;
  const toggleWidth: (widgetId: WidgetId) => void;
  const reorder: (fromIndex: number, toIndex: number) => void;
  const resetToDefault: () => void;

  // Persistence (auto-save on layout change)
  // - localStorage: immediate write
  // - Supabase: debounced 1s write (logged-in users only)

  return {
    layout, editMode, setEditMode,
    toggleVisibility, toggleWidth, reorder, resetToDefault
  };
}
```

**Persistence key**: `fre-dashboard-layout` (localStorage)

**Supabase column**: `fre_user_profiles.dashboard_layout JSONB DEFAULT NULL`

### DC-3: Widget Registry (`lib/constants.ts`)

```typescript
export const DASHBOARD_WIDGETS: Record<WidgetId, {
  labelKey: string;    // i18n key
  icon: string;        // Lucide icon name
  defaultWidth: WidgetWidth;
  minWidth: WidgetWidth;  // some widgets require full width
}> = {
  'kpi-cards':        { labelKey: 'dashboard.widgets.kpiCards',       icon: 'BarChart2', defaultWidth: 'full', minWidth: 'full' },
  'funnel-chart':     { labelKey: 'dashboard.widgets.funnelChart',    icon: 'Filter',    defaultWidth: 'full', minWidth: 'half' },
  'retention-chart':  { labelKey: 'dashboard.widgets.retentionChart', icon: 'Clock',     defaultWidth: 'full', minWidth: 'half' },
  'data-quality':     { labelKey: 'dashboard.widgets.dataQuality',    icon: 'Shield',    defaultWidth: 'half', minWidth: 'half' },
  'quick-actions':    { labelKey: 'dashboard.widgets.quickActions',   icon: 'Zap',       defaultWidth: 'half', minWidth: 'half' },
  'recent-insights':  { labelKey: 'dashboard.widgets.recentInsights', icon: 'Sparkles',  defaultWidth: 'full', minWidth: 'half' },
  'saved-analyses':   { labelKey: 'dashboard.widgets.savedAnalyses',  icon: 'Download',  defaultWidth: 'full', minWidth: 'half' },
};

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  { widgetId: 'kpi-cards',       visible: true, width: 'full', order: 0 },
  { widgetId: 'funnel-chart',    visible: true, width: 'full', order: 1 },
  { widgetId: 'retention-chart', visible: true, width: 'full', order: 2 },
  { widgetId: 'data-quality',    visible: true, width: 'half', order: 3 },
  { widgetId: 'quick-actions',   visible: true, width: 'half', order: 4 },
  { widgetId: 'recent-insights', visible: true, width: 'full', order: 5 },
  { widgetId: 'saved-analyses',  visible: true, width: 'full', order: 6 },
];
```

### DC-4: DashboardWidget Wrapper (`components/DashboardWidget.tsx`)

```typescript
interface DashboardWidgetProps {
  widgetId: WidgetId;
  title: string;
  icon: React.ReactNode;
  editMode: boolean;
  visible: boolean;
  width: WidgetWidth;
  onToggleVisibility: () => void;
  onToggleWidth: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
}
```

Features:
- In edit mode: shows drag handle (GripVertical icon), visibility eye toggle, width toggle (Maximize2/Minimize2)
- In view mode: renders children normally with no chrome
- Drag handle uses `draggable` attribute
- Hidden widgets show as collapsed gray bar in edit mode (not rendered in view mode)
- Width class: `full` → `col-span-2`, `half` → `col-span-1` (on `md:grid-cols-2` grid)

### DC-5: Dashboard Edit Mode UI

Add to Dashboard.tsx header area:

```typescript
// Edit mode toggle button
<button onClick={() => setEditMode(!editMode)}>
  {editMode ? <Check /> : <Settings />}
  {editMode ? t('dashboard.editDone') : t('dashboard.editLayout')}
</button>

// Reset button (only in edit mode)
{editMode && (
  <button onClick={resetToDefault}>
    <RotateCcw /> {t('dashboard.resetLayout')}
  </button>
)}
```

Dashboard body changes:
- Wrap each widget section in `<DashboardWidget>` with appropriate props
- Replace hardcoded grid with dynamic `layout.sort(order).map(widget => ...)` render
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Full-width widgets: `md:col-span-2`
- Half-width widgets: `md:col-span-1`
- Mobile: always `col-span-1` (single column)

### DC-6: Layout Persistence (`hooks/useDashboardLayout.ts`)

**localStorage**:
```typescript
const STORAGE_KEY = 'fre-dashboard-layout';

// Load on mount
const saved = localStorage.getItem(STORAGE_KEY);
const initial = saved ? JSON.parse(saved) : DEFAULT_LAYOUT;

// Save on change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}, [layout]);
```

**Supabase** (logged-in users):
```typescript
// New migration: ALTER TABLE fre_user_profiles ADD COLUMN dashboard_layout JSONB DEFAULT NULL;

// Save (debounced 1s):
await supabase
  .from('fre_user_profiles')
  .update({ dashboard_layout: layout })
  .eq('id', user.id);

// Load on auth (merge with localStorage, Supabase takes priority if exists):
const { data } = await supabase
  .from('fre_user_profiles')
  .select('dashboard_layout')
  .eq('id', user.id)
  .single();
```

### DC-7: i18n Keys

Add to `locales/ko/pages.json` under `dashboard`:

```json
{
  "editLayout": "레이아웃 편집",
  "editDone": "편집 완료",
  "resetLayout": "기본 레이아웃으로 복원",
  "resetConfirm": "기본 레이아웃으로 복원하시겠습니까?",
  "widgets": {
    "kpiCards": "KPI 카드",
    "funnelChart": "퍼널 이탈 차트",
    "retentionChart": "리텐션 곡선",
    "dataQuality": "데이터 품질",
    "quickActions": "빠른 분석",
    "recentInsights": "최근 인사이트",
    "savedAnalyses": "저장된 분석"
  },
  "widgetHidden": "숨겨진 위젯",
  "dragToReorder": "드래그하여 순서 변경"
}
```

Corresponding English keys in `locales/en/pages.json`.

## 3. Dependencies

- **New npm**: None (HTML5 Drag & Drop API, no external library)
- **New Supabase migration**: `ALTER TABLE fre_user_profiles ADD COLUMN dashboard_layout JSONB DEFAULT NULL;`
- **Existing**: useAppContext, useAuth, localStorage, i18n

## 4. Implementation Order

1. DC-1: Types + State (foundation)
2. DC-3: Widget Registry constant (needed by hook)
3. DC-2: useDashboardLayout hook (core logic)
4. DC-4: DashboardWidget wrapper component
5. DC-5: Dashboard.tsx refactor (integrate edit mode + dynamic rendering)
6. DC-6: Persistence (localStorage + Supabase migration)
7. DC-7: i18n keys (ko/en)

## 5. Mobile Behavior

- Edit mode toggle visible on mobile
- In edit mode: vertical list (no grid), drag & drop works via touch events
- In view mode: single column, all widgets full-width regardless of `width` setting
- Widget settings (visibility/width toggles) accessible via tap in edit mode
