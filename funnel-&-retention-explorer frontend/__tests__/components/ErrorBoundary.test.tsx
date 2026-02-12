import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Mock Icons
vi.mock('../../components/Icons', () => ({
  AlertTriangle: ({ size, ...props }: { size?: number }) => <span data-testid="alert-icon" {...props}>!</span>,
}));

// Mock @sentry/react with a real ErrorBoundary implementation
vi.mock('@sentry/react', () => {
  const React = require('react');
  class MockSentryErrorBoundary extends React.Component<{
    children: React.ReactNode;
    fallback: (props: { error: Error; resetError: () => void }) => React.ReactNode;
  }, { hasError: boolean; error: Error | null }> {
    constructor(props: Record<string, unknown>) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    render() {
      if (this.state.hasError && this.state.error) {
        return (this.props as { fallback: (p: { error: Error; resetError: () => void }) => React.ReactNode }).fallback({
          error: this.state.error,
          resetError: () => this.setState({ hasError: false, error: null }),
        });
      }
      return this.props.children;
    }
  }
  return {
    ErrorBoundary: MockSentryErrorBoundary,
    captureException: vi.fn(),
  };
});

// Controllable throwing component using external flag
let shouldThrowFlag = false;
function ThrowingComponent() {
  if (shouldThrowFlag) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    shouldThrowFlag = false;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows error UI when child component throws', () => {
    shouldThrowFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Normal content')).not.toBeInTheDocument();
    expect(screen.getByText('error.title')).toBeInTheDocument();
  });

  it('displays error title heading', () => {
    shouldThrowFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('error.title')).toBeInTheDocument();
  });

  it('shows error message in pre element', () => {
    shouldThrowFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    const pre = screen.getByText('Test error message');
    expect(pre.tagName).toBe('PRE');
  });

  it('retry button resets error state', () => {
    shouldThrowFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('error.title')).toBeInTheDocument();

    // Stop throwing before clicking reset
    shouldThrowFlag = false;
    fireEvent.click(screen.getByText('error.retry'));

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('reload button calls location.reload', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    shouldThrowFlag = true;
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('error.reload'));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
