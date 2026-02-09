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

  // PI-10: Server-side AI call limit enforcement
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: profile } = await serviceClient
    .from('fre_user_profiles')
    .select('plan, ai_calls_today, ai_calls_reset_at')
    .eq('id', user.id)
    .single();

  if (profile) {
    const today = new Date().toISOString().slice(0, 10);
    const resetDate = profile.ai_calls_reset_at?.slice(0, 10);
    const limits: Record<string, number> = { free: 3, pro: 50 };
    const dailyLimit = limits[profile.plan] ?? 3;
    const callsToday = resetDate === today ? profile.ai_calls_today : 0;

    if (callsToday >= dailyLimit) {
      return new Response(JSON.stringify({ error: 'AI 일일 호출 한도에 도달했습니다.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment usage
    if (resetDate !== today) {
      await serviceClient
        .from('fre_user_profiles')
        .update({ ai_calls_today: 1, ai_calls_reset_at: today })
        .eq('id', user.id);
    } else {
      await serviceClient
        .from('fre_user_profiles')
        .update({ ai_calls_today: callsToday + 1 })
        .eq('id', user.id);
    }
  }

  const body = await req.json();

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI 서비스가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const GEMINI_MODEL = 'gemini-2.0-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const geminiData = await geminiResponse.json();

  return new Response(JSON.stringify(geminiData), {
    status: geminiResponse.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
