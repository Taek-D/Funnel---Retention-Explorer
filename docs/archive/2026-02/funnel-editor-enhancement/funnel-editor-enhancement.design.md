# Funnel Editor Enhancement — Design

> **Feature**: funnel-editor-enhancement
> **Plan**: [funnel-editor-enhancement.plan.md](../../01-plan/features/funnel-editor-enhancement.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture Overview

FunnelAnalysis.tsx 페이지의 스텝 빌더를 고도화합니다:
1. HTML5 DnD로 드래그 앤 드롭 스텝 순서 변경
2. Supabase `fre_saved_funnels` 테이블에 퍼널 설정 저장/불러오기
3. Save/Load UI (모달 + 드롭다운)
4. i18n 키 추가

### Layer Mapping

| Layer | File | Changes |
|-------|------|---------|
| Domain | types/index.ts | SavedFunnel interface |
| Application | lib/supabaseData.ts | CRUD functions for fre_saved_funnels |
| Presentation | pages/FunnelAnalysis.tsx | DnD reorder + Save/Load UI |
| i18n | locales/ko/pages.json, locales/en/pages.json | New keys under `funnel.*` |

---

## 2. Detailed Design

### FE-1: Drag & Drop Step Reorder

**File**: `pages/FunnelAnalysis.tsx`

기존 스텝 카드 (`div key={i}` grid)에 HTML5 DnD 속성 추가.

#### DnD State & Handlers

```typescript
const [dragIndex, setDragIndex] = useState<number | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

const handleDragStart = (e: React.DragEvent, index: number) => {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(index));
  setDragIndex(index);
};

const handleDragOver = (e: React.DragEvent, index: number) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverIndex(index);
};

const handleDrop = (e: React.DragEvent, toIndex: number) => {
  e.preventDefault();
  const fromIndex = Number(e.dataTransfer.getData('text/plain'));
  if (fromIndex !== toIndex) moveStep(fromIndex, toIndex);
  setDragIndex(null);
  setDragOverIndex(null);
};

const handleDragEnd = () => {
  setDragIndex(null);
  setDragOverIndex(null);
};
```

#### Step Card Changes

각 스텝 카드의 `div`에 DnD 속성을 추가하고, GripVertical 핸들 아이콘 삽입:

```tsx
<div
  key={i}
  draggable
  onDragStart={(e) => handleDragStart(e, i)}
  onDragOver={(e) => handleDragOver(e, i)}
  onDrop={(e) => handleDrop(e, i)}
  onDragEnd={handleDragEnd}
  className={`group flex items-center gap-2 p-3 rounded-lg border
    ${dragIndex === i ? 'opacity-40' : ''}
    ${dragOverIndex === i ? 'border-accent' : 'border-white/10'}
    bg-background hover:border-accent/50 transition-colors`}
>
  <GripVertical size={14} className="text-slate-600 cursor-grab shrink-0" />
  {/* existing chevron buttons remain for accessibility */}
```

기존 ChevronUp/Down 버튼은 유지 (키보드 접근성 대안).

### FE-2: Saved Funnels (Supabase)

#### 2.1 Type Definition

**File**: `types/index.ts`

```typescript
export interface SavedFunnel {
  id: string;
  user_id: string;
  name: string;
  steps: string[];
  created_at: string;
  updated_at: string;
}
```

#### 2.2 Database Table

**Table**: `fre_saved_funnels`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK auth.users, NOT NULL |
| name | text | NOT NULL |
| steps | jsonb | NOT NULL, default '[]' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS Policies**:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

#### 2.3 CRUD Functions

**File**: `lib/supabaseData.ts`

```typescript
// ===== Saved Funnels =====

export async function listSavedFunnels(userId: string): Promise<SavedFunnel[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_saved_funnels')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createSavedFunnel(params: {
  userId: string; name: string; steps: string[];
}): Promise<SavedFunnel> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_saved_funnels')
    .insert({ user_id: params.userId, name: params.name, steps: params.steps })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSavedFunnel(id: string, params: {
  name?: string; steps?: string[];
}): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_saved_funnels')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSavedFunnel(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_saved_funnels')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
```

#### 2.4 Guest Fallback

비로그인 사용자는 기존 `localStorage('fre-funnel-templates')` 로직을 그대로 사용.
로그인 사용자는 Supabase CRUD로 전환.

### FE-3: Save/Load UI

**File**: `pages/FunnelAnalysis.tsx`

기존 템플릿 영역을 Saved Funnels로 확장.

#### 3.1 State

```typescript
const [savedFunnels, setSavedFunnels] = useState<SavedFunnel[]>([]);
const [showSaveModal, setShowSaveModal] = useState(false);
const [saveName, setSaveName] = useState('');
const [editingFunnelId, setEditingFunnelId] = useState<string | null>(null);
```

#### 3.2 Load Saved Funnels

```typescript
useEffect(() => {
  if (user) {
    listSavedFunnels(user.id).then(setSavedFunnels);
  } else {
    // localStorage fallback (existing logic)
    try { setSavedFunnels(
      JSON.parse(localStorage.getItem('fre-funnel-templates') || '[]')
        .map((t: { name: string; steps: string[] }, i: number) => ({
          id: `local-${i}`, user_id: '', name: t.name, steps: t.steps,
          created_at: '', updated_at: ''
        }))
    ); } catch { /* empty */ }
  }
}, [user]);
```

#### 3.3 Save Funnel

"Save Funnel" 버튼 → 모달:
- 새 퍼널: 이름 입력 → `createSavedFunnel()`
- 기존 퍼널 업데이트: `updateSavedFunnel()` (이름이 같으면 덮어쓰기)

```tsx
{showSaveModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-surface border border-white/10 rounded-lg p-6 w-full max-w-sm">
      <h3 className="text-white font-bold mb-4">{t('funnel.saveFunnel')}</h3>
      <input
        value={saveName}
        onChange={(e) => setSaveName(e.target.value)}
        placeholder={t('funnel.funnelNamePlaceholder')}
        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-4"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowSaveModal(false)}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white">
          {t('funnel.cancel')}
        </button>
        <button onClick={handleSaveFunnel}
          disabled={!saveName.trim()}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold disabled:opacity-40">
          {t('funnel.save')}
        </button>
      </div>
    </div>
  </div>
)}
```

#### 3.4 Load Funnel

저장된 퍼널 목록은 기존 템플릿 영역 아래 버튼으로 표시.
각 항목에 로드 버튼 + 삭제(X) 버튼.

#### 3.5 Delete Confirmation

삭제 시 `window.confirm()` 사용 (별도 모달 없이).

```typescript
const handleDeleteFunnel = async (funnel: SavedFunnel) => {
  if (!window.confirm(t('funnel.deleteFunnelConfirm', { name: funnel.name }))) return;
  if (user) {
    await deleteSavedFunnel(funnel.id);
    setSavedFunnels(prev => prev.filter(f => f.id !== funnel.id));
  } else {
    // localStorage fallback
    const templates = savedFunnels.filter(f => f.id !== funnel.id);
    localStorage.setItem('fre-funnel-templates', JSON.stringify(
      templates.map(f => ({ name: f.name, steps: f.steps }))
    ));
    setSavedFunnels(templates);
  }
};
```

### FE-4: i18n Keys

**Files**: `locales/ko/pages.json`, `locales/en/pages.json`

Add under `funnel` section:

| Key | Korean | English |
|-----|--------|---------|
| funnel.saveFunnel | 퍼널 저장 | Save Funnel |
| funnel.loadFunnel | 저장된 퍼널 | Saved Funnels |
| funnel.funnelNamePlaceholder | 퍼널 이름 입력 | Enter funnel name |
| funnel.deleteFunnelConfirm | "{{name}}" 퍼널을 삭제하시겠습니까? | Delete funnel "{{name}}"? |
| funnel.cancel | 취소 | Cancel |
| funnel.save | 저장 | Save |
| funnel.saved | 저장됨 | Saved |
| funnel.overwrite | 덮어쓰기 | Overwrite |
| funnel.overwriteConfirm | "{{name}}" 퍼널을 덮어쓰시겠습니까? | Overwrite funnel "{{name}}"? |
| funnel.dragToReorder | 드래그하여 순서 변경 | Drag to reorder |

---

## 3. Implementation Order

| # | ID | Task | File(s) |
|---|-----|------|---------|
| 1 | FE-1 | Add DnD state + handlers to FunnelAnalysis | pages/FunnelAnalysis.tsx |
| 2 | FE-1 | Add GripVertical handle + DnD attributes to step cards | pages/FunnelAnalysis.tsx |
| 3 | FE-1 | Visual feedback (opacity + border highlight) | pages/FunnelAnalysis.tsx |
| 4 | FE-2 | Add SavedFunnel interface to types | types/index.ts |
| 5 | FE-2 | Add CRUD functions to supabaseData.ts | lib/supabaseData.ts |
| 6 | FE-3 | Replace localStorage template with Saved Funnels UI | pages/FunnelAnalysis.tsx |
| 7 | FE-3 | Save modal (name input + create/overwrite) | pages/FunnelAnalysis.tsx |
| 8 | FE-3 | Load + Delete UI (list with X buttons) | pages/FunnelAnalysis.tsx |
| 9 | FE-4 | Add i18n keys (ko + en) | locales/ko/pages.json, locales/en/pages.json |

---

## 4. Verification Checklist

| # | ID | Item | Expected |
|---|-----|------|----------|
| 1 | FE-1 | DnD state: dragIndex, dragOverIndex in FunnelAnalysis | useState<number \| null> |
| 2 | FE-1 | handleDragStart sets dragIndex and dataTransfer | Sets effectAllowed='move' |
| 3 | FE-1 | handleDragOver prevents default and sets dragOverIndex | e.preventDefault() |
| 4 | FE-1 | handleDrop calls moveStep(from, to) | Reads dataTransfer, calls moveStep |
| 5 | FE-1 | handleDragEnd resets drag state | Sets null |
| 6 | FE-1 | Step card has draggable + DnD event handlers | All 4 handlers attached |
| 7 | FE-1 | GripVertical icon in step card | Before ChevronUp/Down or number badge |
| 8 | FE-1 | Visual feedback: opacity on dragged, border-accent on drop target | Conditional classes |
| 9 | FE-1 | ChevronUp/Down buttons preserved | Existing buttons remain |
| 10 | FE-2 | SavedFunnel interface in types/index.ts | id, user_id, name, steps, created_at, updated_at |
| 11 | FE-2 | listSavedFunnels(userId) in supabaseData.ts | Returns SavedFunnel[], ordered by updated_at desc |
| 12 | FE-2 | createSavedFunnel(params) in supabaseData.ts | Inserts + returns SavedFunnel |
| 13 | FE-2 | updateSavedFunnel(id, params) in supabaseData.ts | Updates name/steps |
| 14 | FE-2 | deleteSavedFunnel(id) in supabaseData.ts | Deletes by id |
| 15 | FE-3 | savedFunnels state loaded on mount | From Supabase (user) or localStorage (guest) |
| 16 | FE-3 | Save Funnel button opens modal | setShowSaveModal(true) |
| 17 | FE-3 | Save modal: name input + save/cancel buttons | Input + 2 buttons |
| 18 | FE-3 | handleSaveFunnel creates/updates funnel | createSavedFunnel or updateSavedFunnel |
| 19 | FE-3 | Saved funnels displayed as buttons in template area | Button per saved funnel |
| 20 | FE-3 | Delete button (X) with confirm | window.confirm + deleteSavedFunnel |
| 21 | FE-3 | Guest fallback: localStorage for save/load/delete | Uses fre-funnel-templates key |
| 22 | FE-4 | 10 i18n keys in ko/pages.json funnel section | All keys present |
| 23 | FE-4 | 10 i18n keys in en/pages.json funnel section | All keys present |

---

## 5. Out of Scope

- `fre_saved_funnels` Supabase migration SQL (외부 작업)
- 조건 분기 (conditional branching)
- 퍼널 에디터를 별도 페이지로 분리

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial design | Claude |
