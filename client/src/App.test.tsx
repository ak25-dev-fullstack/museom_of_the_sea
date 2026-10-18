import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows the museum title', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Museum of the Sea' })).toBeInTheDocument();
  });

  it('shows the server as online when the health check succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ status: 'ok', uptime: 1 }))),
    );
    render(<App />);

    expect(await screen.findByText('Server: online')).toBeInTheDocument();
  });

  it('shows the server as offline when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    render(<App />);

    expect(await screen.findByText('Server: offline')).toBeInTheDocument();
  });
});
