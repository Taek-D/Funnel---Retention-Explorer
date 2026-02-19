import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlanGate } from '../../hooks/usePlanGate';

describe('usePlanGate (all features unlocked)', () => {
  it('returns isPro: true', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.isPro).toBe(true);
  });

  it('returns canUseAI: true', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.canUseAI).toBe(true);
  });

  it('returns unlimited csvRowLimit', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.csvRowLimit).toBe(1_000_000);
  });

  it('returns unlimited connectorLimit', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.connectorLimit).toBe(999);
  });

  it('returns hourly maxSyncSchedule', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.maxSyncSchedule).toBe('hourly');
  });

  it('canUseConnector always returns true', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.canUseConnector('ga4-api')).toBe(true);
    expect(result.current.canUseConnector('postgresql')).toBe(true);
    expect(result.current.canUseConnector('csv')).toBe(true);
  });

  it('showUpgradeModal is always false', () => {
    const { result } = renderHook(() => usePlanGate());
    expect(result.current.showUpgradeModal).toBe(false);
  });
});
