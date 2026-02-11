import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoader } from '../../components/PageLoader';

describe('PageLoader', () => {
  it('renders spinner element', () => {
    const { container } = render(<PageLoader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders loading text', () => {
    render(<PageLoader />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('has correct layout classes', () => {
    const { container } = render(<PageLoader />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('flex')).toBe(true);
    expect(wrapper?.classList.contains('items-center')).toBe(true);
    expect(wrapper?.classList.contains('justify-center')).toBe(true);
  });
});
