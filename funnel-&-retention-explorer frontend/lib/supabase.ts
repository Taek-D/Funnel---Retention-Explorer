import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Gracefully handle missing env vars (e.g. when VITE_ vars are not set)
// App still works in guest mode without Supabase features
export const supabase: SupabaseClient = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export const isSupabaseConfigured = !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co';
