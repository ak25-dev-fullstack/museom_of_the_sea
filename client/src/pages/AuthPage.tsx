/**
 * @module pages/AuthPage
 *
 * Sign-up / log-in page reached from the intro. Front end only for now: the
 * form checks its fields in the browser, but nothing is sent to the server
 * until the accounts API exists.
 */
import { useState, type FormEvent } from 'react';
import { StormScene } from '../components/StormScene';
import './AuthPage.css';

/** `register` for new users, `login` for existing users. */
export type AuthMode = 'register' | 'login';

const TEXT: Record<AuthMode, { heading: string; intro: string; submit: string; switch: string }> = {
  register: {
    heading: 'Create your visitor pass',
    intro: 'Sign up to save your journey through the museum.',
    submit: 'Create account',
    switch: 'Already have an account? Log in',
  },
  login: {
    heading: 'Welcome back, traveller',
    intro: 'Log in to continue your journey.',
    submit: 'Log in',
    switch: 'New here? Create an account',
  },
};

export interface AuthPageProps {
  /** Which form to show first. */
  initialMode: AuthMode;
  /** Returns to the intro. */
  onBack: () => void;
}

/** Login and registration form over a calm storm background. */
export function AuthPage({ initialMode, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [notice, setNotice] = useState<string | null>(null);
  const text = TEXT[mode];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: call the accounts API through api/client.ts once it exists.
    setNotice('Accounts are not connected yet. This form is a preview.');
  };

  const switchMode = () => {
    setMode(mode === 'register' ? 'login' : 'register');
    setNotice(null);
  };

  return (
    <div className="auth">
      <StormScene calm />
      <main className="auth__layer">
        <section className="auth__card" aria-labelledby="auth-heading">
          <p className="auth__brand">Museum of the Sea</p>
          <h1 id="auth-heading" className="auth__heading">
            {text.heading}
          </h1>
          <p className="auth__intro">{text.intro}</p>

          <form className="auth__form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="auth__field">
                <span>Name</span>
                <input name="name" autoComplete="name" required maxLength={50} />
              </label>
            )}
            <label className="auth__field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="auth__field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={8}
              />
            </label>
            <button type="submit" className="auth__submit">
              {text.submit}
            </button>
          </form>

          {notice && (
            <p className="auth__notice" role="status">
              {notice}
            </p>
          )}

          <div className="auth__links">
            <button type="button" className="auth__link" onClick={switchMode}>
              {text.switch}
            </button>
            <button type="button" className="auth__link" onClick={onBack}>
              ← Back to the intro
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
