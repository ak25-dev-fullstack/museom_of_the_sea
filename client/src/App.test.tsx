import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

/** Enters the intro and skips straight to the New user / Existing user buttons. */
async function skipIntro(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Enter the storm' }));
  await user.click(screen.getByRole('button', { name: 'Skip intro' }));
}

describe('App', () => {
  it('starts on the intro gate', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Enter the storm' })).toBeInTheDocument();
  });

  it('opens the sign-up form for a new user', async () => {
    const user = userEvent.setup();
    render(<App />);
    await skipIntro(user);

    await user.click(screen.getByRole('button', { name: 'New user' }));

    expect(screen.getByRole('heading', { name: 'Create your visitor pass' })).toBeInTheDocument();
  });

  it('opens the log-in form for an existing user', async () => {
    const user = userEvent.setup();
    render(<App />);
    await skipIntro(user);

    await user.click(screen.getByRole('button', { name: 'Existing user' }));

    expect(screen.getByRole('heading', { name: 'Welcome back, traveller' })).toBeInTheDocument();
  });

  it('goes back from the login page to the intro buttons', async () => {
    const user = userEvent.setup();
    render(<App />);
    await skipIntro(user);
    await user.click(screen.getByRole('button', { name: 'Existing user' }));

    await user.click(screen.getByRole('button', { name: /back to the intro/i }));

    expect(screen.getByRole('button', { name: 'New user' })).toBeInTheDocument();
  });
});
