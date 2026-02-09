-- SS-10: fre_user_profiles 스키마 확장 (retry_count, grace_period_end, cancelled_at)
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_end DATE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- SS-8: fre_billing_history 결제 내역 테이블
CREATE TABLE IF NOT EXISTS fre_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  amount INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'refunded')),
  toss_payment_key TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_history_select ON fre_billing_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY service_role_all ON fre_billing_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_billing_history_user ON fre_billing_history(user_id);
CREATE INDEX idx_billing_history_created ON fre_billing_history(created_at DESC);

-- SS-2: pg_cron + pg_net 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vault에 시크릿 저장 (실제 값은 Supabase Dashboard에서 설정)
-- SELECT vault.create_secret('process_billing_url', 'https://yidyxlwrongecctifiis.supabase.co/functions/v1/process-billing');
-- SELECT vault.create_secret('service_role_key', '<SUPABASE_SERVICE_ROLE_KEY>');

-- Cron job: 매일 00:05 KST (15:05 UTC)
SELECT cron.schedule(
  'daily-billing',
  '5 15 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'process_billing_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
