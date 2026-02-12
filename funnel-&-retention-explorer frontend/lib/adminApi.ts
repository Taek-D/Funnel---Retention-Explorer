import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!supabase || !SUPABASE_URL) throw new Error('Supabase not configured');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-api${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Admin API error: ${res.status}`);
  }
  return res.json();
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  todaySignups: number;
  mrr: number;
}

export interface AdminUser {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  role: 'user' | 'admin';
  plan: string;
  subscription_status: string;
  billing_cycle: string;
}

export interface AdminUserDetail {
  user: { id: string; email: string; last_sign_in_at: string | null; created_at: string };
  profile: Record<string, unknown>;
  billing: Array<Record<string, unknown>>;
  projects: Array<{ id: string; name: string; created_at: string }>;
}

export interface AdminBillingRecord {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  created_at: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export const fetchAdminStats = () => adminFetch<AdminStats>('/stats');

export const fetchAdminUsers = (page: number, search?: string, plan?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('search', search);
  if (plan) params.set('plan', plan);
  return adminFetch<{ users: AdminUser[]; page: number; total: number }>(`/users?${params}`);
};

export const fetchAdminUserDetail = (id: string) => adminFetch<AdminUserDetail>(`/users/${id}`);

export const updateAdminUser = (id: string, updates: Record<string, unknown>) =>
  adminFetch<{ success: boolean }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });

export const fetchAdminBilling = (page: number, status?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  return adminFetch<{ records: AdminBillingRecord[]; page: number; total: number }>(`/billing?${params}`);
};

export const fetchAdminRevenue = () => adminFetch<{ revenue: RevenueData[] }>('/revenue');
