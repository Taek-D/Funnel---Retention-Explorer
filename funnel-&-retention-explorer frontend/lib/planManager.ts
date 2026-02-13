import { supabase } from './supabase';

// ===== Plan & Subscription Types =====

export type PlanType = 'free' | 'pro' | 'team';
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'past_due';
export type BillingCycle = 'monthly' | 'annual';

export interface UserProfile {
  id: string;
  role: 'user' | 'admin';
  plan: PlanType;
  plan_started_at: string | null;
  toss_customer_key: string | null;
  toss_billing_key: string | null;
  subscription_status: SubscriptionStatus;
  next_billing_date: string | null;
  ai_calls_today: number;
  ai_calls_reset_at: string;
  csv_row_limit: number;
  billing_cycle: BillingCycle;
  retry_count: number;
  grace_period_end: string | null;
  cancelled_at: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Billing Constants =====

export const BILLING_PRICES = {
  monthly: 29_000,
  annual: 278_400,
  teamMonthly: 79_000,
  teamAnnual: 758_400,
} as const;

export const BILLING_INTERVALS = {
  monthly: 30,
  annual: 365,
} as const;

// ===== Plan Limits =====

export const PLAN_LIMITS = {
  free: { csvRows: 10_000, aiCallsPerDay: 3, projects: 1, savedAnalyses: 5, teamMembers: 1 },
  pro: { csvRows: 500_000, aiCallsPerDay: 50, projects: -1, savedAnalyses: -1, teamMembers: 1 },
  team: { csvRows: 1_000_000, aiCallsPerDay: 200, projects: -1, savedAnalyses: -1, teamMembers: 10 },
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

export function isAdmin(profile: UserProfile): boolean {
  return profile.role === 'admin';
}

export function isTrialing(profile: UserProfile): boolean {
  if (profile.plan !== 'pro' || !profile.trial_end) return false;
  return new Date(profile.trial_end) > new Date();
}

export function getTrialDaysRemaining(profile: UserProfile): number {
  if (!profile.trial_end) return 0;
  const diff = new Date(profile.trial_end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function hasUsedTrial(profile: UserProfile): boolean {
  return profile.trial_end != null;
}

export function getAIUsagePercent(profile: UserProfile): number {
  const today = new Date().toISOString().slice(0, 10);
  const resetDate = profile.ai_calls_reset_at?.slice(0, 10);
  const limit = PLAN_LIMITS[profile.plan].aiCallsPerDay;
  if (resetDate !== today) return 0;
  return Math.min(100, Math.round((profile.ai_calls_today / limit) * 100));
}

export async function startTrial(accessToken: string): Promise<{
  success: boolean;
  message: string;
  trial_end?: string;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return { success: false, message: '서비스가 설정되지 않았습니다.' };
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/start-trial`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return await res.json();
  } catch {
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

// ===== Subscription Management =====

export async function cancelSubscription(accessToken: string): Promise<{
  success: boolean;
  message: string;
  next_billing_date?: string;
  error?: string;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return { success: false, message: '서비스가 설정되지 않았습니다.' };
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/cancel-subscription`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return await res.json();
  } catch {
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

// ===== Billing Key & Plan Switch =====

export async function changeBillingKey(accessToken: string, authKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return { success: false, message: '서비스가 설정되지 않았습니다.' };
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/change-billing-key`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authKey }),
    });
    return await res.json();
  } catch {
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

export async function switchPlan(accessToken: string, targetCycle: BillingCycle): Promise<{
  success: boolean;
  message: string;
  billingCycle?: BillingCycle;
  nextBillingDate?: string;
  charged?: number;
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return { success: false, message: '서비스가 설정되지 않았습니다.' };
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/switch-plan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetCycle }),
    });
    return await res.json();
  } catch {
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

export type BillingRecord = {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  toss_payment_key: string | null;
  failure_reason: string | null;
  created_at: string;
};

export async function fetchBillingHistory(userId: string): Promise<BillingRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('fre_billing_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as BillingRecord[];
}
