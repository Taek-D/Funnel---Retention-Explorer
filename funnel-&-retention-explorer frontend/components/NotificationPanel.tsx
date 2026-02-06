import React, { useRef, useEffect } from 'react';
import { Bell, Settings, X } from './Icons';
import { useNotifications, type NotificationType } from '../context/NotificationContext';

const typeLabels: Record<NotificationType, { label: string; color: string }> = {
  analysis: { label: '분석', color: 'text-accent bg-accent/10' },
  import: { label: '가져오기', color: 'text-sky-400 bg-sky-400/10' },
  ai: { label: 'AI', color: 'text-amber bg-amber/10' },
  export: { label: '내보내기', color: 'text-coral bg-coral/10' },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

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
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

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
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-coral rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-11 w-80 md:w-96 bg-surface border border-white/[0.06] rounded-lg shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">알림</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenEmailSettings}
              className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              title="이메일 설정"
            >
              <Settings size={14} />
            </button>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                title="모두 삭제"
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
              <p className="text-slate-500 text-sm text-center">아직 알림이 없습니다</p>
              <p className="text-slate-600 text-xs text-center mt-1">활동이 여기에 표시됩니다</p>
            </div>
          ) : (
            notifications.map(n => {
              const t = typeLabels[n.type];
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                    !n.read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.color} shrink-0 mt-0.5`}>
                    {t.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{n.title}</p>
                    <p className="text-xs text-slate-400 truncate">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
