import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardWidget } from '../../components/DashboardWidget';
import type { WidgetId } from '../../types';

vi.mock('../../components/Icons', () => ({
  GripVertical: (props: Record<string, unknown>) => <span data-testid="grip-icon" {...props} />,
  Eye: (props: Record<string, unknown>) => <span data-testid="eye-icon" {...props} />,
  EyeOff: (props: Record<string, unknown>) => <span data-testid="eye-off-icon" {...props} />,
  Maximize2: (props: Record<string, unknown>) => <span data-testid="maximize-icon" {...props} />,
  Minimize2: (props: Record<string, unknown>) => <span data-testid="minimize-icon" {...props} />,
}));

function createProps(overrides: Partial<React.ComponentProps<typeof DashboardWidget>> = {}) {
  return {
    widgetId: 'kpi-cards' as WidgetId,
    editMode: false,
    visible: true,
    width: 'full' as const,
    onToggleVisibility: vi.fn(),
    onToggleWidth: vi.fn(),
    canResize: true,
    index: 0,
    totalCount: 1,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDragEnd: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    children: <div data-testid="child-content">Widget Content</div>,
    ...overrides,
  };
}

describe('DashboardWidget', () => {
  describe('normal view mode (visible, no editMode)', () => {
    it('renders children in normal view', () => {
      render(<DashboardWidget {...createProps()} />);
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Widget Content')).toBeInTheDocument();
    });

    it('applies full width col-span', () => {
      const { container } = render(<DashboardWidget {...createProps({ width: 'full' })} />);
      expect(container.firstElementChild).toHaveClass('md:col-span-2');
    });

    it('applies half width col-span', () => {
      const { container } = render(<DashboardWidget {...createProps({ width: 'half' })} />);
      expect(container.firstElementChild).toHaveClass('md:col-span-1');
    });

    it('sets data-widget-id attribute', () => {
      const { container } = render(<DashboardWidget {...createProps({ widgetId: 'funnel-chart' })} />);
      expect(container.firstElementChild).toHaveAttribute('data-widget-id', 'funnel-chart');
    });

    it('is not draggable in view mode', () => {
      const { container } = render(<DashboardWidget {...createProps()} />);
      expect(container.firstElementChild).not.toHaveAttribute('draggable');
    });
  });

  describe('hidden in view mode (!visible, no editMode)', () => {
    it('renders nothing when not visible and not in edit mode', () => {
      const { container } = render(
        <DashboardWidget {...createProps({ visible: false, editMode: false })} />
      );
      expect(container.innerHTML).toBe('');
    });
  });

  describe('hidden in edit mode (!visible, editMode)', () => {
    it('renders collapsed bar with widget id text', () => {
      render(
        <DashboardWidget {...createProps({ visible: false, editMode: true })} />
      );
      expect(screen.getByText('kpi-cards')).toBeInTheDocument();
    });

    it('renders show button (Eye icon)', () => {
      render(
        <DashboardWidget {...createProps({ visible: false, editMode: true })} />
      );
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('calls onToggleVisibility when show button clicked', () => {
      const onToggleVisibility = vi.fn();
      render(
        <DashboardWidget {...createProps({ visible: false, editMode: true, onToggleVisibility })} />
      );
      const button = screen.getByTestId('eye-icon').closest('button')!;
      fireEvent.click(button);
      expect(onToggleVisibility).toHaveBeenCalledOnce();
    });

    it('is draggable', () => {
      const { container } = render(
        <DashboardWidget {...createProps({ visible: false, editMode: true })} />
      );
      expect(container.firstElementChild).toHaveAttribute('draggable', 'true');
    });

    it('calls drag handlers', () => {
      const onDragStart = vi.fn();
      const onDragOver = vi.fn();
      const onDrop = vi.fn();
      const onDragEnd = vi.fn();
      const { container } = render(
        <DashboardWidget {...createProps({ visible: false, editMode: true, onDragStart, onDragOver, onDrop, onDragEnd })} />
      );
      const el = container.firstElementChild!;
      fireEvent.dragStart(el);
      fireEvent.dragOver(el);
      fireEvent.drop(el);
      fireEvent.dragEnd(el);
      expect(onDragStart).toHaveBeenCalledOnce();
      expect(onDragOver).toHaveBeenCalledOnce();
      expect(onDrop).toHaveBeenCalledOnce();
      expect(onDragEnd).toHaveBeenCalledOnce();
    });
  });

  describe('edit mode (visible, editMode)', () => {
    it('renders children with pointer-events-none overlay', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true })} />
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      const wrapper = screen.getByTestId('child-content').parentElement!;
      expect(wrapper).toHaveClass('pointer-events-none');
      expect(wrapper).toHaveClass('opacity-70');
    });

    it('shows widget id in toolbar', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true })} />
      );
      expect(screen.getByText('kpi-cards')).toBeInTheDocument();
    });

    it('shows grip icon for drag handle', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true })} />
      );
      expect(screen.getByTestId('grip-icon')).toBeInTheDocument();
    });

    it('shows hide button (EyeOff icon)', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true })} />
      );
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });

    it('calls onToggleVisibility when hide button clicked', () => {
      const onToggleVisibility = vi.fn();
      render(
        <DashboardWidget {...createProps({ editMode: true, onToggleVisibility })} />
      );
      const button = screen.getByTestId('eye-off-icon').closest('button')!;
      fireEvent.click(button);
      expect(onToggleVisibility).toHaveBeenCalledOnce();
    });

    it('shows resize button when canResize is true', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true, canResize: true, width: 'half' })} />
      );
      expect(screen.getByTestId('maximize-icon')).toBeInTheDocument();
    });

    it('shows Minimize2 icon when width is full', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true, canResize: true, width: 'full' })} />
      );
      expect(screen.getByTestId('minimize-icon')).toBeInTheDocument();
    });

    it('hides resize button when canResize is false', () => {
      render(
        <DashboardWidget {...createProps({ editMode: true, canResize: false })} />
      );
      expect(screen.queryByTestId('maximize-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('minimize-icon')).not.toBeInTheDocument();
    });

    it('calls onToggleWidth when resize button clicked', () => {
      const onToggleWidth = vi.fn();
      render(
        <DashboardWidget {...createProps({ editMode: true, canResize: true, width: 'half', onToggleWidth })} />
      );
      const button = screen.getByTestId('maximize-icon').closest('button')!;
      fireEvent.click(button);
      expect(onToggleWidth).toHaveBeenCalledOnce();
    });

    it('is draggable', () => {
      const { container } = render(
        <DashboardWidget {...createProps({ editMode: true })} />
      );
      expect(container.firstElementChild).toHaveAttribute('draggable', 'true');
    });

    it('has data-widget-id attribute', () => {
      const { container } = render(
        <DashboardWidget {...createProps({ editMode: true, widgetId: 'data-quality' })} />
      );
      expect(container.firstElementChild).toHaveAttribute('data-widget-id', 'data-quality');
    });
  });
});
