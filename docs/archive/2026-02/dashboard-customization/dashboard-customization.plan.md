# Dashboard Customization — Plan

> **Feature**: dashboard-customization
> **Priority**: 2/5 (Medium)
> **Date**: 2026-02-11

---

## 1. Background

Current Dashboard has 7 hardcoded widgets (KPI cards, Funnel chart, Retention chart, Data Quality, Quick Actions, Recent Insights, Saved Analyses) in a fixed layout. Users cannot reorder, hide, or resize widgets. All layout is determined by component render order in Dashboard.tsx.

## 2. Goals

- Allow users to show/hide individual widgets
- Allow users to reorder widgets via drag & drop
- Allow users to resize widgets (full-width vs half-width)
- Persist layout per user (localStorage for guests, Supabase for logged-in users)
- Provide a "Reset to default" option
- Maintain mobile responsiveness (single column on mobile regardless of custom layout)

## 3. Scope

### In Scope
- DC-1: Dashboard layout state model (`types/index.ts` + `context/`)
- DC-2: `useDashboardLayout` hook (layout CRUD + persistence)
- DC-3: Widget wrapper component with drag handle + visibility toggle
- DC-4: Dashboard edit mode UI (toggle edit mode, widget settings panel)
- DC-5: Drag & drop reordering (lightweight, no external library)
- DC-6: Layout persistence (localStorage + Supabase `fre_user_profiles`)
- DC-7: i18n keys for dashboard customization UI

### Out of Scope
- Custom widget creation (user-defined widgets)
- Dashboard sharing/templates between users
- Widget-level data source configuration
- Real-time collaborative editing

## 4. Technical Approach

- **Layout Model**: Array of `{ widgetId, visible, width: 'full' | 'half', order }` stored as JSON
- **Drag & Drop**: Native HTML5 Drag and Drop API (no react-dnd or dnd-kit dependency)
- **State**: New `dashboardLayout` property in AppState + reducer actions
- **Persistence**: localStorage for immediate save, Supabase sync for logged-in users
- **Edit Mode**: Toggle button in Dashboard header enters/exits edit mode with visual affordances
- **Default Layout**: Hardcoded fallback matching current widget order

## 5. Widget Registry

| widgetId | Label | Default Visible | Default Width | Default Order |
|----------|-------|:---------------:|:-------------:|:-------------:|
| kpi-cards | KPI Cards | true | full | 0 |
| funnel-chart | Funnel Dropoff | true | full | 1 |
| retention-chart | Retention Curve | true | full | 2 |
| data-quality | Data Quality | true | half | 3 |
| quick-actions | Quick Actions | true | half | 4 |
| recent-insights | Recent Insights | true | full | 5 |
| saved-analyses | Saved Analyses | true | full | 6 |

## 6. Success Criteria

- [ ] Users can toggle widget visibility (show/hide)
- [ ] Users can drag & drop to reorder widgets
- [ ] Users can toggle widget width (full/half)
- [ ] Layout persists across page reloads (localStorage)
- [ ] Layout syncs to Supabase for logged-in users
- [ ] "Reset to default" restores original layout
- [ ] Mobile view ignores custom widths (always full)
- [ ] Edit mode has clear visual distinction
- [ ] All UI strings localized (ko/en)
- [ ] Build passes, no bundle regression
