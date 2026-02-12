# Notification System Enhancement - Design Document

> Plan 참조: `docs/01-plan/features/notification-system.plan.md`

## 현황 분석 (Design 기준 재확인)

### 이미 통합된 알림 트리거 (4/8)
| Hook | addNotification 호출 | 타입 |
|------|---------------------|------|
| `useCSVUpload.ts` | ✅ line 130, 186 | import |
| `useFunnelAnalysis.ts` | ✅ line 53 | analysis |
| `useAIInsights.ts` | ✅ line 67 | ai |
| `useExportReport.ts` | ✅ line 43 | export |

### 미통합 알림 트리거 (4/8)
| Hook/Component | 현재 상태 | 추가할 타입 |
|----------------|----------|------------|
| `useRetentionAnalysis.ts` | toast만 사용 | analysis |
| `useSegmentComparison.ts` | toast만 사용 | analysis |
| `useDataExport.ts` | toast만 사용 | export |
| `SaveAnalysisButton.tsx` | toast만 사용 | analysis |

---

## NF-1: 알림 트리거 통합

### 1.1 useRetentionAnalysis.ts 수정

**변경 내용**: `runRetentionAnalysis` 성공 시 `addNotification` 호출 추가

```typescript
// 추가 import
import { useNotifications } from '../context/NotificationContext';

// hook 내부
const { addNotification } = useNotifications();

// runRetentionAnalysis 내 trackEvent 직후 (line 55 부근)
addNotification(
  'analysis',
  i18n.t('analysis.retentionComplete'),
  i18n.t('analysis.retentionCompleteDesc')
);
```

**의존성 배열**: `[state, dispatch, toast, addNotification]`

### 1.2 useSegmentComparison.ts 수정

**변경 내용**: `runComparison` 성공 시 `addNotification` 호출 추가

```typescript
// 추가 import
import { useNotifications } from '../context/NotificationContext';

// hook 내부
const { addNotification } = useNotifications();

// dispatch SET_INSIGHTS 이후
addNotification(
  'analysis',
  i18n.t('analysis.segmentComplete'),
  i18n.t('analysis.segmentCompleteDesc')
);
```

**의존성 배열**: `[state, dispatch, toast, addNotification]`

### 1.3 useDataExport.ts 수정

**변경 내용**: CSV/Excel 내보내기 성공 시 `addNotification` 호출 추가

```typescript
// 추가 import
import { useNotifications } from '../context/NotificationContext';

// hook 내부
const { addNotification } = useNotifications();

// exportCSV 성공 시 (toast 'success' 직후)
addNotification('export', t('dataExport.complete'), t('dataExport.csvExported'));

// exportExcel 성공 시 (toast 'success' 직후)
addNotification('export', t('dataExport.complete'), t('dataExport.excelExported'));
```

### 1.4 SaveAnalysisButton.tsx 수정

**변경 내용**: 저장 성공 시 `addNotification` 호출 추가

```typescript
// 추가 import
import { useNotifications } from '../context/NotificationContext';

// 컴포넌트 내부
const { addNotification } = useNotifications();

// setSaved(true) 직후
addNotification('analysis', t('save.saved'), t('save.savedDesc'));
```

### 1.5 i18n 키 추가

`locales/ko/analysis.json`에 추가:
```json
{
  "retentionComplete": "리텐션 분석 완료",
  "retentionCompleteDesc": "리텐션 분석 결과가 준비되었습니다",
  "segmentComplete": "세그먼트 비교 완료",
  "segmentCompleteDesc": "세그먼트 비교 결과를 확인하세요"
}
```

`locales/en/analysis.json`에 추가:
```json
{
  "retentionComplete": "Retention Analysis Complete",
  "retentionCompleteDesc": "Retention analysis results are ready",
  "segmentComplete": "Segment Comparison Complete",
  "segmentCompleteDesc": "Check the segment comparison results"
}
```

`locales/ko/dataExport.json`에 추가:
```json
{
  "csvExported": "CSV 파일이 다운로드되었습니다",
  "excelExported": "Excel 파일이 다운로드되었습니다"
}
```

`locales/en/dataExport.json`에 추가:
```json
{
  "csvExported": "CSV file has been downloaded",
  "excelExported": "Excel file has been downloaded"
}
```

`locales/ko/save.json` (또는 해당 네임스페이스)에 추가:
```json
{
  "savedDesc": "분석 결과가 클라우드에 저장되었습니다"
}
```

`locales/en/save.json`에 추가:
```json
{
  "savedDesc": "Analysis results have been saved to cloud"
}
```

---

## NF-2: Supabase 영속화

### 2.1 DB 마이그레이션 (Supabase Dashboard에서 실행)

```sql
-- fre_notifications 테이블
CREATE TABLE fre_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('analysis','import','ai','export')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fre_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON fre_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications"
  ON fre_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON fre_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications"
  ON fre_notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_unread
  ON fre_notifications (user_id, read, created_at DESC);
```

### 2.2 supabaseData.ts에 CRUD 함수 추가

```typescript
// ===== Notifications =====

export interface FRENotification {
  id: string;
  user_id: string;
  type: 'analysis' | 'import' | 'ai' | 'export';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function listNotifications(limit = 50): Promise<FRENotification[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function insertNotification(params: {
  type: 'analysis' | 'import' | 'ai' | 'export';
  title: string;
  message: string;
}): Promise<FRENotification> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증되지 않았습니다');

  const { data, error } = await client
    .from('fre_notifications')
    .insert({
      user_id: user.id,
      type: params.type,
      title: params.title,
      message: params.message,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(): Promise<void> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const { error } = await client
    .from('fre_notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) throw new Error(error.message);
}

export async function deleteNotification(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_notifications')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function clearAllNotifications(): Promise<void> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const { error } = await client
    .from('fre_notifications')
    .delete()
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}
```

### 2.3 NotificationContext.tsx 리팩토링

**핵심 변경**: 로그인 사용자는 Supabase, 게스트는 인메모리 유지

```typescript
import { useAuth } from './AuthContext';
import {
  listNotifications,
  insertNotification,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification as deleteNotificationDb,
  clearAllNotifications,
  type FRENotification,
} from '../lib/supabaseData';

// Notification 인터페이스 확장
export interface Notification {
  id: string;         // UUID (DB) 또는 string (인메모리)
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Context에 개별 조작 메서드 추가
interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, title: string, message: string) => void;
  markAsRead: (id: string) => void;        // NEW
  removeNotification: (id: string) => void; // NEW
  markAllAsRead: () => void;
  clearAll: () => void;
  loading: boolean;                         // NEW
}
```

**Provider 내부 로직**:
```
1. useAuth()에서 user 가져오기
2. user 존재 → useEffect에서 listNotifications() 호출 → state 초기화
3. addNotification:
   - user 존재 → insertNotification() + state prepend
   - user 없음 → 기존 인메모리 로직
4. markAllAsRead:
   - user 존재 → markAllNotificationsRead() + state 업데이트
   - user 없음 → 기존 인메모리 로직
5. clearAll:
   - user 존재 → clearAllNotifications() + state 비우기
   - user 없음 → 기존 인메모리 로직
```

**에러 처리**: DB 연산 실패 시 인메모리 fallback (사용자에게 에러 표시하지 않음)

---

## NF-3: 개별 알림 읽음/삭제

### 3.1 NotificationPanel.tsx UI 변경

**개별 알림 항목에 추가**:
- 클릭 시 `markAsRead(id)` 호출
- X 버튼 추가 → `removeNotification(id)` 호출

```tsx
// 기존 notification item div에 onClick 추가
<div
  key={n.id}
  onClick={() => !n.read && markAsRead(n.id)}
  className={`... cursor-pointer`}
>
  {/* 기존 내용 */}
  <button
    onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-white transition-all"
    aria-label={t('notification.delete')}
  >
    <X size={12} />
  </button>
</div>
```

**읽음 상태 시각적 구분**:
- 미읽음: 왼쪽에 작은 accent dot 표시
- 읽음: dot 없음, 텍스트 색상 약간 어둡게

### 3.2 i18n 키 추가

```json
{
  "notification.delete": "알림 삭제"
}
```

---

## NF-4: 알림 설정 패널

### 4.1 DB 변경

`fre_user_profiles`에 컬럼 추가:
```sql
ALTER TABLE fre_user_profiles
ADD COLUMN notification_preferences JSONB DEFAULT '{"analysis":true,"import":true,"ai":true,"export":true}';
```

### 4.2 NotificationPreferencesModal 컴포넌트

**위치**: `components/NotificationPreferencesModal.tsx` (새 파일)

**Props**:
```typescript
interface NotificationPreferencesModalProps {
  open: boolean;
  onClose: () => void;
}
```

**UI 구성**:
```
┌─────────────────────────────┐
│  알림 설정                   │
├─────────────────────────────┤
│                             │
│  ☑ 분석 완료 알림           │
│    퍼널, 리텐션, 세그먼트    │
│                             │
│  ☑ 데이터 가져오기 알림      │
│    CSV 업로드, 샘플 로드     │
│                             │
│  ☑ AI 인사이트 알림          │
│    AI 분석 결과              │
│                             │
│  ☑ 내보내기 알림             │
│    CSV, Excel, 리포트        │
│                             │
├─────────────────────────────┤
│            [저장]            │
└─────────────────────────────┘
```

**상태 관리**:
- 로그인 사용자: `fre_user_profiles.notification_preferences`에서 읽기/쓰기
- 게스트: localStorage `fre_notification_prefs` 키 사용
- `addNotification` 호출 시 해당 타입이 비활성화되어 있으면 무시

### 4.3 NotificationContext에 preferences 통합

```typescript
interface NotificationContextValue {
  // ... 기존
  preferences: NotificationPreferences;
  updatePreferences: (prefs: NotificationPreferences) => void;
}

type NotificationPreferences = Record<NotificationType, boolean>;

// addNotification 내부
const addNotification = (type, title, message) => {
  if (!preferences[type]) return; // 비활성화 타입 무시
  // ... 기존 로직
};
```

### 4.4 AppShell.tsx 연동

기존 `onOpenEmailSettings` prop을 `NotificationPreferencesModal`에 연결:
```typescript
const [showNotifPrefs, setShowNotifPrefs] = useState(false);

<NotificationPanel
  onOpenEmailSettings={() => setShowNotifPrefs(true)}
  ...
/>
<NotificationPreferencesModal
  open={showNotifPrefs}
  onClose={() => setShowNotifPrefs(false)}
/>
```

---

## 파일 변경 요약

### 수정 파일 (기존)
| 파일 | 변경 내용 | NF |
|------|----------|-----|
| `hooks/useRetentionAnalysis.ts` | addNotification 추가 | NF-1 |
| `hooks/useSegmentComparison.ts` | addNotification 추가 | NF-1 |
| `hooks/useDataExport.ts` | addNotification 추가 | NF-1 |
| `components/SaveAnalysisButton.tsx` | addNotification 추가 | NF-1 |
| `lib/supabaseData.ts` | Notification CRUD 함수 6개 추가 | NF-2 |
| `context/NotificationContext.tsx` | Supabase 연동 + 개별 조작 | NF-2, NF-3, NF-4 |
| `components/NotificationPanel.tsx` | 개별 읽음/삭제 UI, group-hover | NF-3 |
| `components/AppShell.tsx` | NotificationPreferencesModal 연결 | NF-4 |
| `types/index.ts` | NotificationPreferences 타입 추가 | NF-4 |
| `locales/ko/*.json` | i18n 키 추가 (6개) | NF-1, NF-3 |
| `locales/en/*.json` | i18n 키 추가 (6개) | NF-1, NF-3 |

### 신규 파일
| 파일 | 내용 | NF |
|------|------|-----|
| `components/NotificationPreferencesModal.tsx` | 알림 설정 Modal | NF-4 |

### DB 마이그레이션 (Supabase Dashboard)
| SQL | 내용 | NF |
|-----|------|-----|
| CREATE TABLE fre_notifications | 알림 테이블 + RLS + 인덱스 | NF-2 |
| ALTER TABLE fre_user_profiles | notification_preferences 컬럼 | NF-4 |

---

## 구현 순서 (Do Phase 가이드)

```
Step 1: NF-1 알림 트리거 (4 파일 수정 + i18n 키)
  ├── useRetentionAnalysis.ts
  ├── useSegmentComparison.ts
  ├── useDataExport.ts
  ├── SaveAnalysisButton.tsx
  └── locales 키 추가

Step 2: NF-2 Supabase 영속화
  ├── SQL 마이그레이션 실행
  ├── supabaseData.ts CRUD 함수 추가
  └── NotificationContext.tsx 리팩토링

Step 3: NF-3 개별 읽음/삭제
  ├── NotificationContext.tsx (markAsRead, removeNotification)
  └── NotificationPanel.tsx UI 업데이트

Step 4: NF-4 알림 설정
  ├── SQL 마이그레이션 (notification_preferences)
  ├── NotificationPreferencesModal.tsx 생성
  ├── NotificationContext.tsx (preferences 통합)
  ├── AppShell.tsx 연동
  └── types/index.ts 타입 추가
```

## 테스트 계획

- 기존 310개 테스트 유지
- NF-1: 기존 hook 테스트에 addNotification mock 추가
- NF-2: supabaseData notification 함수 단위 테스트 (mock Supabase)
- NF-3: NotificationPanel 컴포넌트 테스트 (개별 삭제 버튼)
- NF-4: NotificationPreferencesModal 컴포넌트 테스트
