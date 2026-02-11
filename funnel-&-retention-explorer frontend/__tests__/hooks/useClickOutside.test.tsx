import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { fireEvent } from '@testing-library/react';

describe('useClickOutside', () => {
  it('calls handler on mousedown outside ref element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);
    const ref = { current: div };

    renderHook(() => useClickOutside(ref, handler));

    // Click outside (on document body)
    fireEvent.mouseDown(document.body);

    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(div);
  });

  it('does NOT call handler on mousedown inside ref element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);
    const ref = { current: div };

    renderHook(() => useClickOutside(ref, handler));

    // Click inside
    fireEvent.mouseDown(div);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('does NOT call handler when enabled = false', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);
    const ref = { current: div };

    renderHook(() => useClickOutside(ref, handler, false));

    fireEvent.mouseDown(document.body);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('cleans up event listener on unmount', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);
    const ref = { current: div };

    const { unmount } = renderHook(() => useClickOutside(ref, handler));
    unmount();

    fireEvent.mouseDown(document.body);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });
});
