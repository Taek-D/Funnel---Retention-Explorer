import { supabase } from './supabase';
import type { Team, TeamMember, TeamRole } from '../types';

function getSupabase() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다. 환경 변수를 확인하세요.');
  return supabase;
}

// ===== Projects =====

export interface FREProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function listProjects(): Promise<FREProject[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createProject(name: string, description?: string, teamId?: string): Promise<FREProject> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증되지 않았습니다');

  const { data, error } = await client
    .from('fre_projects')
    .insert({ name, description: description || null, user_id: user.id, team_id: teamId || null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_projects')
    .delete()
    .eq('id', projectId);

  if (error) throw new Error(error.message);
}

// ===== Datasets =====

export interface FREDataset {
  id: string;
  project_id: string;
  file_name: string;
  row_count: number | null;
  column_mapping: Record<string, string> | null;
  detected_type: string | null;
  quality_report: Record<string, unknown> | null;
  created_at: string;
}

export async function listDatasets(projectId: string): Promise<FREDataset[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_datasets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createDataset(params: {
  projectId: string;
  fileName: string;
  rowCount: number;
  columnMapping: Record<string, string>;
  detectedType: string | null;
  qualityReport: Record<string, unknown> | null;
}): Promise<FREDataset> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_datasets')
    .insert({
      project_id: params.projectId,
      file_name: params.fileName,
      row_count: params.rowCount,
      column_mapping: params.columnMapping,
      detected_type: params.detectedType,
      quality_report: params.qualityReport,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ===== Analysis Snapshots =====

export interface FRESnapshot {
  id: string;
  dataset_id: string;
  snapshot_type: string;
  config: Record<string, unknown> | null;
  results: Record<string, unknown> | null;
  created_at: string;
  share_token?: string | null;
  is_shared?: boolean;
  dataset_name?: string;
}

export async function listSnapshots(datasetId: string): Promise<FRESnapshot[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_analysis_snapshots')
    .select('*')
    .eq('dataset_id', datasetId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function listAllSnapshots(): Promise<(FRESnapshot & { dataset_name?: string })[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_analysis_snapshots')
    .select('*, fre_datasets!inner(file_name)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data || []).map((row: Record<string, unknown>) => {
    const datasets = row.fre_datasets as { file_name: string } | null;
    return {
      id: row.id as string,
      dataset_id: row.dataset_id as string,
      snapshot_type: row.snapshot_type as string,
      config: row.config as Record<string, unknown> | null,
      results: row.results as Record<string, unknown> | null,
      created_at: row.created_at as string,
      share_token: row.share_token as string | null | undefined,
      is_shared: row.is_shared as boolean | undefined,
      dataset_name: datasets?.file_name || undefined,
    };
  });
}

export async function deleteSnapshot(snapshotId: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_analysis_snapshots')
    .delete()
    .eq('id', snapshotId);

  if (error) throw new Error(error.message);
}

export async function saveSnapshot(params: {
  datasetId: string;
  snapshotType: string;
  config: Record<string, unknown>;
  results: Record<string, unknown>;
}): Promise<FRESnapshot> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_analysis_snapshots')
    .insert({
      dataset_id: params.datasetId,
      snapshot_type: params.snapshotType,
      config: params.config,
      results: params.results,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function shareSnapshot(snapshotId: string): Promise<string> {
  const client = getSupabase();
  const shareToken = crypto.randomUUID();

  const { error } = await client
    .from('fre_analysis_snapshots')
    .update({ share_token: shareToken, is_shared: true })
    .eq('id', snapshotId);

  if (error) throw new Error(error.message);
  return shareToken;
}

export async function getSharedSnapshot(shareToken: string): Promise<FRESnapshot | null> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_analysis_snapshots')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_shared', true)
    .single();

  if (error) return null;
  return data;
}

// ===== Notifications =====

export type NotificationDbType = 'analysis' | 'import' | 'ai' | 'export';

export interface FRENotification {
  id: string;
  user_id: string;
  type: NotificationDbType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function listNotifications(limit = 50): Promise<FRENotification[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function insertNotification(params: {
  type: NotificationDbType;
  title: string;
  message: string;
}): Promise<FRENotification> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증되지 않았습니다');

  const { data, error } = await client
    .from('fre_notifications')
    .insert({
      user_id: user.id,
      type: params.type,
      title: params.title,
      message: params.message,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(): Promise<void> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const { error } = await client
    .from('fre_notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) throw new Error(error.message);
}

export async function deleteNotificationDb(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_notifications')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function clearAllNotifications(): Promise<void> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const { error } = await client
    .from('fre_notifications')
    .delete()
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

// ===== Webhooks =====

import type { WebhookConfig, WebhookLog, WebhookEventType, WebhookFormat } from '../types';

export async function listWebhooks(): Promise<WebhookConfig[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_webhooks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createWebhook(params: {
  name: string; url: string; events: WebhookEventType[]; format: WebhookFormat;
}): Promise<WebhookConfig> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const secret = crypto.randomUUID();
  const { data, error } = await client
    .from('fre_webhooks')
    .insert({ user_id: user.id, ...params, secret })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateWebhook(id: string, params: Partial<{
  name: string; url: string; events: WebhookEventType[]; format: WebhookFormat; active: boolean;
}>): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_webhooks')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteWebhook(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_webhooks')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listWebhookLogs(webhookId: string, limit = 20): Promise<WebhookLog[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_webhook_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

// ===== Teams =====

export async function createTeam(name: string): Promise<Team> {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증되지 않았습니다');

  const { data: team, error: teamErr } = await client
    .from('fre_teams')
    .insert({ name, owner_id: user.id })
    .select()
    .single();
  if (teamErr) throw new Error(teamErr.message);

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

  let team = ownedTeam;
  if (!team) {
    // Check as member
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

export async function inviteTeamMember(
  teamId: string,
  email: string,
  role: TeamRole = 'member'
): Promise<TeamMember> {
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

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  role: TeamRole
): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_team_members')
    .update({ role })
    .eq('id', memberId)
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
}
