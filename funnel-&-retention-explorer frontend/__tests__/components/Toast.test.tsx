import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/Toast';

// Mock Icons
vi.mock('../../components/Icons', () => ({
  CheckCircle: (props: Record<string, unknown>) => <span data-testid="check-icon" {...props} />,
  AlertCircle: (props: Record<string, unknown>) => <span data-testid="alert-icon" {...props} />,
  AlertTriangle: (props: Record<string, unknown>) => <span data-testid="warning-icon" {...props} />,
  Info: (props: Record<string, unknown>) => <span data-testid="info-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
}));

// Test component that triggers toast
function ToastTrigger({ type, title, message }: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast(type, title, message)}>
      Trigger
    </button>
  );
}

describe('useToast', () => {
  it('throws when outside ToastProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<ToastTrigger type="success" title="Test" />);
    }).toThrow('useToast must be used within ToastProvider');
    spy.mockRestore();
  });
});

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('toast appears when toast() is called', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="success" title="Success!" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('toast shows correct title text', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="info" title="Info Title" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Info Title')).toBeInTheDocument();
  });

  it('toast shows optional message text', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="warning" title="Warning" message="Details here" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('toast auto-removes after timeout', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="success" title="Auto" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByText('Auto')).toBeInTheDocument();

    // Advance past calcTimeout + exit animation (3000 base + 200 exit)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });

  it('toast has role="alert" attribute', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="error" title="Error Toast" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('close button has aria-label="알림 닫기"', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="info" title="Close Test" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    expect(screen.getByLabelText('알림 닫기')).toBeInTheDocument();
  });

  it('container has role="status" and aria-live="polite"', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="info" title="Container Test" />
      </ToastProvider>
    );

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});

describe('calcTimeout', () => {
  // We test indirectly via toast auto-removal timing
  it('returns minimum 3000ms for short text', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger type="info" title="Hi" />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    // At 2800ms, should still be visible
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(screen.getByText('Hi')).toBeInTheDocument();

    // At 3200 + 200 exit, should be gone
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.queryByText('Hi')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('returns maximum 8000ms for long text', () => {
    vi.useFakeTimers();
    const longTitle = 'A'.repeat(200);
    render(
      <ToastProvider>
        <ToastTrigger type="info" title={longTitle} />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger').click();
    });

    // At 7800ms should still be visible
    act(() => {
      vi.advanceTimersByTime(7800);
    });
    expect(screen.getByText(longTitle)).toBeInTheDocument();

    // At 8200 + 200 exit should be gone
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
