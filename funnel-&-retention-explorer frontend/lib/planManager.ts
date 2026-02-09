import { supabase } from './supabase';

// ===== Plan & Subscription Types =====

export type PlanType = 'free' | 'pro';
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'past_due';

export interface UserProfile {
  id: string;
  plan: PlanType;
  plan_started_at: string | null;
  toss_customer_key: string | null;
  toss_billing_key: string | null;
  subscription_status: SubscriptionStatus;
  next_billing_date: string | null;
  ai_calls_today: number;
  ai_calls_reset_at: string;
  csv_row_limit: number;
  created_at: string;
  updated_at: string;
}

// ===== Plan Limits =====

export const PLAN_LIMITS = {
  free: { csvRows: 10_000, aiCallsPerDay: 3, projects: 1, savedAnalyses: 5 },
  pro: { csvRows: 500_000, aiCallsPerDay: 50, projects: -1, savedAnalyses: -1 },
} as const;

// ===== Profile Functions =====

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('fre_user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as UserProfile;
}

export async function upsertUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('fre_user_profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select('*')
    .single();
  if (error || !data) return null;
  return data as UserProfile;
}

// ===== Plan Gate Utilities =====

export function canUseAI(profile: UserProfile): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const resetDate = profile.ai_calls_reset_at?.slice(0, 10);
  if (resetDate !== today) {
    return true;
  }
  const limit = PLAN_LIMITS[profile.plan].aiCallsPerDay;
  return profile.ai_calls_today < limit;
}

export function getAICallsRemaining(profile: UserProfile): number {
  const today = new Date().toISOString().slice(0, 10);
  const resetDate = profile.ai_calls_reset_at?.slice(0, 10);
  const limit = PLAN_LIMITS[profile.plan].aiCallsPerDay;
  if (resetDate !== today) {
    return limit;
  }
  return Math.max(0, limit - profile.ai_calls_today);
}

export async function incrementAIUsage(userId: string): Promise<void> {
  if (!supabase) return;
  const profile = await fetchUserProfile(userId);
  if (!profile) return;

  const today = new Date().toISOString().slice(0, 10);
  const resetDate = profile.ai_calls_reset_at?.slice(0, 10);

  if (resetDate !== today) {
    await supabase
      .from('fre_user_profiles')
      .update({ ai_calls_today: 1, ai_calls_reset_at: today })
      .eq('id', userId);
  } else {
    await supabase
      .from('fre_user_profiles')
      .update({ ai_calls_today: profile.ai_calls_today + 1 })
      .eq('id', userId);
  }
}

export function getCSVRowLimit(profile: UserProfile): number {
  return PLAN_LIMITS[profile.plan].csvRows;
}

export function isPro(profile: UserProfile): boolean {
  return profile.plan === 'pro';
}
