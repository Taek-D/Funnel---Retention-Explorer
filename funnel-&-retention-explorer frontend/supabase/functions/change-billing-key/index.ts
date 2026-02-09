import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  let body: { authKey: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: '잘못된 요청 형식입니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { authKey } = body;
  if (!authKey) {
    return new Response(JSON.stringify({ error: 'authKey가 필요합니다.' }), {
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

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: profile } = await serviceClient
    .from('fre_user_profiles')
    .select('toss_customer_key, toss_billing_key')
    .eq('id', user.id)
    .single();

  if (!profile?.toss_customer_key) {
    return new Response(JSON.stringify({ error: '사용자 프로필을 찾을 수 없습니다.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tossAuth = `Basic ${btoa(TOSS_SECRET_KEY + ':')}`;

  // Step 1: Issue new billingKey
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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { billingKey: newBillingKey } = billingData;

  // Step 2: Delete previous billingKey (best-effort)
  if (profile.toss_billing_key) {
    try {
      await fetch(
        `https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}`,
        {
          method: 'DELETE',
          headers: { Authorization: tossAuth },
        }
      );
    } catch {
      // Ignore delete failure — new key is already issued
    }
  }

  // Step 3: Update DB with new billingKey only
  const { error: updateError } = await serviceClient
    .from('fre_user_profiles')
    .update({ toss_billing_key: newBillingKey })
    .eq('id', user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: '프로필 업데이트에 실패했습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: '결제 수단이 변경되었습니다.',
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
