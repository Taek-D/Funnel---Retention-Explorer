-- FRE Analytics SaaS Database Schema
-- Apply this migration to Supabase project: yidyxlwrongecctifiis

-- Projects table
CREATE TABLE IF NOT EXISTS fre_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Datasets table
CREATE TABLE IF NOT EXISTS fre_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES fre_projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  row_count INT,
  column_mapping JSONB,
  detected_type TEXT,
  quality_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analysis snapshots table
CREATE TABLE IF NOT EXISTS fre_analysis_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES fre_datasets(id) ON DELETE CASCADE NOT NULL,
  snapshot_type TEXT NOT NULL,
  config JSONB,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE fre_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE fre_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fre_analysis_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "own_projects" ON fre_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_datasets" ON fre_datasets
  FOR ALL USING (
    project_id IN (SELECT id FROM fre_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "own_snapshots" ON fre_analysis_snapshots
  FOR ALL USING (
    dataset_id IN (
      SELECT d.id FROM fre_datasets d
      JOIN fre_projects p ON d.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Auto-update updated_at on fre_projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fre_projects_updated_at
  BEFORE UPDATE ON fre_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
