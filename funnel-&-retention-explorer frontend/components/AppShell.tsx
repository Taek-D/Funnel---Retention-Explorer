import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Modal } from './Modal';
import { UserMenu } from './UserMenu';
import { NotificationPanel } from './NotificationPanel';
import { SearchModal } from './SearchModal';
import { Search, Bell, Menu, Mail, Settings } from './Icons';
import { useToast } from './Toast';
import { useNotifications } from '../context/NotificationContext';
import { useEmailSettings } from '../hooks/useEmailSettings';

export const AppShell: React.FC = () => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const { settings, updateSettings, saveSettings, testConnection, testing } = useEmailSettings();

  const currentSegment = location.pathname.split('/').pop() || 'dashboard';
  const pageTitle = currentSegment.replace(/-/g, ' ');

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveEmailSettings = useCallback(() => {
    if (!settings.webhookUrl.trim()) {
      toast('warning', '웹훅 URL을 입력해주세요');
      return;
    }
    try {
      new URL(settings.webhookUrl);
    } catch {
      toast('error', '유효한 URL을 입력해주세요');
      return;
    }
    saveSettings();
    setEmailModalOpen(false);
    toast('success', '설정 저장 완료', '이메일 설정이 저장되었습니다.');
  }, [settings.webhookUrl, saveSettings, toast]);

  const handleTestConnection = useCallback(async () => {
    if (!settings.webhookUrl.trim()) {
      toast('warning', '웹훅 URL을 먼저 입력해주세요');
      return;
    }
    const success = await testConnection();
    if (success) {
      toast('success', '연결 성공', '웹훅 서버가 정상 응답했습니다.');
    } else {
      toast('error', '연결 실패', '웹훅 URL을 확인해주세요.');
    }
  }, [settings.webhookUrl, testConnection, toast]);

  return (
    <div className="flex min-h-screen bg-background text-white font-sans selection:bg-accent/30 selection:text-white">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none -z-10" />

      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <main className="flex-1 flex flex-col md:pl-16 relative">
        {/* Top Header — minimal */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.06] bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-sm text-white capitalize tracking-tight">{pageTitle}</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white tracking-tight capitalize">{pageTitle}</h1>
            <span className="text-[10px] text-slate-500 font-mono uppercase">FRE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              title="검색 (Ctrl+K)"
            >
              <Search size={16} />
            </button>
            <NotificationPanel
              open={notificationOpen}
              onToggle={() => setNotificationOpen(prev => !prev)}
              onClose={() => setNotificationOpen(false)}
              onOpenEmailSettings={() => { setNotificationOpen(false); setEmailModalOpen(true); }}
              unreadCount={unreadCount}
            />
            <div className="w-px h-5 bg-white/[0.06] mx-1" />
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Email Settings Modal */}
      <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="이메일 설정">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">n8n 웹훅 URL</label>
            <input
              type="text"
              value={settings.webhookUrl}
              onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
              className="w-full bg-white/[0.03] border-b border-white/10 px-0 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="https://primary.n8n.cloud/webhook/..."
            />
            <p className="text-[11px] text-slate-600">이벤트 발생 시 호출할 n8n 웹훅 주소를 입력하세요.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              수신자 이메일 <span className="text-slate-600 font-normal normal-case">(쉼표로 구분)</span>
            </label>
            <textarea
              value={settings.recipientEmails}
              onChange={(e) => updateSettings({ recipientEmails: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-3 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors min-h-[100px] resize-none"
              placeholder="user@example.com, admin@company.com"
            />
          </div>

          <div className="flex items-center justify-between bg-surface p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-md bg-accent/10 text-accent p-2 shrink-0">
                <Mail size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">분석 시 자동 발송</span>
                <span className="text-[11px] text-slate-500">데이터 집계 완료 후 즉시 리포트를 발송합니다.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoSend}
                onChange={(e) => updateSettings({ autoSend: e.target.checked })}
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-md transition-colors disabled:opacity-50"
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              onClick={() => setEmailModalOpen(false)}
            >
              닫기
            </button>
            <button
              onClick={handleSaveEmailSettings}
              className="px-5 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
