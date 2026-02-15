import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? 'https://fre-analytics-castletaek9643-9522s-projects.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SS-7: Webhook Secret 검증 (HMAC-SHA256)
async function verifyWebhookSignature(
  req: Request,
  bodyText: string
): Promise<boolean> {
  const secret = Deno.env.get('TOSS_WEBHOOK_SECRET');
  if (!secret) {
    console.error('TOSS_WEBHOOK_SECRET not configured — rejecting webhook');
    return false;
  }

  const signature = req.headers.get('TossPayments-Signature');
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
  const computed = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return computed === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // SS-7: Webhook 서명 검증
  const bodyText = await req.text();
  const isValid = await verifyWebhookSignature(req, bodyText);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Webhook 서명이 유효하지 않습니다.' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response(JSON.stringify({ error: '잘못된 요청 형식입니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const eventType = body.eventType as string;

  if (eventType === 'BILLING_DELETED') {
    const customerKey = body.customerKey as string;
    if (customerKey) {
      await serviceClient
        .from('fre_user_profiles')
        .update({
          plan: 'free',
          toss_billing_key: null,
          subscription_status: 'cancelled',
          csv_row_limit: 10000,
        })
        .eq('toss_customer_key', customerKey);
    }
  }

  if (eventType === 'PAYMENT_STATUS_CHANGED') {
    const status = body.status as string;
    const customerKey = body.customerKey as string;

    if (customerKey && status === 'CANCELED') {
      await serviceClient
        .from('fre_user_profiles')
        .update({
          subscription_status: 'past_due',
        })
        .eq('toss_customer_key', customerKey);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
