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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Service role key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDayOfWeek = now.getUTCDay();
  const currentDayOfMonth = now.getUTCDate();

  // Query active schedules matching current hour
  const { data: schedules, error: queryError } = await supabase
    .from('fre_scheduled_reports')
    .select('*')
    .eq('active', true)
    .eq('hour_utc', currentHour);

  if (queryError) {
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Filter by frequency + day
  const dueSchedules = (schedules ?? []).filter((s: Record<string, unknown>) => {
    if (s.frequency === 'daily') return true;
    if (s.frequency === 'weekly') return s.day_of_week === currentDayOfWeek;
    if (s.frequency === 'monthly') return s.day_of_month === currentDayOfMonth;
    return false;
  });

  const results: { scheduleId: string; status: string; error?: string }[] = [];

  for (const schedule of dueSchedules) {
    try {
      // Fetch latest dataset for the user
      const { data: datasets } = await supabase
        .from('fre_datasets')
        .select('data')
        .eq('user_id', schedule.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!datasets || datasets.length === 0) {
        results.push({ scheduleId: schedule.id, status: 'skipped', error: 'No dataset found' });
        continue;
      }

      const datasetRows = datasets[0].data as Record<string, unknown>[];
      const uniqueUsers = new Set(datasetRows.map((r: Record<string, unknown>) => r.user_id ?? r.userId ?? r.uid)).size;

      // Build summary
      const freqLabel = schedule.frequency === 'daily' ? 'Daily' : schedule.frequency === 'weekly' ? 'Weekly' : 'Monthly';
      const title = `[${freqLabel}] ${schedule.name}`;
      const message = [
        `Events: ${datasetRows.length.toLocaleString()} | Users: ${uniqueUsers.toLocaleString()}`,
        `Generated: ${now.toISOString()}`,
      ].join('\n');

      // Get user's webhooks
      const webhookIds = schedule.webhook_ids as string[];
      if (webhookIds.length === 0) {
        results.push({ scheduleId: schedule.id, status: 'skipped', error: 'No webhooks configured' });
        continue;
      }

      const { data: webhooks } = await supabase
        .from('fre_webhooks')
        .select('*')
        .in('id', webhookIds)
        .eq('active', true);

      if (!webhooks || webhooks.length === 0) {
        results.push({ scheduleId: schedule.id, status: 'skipped', error: 'No active webhooks' });
        continue;
      }

      // Dispatch to each webhook via webhook-dispatch function
      for (const webhook of webhooks) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              webhookId: webhook.id,
              url: webhook.url,
              format: webhook.format,
              secret: webhook.secret,
              payload: {
                eventType: 'export',
                title,
                message,
                timestamp: now.toISOString(),
              },
            }),
          });
        } catch {
          // Log webhook dispatch failure but continue
        }
      }

      // Update last_run_at
      await supabase
        .from('fre_scheduled_reports')
        .update({ last_run_at: now.toISOString() })
        .eq('id', schedule.id);

      results.push({ scheduleId: schedule.id, status: 'sent' });
    } catch (err) {
      results.push({
        scheduleId: schedule.id,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return new Response(
    JSON.stringify({ processed: dueSchedules.length, results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
