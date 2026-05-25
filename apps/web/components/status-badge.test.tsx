import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';
import { describe, it, expect } from 'vitest';

describe('StatusBadge', () => {
  it('renders correctly with default status', () => {
    render(<StatusBadge status="up" />);
    expect(screen.getByText('up')).toBeInTheDocument();
  });

  it('renders correctly with down status', () => {
    render(<StatusBadge status="down" />);
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  it('renders correctly with paused status', () => {
    render(<StatusBadge status="paused" />);
    expect(screen.getByText('paused')).toBeInTheDocument();
  });

  it('renders children if provided', () => {
    render(<StatusBadge status="up">Online</StatusBadge>);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
