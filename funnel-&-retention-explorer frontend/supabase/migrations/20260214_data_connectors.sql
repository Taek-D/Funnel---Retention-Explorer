-- DCP-3: Data Connector Pro - Connector configuration table
CREATE TABLE fre_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('ga4-api', 'mixpanel-api', 'postgresql', 'mysql')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  sync_schedule TEXT CHECK (sync_schedule IN ('hourly', 'daily', 'weekly')),
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'running', 'success', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DCP-4: Sync history log table
CREATE TABLE fre_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES fre_connectors(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  rows_fetched INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fre_connectors_user ON fre_connectors(user_id);
CREATE INDEX idx_fre_connectors_active ON fre_connectors(is_active) WHERE is_active = true;
CREATE INDEX idx_fre_sync_logs_connector ON fre_sync_logs(connector_id);
CREATE INDEX idx_fre_sync_logs_created ON fre_sync_logs(created_at DESC);

-- RLS Policies
ALTER TABLE fre_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fre_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connectors" ON fre_connectors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own sync logs" ON fre_sync_logs
  FOR SELECT USING (
    connector_id IN (SELECT id FROM fre_connectors WHERE user_id = auth.uid())
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_fre_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fre_connectors_updated
  BEFORE UPDATE ON fre_connectors
  FOR EACH ROW EXECUTE FUNCTION update_fre_connectors_updated_at();
