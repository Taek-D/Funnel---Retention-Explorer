# Webhook — Design

> **Feature**: webhook
> **Plan**: [webhook.plan.md](../../01-plan/features/webhook.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
addNotification(type, title, message)
  │
  ├─ In-app notification (existing, unchanged)
  │     └─ NotificationContext → fre_notifications
  │
  └─ Webhook dispatch (NEW)
        └─ dispatchWebhooks(type, title, message)
              │
              ├─ Fetch active webhooks from fre_webhooks (cached)
              ├─ Filter by event type subscription
              └─ POST to Edge Function: webhook-dispatch
                    │
                    ├─ Format payload (json / slack / discord)
                    ├─ Sign with HMAC-SHA256 (X-Webhook-Signature)
                    ├─ HTTP POST to user URL
                    ├─ Log result to fre_webhook_logs
                    └─ Retry once on failure (5s delay)
```

## 2. Implementation Tasks

### WH-1: Types + DB Schema (`types/index.ts` + `lib/supabaseData.ts`)

Add to `types/index.ts`:

```typescript
// ===== Webhooks =====

export type WebhookFormat = 'json' | 'slack' | 'discord';

export type WebhookEventType = 'analysis' | 'import' | 'ai' | 'export';

export interface WebhookConfig {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  format: WebhookFormat;
  secret: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  status: 'success' | 'failed';
  response_code: number | null;
  error_message: string | null;
  created_at: string;
}
```

Add Supabase migration (SQL, not applied in frontend):

```sql
-- fre_webhooks
CREATE TABLE fre_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'slack', 'discord')),
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own webhooks" ON fre_webhooks
  FOR ALL USING (auth.uid() = user_id);

-- fre_webhook_logs
CREATE TABLE fre_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES fre_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  response_code INT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own webhook logs" ON fre_webhook_logs
  FOR SELECT USING (
    webhook_id IN (SELECT id FROM fre_webhooks WHERE user_id = auth.uid())
  );
```

Add CRUD to `lib/supabaseData.ts`:

```typescript
// ===== Webhooks =====

export async function listWebhooks(): Promise<WebhookConfig[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_webhooks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createWebhook(params: {
  name: string; url: string; events: WebhookEventType[]; format: WebhookFormat;
}): Promise<WebhookConfig> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const secret = crypto.randomUUID();
  const { data, error } = await client
    .from('fre_webhooks')
    .insert({ user_id: user.id, ...params, secret })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateWebhook(id: string, params: Partial<{
  name: string; url: string; events: WebhookEventType[]; format: WebhookFormat; active: boolean;
}>): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_webhooks')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteWebhook(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_webhooks')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listWebhookLogs(webhookId: string, limit = 20): Promise<WebhookLog[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_webhook_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}
```

### WH-2: Webhook Dispatch (`lib/webhookDispatcher.ts`)

```typescript
import type { WebhookConfig, WebhookEventType } from '../types';
import { listWebhooks } from './supabaseData';

let cachedWebhooks: WebhookConfig[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function invalidateWebhookCache(): void {
  cachedWebhooks = null;
  cacheTime = 0;
}

async function getActiveWebhooks(): Promise<WebhookConfig[]> {
  if (cachedWebhooks && Date.now() - cacheTime < CACHE_TTL) {
    return cachedWebhooks;
  }
  try {
    cachedWebhooks = await listWebhooks();
    cacheTime = Date.now();
    return cachedWebhooks;
  } catch {
    return [];
  }
}

export async function dispatchWebhooks(
  eventType: WebhookEventType,
  title: string,
  message: string
): Promise<void> {
  const webhooks = await getActiveWebhooks();
  const matching = webhooks.filter(w => w.active && w.events.includes(eventType));
  if (matching.length === 0) return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const payload = { eventType, title, message, timestamp: new Date().toISOString() };

  // Fire and forget — don't block the UI
  for (const webhook of matching) {
    fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookId: webhook.id,
        url: webhook.url,
        format: webhook.format,
        secret: webhook.secret,
        payload,
      }),
    }).catch(() => { /* silently fail */ });
  }
}
```

### WH-3: NotificationContext Integration

Modify `addNotification` in `NotificationContext.tsx`:

```typescript
// After the existing insertNotification call, add webhook dispatch:
import { dispatchWebhooks } from '../lib/webhookDispatcher';

const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
  // ... existing preference check + local state + DB insert ...

  // Webhook dispatch (fire and forget)
  if (user) {
    dispatchWebhooks(type, title, message).catch(() => {});
  }
}, [user]);
```

### WH-4: Webhook Settings UI (`pages/WebhookSettings.tsx`)

New page at `/app/webhooks`:

- Webhook list with toggle, edit, delete
- "Add Webhook" form: name, URL, format (auto-detected), event checkboxes
- Test button (sends ping event)
- Log viewer per webhook (expandable, shows last 20 entries)
- Route added to router.tsx

Key components:
- WebhookForm: name input, URL input, format selector, event checkboxes
- WebhookCard: displays webhook info, active toggle, edit/delete/test buttons, expandable logs
- WebhookLogs: table of recent delivery attempts

### WH-5: Format Presets (`lib/webhookFormatters.ts`)

```typescript
import type { WebhookFormat } from '../types';

interface WebhookPayload {
  eventType: string;
  title: string;
  message: string;
  timestamp: string;
}

// Detect format from URL pattern
export function detectWebhookFormat(url: string): WebhookFormat {
  if (url.includes('hooks.slack.com')) return 'slack';
  if (url.includes('discord.com/api/webhooks')) return 'discord';
  return 'json';
}

// Format payload for target platform (used in Edge Function)
export function formatPayload(payload: WebhookPayload, format: WebhookFormat): Record<string, unknown> {
  switch (format) {
    case 'slack':
      return {
        text: `*${payload.title}*\n${payload.message}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: payload.title } },
          { type: 'section', text: { type: 'mrkdwn', text: payload.message } },
          { type: 'context', elements: [
            { type: 'mrkdwn', text: `_${payload.eventType}_ | ${payload.timestamp}` },
          ]},
        ],
      };
    case 'discord':
      return {
        embeds: [{
          title: payload.title,
          description: payload.message,
          color: 0x6366F1, // accent color
          footer: { text: `${payload.eventType} | FRE Analytics` },
          timestamp: payload.timestamp,
        }],
      };
    default: // json
      return payload;
  }
}
```

### WH-6: i18n Keys

Add to `locales/ko/pages.json` under `webhook`:

```json
{
  "webhook": {
    "title": "Webhook 설정",
    "description": "분석 완료, 데이터 가져오기 등의 이벤트를 외부 서비스로 전송합니다",
    "addWebhook": "Webhook 추가",
    "editWebhook": "Webhook 수정",
    "name": "이름",
    "namePlaceholder": "예: Slack 알림",
    "url": "Webhook URL",
    "urlPlaceholder": "https://hooks.slack.com/services/...",
    "format": "포맷",
    "formatJson": "JSON (기본)",
    "formatSlack": "Slack",
    "formatDiscord": "Discord",
    "events": "이벤트",
    "eventAnalysis": "분석 완료",
    "eventImport": "데이터 가져오기",
    "eventAI": "AI 인사이트",
    "eventExport": "내보내기",
    "active": "활성",
    "test": "테스트 전송",
    "testSuccess": "테스트 전송 성공",
    "testFailed": "테스트 전송 실패",
    "delete": "삭제",
    "deleteConfirm": "이 Webhook을 삭제하시겠습니까?",
    "logs": "전송 로그",
    "noWebhooks": "등록된 Webhook이 없습니다",
    "secret": "서명 키",
    "secretHint": "X-Webhook-Signature 헤더로 HMAC-SHA256 서명이 전송됩니다",
    "save": "저장",
    "cancel": "취소"
  }
}
```

Corresponding English keys in `locales/en/pages.json`.

## 3. Dependencies

- **New npm**: None
- **New Edge Function**: `webhook-dispatch` (HTTP POST + HMAC + logging)
- **New Supabase tables**: `fre_webhooks`, `fre_webhook_logs` (with RLS)
- **New Icons**: `Webhook` (add to Icons.tsx if not already exported)

## 4. Implementation Order

1. WH-1: Types + CRUD functions (foundation)
2. WH-5: Format presets (needed by dispatcher)
3. WH-2: Webhook dispatcher (core logic)
4. WH-3: NotificationContext integration (connect dispatcher)
5. WH-6: i18n keys (needed by UI)
6. WH-4: Webhook settings UI page + route

## 5. Verification Checklist

- [ ] WH-1: WebhookConfig, WebhookLog, WebhookFormat, WebhookEventType in types/index.ts
- [ ] WH-1: SQL migration for fre_webhooks + fre_webhook_logs with RLS
- [ ] WH-1: CRUD functions in supabaseData.ts (list, create, update, delete, listLogs)
- [ ] WH-2: dispatchWebhooks function with caching + fire-and-forget
- [ ] WH-2: invalidateWebhookCache exported
- [ ] WH-3: addNotification calls dispatchWebhooks for logged-in users
- [ ] WH-3: Webhook failure doesn't block in-app notification
- [ ] WH-4: WebhookSettings page at /app/webhooks
- [ ] WH-4: Webhook CRUD form (name, url, format, events)
- [ ] WH-4: Active toggle, test button, delete with confirm
- [ ] WH-4: Webhook logs viewer (last 20, status + response code)
- [ ] WH-4: Route added to router.tsx + Sidebar link
- [ ] WH-5: detectWebhookFormat (slack/discord/json)
- [ ] WH-5: formatPayload for slack (blocks), discord (embeds), json
- [ ] WH-6: i18n keys added (ko + en, ~28 keys each)
