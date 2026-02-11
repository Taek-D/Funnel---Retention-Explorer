import { vi } from 'vitest';

// Supabase client mock
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
};

// Mock Supabase module
export function mockSupabaseModule() {
  vi.mock('../../lib/supabase', () => ({
    supabase: mockSupabase,
  }));
}

// Mock AuthContext
export function createMockAuthContext(overrides = {}) {
  return {
    user: null,
    session: null,
    userProfile: null,
    loading: false,
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

// Mock analytics (no-op)
export function mockAnalytics() {
  vi.mock('../../lib/analytics', () => ({
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
  }));
}

// Mock Sentry (no-op)
export function mockSentry() {
  vi.mock('../../lib/sentry', () => ({
    Sentry: {
      captureException: vi.fn(),
      init: vi.fn(),
    },
  }));
}

// localStorage mock helper
export function createMockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
}
