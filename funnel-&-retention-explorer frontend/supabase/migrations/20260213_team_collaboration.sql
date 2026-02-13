-- Team Collaboration: fre_teams + fre_team_members tables

-- fre_teams table
CREATE TABLE IF NOT EXISTS fre_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- fre_team_members table
CREATE TABLE IF NOT EXISTS fre_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES fre_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fre_team_members_team_id ON fre_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_fre_team_members_user_id ON fre_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_fre_team_members_email ON fre_team_members(email);
CREATE INDEX IF NOT EXISTS idx_fre_teams_owner_id ON fre_teams(owner_id);

-- RLS for fre_teams
ALTER TABLE fre_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owner can manage" ON fre_teams
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Team members can view" ON fre_teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM fre_team_members
      WHERE (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND status = 'active'
    )
  );

-- RLS for fre_team_members
ALTER TABLE fre_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team admins can manage members" ON fre_team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM fre_teams WHERE owner_id = auth.uid()
    )
    OR
    team_id IN (
      SELECT team_id FROM fre_team_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Members can view own team" ON fre_team_members
  FOR SELECT USING (
    (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status IN ('pending', 'active')
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_fre_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fre_teams_updated_at
  BEFORE UPDATE ON fre_teams
  FOR EACH ROW EXECUTE FUNCTION update_fre_teams_updated_at();

-- TC-5: Add team_id to fre_projects for team-scoped sharing
ALTER TABLE fre_projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES fre_teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fre_projects_team_id ON fre_projects(team_id);

-- RLS: team members can view team projects
CREATE POLICY "Team members can view team projects" ON fre_projects
  FOR SELECT USING (
    team_id IS NOT NULL AND team_id IN (
      SELECT team_id FROM fre_team_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
