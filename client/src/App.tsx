/**
 * @module App
 *
 * Root component. For now it is a placeholder shell that proves the
 * client ↔ server connection works. The real screens (gallery map, dialogue,
 * trial, endings) will live in `pages/` and `components/`.
 */
import { useEffect, useState } from 'react';
import { getHealth } from './api/client';

type ServerStatus = 'checking' | 'online' | 'offline';

export default function App() {
  const [status, setStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    getHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <main className="shell">
      <h1>Museum of the Sea</h1>
      <p className="tagline">An interactive conversation with history.</p>
      <p className="status" role="status" data-status={status}>
        Server: {status}
      </p>
    </main>
  );
}
