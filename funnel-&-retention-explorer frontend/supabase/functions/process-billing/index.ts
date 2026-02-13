import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETRY_INTERVALS = [1, 3, 7];
const GRACE_PERIOD_DAYS = 7;

const BILLING_PRICES: Record<string, number> = { monthly: 29000, annual: 278400 };
const BILLING_INTERVALS: Record<string, number> = { monthly: 30, annual: 365 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // service_role 인증 확인 (pg_cron에서만 호출)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!token || token !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: '권한이 없습니다.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TOSS_SECRET_KEY = Deno.env.get('TOSS_SECRET_KEY');
  if (!TOSS_SECRET_KEY) {
    return new Response(JSON.stringify({ error: '결제 서비스가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey
  );

  const tossAuth = `Basic ${btoa(TOSS_SECRET_KEY + ':')}`;
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = today.replace(/-/g, '');

  let successCount = 0;
  let failedCount = 0;
  let cancelledDowngraded = 0;
  let graceExpired = 0;

  // 1. 만기 구독 결제 처리
  const { data: dueProfiles } = await serviceClient
    .from('fre_user_profiles')
    .select('*')
    .eq('subscription_status', 'active')
    .lte('next_billing_date', today)
    .not('toss_billing_key', 'is', null);

  for (const profile of dueProfiles ?? []) {
    const orderId = `FRE-RENEW-${profile.id.slice(0, 8)}-${dateStr}`;
    const cycle = profile.billing_cycle ?? 'monthly';
    const billingAmount = BILLING_PRICES[cycle] ?? BILLING_PRICES.monthly;
    const billingInterval = BILLING_INTERVALS[cycle] ?? BILLING_INTERVALS.monthly;
    const cycleName = cycle === 'annual' ? '연간' : '월간';

    try {
      const res = await fetch(
        `https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}`,
        {
          method: 'POST',
          headers: {
            Authorization: tossAuth,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerKey: profile.toss_customer_key,
            amount: billingAmount,
            orderId,
            orderName: `FRE Analytics Pro ${cycleName} 구독 갱신`,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + billingInterval);

        await serviceClient
          .from('fre_user_profiles')
          .update({
            next_billing_date: nextDate.toISOString().slice(0, 10),
            retry_count: 0,
          })
          .eq('id', profile.id);

        await serviceClient.from('fre_billing_history').insert({
          user_id: profile.id,
          order_id: orderId,
          amount: billingAmount,
          status: 'success',
          toss_payment_key: data.paymentKey,
        });

        successCount++;
      } else {
        const errData = await res.json();
        const newRetryCount = (profile.retry_count ?? 0) + 1;

        await serviceClient.from('fre_billing_history').insert({
          user_id: profile.id,
          order_id: orderId,
          amount: billingAmount,
          status: 'failed',
          failure_reason: errData.message ?? 'Unknown error',
        });

        if (newRetryCount >= 3) {
          const graceEnd = new Date();
          graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

          await serviceClient
            .from('fre_user_profiles')
            .update({
              retry_count: newRetryCount,
              subscription_status: 'past_due',
              grace_period_end: graceEnd.toISOString().slice(0, 10),
            })
            .eq('id', profile.id);
        } else {
          const retryDate = new Date();
          retryDate.setDate(retryDate.getDate() + RETRY_INTERVALS[newRetryCount - 1]);

          await serviceClient
            .from('fre_user_profiles')
            .update({
              retry_count: newRetryCount,
              next_billing_date: retryDate.toISOString().slice(0, 10),
            })
            .eq('id', profile.id);
        }

        failedCount++;
      }
    } catch (err) {
      console.error(`Billing failed for ${profile.id}:`, err);
      failedCount++;
    }
  }

  // 2. cancelled 구독 만기 처리 → Free 다운그레이드 + 빌링키 삭제
  const { data: cancelledProfiles } = await serviceClient
    .from('fre_user_profiles')
    .select('*')
    .eq('subscription_status', 'cancelled')
    .lte('next_billing_date', today);

  for (const profile of cancelledProfiles ?? []) {
    // TossPayments 빌링키 삭제
    if (profile.toss_billing_key) {
      try {
        await fetch(
          `https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}`,
          {
            method: 'DELETE',
            headers: { Authorization: tossAuth },
          }
        );
      } catch (err) {
        console.error(`BillingKey delete failed for ${profile.id}:`, err);
      }
    }

    await serviceClient
      .from('fre_user_profiles')
      .update({
        plan: 'free',
        subscription_status: 'none',
        toss_billing_key: null,
        csv_row_limit: 10000,
        retry_count: 0,
        grace_period_end: null,
      })
      .eq('id', profile.id);

    cancelledDowngraded++;
  }

  // 3. Grace period 만료 처리 → Free 다운그레이드
  const { data: graceProfiles } = await serviceClient
    .from('fre_user_profiles')
    .select('*')
    .eq('subscription_status', 'past_due')
    .lte('grace_period_end', today);

  for (const profile of graceProfiles ?? []) {
    // 빌링키 삭제
    if (profile.toss_billing_key) {
      try {
        await fetch(
          `https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}`,
          {
            method: 'DELETE',
            headers: { Authorization: tossAuth },
          }
        );
      } catch (err) {
        console.error(`BillingKey delete failed for ${profile.id}:`, err);
      }
    }

    await serviceClient
      .from('fre_user_profiles')
      .update({
        plan: 'free',
        subscription_status: 'none',
        toss_billing_key: null,
        csv_row_limit: 10000,
        retry_count: 0,
        grace_period_end: null,
      })
      .eq('id', profile.id);

    graceExpired++;
  }

  // 4. Trial 만료 처리 → Free 다운그레이드
  let trialExpired = 0;

  const { data: expiredTrials } = await serviceClient
    .from('fre_user_profiles')
    .select('id, trial_end')
    .eq('plan', 'pro')
    .not('trial_end', 'is', null)
    .lte('trial_end', new Date().toISOString())
    .or('subscription_status.eq.none,subscription_status.is.null');

  for (const profile of expiredTrials ?? []) {
    await serviceClient
      .from('fre_user_profiles')
      .update({
        plan: 'free',
        csv_row_limit: 10000,
      })
      .eq('id', profile.id);

    trialExpired++;
  }

  const processed = (dueProfiles?.length ?? 0) + (cancelledProfiles?.length ?? 0) + (graceProfiles?.length ?? 0) + (expiredTrials?.length ?? 0);

  return new Response(JSON.stringify({
    processed,
    success: successCount,
    failed: failedCount,
    cancelled_downgraded: cancelledDowngraded,
    grace_expired: graceExpired,
    trial_expired: trialExpired,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
