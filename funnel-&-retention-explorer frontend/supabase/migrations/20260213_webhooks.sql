-- Webhook configurations
CREATE TABLE fre_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'slack', 'discord')),
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own webhooks" ON fre_webhooks
  FOR ALL USING (auth.uid() = user_id);

-- Webhook delivery logs
CREATE TABLE fre_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES fre_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  response_code INT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own webhook logs" ON fre_webhook_logs
  FOR SELECT USING (
    webhook_id IN (SELECT id FROM fre_webhooks WHERE user_id = auth.uid())
  );

-- Index for efficient log queries
CREATE INDEX idx_webhook_logs_webhook_id ON fre_webhook_logs(webhook_id, created_at DESC);
