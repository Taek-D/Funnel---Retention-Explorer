import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import type { NotificationType } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getNotificationPreferences, updateNotificationPreferences } from '../lib/supabaseData';

const STORAGE_KEY = 'fre_notification_prefs';

export type NotificationPreferences = Record<NotificationType | 'desktop', boolean>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  analysis: true,
  import: true,
  ai: true,
  export: true,
  desktop: true,
};

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch { /* fallback */ }
  return { ...DEFAULT_PREFERENCES };
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

interface NotificationPreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_KEYS: { type: NotificationType | 'desktop'; titleKey: string; descKey: string }[] = [
  { type: 'analysis', titleKey: 'notifPrefs.analysisTitle', descKey: 'notifPrefs.analysisDesc' },
  { type: 'import', titleKey: 'notifPrefs.importTitle', descKey: 'notifPrefs.importDesc' },
  { type: 'ai', titleKey: 'notifPrefs.aiTitle', descKey: 'notifPrefs.aiDesc' },
  { type: 'export', titleKey: 'notifPrefs.exportTitle', descKey: 'notifPrefs.exportDesc' },
  { type: 'desktop', titleKey: 'pages:notificationPage.desktopNotification', descKey: 'pages:notificationPage.desktopNotificationDesc' },
];

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const local = loadNotificationPreferences();
    setPrefs(local);

    // Try loading from DB if logged in
    if (user && !dbLoaded) {
      getNotificationPreferences()
        .then(dbPrefs => {
          if (dbPrefs) {
            const merged = { ...DEFAULT_PREFERENCES, ...dbPrefs };
            setPrefs(merged);
            saveNotificationPreferences(merged);
          }
          setDbLoaded(true);
        })
        .catch(() => { setDbLoaded(true); });
    }
  }, [open, user, dbLoaded]);

  const handleToggle = (type: NotificationType | 'desktop') => {
    setPrefs(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSave = () => {
    saveNotificationPreferences(prefs);
    if (user) {
      updateNotificationPreferences(prefs).catch(() => {});
    }
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={t('notifPrefs.title')}>
      <div className="space-y-4">
        {TYPE_KEYS.map(({ type, titleKey, descKey }) => (
          <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{t(titleKey)}</span>
              <span className="text-[11px] text-slate-500">{t(descKey)}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={prefs[type]}
                onChange={() => handleToggle(type)}
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
            </label>
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            {t('notifPrefs.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
          >
            {t('notifPrefs.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
