import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  listNotifications,
  insertNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationDb,
  clearAllNotifications,
} from '../lib/supabaseData';
import { loadNotificationPreferences } from '../components/NotificationPreferencesModal';

export type NotificationType = 'analysis' | 'import' | 'ai' | 'export';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (type: NotificationType, title: string, message: string) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let localId = 0;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  // Load notifications from Supabase on login
  useEffect(() => {
    if (!user) {
      loadedRef.current = false;
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;

    setLoading(true);
    listNotifications(50)
      .then(rows => {
        setNotifications(rows.map(r => ({
          id: r.id,
          type: r.type as NotificationType,
          title: r.title,
          message: r.message,
          read: r.read,
          createdAt: new Date(r.created_at),
        })));
      })
      .catch(() => { /* fallback: keep empty */ })
      .finally(() => setLoading(false));
  }, [user]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const prefs = loadNotificationPreferences();
    if (!prefs[type]) return;

    const tempId = `local-${++localId}`;
    const newNotif: Notification = { id: tempId, type, title, message, read: false, createdAt: new Date() };

    setNotifications(prev => [newNotif, ...prev].slice(0, 50));

    if (user) {
      insertNotification({ type, title, message })
        .then(row => {
          // Replace temp id with real DB id
          setNotifications(prev => prev.map(n => n.id === tempId ? { ...n, id: row.id } : n));
        })
        .catch(() => { /* keep local version */ });
    }
  }, [user]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (user && !id.startsWith('local-')) {
      markNotificationRead(id).catch(() => {});
    }
  }, [user]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (user && !id.startsWith('local-')) {
      deleteNotificationDb(id).catch(() => {});
    }
  }, [user]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) {
      markAllNotificationsRead().catch(() => {});
    }
  }, [user]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (user) {
      clearAllNotifications().catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      addNotification, markAsRead, removeNotification, markAllAsRead, clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
