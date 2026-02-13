import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanBadge } from '../../components/PlanBadge';
import type { UserProfile } from '../../lib/planManager';

// Mock Icons
vi.mock('../../components/Icons', () => ({
  Zap: ({ size, ...props }: { size?: number }) => <span data-testid="zap-icon" {...props}>Zap</span>,
}));

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function createProfile(plan: 'free' | 'pro'): UserProfile {
  return {
    id: 'user-1',
    role: 'user' as const,
    plan,
    plan_started_at: null,
    trial_end: null,
    toss_customer_key: null,
    toss_billing_key: null,
    subscription_status: 'none',
    next_billing_date: null,
    ai_calls_today: 0,
    ai_calls_reset_at: '2025-01-01',
    csv_row_limit: plan === 'pro' ? 500_000 : 10_000,
    billing_cycle: 'monthly',
    retry_count: 0,
    grace_period_end: null,
    cancelled_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };
}

describe('PlanBadge', () => {
  it('renders pro plan text for pro plan user', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile('pro') });
    render(<PlanBadge />);
    expect(screen.getByText('plan.pro')).toBeInTheDocument();
  });

  it('renders Zap icon for pro plan', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile('pro') });
    render(<PlanBadge />);
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });

  it('renders free plan text for free plan user', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile('free') });
    render(<PlanBadge />);
    expect(screen.getByText('plan.free')).toBeInTheDocument();
  });

  it('renders upgrade text for free plan', () => {
    mockUseAuth.mockReturnValue({ userProfile: createProfile('free') });
    render(<PlanBadge />);
    expect(screen.getByText('plan.upgrade')).toBeInTheDocument();
  });

  it('renders free plan when userProfile is null', () => {
    mockUseAuth.mockReturnValue({ userProfile: null });
    render(<PlanBadge />);
    expect(screen.getByText('plan.free')).toBeInTheDocument();
  });
});
