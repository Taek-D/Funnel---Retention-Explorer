import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from './Icons';
import { useAuth } from '../context/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="px-4 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
      >
        로그인
      </button>
    );
  }

  const initial = (user.email?.charAt(0) || 'U').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-mono font-semibold border border-accent/20 hover:bg-accent/20 transition-colors"
        title={user.email || ''}
      >
        {initial}
      </button>

      <div
        className={`absolute right-0 top-11 w-56 md:w-64 bg-surface border border-white/[0.06] rounded-lg shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-sm font-medium text-white truncate">{user.email}</p>
          <p className="text-xs text-slate-500">무료 플랜</p>
        </div>
        <div className="py-1">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};
