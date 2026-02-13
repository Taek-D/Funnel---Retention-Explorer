# Custom Event Definition — Design

## 1. Overview

사용자가 CSV 원본 이벤트를 기반으로 커스텀 이벤트(별칭, 그룹, 조건부)를 정의하고,
퍼널/리텐션 분석에서 활용할 수 있게 합니다.

## 2. Data Model

### 2.1 TypeScript Types (types/index.ts)

```typescript
export type CustomEventType = 'alias' | 'group' | 'conditional';

export interface CustomEventCondition {
  field: 'platform' | 'channel';
  operator: 'eq' | 'neq';
  value: string;
}

export interface CustomEventDefinition {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  description: string;
  type: CustomEventType;
  // alias: single source event name
  sourceEvent?: string;
  // group: multiple source event names
  sourceEvents?: string[];
  // conditional: source event + conditions
  conditions?: CustomEventCondition[];
  created_at: string;
  updated_at: string;
}
```

### 2.2 DB Migration (supabase/migrations/20260213_custom_events.sql)

```sql
CREATE TABLE IF NOT EXISTS fre_custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('alias', 'group', 'conditional')),
  definition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fre_custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom events"
  ON fre_custom_events FOR ALL
  USING (auth.uid() = user_id);
```

`definition` JSONB contains: `{ sourceEvent, sourceEvents, conditions }`.

## 3. Implementation

### CE-1: Types & DB CRUD

**Files**: types/index.ts, supabaseData.ts, migrations/

1. Add `CustomEventType`, `CustomEventCondition`, `CustomEventDefinition` to types/index.ts
2. Add migration SQL
3. Add to supabaseData.ts:
   - `listCustomEvents(userId: string): Promise<CustomEventDefinition[]>`
   - `createCustomEvent(event: Omit<CustomEventDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<CustomEventDefinition | null>`
   - `updateCustomEvent(id: string, updates: Partial<CustomEventDefinition>): Promise<void>`
   - `deleteCustomEvent(id: string): Promise<void>`

### CE-2: Event Resolver (lib/eventResolver.ts)

New file: `lib/eventResolver.ts`

```typescript
export function resolveCustomEvent(
  data: ProcessedEvent[],
  customEvent: CustomEventDefinition
): Set<string> {
  // Returns user IDs matching the custom event
}

export function getMergedEventList(
  uniqueEvents: string[],
  customEvents: CustomEventDefinition[]
): { label: string; value: string; isCustom: boolean }[]
```

- `resolveCustomEvent`:
  - alias: filter data by `sourceEvent`, return unique userIds
  - group: filter data by any of `sourceEvents`, return unique userIds union
  - conditional: filter data by `sourceEvent` + `conditions` (platform/channel eq/neq)
- `getMergedEventList`: combines uniqueEvents + customEvents into a unified list for dropdowns
  - Custom events prefixed with `[C]` indicator or grouped in separate optgroup

### CE-3: Custom Events Page (pages/CustomEventsPage.tsx)

- Route: `/app/events`
- Lazy loaded in router.tsx
- Sidebar nav item with `Tag` icon

**UI Layout**:
```
┌─────────────────────────────────────────────────┐
│ Custom Events                    [+ New Event]  │
├─────────────────────────────────────────────────┤
│ ┌───┬────────────┬──────┬──────────┬──────────┐ │
│ │ # │ Name       │ Type │ Mapping  │ Actions  │ │
│ ├───┼────────────┼──────┼──────────┼──────────┤ │
│ │ 1 │ All Buys   │ grp  │ 3 events │ Edit Del │ │
│ │ 2 │ iOS Signup │ cond │ signup.. │ Edit Del │ │
│ │ 3 │ Register   │ alis │ sign_up  │ Edit Del │ │
│ └───┴────────────┴──────┴──────────┴──────────┘ │
└─────────────────────────────────────────────────┘
```

**Create/Edit Modal**:
- Name input (required)
- Description input (optional)
- Type selector: radio buttons (Alias / Group / Conditional)
- Dynamic form based on type:
  - **Alias**: source event dropdown (from uniqueEvents)
  - **Group**: multi-select checkboxes (from uniqueEvents)
  - **Conditional**: source event dropdown + condition builder
    - Field dropdown (platform / channel)
    - Operator dropdown (equals / not equals)
    - Value dropdown (from unique values in data)
    - [+ Add Condition] button (max 3 conditions)
- Save / Cancel buttons
- Pro gate: Free plan max 5 custom events

### CE-4: Analysis Integration

**FunnelAnalysis.tsx** (lines 212-221):
- Replace `<option>` loop with optgroup structure:
  ```tsx
  <optgroup label="Events">
    {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
  </optgroup>
  {customEvents.length > 0 && (
    <optgroup label="Custom Events">
      {customEvents.map(ce => <option key={`custom:${ce.id}`} value={`custom:${ce.id}`}>{ce.name}</option>)}
    </optgroup>
  )}
  ```

**RetentionAnalysis.tsx** (lines 122-145):
- Same optgroup pattern for cohort event and active events

**useFunnelAnalysis.ts**:
- When a step value starts with `custom:`, resolve via eventResolver before passing to calculateFunnel
- New: `resolveSteps(steps: string[], customEvents, data)` → resolved step names for the engine

**useRetentionAnalysis.ts**:
- Same custom event resolution for cohort/active events

### CE-5: i18n Keys

**pages.json** (ko/en):
```json
"customEvents": {
  "title": "커스텀 이벤트",
  "newEvent": "새 이벤트",
  "editEvent": "이벤트 편집",
  "name": "이름",
  "description": "설명",
  "type": "타입",
  "alias": "별칭",
  "group": "그룹",
  "conditional": "조건부",
  "sourceEvent": "원본 이벤트",
  "sourceEvents": "포함 이벤트",
  "conditions": "조건",
  "field": "필드",
  "operator": "연산자",
  "equals": "같음",
  "notEquals": "같지 않음",
  "value": "값",
  "addCondition": "조건 추가",
  "save": "저장",
  "cancel": "취소",
  "delete": "삭제",
  "deleteConfirm": "이 커스텀 이벤트를 삭제할까요?",
  "noEvents": "커스텀 이벤트가 없습니다",
  "noEventsDesc": "이벤트를 정의하여 분석에 활용하세요",
  "mapping": "매핑",
  "events": "개 이벤트",
  "limitReached": "Free 플랜은 최대 5개까지 가능합니다",
  "loginRequired": "로그인이 필요합니다",
  "optgroupCustom": "커스텀 이벤트",
  "optgroupRaw": "이벤트"
}
```

**common.json** (ko/en):
```json
"nav.events": "이벤트 정의"
```

## 4. Guest Mode

For non-logged-in users:
- Custom events stored in `localStorage` key `fre_custom_events`
- CRUD operations via local functions (no DB calls)
- Max 5 events regardless of plan (no Pro check without auth)

## 5. Verification Checklist

| # | Item |
|---|------|
| 1 | CE-1: CustomEventType, CustomEventCondition, CustomEventDefinition in types/index.ts |
| 2 | CE-1: SQL migration for fre_custom_events table with RLS |
| 3 | CE-1: listCustomEvents() in supabaseData.ts |
| 4 | CE-1: createCustomEvent() in supabaseData.ts |
| 5 | CE-1: updateCustomEvent() in supabaseData.ts |
| 6 | CE-1: deleteCustomEvent() in supabaseData.ts |
| 7 | CE-2: eventResolver.ts with resolveCustomEvent() |
| 8 | CE-2: eventResolver.ts with getMergedEventList() |
| 9 | CE-3: CustomEventsPage.tsx with event list table |
| 10 | CE-3: Create/Edit modal with type-specific forms |
| 11 | CE-3: Alias form: source event dropdown |
| 12 | CE-3: Group form: multi-select checkboxes |
| 13 | CE-3: Conditional form: source event + condition builder |
| 14 | CE-3: Delete with confirmation |
| 15 | CE-3: Pro gate (Free max 5) |
| 16 | CE-4: FunnelAnalysis dropdown with custom event optgroup |
| 17 | CE-4: RetentionAnalysis cohort dropdown with custom event optgroup |
| 18 | CE-4: RetentionAnalysis active events with custom events |
| 19 | CE-4: useFunnelAnalysis resolves custom: prefixed steps |
| 20 | CE-4: useRetentionAnalysis resolves custom events |
| 21 | CE-5: Route /app/events in router.tsx (lazy loaded) |
| 22 | CE-5: Sidebar nav item with Tag icon |
| 23 | CE-5: i18n keys in ko/en pages.json (customEvents section) |
| 24 | CE-5: nav.events key in ko/en common.json |
