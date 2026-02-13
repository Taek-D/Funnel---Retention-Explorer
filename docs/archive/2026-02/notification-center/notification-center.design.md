# Notification Center — Design

> **Feature**: notification-center
> **Plan**: [notification-center.plan.md](../../01-plan/features/notification-center.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
NotificationContext (enhanced)
  ├─ Load from DB on login (existing)
  ├─ Supabase Realtime channel: fre_notifications INSERT
  │     └─ On new row → prepend to state + trigger desktop notification
  ├─ addNotification() → insertNotification + webhook dispatch (existing)
  └─ Desktop notification via Notification API

NotificationPanel (existing, minor touch)
  └─ Link to /app/notifications full page

NotificationsPage (NEW)
  ├─ Full list with type filter + read/unread filter
  ├─ Bulk actions (select, delete, mark read)
  └─ Load more pagination

Preferences DB Sync
  ├─ fre_user_profiles.notification_preferences JSONB
  └─ loadNotificationPreferences() reads from DB → localStorage cache
```

## 2. Implementation Tasks

### NC-1: Supabase Realtime (`context/NotificationContext.tsx`)

Add Realtime subscription inside the existing `useEffect` that loads on login:

```typescript
// After initial load, subscribe to realtime
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'fre_notifications',
    filter: `user_id=eq.${user.id}`,
  }, (payload) => {
    const row = payload.new;
    // Skip if we just inserted it locally (check temp id)
    const newNotif: Notification = {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: new Date(row.created_at),
    };
    setNotifications(prev => {
      if (prev.some(n => n.id === row.id)) return prev;
      return [newNotif, ...prev].slice(0, 100);
    });
    // Trigger desktop notification
    showDesktopNotification(row.title, row.message);
  })
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

Import `supabase` from lib/supabase. Add `showDesktopNotification` from NC-2.

### NC-2: Desktop Notifications (`hooks/useDesktopNotification.ts`)

```typescript
export function useDesktopNotification() {
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  const show = (title: string, body: string) => {
    if (Notification.permission !== 'granted') return;
    if (document.hasFocus()) return; // Don't show if app is focused
    const notif = new Notification(title, {
      body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'fre-notification',
    });
    notif.onclick = () => { window.focus(); notif.close(); };
  };

  return { requestPermission, show, permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied' };
}
```

Also export standalone `showDesktopNotification(title, message)` for use in NotificationContext.

### NC-2b: Desktop Notification Toggle in Preferences

Add `desktop: boolean` to NotificationPreferences type and toggle UI.

### NC-3: Notifications Page (`pages/NotificationsPage.tsx`)

Full notification history with filtering:

```typescript
// Key features:
// - Type filter chips (analysis, import, ai, export, all)
// - Read/unread filter toggle
// - Select mode for bulk operations
// - "Load more" button (paginated, 20 per page)
// - Individual mark read / delete
// - Bulk "mark selected as read" / "delete selected"
// - Empty state
// - Login required guard
```

### NC-3b: Route + Sidebar

Router: Add lazy import + route `{ path: 'notifications', element: ... }` after dashboard.

Sidebar: Add `{ path: '/app/notifications', icon: Bell, labelKey: 'nav.notifications' }` after insights.

### NC-3c: Panel Link to Full Page

In NotificationPanel header, add a link/button to navigate to `/app/notifications`.

### NC-4: Preferences DB Sync

Migration: `ALTER TABLE fre_user_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"analysis":true,"import":true,"ai":true,"export":true,"desktop":true}';`

Modify `loadNotificationPreferences()`:
1. If user is logged in → read from `fre_user_profiles.notification_preferences`
2. Cache in localStorage
3. If no user → read from localStorage only

Modify `saveNotificationPreferences()`:
1. Save to localStorage
2. If user is logged in → also update `fre_user_profiles.notification_preferences`

### NC-4b: CRUD for notification preferences in supabaseData.ts

```typescript
export async function getNotificationPreferences(): Promise<Record<string, boolean> | null> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from('fre_user_profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .single();
  return data?.notification_preferences ?? null;
}

export async function updateNotificationPreferences(prefs: Record<string, boolean>): Promise<void> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;
  await client
    .from('fre_user_profiles')
    .update({ notification_preferences: prefs })
    .eq('id', user.id);
}
```

### NC-5: i18n Keys

`locales/ko/common.json` — nav:
```json
"notifications": "알림"
```

`locales/ko/pages.json` — `notificationPage` section:
```json
{
  "notificationPage": {
    "title": "알림 센터",
    "filter": "필터",
    "all": "전체",
    "unreadOnly": "안읽음만",
    "selectMode": "선택",
    "deleteSelected": "선택 삭제",
    "markSelectedRead": "선택 읽음",
    "loadMore": "더 보기",
    "noNotifications": "알림이 없습니다",
    "desktopNotification": "데스크톱 알림",
    "desktopNotificationDesc": "브라우저 알림으로 새 알림을 받습니다",
    "permissionDenied": "브라우저 알림 권한이 차단되었습니다",
    "viewAll": "전체 보기"
  }
}
```

Corresponding English keys.

## 3. Dependencies

- **New npm**: none
- **New files**: useDesktopNotification.ts, NotificationsPage.tsx, migration SQL
- **Modified**: NotificationContext.tsx, NotificationPanel.tsx, NotificationPreferencesModal.tsx, supabaseData.ts, router.tsx, Sidebar.tsx, i18n files

## 4. Implementation Order

1. NC-2: Desktop notification hook (standalone, no deps)
2. NC-1: Realtime subscription in NotificationContext
3. NC-4: Preferences DB sync (migration + CRUD + modal update)
4. NC-3: Notifications page + route + sidebar
5. NC-5: i18n keys

## 5. Verification Checklist

- [ ] NC-1: Supabase Realtime channel subscription in NotificationContext
- [ ] NC-1: Filter by user_id in realtime subscription
- [ ] NC-1: Deduplication (skip if id already exists)
- [ ] NC-1: Channel cleanup on unmount
- [ ] NC-2: useDesktopNotification hook with requestPermission + show
- [ ] NC-2: showDesktopNotification standalone function
- [ ] NC-2: Skip desktop notification if app is focused
- [ ] NC-2: Desktop notification toggle in preferences modal
- [ ] NC-3: NotificationsPage with type filter chips
- [ ] NC-3: Read/unread filter toggle
- [ ] NC-3: Bulk select + delete/mark read
- [ ] NC-3: Load more pagination
- [ ] NC-3: Login required guard
- [ ] NC-3: Route registered in router.tsx
- [ ] NC-3: Sidebar nav item with Bell icon
- [ ] NC-3: Link from NotificationPanel to full page
- [ ] NC-4: SQL migration for notification_preferences column
- [ ] NC-4: getNotificationPreferences() in supabaseData.ts
- [ ] NC-4: updateNotificationPreferences() in supabaseData.ts
- [ ] NC-4: loadNotificationPreferences reads from DB when logged in
- [ ] NC-4: saveNotificationPreferences syncs to DB when logged in
- [ ] NC-5: i18n keys added (ko + en, ~15 keys each)
- [ ] NC-5: nav.notifications key in common.json
