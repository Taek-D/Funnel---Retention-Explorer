import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? 'https://fre-analytics-castletaek9643-9522s-projects.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Cache-Control': 'no-store',
};

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

  const BILLING_PRICES: Record<string, number> = { monthly: 29000, annual: 278400 };
  const BILLING_INTERVALS: Record<string, number> = { monthly: 30, annual: 365 };

  let body: { authKey: string; billingCycle?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: '잘못된 요청 형식입니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { authKey, billingCycle: rawCycle } = body;
  if (!authKey) {
    return new Response(JSON.stringify({ error: 'authKey가 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const billingCycle = rawCycle ?? 'monthly';
  if (!['monthly', 'annual'].includes(billingCycle)) {
    return new Response(JSON.stringify({ error: '유효하지 않은 결제 주기입니다.' }), {
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

  // Get user profile for customerKey
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: profile } = await serviceClient
    .from('fre_user_profiles')
    .select('toss_customer_key')
    .eq('id', user.id)
    .single();

  if (!profile?.toss_customer_key) {
    return new Response(JSON.stringify({ error: '사용자 프로필을 찾을 수 없습니다.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tossAuth = `Basic ${btoa(TOSS_SECRET_KEY + ':')}`;

  // Step 1: Issue billingKey
  const billingRes = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: {
      Authorization: tossAuth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authKey,
      customerKey: profile.toss_customer_key,
    }),
  });

  const billingData = await billingRes.json();
  if (!billingRes.ok) {
    return new Response(JSON.stringify({ error: billingData.message || '빌링키 발급에 실패했습니다.' }), {
      status: billingRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { billingKey } = billingData;

  // Step 2: First payment
  const orderId = `FRE-PRO-${user.id.slice(0, 8)}-${Date.now()}`;
  const paymentRes = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: 'POST',
    headers: {
      Authorization: tossAuth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey: profile.toss_customer_key,
      amount: BILLING_PRICES[billingCycle],
      orderId,
      orderName: `FRE Analytics Pro ${billingCycle === 'annual' ? '연간' : '월간'} 구독`,
    }),
  });

  const paymentData = await paymentRes.json();
  if (!paymentRes.ok) {
    return new Response(JSON.stringify({ error: paymentData.message || '결제 승인에 실패했습니다.' }), {
      status: paymentRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Step 3: Update DB
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + BILLING_INTERVALS[billingCycle]);

  const { error: updateError } = await serviceClient
    .from('fre_user_profiles')
    .update({
      plan: 'pro',
      toss_billing_key: billingKey,
      subscription_status: 'active',
      plan_started_at: new Date().toISOString(),
      csv_row_limit: 500000,
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate.toISOString().slice(0, 10),
    })
    .eq('id', user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: '프로필 업데이트에 실패했습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    plan: 'pro',
    orderId,
    nextBillingDate: nextBillingDate.toISOString().slice(0, 10),
    billingCycle,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
