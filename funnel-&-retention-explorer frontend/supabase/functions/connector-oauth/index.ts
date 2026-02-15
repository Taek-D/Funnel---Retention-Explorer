import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? 'https://fre-analytics-castletaek9643-9522s-projects.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function redirectResponse(url: string) {
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: url },
  });
}

// ===== HMAC State Signing =====
async function signState(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

async function verifyState(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await signState(data, secret);
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/connector-oauth\/?/, '');

  // POST /connector-oauth/start — initiate OAuth flow
  if (req.method === 'POST' && (path === 'start' || path === '')) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid authentication' }, 401);
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return jsonResponse({ error: 'Google OAuth not configured' }, 500);
    }

    // Generate HMAC-signed state token to prevent forgery
    const stateSecret = Deno.env.get('OAUTH_STATE_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const statePayload = JSON.stringify({ userId: user.id, ts: Date.now() });
    const stateSignature = await signState(statePayload, stateSecret);
    const state = btoa(JSON.stringify({ d: statePayload, s: stateSignature }));

    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return jsonResponse({ authUrl: authUrl.toString() });
  }

  // GET /connector-oauth/callback — handle OAuth callback from Google
  if (req.method === 'GET' && path === 'callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const frontendUrl = Deno.env.get('FRONTEND_URL') ?? 'https://fre-analytics.vercel.app';

    if (error) {
      return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=missing_params`);
    }

    // Decode and verify HMAC-signed state to get user ID
    let stateData: { userId: string; ts: number };
    try {
      const decoded = JSON.parse(atob(state));
      const stateSecret = Deno.env.get('OAUTH_STATE_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const isValid = await verifyState(decoded.d, decoded.s, stateSecret);
      if (!isValid) {
        return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=invalid_state_signature`);
      }
      stateData = JSON.parse(decoded.d);
      // Reject state tokens older than 10 minutes
      if (Date.now() - stateData.ts > 10 * 60 * 1000) {
        return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=state_expired`);
      }
    } catch {
      return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=invalid_state`);
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') ?? '';

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();

    // Create connector in DB with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: connector, error: insertError } = await supabaseAdmin
      .from('fre_connectors')
      .insert({
        user_id: stateData.userId,
        type: 'ga4-api',
        name: 'Google Analytics 4',
        config: {
          type: 'ga4-api',
          propertyId: '',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isConnected: true,
        },
      })
      .select('id')
      .single();

    if (insertError || !connector) {
      return redirectResponse(`${frontendUrl}/app/connectors?oauth=error&message=save_failed`);
    }

    return redirectResponse(`${frontendUrl}/app/connectors?oauth=success&connectorId=${connector.id}`);
  }

  return jsonResponse({ error: 'Not found' }, 404);
});
