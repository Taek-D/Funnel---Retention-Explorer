import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { CheckCircle, AlertCircle } from '../components/Icons';

export const BillingSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const mode = searchParams.get('mode');
    const billingCycle = searchParams.get('billingCycle') ?? 'monthly';

    if (!authKey || !user || !supabase) {
      setStatus('error');
      setErrorMessage('필수 파라미터가 없습니다.');
      return;
    }

    const processBilling = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMessage('인증 세션이 만료되었습니다.');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (mode === 'change') {
        // Change billing key flow
        const res = await fetch(
          `${supabaseUrl}/functions/v1/change-billing-key`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ authKey }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setErrorMessage(data.error || '결제 수단 변경에 실패했습니다.');
          return;
        }

        await refreshProfile();
        setSuccessMessage('결제 수단이 변경되었습니다.');
        setStatus('success');
      } else {
        // New subscription flow (default)
        const res = await fetch(
          `${supabaseUrl}/functions/v1/issue-billing`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ authKey, billingCycle }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setErrorMessage(data.error || '결제 처리에 실패했습니다.');
          return;
        }

        await refreshProfile();
        trackEvent('pro_conversion', { billing_cycle: billingCycle });
        const cycleName = billingCycle === 'annual' ? '연간' : '월간';
        setSuccessMessage(`Pro ${cycleName} 업그레이드 완료!`);
        setStatus('success');
      }

      setTimeout(() => {
        navigate(mode === 'change' ? '/app/subscription' : '/app/dashboard', { replace: true });
      }, 3000);
    };

    processBilling();
  }, [searchParams, user, refreshProfile, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-surface border border-white/[0.06] rounded-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">결제 처리 중...</h2>
            <p className="text-slate-400 text-sm">잠시만 기다려주세요. 결제를 확인하고 있습니다.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-accent mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">{successMessage || '완료!'}</h2>
            <p className="text-slate-400 text-sm mb-6">
              {searchParams.get('mode') === 'change'
                ? '결제 수단이 성공적으로 변경되었습니다. 잠시 후 구독 관리 페이지로 이동합니다.'
                : '축하합니다! Pro 플랜이 활성화되었습니다. 잠시 후 대시보드로 이동합니다.'}
            </p>
            <button
              onClick={() => navigate(searchParams.get('mode') === 'change' ? '/app/subscription' : '/app/dashboard', { replace: true })}
              className="px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              {searchParams.get('mode') === 'change' ? '구독 관리로 이동' : '대시보드로 이동'}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} className="text-coral mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">결제 처리 실패</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/app/dashboard', { replace: true })}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-white/[0.05] hover:bg-white/10 rounded-lg transition-colors"
              >
                대시보드로 이동
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
