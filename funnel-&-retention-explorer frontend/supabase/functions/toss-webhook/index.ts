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

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
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
    const paymentKey = body.paymentKey as string;
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
