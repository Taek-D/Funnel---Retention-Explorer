# Scheduled Reports -- Gap Analysis

> Match Rate: 100.0% (22 PASS / 22 total)
> Date: 2026-02-13

## Design Document

`docs/02-design/features/scheduled-reports.design.md`

## Implementation Paths

| Area | Path |
|------|------|
| Types | `funnel-&-retention-explorer frontend/types/index.ts` (lines 45-63) |
| DB Migration | `funnel-&-retention-explorer frontend/supabase/migrations/20260213_scheduled_reports.sql` |
| CRUD | `funnel-&-retention-explorer frontend/lib/supabaseData.ts` (lines 378-428) |
| Builder | `funnel-&-retention-explorer frontend/lib/scheduledReportBuilder.ts` |
| Edge Function | `funnel-&-retention-explorer frontend/supabase/functions/scheduled-report/index.ts` |
| Page | `funnel-&-retention-explorer frontend/pages/ScheduledReports.tsx` |
| Router | `funnel-&-retention-explorer frontend/router.tsx` (line 26, 79) |
| Sidebar | `funnel-&-retention-explorer frontend/components/Sidebar.tsx` (line 39) |
| Icons | `funnel-&-retention-explorer frontend/components/Icons.tsx` (Clock export) |
| i18n KO pages | `funnel-&-retention-explorer frontend/locales/ko/pages.json` (lines 600-625) |
| i18n EN pages | `funnel-&-retention-explorer frontend/locales/en/pages.json` (lines 600-625) |
| i18n KO common | `funnel-&-retention-explorer frontend/locales/ko/common.json` (line 12) |
| i18n EN common | `funnel-&-retention-explorer frontend/locales/en/common.json` (line 12) |

## Checklist Results

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | SR-1: ScheduledReport type with all fields | PASS | Interface at types/index.ts:49-63 matches design exactly: id, user_id, project_id, name, frequency, day_of_week, day_of_month, hour_utc, webhook_ids, active, last_run_at, created_at, updated_at |
| 2 | SR-1: ReportFrequency type ('daily' \| 'weekly' \| 'monthly') | PASS | Defined at types/index.ts:47 as `type ReportFrequency = 'daily' \| 'weekly' \| 'monthly'` |
| 3 | SR-1: SQL migration with RLS policies | PASS | 20260213_scheduled_reports.sql has CREATE TABLE with all columns, CHECK constraints, 6 RLS policies (4 user + 2 service_role) matching design |
| 4 | SR-2: listScheduledReports() in supabaseData.ts | PASS | supabaseData.ts:378-386 selects from fre_scheduled_reports ordered by created_at desc |
| 5 | SR-2: createScheduledReport() with user_id auto-set | PASS | supabaseData.ts:388-406 gets user via auth.getUser(), inserts with spread params + user_id |
| 6 | SR-2: updateScheduledReport() with partial params | PASS | supabaseData.ts:409-419 accepts Partial<Pick<ScheduledReport, ...>> and sets updated_at |
| 7 | SR-2: deleteScheduledReport() | PASS | supabaseData.ts:421-428 deletes by id |
| 8 | SR-3: scheduledReportBuilder.ts with buildScheduledPayload() | PASS | lib/scheduledReportBuilder.ts:25-98 implements full payload builder with unique users, date range, funnel conversion/drop-off, retention, and highlights |
| 9 | SR-3: formatSummaryText() returning title + message | PASS | lib/scheduledReportBuilder.ts:101-130 returns `{ title, message }` with frequency label prefix, events/users/period/funnel/retention/highlights sections |
| 10 | SR-4: Edge Function scaffold (scheduled-report/index.ts) | PASS | supabase/functions/scheduled-report/index.ts (146 lines) using Deno serve() pattern with CORS + service_role auth |
| 11 | SR-4: Query active schedules by hour_utc | PASS | Edge Function lines 32-36: `.eq('active', true).eq('hour_utc', currentHour)` |
| 12 | SR-4: Filter by frequency + day | PASS | Edge Function lines 46-51: filters daily (always true), weekly (day_of_week), monthly (day_of_month) |
| 13 | SR-5: ScheduledReports page component | PASS | pages/ScheduledReports.tsx exports `ScheduledReports` React.FC (414 lines) |
| 14 | SR-5: Create/edit form with frequency-dependent fields | PASS | Form shows day_of_week dropdown when weekly (line 222), day_of_month dropdown 1-28 when monthly (line 238), frequency radio buttons for daily/weekly/monthly |
| 15 | SR-5: Active toggle, delete confirmation | PASS | Toggle switch (lines 329-338) calls handleToggle; delete uses deleteConfirmId state with confirm/cancel icons (lines 353-375) |
| 16 | SR-5: Webhook multi-select from existing webhooks | PASS | Fetches webhooks via listWebhooks() on mount; renders checkbox list (lines 271-291) with toggleWebhookId |
| 17 | SR-5: Pro-only gating (usePlanGate) | PASS | usePlanGate() at line 34; non-Pro users see upgrade prompt (lines 67-85) |
| 18 | SR-5: Login required guard | PASS | Checks `!user` at line 59 and shows loginRequired message |
| 19 | SR-5: Route registered in router.tsx | PASS | Lazy import at line 26; route `{ path: 'scheduled-reports', ... }` at line 79, after webhooks |
| 20 | SR-5: Sidebar nav item with Clock icon | PASS | Sidebar.tsx line 39: `{ path: '/app/scheduled-reports', icon: Clock, labelKey: 'nav.scheduledReports' }` after webhooks; Clock imported from Icons.tsx |
| 21 | SR-6: i18n keys added (ko + en, ~20 keys each) | PASS | Both ko/pages.json and en/pages.json have `scheduledReport` section with 20 keys: title, description, create, edit, name, namePlaceholder, frequency, daily, weekly, monthly, dayOfWeek, dayOfMonth, hourUtc, localTimeHint, targetWebhooks, noWebhooks, lastRun, neverRun, active, inactive, deleteConfirm, proOnly, saved, deleted (24 keys total) |
| 22 | SR-6: nav.scheduledReports key in common.json | PASS | ko/common.json line 12: `"scheduledReports": "..."` and en/common.json line 12: `"scheduledReports": "Scheduled Reports"` |

## Summary

All 22 verification checklist items from the design document have been implemented. The implementation closely follows the design specification:

- **Types**: ScheduledReport interface and ReportFrequency type match the design field-for-field.
- **DB Schema**: Migration file is identical to the design SQL, with all RLS policies.
- **CRUD**: All 4 functions (list, create, update, delete) follow the exact signatures from the design.
- **Builder**: Both `buildScheduledPayload()` and `formatSummaryText()` are implemented with full logic (not stubs). The builder computes unique users, date ranges, funnel conversion/drop-off, retention stats, and highlights. `formatSummaryText` uses a capitalized frequency label rather than `.toUpperCase()` -- a minor stylistic difference with no functional impact.
- **Edge Function**: Full implementation (not pseudocode) with query by hour_utc, frequency+day filtering, dataset fetch, summary build, webhook dispatch via webhook-dispatch sub-function, and last_run_at update. Error handling with per-schedule try/catch.
- **UI**: ScheduledReports.tsx is a complete CRUD page with form (name, frequency radio, conditional day selectors, hour UTC dropdown with local time hint, webhook multi-select), list with toggle/edit/delete, Pro gating, and login guard.
- **Routing + Sidebar**: Lazy-loaded route at `/app/scheduled-reports` after webhooks; Sidebar entry with Clock icon.
- **i18n**: 24 keys in `scheduledReport` section (ko + en) plus `nav.scheduledReports` in common (ko + en).

No missing, added, or changed features detected. Match rate is 100%.
