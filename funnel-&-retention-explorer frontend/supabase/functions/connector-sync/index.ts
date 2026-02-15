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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow internal (service role) calls
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== serviceRoleKey) {
    return jsonResponse({ error: 'Service role key required' }, 403);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey,
  );

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

  // Get all active connectors with sync schedule
  const { data: connectors, error } = await supabase
    .from('fre_connectors')
    .select('*')
    .eq('is_active', true)
    .not('sync_schedule', 'is', null);

  if (error || !connectors) {
    return jsonResponse({ error: 'Failed to fetch connectors', details: error?.message }, 500);
  }

  const now = new Date();
  const results: { connectorId: string; status: string; rows?: number; error?: string }[] = [];

  for (const connector of connectors) {
    // Check if sync is due based on schedule
    const lastSync = connector.last_synced_at ? new Date(connector.last_synced_at) : null;
    const schedule = connector.sync_schedule;

    if (lastSync && !isSyncDue(lastSync, now, schedule)) {
      continue;
    }

    // Mark as running
    await supabase
      .from('fre_connectors')
      .update({ sync_status: 'running' })
      .eq('id', connector.id);

    const startTime = Date.now();
    let retries = 0;
    const maxRetries = 3;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        // Call connector-proxy with service role
        const proxyRes = await fetch(`${supabaseUrl}/functions/v1/connector-proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'fetch',
            connectorId: connector.id,
          }),
        });

        if (!proxyRes.ok) {
          const err = await proxyRes.json();
          throw new Error(err.error ?? `HTTP ${proxyRes.status}`);
        }

        const data = await proxyRes.json();
        const duration = Date.now() - startTime;

        // Log success
        await supabase.from('fre_sync_logs').insert({
          connector_id: connector.id,
          status: 'success',
          rows_fetched: data.totalRows ?? 0,
          duration_ms: duration,
        });

        // Update connector status
        await supabase
          .from('fre_connectors')
          .update({ sync_status: 'success', last_synced_at: now.toISOString() })
          .eq('id', connector.id);

        results.push({ connectorId: connector.id, status: 'success', rows: data.totalRows });
        success = true;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          const duration = Date.now() - startTime;
          const errMsg = err instanceof Error ? err.message : 'Unknown error';

          await supabase.from('fre_sync_logs').insert({
            connector_id: connector.id,
            status: 'error',
            rows_fetched: 0,
            duration_ms: duration,
            error_message: errMsg,
          });

          await supabase
            .from('fre_connectors')
            .update({ sync_status: 'error' })
            .eq('id', connector.id);

          results.push({ connectorId: connector.id, status: 'error', error: errMsg });
        }
      }
    }
  }

  return jsonResponse({ synced: results.length, results });
});

function isSyncDue(lastSync: Date, now: Date, schedule: string): boolean {
  const diff = now.getTime() - lastSync.getTime();
  const hours = diff / (1000 * 60 * 60);

  switch (schedule) {
    case 'hourly': return hours >= 1;
    case 'daily': return hours >= 24;
    case 'weekly': return hours >= 168;
    default: return false;
  }
}
