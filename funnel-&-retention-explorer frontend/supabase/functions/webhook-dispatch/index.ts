import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  eventType: string;
  title: string;
  message: string;
  timestamp: string;
}

function formatPayload(payload: WebhookPayload, format: string): Record<string, unknown> {
  switch (format) {
    case 'slack':
      return {
        text: `*${payload.title}*\n${payload.message}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: payload.title } },
          { type: 'section', text: { type: 'mrkdwn', text: payload.message } },
          { type: 'context', elements: [
            { type: 'mrkdwn', text: `_${payload.eventType}_ | ${payload.timestamp}` },
          ]},
        ],
      };
    case 'discord':
      return {
        embeds: [{
          title: payload.title,
          description: payload.message,
          color: 0x6366F1,
          footer: { text: `${payload.eventType} | FRE Analytics` },
          timestamp: payload.timestamp,
        }],
      };
    default:
      return payload;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: {
    webhookId?: string;
    url: string;
    format?: string;
    secret?: string;
    payload: WebhookPayload;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { webhookId, url, format, secret, payload } = body;

  if (!url || !payload) {
    return new Response(JSON.stringify({ error: 'Missing url or payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const formattedPayload = formatPayload(payload, format ?? 'json');

  let responseCode = 0;
  let status: 'success' | 'failed' = 'failed';
  let errorMessage: string | null = null;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(formattedPayload),
    });

    responseCode = res.status;
    status = res.ok ? 'success' : 'failed';
    if (!res.ok) {
      errorMessage = `HTTP ${res.status}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Network error';
  }

  // Log to fre_webhook_logs
  if (webhookId) {
    try {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await serviceClient.from('fre_webhook_logs').insert({
        webhook_id: webhookId,
        event_type: payload.eventType ?? 'unknown',
        status,
        response_code: responseCode || null,
        error_message: errorMessage,
      });
    } catch {
      // Logging failure should not block response
    }
  }

  return new Response(
    JSON.stringify({ success: status === 'success', status, responseCode, errorMessage }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
