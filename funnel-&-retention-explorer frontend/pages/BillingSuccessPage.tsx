import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { CheckCircle, AlertCircle } from '../components/Icons';

export const BillingSuccessPage: React.FC = () => {
  const { t } = useTranslation('pages');
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

    const sb = supabase;
    if (!authKey || !user || !sb) {
      setStatus('error');
      setErrorMessage(t('billingSuccess.missingParams'));
      return;
    }

    const processBilling = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMessage(t('billingSuccess.sessionExpired'));
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
          setErrorMessage(data.error || t('billingSuccess.billingKeyFailed'));
          return;
        }

        await refreshProfile();
        setSuccessMessage(t('billingSuccess.billingKeySuccess'));
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
          setErrorMessage(data.error || t('billingSuccess.paymentFailed'));
          return;
        }

        await refreshProfile();
        trackEvent('pro_conversion', { billing_cycle: billingCycle });
        const cycleName = billingCycle === 'annual' ? t('billingSuccess.annual') : t('billingSuccess.monthly');
        setSuccessMessage(t('billingSuccess.proUpgradeComplete', { cycle: cycleName }));
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
            <h2 className="text-xl font-bold text-white mb-2">{t('billingSuccess.processing')}</h2>
            <p className="text-slate-400 text-sm">{t('billingSuccess.processingDesc')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-accent mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">{successMessage || t('billingSuccess.done')}</h2>
            <p className="text-slate-400 text-sm mb-6">
              {searchParams.get('mode') === 'change'
                ? t('billingSuccess.billingKeyChanged')
                : t('billingSuccess.proActivated')}
            </p>
            <button
              onClick={() => navigate(searchParams.get('mode') === 'change' ? '/app/subscription' : '/app/dashboard', { replace: true })}
              className="px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              {searchParams.get('mode') === 'change' ? t('billingSuccess.goToSubscription') : t('billingSuccess.goToDashboard')}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} className="text-coral mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">{t('billingSuccess.failedTitle')}</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/app/dashboard', { replace: true })}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-white/[0.05] hover:bg-white/10 rounded-lg transition-colors"
              >
                {t('billingSuccess.goToDashboard')}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors"
              >
                {t('billingSuccess.retry')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
