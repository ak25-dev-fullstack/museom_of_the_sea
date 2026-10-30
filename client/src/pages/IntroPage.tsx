/**
 * @module pages/IntroPage
 *
 * The cinematic opening. A "gate" asks the visitor to enter (browsers only allow
 * sound after a click). Then the storm video plays (Poseidon rises from the
 * sea) with lightning and thunder, the title and tagline fade in, and finally the New user / Existing user buttons
 * appear. The visitor can skip straight to the buttons at any time.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StormAudio } from '../audio/stormAudio';
import { StormScene } from '../components/StormScene';
import { INTRO_COPY } from '../content/intro';
import './IntroPage.css';

/** The steps of the intro, in order. */
const STAGES = ['gate', 'storm', 'title', 'tagline', 'choices'] as const;
type Stage = (typeof STAGES)[number];

/**
 * When each stage starts, in ms after the visitor clicks "Enter". The title
 * waits until Poseidon has risen in the background video (about 2.5 s).
 */
const STAGE_TIMES: [Stage, number][] = [
  ['title', 2600],
  ['tagline', 4600],
  ['choices', 6800],
];

/** Random number between min and max. */
const between = (min: number, max: number) => min + Math.random() * (max - min);

export interface IntroPageProps {
  /** Called when the visitor picks "New user". */
  onNewUser: () => void;
  /** Called when the visitor picks "Existing user". */
  onExistingUser: () => void;
  /** Start with the buttons already showing (e.g. coming back from the login page). */
  skipToChoices?: boolean;
}

/** Full-screen storm intro that ends with the New user / Existing user choice. */
export function IntroPage({ onNewUser, onExistingUser, skipToChoices = false }: IntroPageProps) {
  const [stage, setStage] = useState<Stage>(skipToChoices ? 'choices' : 'gate');
  const [skipped, setSkipped] = useState(skipToChoices);
  const [soundOn, setSoundOn] = useState(false);
  const [strike, setStrike] = useState({ key: 0, x: 30 });
  const audioRef = useRef<StormAudio | null>(null);

  const audio = () => (audioRef.current ??= new StormAudio());
  const reached = (s: Stage) => STAGES.indexOf(stage) >= STAGES.indexOf(s);
  /** Moves forward to a stage, never backwards (so skipping is not undone by a timer). */
  const advanceTo = useCallback(
    (next: Stage) =>
      setStage((current) => (STAGES.indexOf(next) > STAGES.indexOf(current) ? next : current)),
    [],
  );
  const started = stage !== 'gate';

  // Run the timed sequence once the visitor has entered.
  useEffect(() => {
    if (!started) return;
    const timers = STAGE_TIMES.map(([s, ms]) => setTimeout(() => advanceTo(s), ms));
    return () => timers.forEach(clearTimeout);
  }, [started, advanceTo]);

  // Lightning strikes at random intervals; thunder follows a moment later
  // (light travels faster than sound).
  useEffect(() => {
    if (!started) return;
    let timer: ReturnType<typeof setTimeout>;
    const strikeNow = (first: boolean) => {
      setStrike((s) => ({ key: s.key + 1, x: between(10, 85) }));
      const delay = between(150, 900);
      timer = setTimeout(() => {
        audioRef.current?.thunder(first ? 1 : between(0.5, 1));
        timer = setTimeout(() => strikeNow(false), between(5000, 11000));
      }, delay);
    };
    timer = setTimeout(() => strikeNow(true), 600);
    return () => clearTimeout(timer);
  }, [started]);

  // Stop the sound when leaving the intro.
  useEffect(() => () => audioRef.current?.stop(), []);

  const enter = () => {
    audio().start();
    setSoundOn(true);
    advanceTo('storm');
  };

  /** Jumps to the end: Poseidon risen and the buttons showing. */
  const skip = () => {
    setSkipped(true);
    advanceTo('choices');
  };

  const toggleSound = () => {
    if (soundOn) {
      audio().setMuted(true);
    } else {
      audio().start();
      audio().setMuted(false);
    }
    setSoundOn(!soundOn);
  };

  return (
    <div className="intro">
      <StormScene
        flashKey={strike.key}
        boltX={strike.x}
        videoState={stage === 'gate' ? 'waiting' : skipped ? 'end' : 'play'}
      />

      {stage === 'gate' ? (
        <div className="intro__gate">
          <p className="intro__hint">{INTRO_COPY.soundHint}</p>
          <button type="button" className="intro__button" onClick={enter} autoFocus>
            {INTRO_COPY.begin}
          </button>
        </div>
      ) : (
        <main className="intro__content">
          {reached('title') && <h1 className="intro__title">{INTRO_COPY.title}</h1>}
          {reached('tagline') && <p className="intro__tagline">{INTRO_COPY.tagline}</p>}
          {reached('choices') && (
            <div className="intro__choices">
              <button type="button" className="intro__button" onClick={onNewUser}>
                {INTRO_COPY.newUser}
              </button>
              <button type="button" className="intro__button" onClick={onExistingUser}>
                {INTRO_COPY.existingUser}
              </button>
            </div>
          )}
        </main>
      )}

      {started && (
        <div className="intro__controls">
          <button
            type="button"
            className="intro__control"
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
          {!reached('choices') && (
            <button type="button" className="intro__control" onClick={skip}>
              {INTRO_COPY.skip}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
