import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Filter, Users, UploadCloud, LogOut, BarChart2, PieChart } from './Icons';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const menuItems: MenuItem[] = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { path: '/app/upload', icon: UploadCloud, label: '데이터 가져오기' },
  { path: '/app/funnels', icon: Filter, label: '퍼널 분석' },
  { path: '/app/retention', icon: Users, label: '리텐션' },
  { path: '/app/segments', icon: PieChart, label: '세그먼트' },
  { path: '/app/insights', icon: BarChart2, label: 'AI 인사이트' },
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
        className="w-8 h-8 flex items-center justify-center rounded-md bg-accent/10 text-accent cursor-pointer hover:bg-accent/20 transition-colors"
        onClick={() => handleNav('/')}
        title="홈"
      >
        <Activity size={18} />
      </div>

      <nav className="flex flex-col gap-0.5 w-full items-center">
        {menuItems.map((item) => {
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
              title={item.label}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-accent rounded-r-full" />
              )}
              <item.icon size={18} />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 text-[11px] font-medium text-white bg-elevated border border-white/[0.06] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 hidden md:block">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 items-center">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-md text-slate-600 hover:text-coral hover:bg-coral/5 transition-colors"
          onClick={handleSignOut}
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>
        <div
          className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-mono font-semibold"
          title={user?.email || '게스트'}
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
        <div className="md:hidden fixed inset-0 z-50">
          <div className="sidebar-overlay absolute inset-0" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-16 flex flex-col items-center bg-background border-r border-white/[0.06] py-4 gap-6 animate-slide-in-left">
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
