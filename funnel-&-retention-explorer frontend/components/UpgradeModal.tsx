import React, { useState } from 'react';
import { X, CheckCircle, Zap } from './Icons';
import { useAuth } from '../context/AuthContext';
import { PLAN_LIMITS } from '../lib/planManager';

declare const TossPayments: (clientKey: string) => {
  requestBillingAuth: (params: {
    method: string;
    successUrl: string;
    failUrl: string;
    customerKey: string;
    customerEmail?: string;
  }) => Promise<void>;
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
}

const REASON_MESSAGES: Record<string, string> = {
  csv_limit: `CSV 업로드 행 수 제한(${PLAN_LIMITS.free.csvRows.toLocaleString()}행)에 도달했습니다.`,
  ai_limit: `AI 인사이트 일일 호출 제한(${PLAN_LIMITS.free.aiCallsPerDay}회)에 도달했습니다.`,
  general: 'Pro 플랜으로 업그레이드하여 더 강력한 기능을 이용하세요.',
};

const FREE_FEATURES = [
  `CSV ${PLAN_LIMITS.free.csvRows.toLocaleString()}행`,
  `AI 인사이트 일 ${PLAN_LIMITS.free.aiCallsPerDay}회`,
  '프로젝트 1개',
  '퍼널 & 리텐션 분석',
];

const PRO_FEATURES = [
  `CSV ${PLAN_LIMITS.pro.csvRows.toLocaleString()}행`,
  `AI 인사이트 일 ${PLAN_LIMITS.pro.aiCallsPerDay}회`,
  '프로젝트 무제한',
  '세그먼트 비교',
  'PDF 내보내기',
  '우선 지원',
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, reason }) => {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    if (!clientKey || !userProfile?.toss_customer_key) return;

    setIsLoading(true);
    try {
      const tossPayments = TossPayments(clientKey);
      await tossPayments.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/app/billing/success`,
        failUrl: `${window.location.origin}/app/billing/fail`,
        customerKey: userProfile.toss_customer_key,
        customerEmail: user?.email ?? undefined,
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-white/[0.06] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-accent" />
            <h2 className="text-lg font-bold text-white">Pro로 업그레이드</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Reason message */}
          <p className="text-slate-400 text-sm mb-6">
            {REASON_MESSAGES[reason] || REASON_MESSAGES.general}
          </p>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Free */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Free</h3>
              <ul className="space-y-2">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={14} className="text-slate-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-accent">Pro</h3>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                  추천
                </span>
              </div>
              <ul className="space-y-2">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle size={14} className="text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="text-center mb-4">
            <span className="text-3xl font-mono font-bold text-white">₩29,000</span>
            <span className="text-slate-400 text-sm ml-1">/월</span>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isLoading || !userProfile?.toss_customer_key}
            className="w-full py-3 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : 'Pro 업그레이드'}
          </button>

          {!user && (
            <p className="text-slate-500 text-xs text-center mt-3">
              업그레이드하려면 먼저 로그인이 필요합니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
