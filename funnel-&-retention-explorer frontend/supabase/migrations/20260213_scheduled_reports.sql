-- Scheduled Reports table
CREATE TABLE IF NOT EXISTS fre_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  hour_utc INTEGER NOT NULL DEFAULT 9 CHECK (hour_utc BETWEEN 0 AND 23),
  webhook_ids UUID[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE fre_scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scheduled reports"
  ON fre_scheduled_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled reports"
  ON fre_scheduled_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled reports"
  ON fre_scheduled_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled reports"
  ON fre_scheduled_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Service role access for cron Edge Function
CREATE POLICY "Service role can read all schedules"
  ON fre_scheduled_reports FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update schedules"
  ON fre_scheduled_reports FOR UPDATE
  TO service_role
  USING (true);
