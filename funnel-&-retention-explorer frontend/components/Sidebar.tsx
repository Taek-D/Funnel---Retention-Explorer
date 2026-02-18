import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Filter, Users, UploadCloud, LogOut, BarChart2, PieChart, Activity, CreditCard, HelpCircle, Shield, Settings, Webhook, Download, Clock, Bell, Tag, FlaskConical, ArrowRightLeft, GitCompareArrows, Diff, Plug } from './Icons';
import { useAuth } from '../context/AuthContext';
import { PlanBadge } from './PlanBadge';
import { UsageIndicator } from './UsageIndicator';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
  dataTour?: string;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  hasData?: boolean;
  onStartTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ mobileOpen, onCloseMobile, hasData, onStartTour }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    { path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', dataTour: 'dashboard' },
    { path: '/app/upload', icon: UploadCloud, labelKey: 'nav.dataImport', dataTour: 'upload' },
    { path: '/app/connectors', icon: Plug, labelKey: 'nav.connectors', dataTour: 'advanced' },
    { path: '/app/funnels', icon: Filter, labelKey: 'nav.funnel', dataTour: 'analysis' },
    { path: '/app/retention', icon: Users, labelKey: 'nav.retention', dataTour: 'retention' },
    { path: '/app/segments', icon: PieChart, labelKey: 'nav.segments', dataTour: 'segments' },
    { path: '/app/insights', icon: BarChart2, labelKey: 'nav.aiInsights', dataTour: 'insights' },
    { path: '/app/events', icon: Tag, labelKey: 'nav.events', dataTour: 'events' },
    { path: '/app/ab-test', icon: FlaskConical, labelKey: 'nav.abTest', dataTour: 'ab-test' },
    { path: '/app/journey', icon: ArrowRightLeft, labelKey: 'nav.journey', dataTour: 'journey' },
    { path: '/app/funnel-compare', icon: GitCompareArrows, labelKey: 'nav.funnelCompare', dataTour: 'funnel-compare' },
    { path: '/app/retention-compare', icon: Diff, labelKey: 'nav.retentionCompare', dataTour: 'retention-compare' },
    { path: '/app/stickiness', icon: Activity, labelKey: 'nav.stickiness', dataTour: 'stickiness' },
    { path: '/app/notifications', icon: Bell, labelKey: 'nav.notifications', dataTour: 'notifications' },
    { path: '/app/team', icon: Shield, labelKey: 'nav.team', dataTour: 'team' },
    { path: '/app/webhooks', icon: Webhook, labelKey: 'nav.webhooks', dataTour: 'webhooks' },
    { path: '/app/scheduled-reports', icon: Clock, labelKey: 'nav.scheduledReports', dataTour: 'scheduled-reports' },
    { path: '/app/subscription', icon: CreditCard, labelKey: 'nav.subscription', dataTour: 'subscription' },
  ];

  const adminItems: MenuItem[] = userProfile?.role === 'admin' ? [
    { path: '/app/admin', icon: Settings, labelKey: 'nav.admin' },
  ] : [];

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'G';
  const { canInstall, install } = useInstallPrompt();

  const handleNav = (path: string) => {
    navigate(path);
    onCloseMobile?.();
  };

  const handleSignOut = async () => {
    if (user) {
      await signOut();
    }
    navigate('/');
    onCloseMobile?.();
  };

  const sidebarContent = (
    <>
      <div
        className="w-8 h-8 flex items-center justify-center rounded-md bg-accent/10 text-accent cursor-pointer hover:bg-accent/20 transition-colors"
        onClick={() => handleNav('/')}
        role="button"
        aria-label={t('nav.home')}
        title={t('nav.home')}
      >
        <Activity size={18} />
      </div>

      <nav className="flex flex-col gap-0.5 w-full items-center">
        {[...menuItems, ...(adminItems.length > 0 ? [{ path: '__divider__', icon: Settings, labelKey: '' } as MenuItem, ...adminItems] : [])].map((item) => {
          if (item.path === '__divider__') {
            return <div key="admin-divider" className="w-6 h-px bg-white/[0.06] my-1" />;
          }
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`group relative w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-150 ${
                isActive
                  ? 'text-accent bg-accent/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
              title={t(item.labelKey)}
              {...(item.dataTour ? { 'data-tour': item.dataTour } : {})}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-accent rounded-r-full" />
              )}
              <item.icon size={18} />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 text-[11px] font-medium text-white bg-elevated border border-white/[0.06] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 hidden md:block">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 items-center">
        {onStartTour && (
          <button
            onClick={onStartTour}
            className="w-10 h-10 flex items-center justify-center rounded-md text-accent/60 hover:text-accent hover:bg-accent/10 transition-colors"
            aria-label={t('nav.startGuide')}
            title={t('nav.startGuide')}
          >
            <HelpCircle size={18} />
          </button>
        )}
        {canInstall && (
          <button
            onClick={install}
            className="w-10 h-10 flex items-center justify-center rounded-md text-accent/60 hover:text-accent hover:bg-accent/10 transition-colors"
            aria-label={t('pwa.installApp')}
            title={t('pwa.installApp')}
          >
            <Download size={18} />
          </button>
        )}
        <PlanBadge />
        <UsageIndicator />
        <LanguageSwitcher />
        <button
          className="w-10 h-10 flex items-center justify-center rounded-md text-slate-600 hover:text-coral hover:bg-coral/5 transition-colors"
          onClick={handleSignOut}
          aria-label={t('nav.logout')}
          title={t('nav.logout')}
        >
          <LogOut size={16} />
        </button>
        <div
          className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-mono font-semibold"
          title={user?.email || t('nav.guest')}
        >
          {initial}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-16 flex-col items-center border-r border-white/[0.06] bg-background py-4 gap-6 shrink-0 z-20 fixed h-full left-0 top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('nav.navMenu')}>
          <div className="sidebar-overlay absolute inset-0" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-16 flex flex-col items-center bg-background border-r border-white/[0.06] py-4 gap-6 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
});
