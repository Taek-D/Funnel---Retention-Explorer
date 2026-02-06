import { supabase } from './supabase';

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
  const { data, error } = await supabase
    .from('fre_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createProject(name: string, description?: string): Promise<FREProject> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('fre_projects')
    .insert({ name, description: description || null, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
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
  quality_report: Record<string, any> | null;
  created_at: string;
}

export async function listDatasets(projectId: string): Promise<FREDataset[]> {
  const { data, error } = await supabase
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
  qualityReport: Record<string, any> | null;
}): Promise<FREDataset> {
  const { data, error } = await supabase
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
  config: Record<string, any> | null;
  results: Record<string, any> | null;
  created_at: string;
}

export async function listSnapshots(datasetId: string): Promise<FRESnapshot[]> {
  const { data, error } = await supabase
    .from('fre_analysis_snapshots')
    .select('*')
    .eq('dataset_id', datasetId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveSnapshot(params: {
  datasetId: string;
  snapshotType: string;
  config: Record<string, any>;
  results: Record<string, any>;
}): Promise<FRESnapshot> {
  const { data, error } = await supabase
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
