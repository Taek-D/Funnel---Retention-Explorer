import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trash2, Check, CheckCircle, X } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications, type NotificationType } from '../context/NotificationContext';

const TYPE_FILTERS: (NotificationType | 'all')[] = ['all', 'analysis', 'import', 'ai', 'export'];
const PAGE_SIZE = 20;

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, markAsRead, removeNotification, markAllAsRead, clearAll, loading } = useNotifications();
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const typeLabels: Record<NotificationType, { label: string; color: string }> = {
    analysis: { label: t('notification.analysis'), color: 'text-accent bg-accent/10' },
    import: { label: t('notification.import'), color: 'text-sky-400 bg-sky-400/10' },
    ai: { label: t('notification.ai'), color: 'text-amber bg-amber/10' },
    export: { label: t('notification.export'), color: 'text-coral bg-coral/10' },
  };

  const filtered = useMemo(() => {
    let result = notifications;
    if (typeFilter !== 'all') {
      result = result.filter(n => n.type === typeFilter);
    }
    if (unreadOnly) {
      result = result.filter(n => !n.read);
    }
    return result;
  }, [notifications, typeFilter, unreadOnly]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return t('notification.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('notification.minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notification.hoursAgo', { count: hours });
    return t('notification.daysAgo', { count: Math.floor(hours / 24) });
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    for (const id of selected) {
      removeNotification(id);
    }
    setSelected(new Set());
    setSelectMode(false);
  };

  const handleMarkSelectedRead = () => {
    for (const id of selected) {
      markAsRead(id);
    }
    setSelected(new Set());
    setSelectMode(false);
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/50">{t('auth.loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell size={22} className="text-accent" />
          {t('pages:notificationPage.title')}
        </h1>
        <div className="flex items-center gap-2">
          {selectMode && selected.size > 0 && (
            <>
              <button
                onClick={handleMarkSelectedRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent rounded-lg hover:bg-accent/20"
              >
                <Check size={14} /> {t('pages:notificationPage.markSelectedRead')}
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
              >
                <Trash2 size={14} /> {t('pages:notificationPage.deleteSelected')}
              </button>
            </>
          )}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
              selectMode ? 'bg-accent/20 border-accent/50 text-accent' : 'border-white/[0.08] text-white/60 hover:border-white/20'
            }`}
          >
            {t('pages:notificationPage.selectMode')}
          </button>
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 border border-white/[0.08] rounded-lg"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-red-400 border border-white/[0.08] rounded-lg"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg border ${
              typeFilter === f
                ? 'bg-accent/20 border-accent/50 text-accent'
                : 'bg-background border-white/[0.08] text-white/60 hover:border-white/20'
            }`}
          >
            {f === 'all' ? t('pages:notificationPage.all') : t(`notification.${f}`)}
          </button>
        ))}
        <div className="w-px h-5 bg-white/[0.06] mx-1" />
        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          className={`px-3 py-1.5 text-xs rounded-lg border ${
            unreadOnly
              ? 'bg-accent/20 border-accent/50 text-accent'
              : 'bg-background border-white/[0.08] text-white/60 hover:border-white/20'
          }`}
        >
          {t('pages:notificationPage.unreadOnly')}
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="text-white/40 text-sm">{t('loading')}</div>
      ) : visible.length === 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-xl p-12 text-center">
          <Bell size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white/40 text-sm">{t('pages:notificationPage.noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {visible.map(n => {
            const typeInfo = typeLabels[n.type];
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors ${
                  !n.read ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-transparent border-transparent hover:bg-white/[0.01]'
                }`}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(n.id)}
                    onChange={() => toggleSelect(n.id)}
                    className="accent-accent mt-1"
                  />
                )}
                <div className="w-1.5 shrink-0 mt-2">
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeInfo.color} shrink-0 mt-0.5`}>
                  {typeInfo.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                  <p className={`text-xs mt-0.5 ${n.read ? 'text-slate-600' : 'text-slate-400'}`}>{n.message}</p>
                </div>
                <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1 rounded text-slate-600 hover:text-accent transition-colors"
                      title={t('notification.markRead')}
                    >
                      <Check size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(n.id)}
                    className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors"
                    title={t('notification.delete')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              className="w-full py-3 text-sm text-accent hover:text-accent/80 font-medium"
            >
              {t('pages:notificationPage.loadMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
