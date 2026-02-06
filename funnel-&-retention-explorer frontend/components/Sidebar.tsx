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
    <aside className="hidden md:flex w-20 flex-col items-center border-r border-white/5 bg-surface/50 backdrop-blur-xl py-6 gap-8 shrink-0 z-20 fixed h-full left-0 top-0">
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/20 text-primary">
        <Activity size={24} />
      </div>
      
      <nav className="flex flex-col gap-6 w-full items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`p-3 rounded-xl transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-6 items-center">
        <button className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut size={20} />
        </button>
        <div 
          className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10" 
          style={{ backgroundImage: "url('https://picsum.photos/100')" }}
        />
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
