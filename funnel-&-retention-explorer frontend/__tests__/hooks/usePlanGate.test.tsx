import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanGate } from '../../hooks/usePlanGate';
import type { UserProfile } from '../../lib/planManager';

function createProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    role: 'user' as const,
    plan: 'free',
    plan_started_at: null,
    trial_end: null,
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

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: null,
}));

describe('usePlanGate', () => {
  it('returns isPro: false when no userProfile', () => {
    mockUseAuth.mockReturnValue({ userProfile: null });
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.isPro).toBe(false);
  });

  it('returns isPro: true for pro user', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile({ plan: 'pro' }) });
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.isPro).toBe(true);
  });

  it('canUseAI reflects planManager result', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile({ ai_calls_today: 0, ai_calls_reset_at: '2025-01-01' }) });
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.canUseAI).toBe(true);
  });

  it('csvRowLimit returns free limit (10,000) for free user', () => {
    mockUseAuth.mockReturnValue({ userProfile: null });
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.csvRowLimit).toBe(10_000);
  });

  it('csvRowLimit returns pro limit (500,000) for pro user', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile({ plan: 'pro' }) });
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.csvRowLimit).toBe(500_000);
  });

  it('openUpgradeModal sets showUpgradeModal and reason', () => {
    mockUseAuth.mockReturnValue({ userProfile: null });
    const { result } = renderHook(() => usePlanGate());

    act(() => {
      result.current.openUpgradeModal('CSV row limit exceeded');
    });

    expect(result.current.showUpgradeModal).toBe(true);
    expect(result.current.upgradeReason).toBe('CSV row limit exceeded');
  });

  it('closeUpgradeModal resets showUpgradeModal and reason', () => {
    mockUseAuth.mockReturnValue({ userProfile: null });
    const { result } = renderHook(() => usePlanGate());

    act(() => {
      result.current.openUpgradeModal('test');
    });
    act(() => {
      result.current.closeUpgradeModal();
    });

    expect(result.current.showUpgradeModal).toBe(false);
    expect(result.current.upgradeReason).toBe('');
  });
});
