# Scheduled Reports — Design

> **Feature**: scheduled-reports
> **Plan**: [scheduled-reports.plan.md](../../01-plan/features/scheduled-reports.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
User ─── ScheduledReportsPage (CRUD) ─── supabaseData.ts (fre_scheduled_reports)
                                              │
                                              ▼
                                     Supabase DB (pg_cron)
                                              │
                                    ┌─────────┴──────────┐
                                    │  Edge Function      │
                                    │  scheduled-report   │
                                    │  (hourly cron)      │
                                    │                     │
                                    │  1. Query due       │
                                    │     schedules       │
                                    │  2. Fetch dataset   │
                                    │  3. Build snapshot   │
                                    │  4. Format payload  │
                                    │  5. POST to webhook │
                                    │  6. Update last_run │
                                    └─────────────────────┘
```

## 2. Implementation Tasks

### SR-1: Types (`types/index.ts`)

```typescript
// ===== Scheduled Reports =====

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export interface ScheduledReport {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  frequency: ReportFrequency;
  day_of_week: number | null;   // 0=Sun..6=Sat (weekly only)
  day_of_month: number | null;  // 1-28 (monthly only)
  hour_utc: number;             // 0-23
  webhook_ids: string[];        // references fre_webhooks.id
  active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}
```

Add before `// ===== Filters =====` section.

### SR-1b: DB Schema (`supabase/migrations/20260213_scheduled_reports.sql`)

```sql
-- Scheduled Reports table
CREATE TABLE IF NOT EXISTS fre_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  hour_utc INTEGER NOT NULL DEFAULT 9 CHECK (hour_utc BETWEEN 0 AND 23),
  webhook_ids UUID[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE fre_scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scheduled reports"
  ON fre_scheduled_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled reports"
  ON fre_scheduled_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled reports"
  ON fre_scheduled_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled reports"
  ON fre_scheduled_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can read all (for cron Edge Function)
CREATE POLICY "Service role can read all schedules"
  ON fre_scheduled_reports FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update schedules"
  ON fre_scheduled_reports FOR UPDATE
  TO service_role
  USING (true);
```

### SR-2: CRUD Functions (`lib/supabaseData.ts`)

```typescript
// ===== Scheduled Reports =====

export async function listScheduledReports(): Promise<ScheduledReport[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_scheduled_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createScheduledReport(params: {
  name: string;
  frequency: ReportFrequency;
  day_of_week?: number | null;
  day_of_month?: number | null;
  hour_utc: number;
  webhook_ids: string[];
  project_id?: string | null;
}): Promise<ScheduledReport> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');
  const { data, error } = await client
    .from('fre_scheduled_reports')
    .insert({ ...params, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateScheduledReport(
  id: string,
  params: Partial<Pick<ScheduledReport, 'name' | 'frequency' | 'day_of_week' | 'day_of_month' | 'hour_utc' | 'webhook_ids' | 'active'>>
): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_scheduled_reports')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteScheduledReport(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_scheduled_reports')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
```

Add after Webhooks section, before Teams section.

### SR-3: Report Summary Builder (`lib/scheduledReportBuilder.ts`)

Server-compatible (no DOM) summary builder for scheduled report payloads.

```typescript
import type { ReportFrequency } from '../types';

interface ScheduledReportPayload {
  reportName: string;
  frequency: ReportFrequency;
  generatedAt: string;
  dataset: {
    totalEvents: number;
    uniqueUsers: number;
    dateRange: string;
  };
  funnel: {
    stepCount: number;
    overallConversion: number | null;
    topDropOff: string | null;
  } | null;
  retention: {
    cohortCount: number;
    avgDay1: number | null;
    avgDay7: number | null;
  } | null;
  highlights: string[];
}

export function buildScheduledPayload(
  reportName: string,
  frequency: ReportFrequency,
  datasetRows: Record<string, unknown>[],
  // analysis results passed from Edge Function
  analysisResults?: {
    funnel?: { steps: string[]; results: { step: string; users: number; conversionRate: number }[] };
    retention?: { cohortCount: number; avgDay1: number | null; avgDay7: number | null };
  }
): ScheduledReportPayload {
  // ... build payload from raw data
}

export function formatSummaryText(payload: ScheduledReportPayload): { title: string; message: string } {
  const title = `[${payload.frequency.toUpperCase()}] ${payload.reportName}`;
  const lines: string[] = [
    `Generated: ${new Date(payload.generatedAt).toLocaleString()}`,
    `Events: ${payload.dataset.totalEvents.toLocaleString()} | Users: ${payload.dataset.uniqueUsers.toLocaleString()}`,
  ];
  if (payload.funnel) {
    lines.push(`Funnel: ${payload.funnel.stepCount} steps, ${payload.funnel.overallConversion?.toFixed(1) ?? 'N/A'}% conversion`);
  }
  if (payload.retention) {
    lines.push(`Retention: D1 ${payload.retention.avgDay1?.toFixed(1) ?? 'N/A'}%, D7 ${payload.retention.avgDay7?.toFixed(1) ?? 'N/A'}%`);
  }
  if (payload.highlights.length > 0) {
    lines.push('', ...payload.highlights.map(h => `• ${h}`));
  }
  return { title, message: lines.join('\n') };
}
```

### SR-4: Edge Function (`supabase/functions/scheduled-report/index.ts`)

Invoked hourly by pg_cron. Queries due schedules, fetches datasets, builds summaries, dispatches webhooks.

```typescript
// Pseudocode — actual implementation follows Deno Deploy pattern
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDayOfWeek = now.getUTCDay();
  const currentDayOfMonth = now.getUTCDate();

  // Query active schedules matching current time
  const { data: schedules } = await supabase
    .from('fre_scheduled_reports')
    .select('*')
    .eq('active', true)
    .eq('hour_utc', currentHour);

  // Filter by frequency + day
  const dueSchedules = schedules?.filter(s => {
    if (s.frequency === 'daily') return true;
    if (s.frequency === 'weekly') return s.day_of_week === currentDayOfWeek;
    if (s.frequency === 'monthly') return s.day_of_month === currentDayOfMonth;
    return false;
  }) || [];

  // Process each schedule
  for (const schedule of dueSchedules) {
    try {
      // 1. Fetch latest dataset
      // 2. Build summary payload
      // 3. Get webhook configs
      // 4. POST to each webhook
      // 5. Update last_run_at
    } catch (err) {
      // Log error to fre_webhook_logs
    }
  }

  return new Response(JSON.stringify({ processed: dueSchedules.length }));
});
```

### SR-5: Schedule Management UI (`pages/ScheduledReports.tsx`)

Full CRUD page following WebhookSettings.tsx pattern.

```typescript
// Key features:
// - List existing schedules with status badges
// - Create/edit form: name, frequency (radio), day selector, hour (dropdown), webhook multi-select
// - Active/inactive toggle
// - Last run timestamp display
// - Delete with confirmation
// - Pro-only gating (usePlanGate)
// - Login required guard
```

Form fields:
- Name (text input)
- Frequency (radio: daily/weekly/monthly)
- Day of week (dropdown, shown when weekly)
- Day of month (dropdown 1-28, shown when monthly)
- Hour UTC (dropdown 0-23 with local time hint)
- Target Webhooks (multi-select from existing webhooks)

### SR-5b: Route + Sidebar

Router: Add lazy import + route `{ path: 'scheduled-reports', element: ... }` after webhooks.

Sidebar: Add `{ path: '/app/scheduled-reports', icon: Clock, labelKey: 'nav.scheduledReports' }` after webhooks.

Icons: Add `Clock` export to Icons.tsx.

### SR-6: i18n Keys

`locales/ko/pages.json` — `scheduledReport` section:
```json
{
  "scheduledReport": {
    "title": "예약 리포트",
    "description": "자동 분석 리포트를 주기적으로 생성하여 Webhook으로 전송합니다.",
    "create": "스케줄 추가",
    "edit": "스케줄 수정",
    "name": "리포트 이름",
    "namePlaceholder": "주간 퍼널 리포트",
    "frequency": "빈도",
    "daily": "매일",
    "weekly": "매주",
    "monthly": "매월",
    "dayOfWeek": "요일",
    "dayOfMonth": "날짜",
    "hourUtc": "실행 시각 (UTC)",
    "localTimeHint": "현지 시각: {{time}}",
    "targetWebhooks": "대상 Webhook",
    "noWebhooks": "등록된 Webhook이 없습니다. Webhook을 먼저 설정해주세요.",
    "lastRun": "마지막 실행",
    "neverRun": "아직 실행되지 않음",
    "active": "활성",
    "inactive": "비활성",
    "deleteConfirm": "이 스케줄을 삭제하시겠습니까?",
    "proOnly": "예약 리포트는 Pro 플랜에서 이용 가능합니다.",
    "saved": "스케줄이 저장되었습니다.",
    "deleted": "스케줄이 삭제되었습니다."
  }
}
```

`locales/ko/common.json`:
```json
{
  "nav": {
    "scheduledReports": "예약 리포트"
  }
}
```

Corresponding English keys in `en/pages.json` and `en/common.json`.

## 3. Dependencies

- **New npm**: none (uses existing Supabase client)
- **New files**: scheduledReportBuilder.ts, ScheduledReports.tsx, migration SQL, Edge Function
- **Modified**: types/index.ts, supabaseData.ts, router.tsx, Sidebar.tsx, Icons.tsx, i18n files

## 4. Implementation Order

1. SR-1: Types + DB schema (foundation)
2. SR-2: CRUD functions
3. SR-3: Report summary builder
4. SR-4: Edge Function (server-side, deferred deployment)
5. SR-5: UI page + route + sidebar
6. SR-6: i18n keys

## 5. Verification Checklist

- [ ] SR-1: ScheduledReport type with all fields
- [ ] SR-1: ReportFrequency type ('daily' | 'weekly' | 'monthly')
- [ ] SR-1: SQL migration with RLS policies
- [ ] SR-2: listScheduledReports() in supabaseData.ts
- [ ] SR-2: createScheduledReport() with user_id auto-set
- [ ] SR-2: updateScheduledReport() with partial params
- [ ] SR-2: deleteScheduledReport()
- [ ] SR-3: scheduledReportBuilder.ts with buildScheduledPayload()
- [ ] SR-3: formatSummaryText() returning title + message
- [ ] SR-4: Edge Function scaffold (scheduled-report/index.ts)
- [ ] SR-4: Query active schedules by hour_utc
- [ ] SR-4: Filter by frequency + day
- [ ] SR-5: ScheduledReports page component
- [ ] SR-5: Create/edit form with frequency-dependent fields
- [ ] SR-5: Active toggle, delete confirmation
- [ ] SR-5: Webhook multi-select from existing webhooks
- [ ] SR-5: Pro-only gating (usePlanGate)
- [ ] SR-5: Login required guard
- [ ] SR-5: Route registered in router.tsx
- [ ] SR-5: Sidebar nav item with Clock icon
- [ ] SR-6: i18n keys added (ko + en, ~20 keys each)
- [ ] SR-6: nav.scheduledReports key in common.json
