-- Custom Events table for user-defined event aliases, groups, and conditional events
CREATE TABLE IF NOT EXISTS fre_custom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('alias', 'group', 'conditional')),
  definition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fre_custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own custom events"
  ON fre_custom_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom events"
  ON fre_custom_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom events"
  ON fre_custom_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom events"
  ON fre_custom_events FOR DELETE
  USING (auth.uid() = user_id);
