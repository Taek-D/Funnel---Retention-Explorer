import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BILLING_PRICES: Record<string, number> = { monthly: 29000, annual: 278400 };

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: '유효하지 않은 인증입니다.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { targetCycle: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: '잘못된 요청 형식입니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { targetCycle } = body;
  if (!['monthly', 'annual'].includes(targetCycle)) {
    return new Response(JSON.stringify({ error: '유효하지 않은 결제 주기입니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: profile } = await serviceClient
    .from('fre_user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: '사용자 프로필을 찾을 수 없습니다.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (profile.subscription_status !== 'active') {
    return new Response(JSON.stringify({ error: '활성 구독이 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (profile.billing_cycle === targetCycle) {
    return new Response(JSON.stringify({ error: '이미 해당 주기입니다.' }), {
      status: 400,
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

  const tossAuth = `Basic ${btoa(TOSS_SECRET_KEY + ':')}`;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Monthly → Annual: proration + immediate charge
  if (targetCycle === 'annual') {
    const nextBilling = profile.next_billing_date ? new Date(profile.next_billing_date) : today;
    const remainingDays = daysBetween(today, nextBilling);
    const credit = Math.round((remainingDays / 30) * BILLING_PRICES.monthly);
    const chargeAmount = Math.max(0, BILLING_PRICES.annual - credit);

    if (chargeAmount > 0 && profile.toss_billing_key) {
      const dateStr = todayStr.replace(/-/g, '');
      const orderId = `FRE-SWITCH-${user.id.slice(0, 8)}-${dateStr}`;

      const paymentRes = await fetch(
        `https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}`,
        {
          method: 'POST',
          headers: {
            Authorization: tossAuth,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerKey: profile.toss_customer_key,
            amount: chargeAmount,
            orderId,
            orderName: 'FRE Analytics Pro 연간 전환 (차액)',
          }),
        }
      );

      const paymentData = await paymentRes.json();

      // Record in billing history
      await serviceClient.from('fre_billing_history').insert({
        user_id: user.id,
        order_id: orderId,
        amount: chargeAmount,
        status: paymentRes.ok ? 'success' : 'failed',
        toss_payment_key: paymentRes.ok ? paymentData.paymentKey : null,
        failure_reason: paymentRes.ok ? null : (paymentData.message ?? 'Unknown error'),
      });

      if (!paymentRes.ok) {
        return new Response(JSON.stringify({ error: '차액 결제에 실패했습니다.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const newNextDate = new Date();
    newNextDate.setDate(newNextDate.getDate() + 365);

    await serviceClient
      .from('fre_user_profiles')
      .update({
        billing_cycle: 'annual',
        next_billing_date: newNextDate.toISOString().slice(0, 10),
      })
      .eq('id', user.id);

    return new Response(JSON.stringify({
      success: true,
      message: '연간 구독으로 전환되었습니다.',
      billingCycle: 'annual',
      nextBillingDate: newNextDate.toISOString().slice(0, 10),
      charged: chargeAmount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Annual → Monthly: no immediate charge, applies at next renewal
  await serviceClient
    .from('fre_user_profiles')
    .update({ billing_cycle: 'monthly' })
    .eq('id', user.id);

  return new Response(JSON.stringify({
    success: true,
    message: '다음 갱신일부터 월간 구독으로 전환됩니다.',
    billingCycle: 'monthly',
    nextBillingDate: profile.next_billing_date,
    charged: 0,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
