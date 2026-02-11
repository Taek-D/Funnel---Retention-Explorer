import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/Modal';

// Mock Icons
vi.mock('../../components/Icons', () => ({
  X: ({ size, ...props }: { size?: number }) => <span data-testid="x-icon" {...props}>X</span>,
}));

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content here</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content here')).toBeInTheDocument();
  });

  it('calls onClose after Escape key press', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Esc Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    // onClose is called after 200ms animation delay
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('calls onClose on overlay click (outside content area)', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Click Test">
        <p>Content</p>
      </Modal>
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does NOT close on content area click', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="No Close Test">
        <p>Inner content</p>
      </Modal>
    );

    fireEvent.click(screen.getByText('Inner content'));
    vi.advanceTimersByTime(200);
    expect(onClose).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="A11y Test">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to title element', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Label Test">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl?.textContent).toBe('Label Test');
  });

  it('close button has aria-label="닫기"', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Close Btn Test">
        <p>Content</p>
      </Modal>
    );
    const closeBtn = screen.getByLabelText('닫기');
    expect(closeBtn).toBeInTheDocument();
  });
});
