import type { WebhookConfig, WebhookEventType } from '../types';
import { listWebhooks } from './supabaseData';

let cachedWebhooks: WebhookConfig[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function invalidateWebhookCache(): void {
  cachedWebhooks = null;
  cacheTime = 0;
}

async function getActiveWebhooks(): Promise<WebhookConfig[]> {
  if (cachedWebhooks && Date.now() - cacheTime < CACHE_TTL) {
    return cachedWebhooks;
  }
  try {
    cachedWebhooks = await listWebhooks();
    cacheTime = Date.now();
    return cachedWebhooks;
  } catch {
    return [];
  }
}

export async function dispatchWebhooks(
  eventType: WebhookEventType,
  title: string,
  message: string
): Promise<void> {
  const webhooks = await getActiveWebhooks();
  const matching = webhooks.filter(w => w.active && w.events.includes(eventType));
  if (matching.length === 0) return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return;

  const payload = { eventType, title, message, timestamp: new Date().toISOString() };

  for (const webhook of matching) {
    fetch(`${supabaseUrl}/functions/v1/webhook-dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookId: webhook.id,
        url: webhook.url,
        format: webhook.format,
        secret: webhook.secret,
        payload,
      }),
    }).catch(() => { /* silently fail — don't block UI */ });
  }
}
