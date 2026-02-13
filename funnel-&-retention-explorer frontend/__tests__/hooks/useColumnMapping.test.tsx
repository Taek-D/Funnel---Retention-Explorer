import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnMapping } from '../../hooks/useColumnMapping';
import { AppProvider } from '../../context/AppContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('useColumnMapping', () => {
  it('returns initial mapping from AppContext state', () => {
    const { result } = renderHook(() => useColumnMapping(), { wrapper });
    expect(result.current.mapping).toEqual({});
  });

  it('updateMapping updates specific field', () => {
    const { result } = renderHook(() => useColumnMapping(), { wrapper });

    act(() => {
      result.current.updateMapping('userid', 'user_id_col');
    });

    expect(result.current.mapping.userid).toBe('user_id_col');
  });

  it('updateMapping with empty string sets undefined', () => {
    const { result } = renderHook(() => useColumnMapping(), { wrapper });

    act(() => {
      result.current.updateMapping('userid', 'some_col');
    });
    act(() => {
      result.current.updateMapping('userid', '');
    });

    expect(result.current.mapping.userid).toBeUndefined();
  });

  it('returns headers from state', () => {
    const { result } = renderHook(() => useColumnMapping(), { wrapper });
    expect(result.current.headers).toEqual([]);
  });

  it('returns rawData from state', () => {
    const { result } = renderHook(() => useColumnMapping(), { wrapper });
    expect(result.current.rawData).toEqual([]);
  });
});
