import { useState, useCallback, useEffect } from 'react';

type PermissionState = 'default' | 'granted' | 'denied';

export function useDesktopNotification() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<PermissionState>(
    supported ? (Notification.permission as PermissionState) : 'denied'
  );

  useEffect(() => {
    if (supported) {
      setPermission(Notification.permission as PermissionState);
    }
  }, [supported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    return result === 'granted';
  }, [supported]);

  const show = useCallback((title: string, body: string) => {
    if (!supported || Notification.permission !== 'granted') return;
    if (document.hasFocus()) return;
    const notif = new Notification(title, {
      body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'fre-notification',
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  }, [supported]);

  return { supported, permission, requestPermission, show };
}

/** Standalone function for use outside React components (e.g. NotificationContext) */
export function showDesktopNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (document.hasFocus()) return;
  const notif = new Notification(title, {
    body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: 'fre-notification',
  });
  notif.onclick = () => {
    window.focus();
    notif.close();
  };
}
