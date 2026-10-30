import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntroPage } from './IntroPage';

function renderIntro() {
  const onNewUser = vi.fn();
  const onExistingUser = vi.fn();
  render(<IntroPage onNewUser={onNewUser} onExistingUser={onExistingUser} />);
  return { onNewUser, onExistingUser };
}

describe('IntroPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows nothing but the gate until the visitor enters', () => {
    renderIntro();

    expect(screen.getByRole('button', { name: 'Enter the storm' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('reveals the title, then the tagline, then the buttons', () => {
    renderIntro();
    fireEvent.click(screen.getByRole('button', { name: 'Enter the storm' }));

    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByRole('heading', { name: 'Museum of the Sea' })).toBeInTheDocument();
    expect(screen.queryByText(/learn about his kingdom/)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText(/learn about his kingdom/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New user' })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2200));
    expect(screen.getByRole('button', { name: 'New user' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Existing user' })).toBeInTheDocument();
  });

  it('skips straight to the buttons, and the timers do not undo the skip', () => {
    renderIntro();
    fireEvent.click(screen.getByRole('button', { name: 'Enter the storm' }));

    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByRole('button', { name: 'New user' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip intro' })).not.toBeInTheDocument();
  });

  it('calls the right handler for each button', () => {
    const { onNewUser, onExistingUser } = renderIntro();
    fireEvent.click(screen.getByRole('button', { name: 'Enter the storm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip intro' }));

    fireEvent.click(screen.getByRole('button', { name: 'New user' }));
    fireEvent.click(screen.getByRole('button', { name: 'Existing user' }));

    expect(onNewUser).toHaveBeenCalledOnce();
    expect(onExistingUser).toHaveBeenCalledOnce();
  });

  it('toggles the sound button', () => {
    renderIntro();
    fireEvent.click(screen.getByRole('button', { name: 'Enter the storm' }));

    const sound = screen.getByRole('button', { name: 'Sound on' });
    fireEvent.click(sound);

    expect(sound).toHaveTextContent('Sound off');
    expect(sound).toHaveAttribute('aria-pressed', 'false');
  });
});
