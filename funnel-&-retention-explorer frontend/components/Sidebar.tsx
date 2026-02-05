import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Filter, Users, UploadCloud, Settings, LogOut, BarChart2, PieChart, Smartphone } from './Icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems: { id: View; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'funnels', icon: Filter, label: 'Funnels' },
    { id: 'retention', icon: Users, label: 'Retention' },
    { id: 'upload', icon: UploadCloud, label: 'Data Import' },
    { id: 'editor', icon: Settings, label: 'Funnel Editor' },
    { id: 'segments', icon: PieChart, label: 'Segments' },
    { id: 'insights', icon: BarChart2, label: 'AI Insights' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile Preview' },
  ];

  return (
    <aside className="hidden md:flex w-20 flex-col items-center border-r border-white/5 bg-surface/50 backdrop-blur-xl py-6 gap-8 shrink-0 z-20 fixed h-full left-0 top-0 group/sidebar">
      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary hover:scale-110 transition-transform duration-300 cursor-pointer shadow-glow-sm">
        <Activity size={24} />
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-3 w-full items-center px-3">
        {menuItems.map((item, index) => (
          <div key={item.id} className="relative group/item w-full flex justify-center">
            <button
              onClick={() => setView(item.id)}
              className={`p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                currentView === item.id
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105'
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'slideInLeft 0.4s ease-out'
              }}
            >
              {/* Active indicator */}
              {currentView === item.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl animate-pulse-slow" />
              )}

              <item.icon size={20} className="relative z-10" />

              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                currentView === item.id
                  ? 'opacity-100 bg-gradient-to-br from-primary-light/20 to-transparent'
                  : 'opacity-0 group-hover/item:opacity-100 bg-gradient-to-br from-white/10 to-transparent'
              }`} />
            </button>

            {/* Tooltip Label */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-surface-elevated border border-white/10 rounded-lg text-sm font-medium text-white whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 pointer-events-none z-50 shadow-xl">
              {item.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-surface-elevated" />
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-4 items-center px-3">
        {/* Logout Button */}
        <div className="relative group/item w-full flex justify-center">
          <button className="p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 hover:scale-105">
            <LogOut size={20} />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-surface-elevated border border-white/10 rounded-lg text-sm font-medium text-white whitespace-nowrap opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 pointer-events-none z-50 shadow-xl">
            Logout
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-surface-elevated" />
          </div>
        </div>

        {/* User Avatar */}
        <div className="relative group/avatar">
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white/10 hover:border-primary transition-all duration-300 cursor-pointer hover:scale-110 shadow-md hover:shadow-glow"
            style={{ backgroundImage: "url('https://picsum.photos/100')" }}
          />

          {/* Status Indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface animate-pulse" />

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-surface-elevated border border-white/10 rounded-lg text-sm font-medium text-white whitespace-nowrap opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 pointer-events-none z-50 shadow-xl">
            Profile
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-surface-elevated" />
          </div>
        </div>
      </div>
    </aside>
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
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);
