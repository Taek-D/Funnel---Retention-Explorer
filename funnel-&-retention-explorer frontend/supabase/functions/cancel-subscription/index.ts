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

  // JWT 인증
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

  // 프로필 조회
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
    return new Response(JSON.stringify({ error: '활성 구독이 없습니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 구독 취소: status만 변경 (plan은 next_billing_date까지 유지)
  const { error: updateError } = await serviceClient
    .from('fre_user_profiles')
    .update({
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: '구독 취소 처리 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: '구독이 취소되었습니다. 다음 결제일까지 Pro 기능을 이용할 수 있습니다.',
    next_billing_date: profile.next_billing_date,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
