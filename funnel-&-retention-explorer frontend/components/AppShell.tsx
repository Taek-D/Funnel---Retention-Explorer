import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Modal } from './Modal';
import { UserMenu } from './UserMenu';
import { NotificationPanel } from './NotificationPanel';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { SearchModal } from './SearchModal';
import { OnboardingTour } from './OnboardingTour';
import { Search, Bell, Menu, Mail, Settings } from './Icons';
import { PastDueBanner } from './PastDueBanner';
import { trackPageView } from '../lib/analytics';
import { useToast } from './Toast';
import { useNotifications } from '../context/NotificationContext';
import { useEmailSettings } from '../hooks/useEmailSettings';
import { useOnboardingTour } from '../hooks/useOnboardingTour';
import { useAppContext } from '../context/AppContext';

export const AppShell: React.FC = () => {
  const { t } = useTranslation();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const { settings, updateSettings, saveSettings, testConnection, testing } = useEmailSettings();
  const { state } = useAppContext();
  const hasData = state.processedData.length > 0;
  const tour = useOnboardingTour(hasData);

  const currentSegment = location.pathname.split('/').pop() || 'dashboard';
  const pageTitle = currentSegment.replace(/-/g, ' ');

  // GA4 page tracking
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

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
      toast('warning', t('email.webhookRequired'));
      return;
    }
    try {
      new URL(settings.webhookUrl);
    } catch {
      toast('error', t('email.invalidUrl'));
      return;
    }
    saveSettings();
    setEmailModalOpen(false);
    toast('success', t('email.settingsSaved'), t('email.settingsSavedDesc'));
  }, [settings.webhookUrl, saveSettings, toast, t]);

  const handleTestConnection = useCallback(async () => {
    if (!settings.webhookUrl.trim()) {
      toast('warning', t('email.webhookUrlFirst'));
      return;
    }
    const success = await testConnection();
    if (success) {
      toast('success', t('email.connectionSuccess'), t('email.connectionSuccessDesc'));
    } else {
      toast('error', t('email.connectionFailed'), t('email.connectionFailedDesc'));
    }
  }, [settings.webhookUrl, testConnection, toast, t]);

  return (
    <div className="flex min-h-screen bg-background text-white font-sans selection:bg-accent/30 selection:text-white">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none -z-10" />

      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} hasData={hasData} onStartTour={tour.startTour} />

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
              title={t('search.shortcut')}
            >
              <Search size={16} />
            </button>
            <NotificationPanel
              open={notificationOpen}
              onToggle={() => setNotificationOpen(prev => !prev)}
              onClose={() => setNotificationOpen(false)}
              onOpenEmailSettings={() => { setNotificationOpen(false); setNotifPrefsOpen(true); }}
              unreadCount={unreadCount}
            />
            <div className="w-px h-5 bg-white/[0.06] mx-1" />
            <UserMenu />
          </div>
        </header>

        {/* Past Due Banner */}
        <PastDueBanner />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Onboarding Tour */}
      <OnboardingTour {...tour} />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal open={notifPrefsOpen} onClose={() => setNotifPrefsOpen(false)} />

      {/* Email Settings Modal */}
      <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} title={t('email.settingsTitle')}>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('email.webhookUrl')}</label>
            <input
              type="text"
              value={settings.webhookUrl}
              onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
              className="w-full bg-white/[0.03] border-b border-white/10 px-0 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="https://primary.n8n.cloud/webhook/..."
            />
            <p className="text-[11px] text-slate-600">{t('email.webhookHint')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {t('email.recipientEmails')} <span className="text-slate-600 font-normal normal-case">({t('email.commaHint')})</span>
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
                <span className="text-sm font-medium text-white">{t('email.autoSend')}</span>
                <span className="text-[11px] text-slate-500">{t('email.autoSendDesc')}</span>
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
              {testing ? t('email.testing') : t('email.testConnection')}
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              onClick={() => setEmailModalOpen(false)}
            >
              {t('email.close')}
            </button>
            <button
              onClick={handleSaveEmailSettings}
              className="px-5 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
            >
              {t('email.save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
