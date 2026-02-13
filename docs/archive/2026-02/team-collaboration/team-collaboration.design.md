# Team Collaboration — Design

> **Feature**: team-collaboration
> **Plan**: [team-collaboration.plan.md](../../01-plan/features/team-collaboration.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
TeamPage.tsx
  └─ useTeam() hook (new)
       ├─ reads team & members from Supabase
       ├─ provides create / invite / remove / role change actions
       └─ loading & error states

Supabase Tables (new):
  fre_teams (id, name, owner_id, created_at, updated_at)
  fre_team_members (id, team_id, user_id, email, role, status, invited_at, joined_at)

lib/supabaseData.ts
  └─ Team CRUD functions (createTeam, getMyTeam, inviteTeamMember, etc.)

types/index.ts
  └─ TeamRole, TeamMemberStatus, TeamMember, Team types
```

## 2. Implementation Tasks

### TC-1: Database Schema & RLS

**Migration SQL**:

```sql
-- fre_teams table
CREATE TABLE fre_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- fre_team_members table
CREATE TABLE fre_team_members (
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
CREATE INDEX idx_fre_team_members_team_id ON fre_team_members(team_id);
CREATE INDEX idx_fre_team_members_user_id ON fre_team_members(user_id);
CREATE INDEX idx_fre_team_members_email ON fre_team_members(email);
CREATE INDEX idx_fre_teams_owner_id ON fre_teams(owner_id);

-- RLS for fre_teams
ALTER TABLE fre_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owner can manage" ON fre_teams
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Team members can view" ON fre_teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM fre_team_members
      WHERE (user_id = auth.uid() OR email = auth.email())
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
    (user_id = auth.uid() OR email = auth.email())
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
```

### TC-2: TypeScript Types (`types/index.ts`)

Add after existing Plan & Subscription section:

```typescript
// ===== Team =====

export type TeamRole = 'admin' | 'member' | 'viewer';
export type TeamMemberStatus = 'pending' | 'active' | 'removed';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invited_at: string;
  joined_at: string | null;
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
```

Remove local types from `TeamPage.tsx`: `TeamRole`, `TeamMember`, `TeamData`.

### TC-3: Supabase CRUD Functions (`lib/supabaseData.ts`)

Add to end of file under `// ===== Teams =====` section:

```typescript
// ===== Teams =====

export async function createTeam(name: string): Promise<Team> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증되지 않았습니다');

  // Create team
  const { data: team, error: teamErr } = await client
    .from('fre_teams')
    .insert({ name, owner_id: user.id })
    .select()
    .single();
  if (teamErr) throw new Error(teamErr.message);

  // Add owner as admin member
  const { error: memberErr } = await client
    .from('fre_team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      email: user.email!,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
    });
  if (memberErr) throw new Error(memberErr.message);

  return team;
}

export async function getMyTeam(): Promise<{ team: Team; members: TeamMember[] } | null> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  // Check as owner first
  const { data: ownedTeam } = await client
    .from('fre_teams')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  // Check as member if not owner
  let team = ownedTeam;
  if (!team) {
    const { data: membership } = await client
      .from('fre_team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) return null;

    const { data: memberTeam } = await client
      .from('fre_teams')
      .select('*')
      .eq('id', membership.team_id)
      .single();

    team = memberTeam;
  }

  if (!team) return null;

  // Get members
  const { data: members, error: membersErr } = await client
    .from('fre_team_members')
    .select('*')
    .eq('team_id', team.id)
    .in('status', ['pending', 'active'])
    .order('invited_at', { ascending: true });

  if (membersErr) throw new Error(membersErr.message);

  return { team, members: members || [] };
}

export async function updateTeamName(teamId: string, name: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_teams')
    .update({ name })
    .eq('id', teamId);
  if (error) throw new Error(error.message);
}

export async function inviteTeamMember(teamId: string, email: string, role: TeamRole = 'member'): Promise<TeamMember> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_team_members')
    .insert({ team_id: teamId, email, role, status: 'pending' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_team_members')
    .update({ status: 'removed' })
    .eq('id', memberId)
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
}

export async function updateMemberRole(teamId: string, memberId: string, role: TeamRole): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_team_members')
    .update({ role })
    .eq('id', memberId)
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
}
```

Import `Team`, `TeamMember`, `TeamRole` from `../types/index` at top of file.

### TC-4: TeamPage Supabase Integration (`pages/TeamPage.tsx`)

**Key changes**:

1. Remove `STORAGE_KEY`, `loadTeamData`, `saveTeamData`, local types
2. Import types from `../types`
3. Import CRUD from `../lib/supabaseData`
4. Add loading/error states
5. Add team creation flow (if no team exists)

```typescript
import { useState, useCallback, useEffect } from 'react';
import { Team, TeamMember, TeamRole } from '../types';
import {
  createTeam, getMyTeam, updateTeamName,
  inviteTeamMember, removeTeamMember, updateMemberRole
} from '../lib/supabaseData';

export const TeamPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const isTeamPlan = userProfile?.plan === 'team';

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);

  // Load team data on mount
  useEffect(() => {
    if (!isTeamPlan) { setLoading(false); return; }
    loadTeam();
  }, [isTeamPlan]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMyTeam();
      if (result) {
        setTeam(result.team);
        setMembers(result.members);
        setTeamName(result.team.name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '팀 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => { /* createTeam() + loadTeam() */ };
  const handleInvite = async () => { /* inviteTeamMember() + loadTeam() */ };
  const handleRemove = async (memberId: string) => { /* removeTeamMember() + update state */ };
  const handleRoleChange = async (memberId: string, role: TeamRole) => { /* updateMemberRole() + update state */ };
  const handleSaveTeamName = async () => { /* updateTeamName() */ };

  // ... render logic (keep existing UI structure, add loading/error states)
};
```

**UI States**:

| State | Display |
|-------|---------|
| `!isTeamPlan` | Upgrade CTA (existing) |
| `loading` | Skeleton loader |
| `error` | Error message + retry button |
| `!team` | Team creation form (name input + create button) |
| `team + members` | Full team management UI (existing layout) |

### TC-5: Team-scoped Project Sharing

**Migration SQL**:

```sql
ALTER TABLE fre_projects ADD COLUMN team_id UUID REFERENCES fre_teams(id) ON DELETE SET NULL;
CREATE INDEX idx_fre_projects_team_id ON fre_projects(team_id);

-- Update RLS: user can see own projects + team projects
CREATE POLICY "Team members can view team projects" ON fre_projects
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM fre_team_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

**Code changes**:
- `listProjects()` already returns all accessible projects (RLS handles filtering)
- `createProject()` add optional `teamId` parameter
- ProjectsPage: show team badge on shared projects

## 3. Dependencies

- **New npm**: None
- **New Supabase migrations**: 2 (tables + project team_id column)
- **Existing**: useAuth, supabaseData patterns, i18n

## 4. Implementation Order

1. TC-2: Types (foundation, no side effects)
2. TC-1: Database migration (tables + RLS)
3. TC-3: CRUD functions in supabaseData.ts
4. TC-4: TeamPage refactor (localStorage → Supabase)
5. TC-5: Team-scoped projects (additive, non-breaking)

## 5. Verification Checklist

- [ ] TC-1: fre_teams, fre_team_members tables created with RLS
- [ ] TC-2: TeamRole, TeamMemberStatus, TeamMember, Team exported from types/index.ts
- [ ] TC-2: TeamPage.tsx local types removed, imports from types/index
- [ ] TC-3: createTeam, getMyTeam, updateTeamName, inviteTeamMember, removeTeamMember, updateMemberRole in supabaseData.ts
- [ ] TC-4: localStorage logic removed from TeamPage.tsx
- [ ] TC-4: Loading, error, empty (no team) states in TeamPage
- [ ] TC-4: Team creation flow works
- [ ] TC-4: Invite, remove, role change integrated with Supabase
- [ ] TC-5: fre_projects.team_id column added
- [ ] TC-5: Team projects visible to team members via RLS
