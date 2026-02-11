import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canUseAI, getAICallsRemaining, getCSVRowLimit, isPro, PLAN_LIMITS, BILLING_PRICES } from '../../lib/planManager';
import type { UserProfile } from '../../lib/planManager';

vi.mock('../../lib/supabase', () => ({
  supabase: null,
}));

function createProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    plan: 'free',
    plan_started_at: null,
    toss_customer_key: null,
    toss_billing_key: null,
    subscription_status: 'none',
    next_billing_date: null,
    ai_calls_today: 0,
    ai_calls_reset_at: '2025-01-01',
    csv_row_limit: 10_000,
    billing_cycle: 'monthly',
    retry_count: 0,
    grace_period_end: null,
    cancelled_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('PLAN_LIMITS', () => {
  it('free plan has csvRows = 10,000', () => {
    expect(PLAN_LIMITS.free.csvRows).toBe(10_000);
  });

  it('pro plan has csvRows = 500,000', () => {
    expect(PLAN_LIMITS.pro.csvRows).toBe(500_000);
  });

  it('team plan has csvRows = 1,000,000', () => {
    expect(PLAN_LIMITS.team.csvRows).toBe(1_000_000);
  });

  it('free plan has aiCallsPerDay = 3', () => {
    expect(PLAN_LIMITS.free.aiCallsPerDay).toBe(3);
  });

  it('pro plan has aiCallsPerDay = 50', () => {
    expect(PLAN_LIMITS.pro.aiCallsPerDay).toBe(50);
  });

  it('team plan has aiCallsPerDay = 200', () => {
    expect(PLAN_LIMITS.team.aiCallsPerDay).toBe(200);
  });

  it('team plan has teamMembers = 10', () => {
    expect(PLAN_LIMITS.team.teamMembers).toBe(10);
  });

  it('free and pro plans have teamMembers = 1', () => {
    expect(PLAN_LIMITS.free.teamMembers).toBe(1);
    expect(PLAN_LIMITS.pro.teamMembers).toBe(1);
  });
});

describe('BILLING_PRICES', () => {
  it('monthly = 29,000', () => {
    expect(BILLING_PRICES.monthly).toBe(29_000);
  });

  it('annual = 278,400', () => {
    expect(BILLING_PRICES.annual).toBe(278_400);
  });

  it('teamMonthly = 79,000', () => {
    expect(BILLING_PRICES.teamMonthly).toBe(79_000);
  });

  it('teamAnnual = 758,400', () => {
    expect(BILLING_PRICES.teamAnnual).toBe(758_400);
  });

  it('team annual is ~20% cheaper than monthly * 12', () => {
    const monthlyTotal = BILLING_PRICES.teamMonthly * 12;
    const discount = (monthlyTotal - BILLING_PRICES.teamAnnual) / monthlyTotal;
    expect(discount).toBeGreaterThan(0.19);
    expect(discount).toBeLessThan(0.21);
  });
});

describe('isPro', () => {
  it('returns true for plan: pro', () => {
    expect(isPro(createProfile({ plan: 'pro' }))).toBe(true);
  });

  it('returns false for plan: free', () => {
    expect(isPro(createProfile({ plan: 'free' }))).toBe(false);
  });
});

describe('getCSVRowLimit', () => {
  it('returns 10,000 for free plan', () => {
    expect(getCSVRowLimit(createProfile({ plan: 'free' }))).toBe(10_000);
  });

  it('returns 500,000 for pro plan', () => {
    expect(getCSVRowLimit(createProfile({ plan: 'pro' }))).toBe(500_000);
  });

  it('returns 1,000,000 for team plan', () => {
    expect(getCSVRowLimit(createProfile({ plan: 'team' }))).toBe(1_000_000);
  });
});

describe('canUseAI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when reset date differs from today', () => {
    const profile = createProfile({ ai_calls_reset_at: '2025-06-14', ai_calls_today: 10 });
    expect(canUseAI(profile)).toBe(true);
  });

  it('returns true when calls < limit today', () => {
    const profile = createProfile({ ai_calls_reset_at: '2025-06-15', ai_calls_today: 2 });
    expect(canUseAI(profile)).toBe(true);
  });

  it('returns false when calls >= limit today', () => {
    const profile = createProfile({ ai_calls_reset_at: '2025-06-15', ai_calls_today: 3 });
    expect(canUseAI(profile)).toBe(false);
  });
});

describe('getAICallsRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns full limit when reset date differs', () => {
    const profile = createProfile({ ai_calls_reset_at: '2025-06-14', ai_calls_today: 3 });
    expect(getAICallsRemaining(profile)).toBe(3);
  });

  it('returns remaining when same day', () => {
    const profile = createProfile({ ai_calls_reset_at: '2025-06-15', ai_calls_today: 1 });
    expect(getAICallsRemaining(profile)).toBe(2);
  });
});
