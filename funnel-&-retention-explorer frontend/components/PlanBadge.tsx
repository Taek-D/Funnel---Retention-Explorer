import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap } from './Icons';

export const PlanBadge: React.FC = () => {
  const { userProfile } = useAuth();
  const plan = userProfile?.plan ?? 'free';

  if (plan === 'pro') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/20 rounded-md" title="Pro 플랜">
        <Zap size={12} className="text-accent" />
        <span className="text-[10px] font-mono font-semibold text-accent uppercase">Pro</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1" title="Free 플랜">
      <span className="text-[10px] font-mono font-medium text-slate-500 uppercase">Free</span>
      <span className="text-[9px] text-accent/70 hover:text-accent cursor-pointer transition-colors">
        업그레이드
      </span>
    </div>
  );
};
