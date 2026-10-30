/**
 * @module App
 *
 * Root component. Chooses which screen to show: the storm intro first, then
 * the login / sign-up page. The real screens (gallery map, dialogue, trial,
 * endings) will be added to `pages/` and `components/`.
 */
import { useState } from 'react';
import { AuthPage, type AuthMode } from './pages/AuthPage';
import { IntroPage } from './pages/IntroPage';

type Screen = { name: 'intro'; skipToChoices: boolean } | { name: 'auth'; mode: AuthMode };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'intro', skipToChoices: false });

  if (screen.name === 'auth') {
    return (
      <AuthPage
        initialMode={screen.mode}
        onBack={() => setScreen({ name: 'intro', skipToChoices: true })}
      />
    );
  }

  return (
    <IntroPage
      skipToChoices={screen.skipToChoices}
      onNewUser={() => setScreen({ name: 'auth', mode: 'register' })}
      onExistingUser={() => setScreen({ name: 'auth', mode: 'login' })}
    />
  );
}
