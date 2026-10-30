import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

describe('AuthPage', () => {
  it('shows a name field only when registering', async () => {
    const user = userEvent.setup();
    render(<AuthPage initialMode="register" onBack={vi.fn()} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('heading', { name: 'Welcome back, traveller' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<AuthPage initialMode="login" onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a preview notice after a valid submit', async () => {
    const user = userEvent.setup();
    render(<AuthPage initialMode="login" onBack={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'visitor@example.com');
    await user.type(screen.getByLabelText('Password'), 'trident123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('status')).toHaveTextContent(/not connected yet/);
  });

  it('calls onBack from the back link', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<AuthPage initialMode="login" onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /back to the intro/i }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
