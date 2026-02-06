import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Filter, Users, UploadCloud, Settings, LogOut, BarChart2, PieChart, Smartphone } from './Icons';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const menuItems: MenuItem[] = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/app/funnels', icon: Filter, label: 'Funnels' },
  { path: '/app/retention', icon: Users, label: 'Retention' },
  { path: '/app/upload', icon: UploadCloud, label: 'Data Import' },
  { path: '/app/editor', icon: Settings, label: 'Funnel Editor' },
  { path: '/app/segments', icon: PieChart, label: 'Segments' },
  { path: '/app/insights', icon: BarChart2, label: 'AI Insights' },
  { path: '/app/mobile', icon: Smartphone, label: 'Mobile Preview' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'G';

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
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 transition-colors"
        onClick={() => handleNav('/')}
        title="Home"
      >
        <Activity size={24} />
      </div>

      <nav className="flex flex-col gap-2 w-full items-center">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`group relative p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={item.label}
            >
              <item.icon size={20} />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium text-white bg-slate-800 border border-white/10 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 hidden md:block">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 items-center">
        <button
          className="p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
        <div
          className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold border border-primary/30"
          title={user?.email || 'Guest'}
        >
          {initial}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-20 flex-col items-center border-r border-white/5 bg-surface/50 backdrop-blur-xl py-6 gap-8 shrink-0 z-20 fixed h-full left-0 top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="sidebar-overlay absolute inset-0" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-20 flex flex-col items-center bg-surface border-r border-white/5 py-6 gap-8 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

const Activity: React.FC<{ size: number }> = ({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
