import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, X } from './Icons';
import { useNotifications, type NotificationType } from '../context/NotificationContext';
import { useClickOutside } from '../hooks/useClickOutside';

interface NotificationPanelProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenEmailSettings: () => void;
  unreadCount: number;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  open,
  onToggle,
  onClose,
  onOpenEmailSettings,
  unreadCount,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, removeNotification, markAllAsRead, clearAll } = useNotifications();

  const typeLabels: Record<NotificationType, { label: string; color: string }> = {
    analysis: { label: t('notification.analysis'), color: 'text-accent bg-accent/10' },
    import: { label: t('notification.import'), color: 'text-sky-400 bg-sky-400/10' },
    ai: { label: t('notification.ai'), color: 'text-amber bg-amber/10' },
    export: { label: t('notification.export'), color: 'text-coral bg-coral/10' },
  };

  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return t('notification.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('notification.minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notification.hoursAgo', { count: hours });
    return t('notification.daysAgo', { count: Math.floor(hours / 24) });
  }

  useClickOutside(ref, onClose, open);

  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  }, [open, unreadCount, markAllAsRead]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors relative"
        aria-label={t('notification.title')}
        aria-expanded={open}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-coral rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5" aria-label={t('notification.unreadCount', { count: unreadCount })}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        role="region"
        aria-label={t('notification.title')}
        className={`absolute right-0 top-11 w-80 md:w-96 bg-surface border border-white/[0.06] rounded-lg shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">{t('notification.title')}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenEmailSettings}
              className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              title={t('notification.settings')}
            >
              <Settings size={14} />
            </button>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                title={t('notification.deleteAll')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm text-center">{t('notification.empty')}</p>
              <p className="text-slate-600 text-xs text-center mt-1">{t('notification.emptyDesc')}</p>
            </div>
          ) : (
            notifications.map(n => {
              const typeInfo = typeLabels[n.type];
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`group flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer ${
                    !n.read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  {/* Unread indicator */}
                  <div className="w-1.5 shrink-0 mt-2">
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeInfo.color} shrink-0 mt-0.5`}>
                    {typeInfo.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                    <p className={`text-xs truncate ${n.read ? 'text-slate-600' : 'text-slate-400'}`}>{n.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-white transition-all shrink-0"
                    aria-label={t('notification.delete')}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* View All Link */}
        {notifications.length > 0 && (
          <button
            onClick={() => { onClose(); navigate('/app/notifications'); }}
            className="w-full px-4 py-2.5 text-xs text-accent hover:text-accent/80 font-medium border-t border-white/5 text-center"
          >
            {t('pages:notificationPage.viewAll')}
          </button>
        )}
      </div>
    </div>
  );
};
