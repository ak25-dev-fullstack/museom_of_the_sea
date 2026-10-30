/**
 * @module components/StormScene
 *
 * Full-screen stormy sea used behind the intro and the login page: a video of
 * the sea in which Poseidon rises from the waves, with canvas rain and
 * lightning strikes layered on top. Underneath the video is a drawn
 * storm (clouds, SVG waves, a tossing ship) that shows while the video loads
 * or if it cannot play. Purely decorative, so it is hidden from screen readers.
 */
import { useEffect, useRef, useState } from 'react';
import stormVideo from '../assets/storm-sea.mp4';
import './StormScene.css';

/** Whether the user has asked the OS to reduce motion. */
function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Builds a repeating storm-sea outline for a 2880×320 SVG by adding together
 * several swells of different sizes. Each swell has sharp crests and broad
 * troughs, like wind-driven waves, and mixing them makes the sea irregular.
 * Every wavelength divides 1440, so the shape repeats every 1440 units and
 * sliding it left by half its width loops seamlessly.
 *
 * @param baseline - Height of the troughs.
 * @param amplitude - Height of the tallest possible crest.
 * @param swells - `[wavelength, weight, phase]` for each swell.
 */
function wavePath(baseline: number, amplitude: number, swells: [number, number, number][]): string {
  const totalWeight = swells.reduce((sum, [, weight]) => sum + weight, 0);
  const crest = (t: number) => ((1 + Math.cos(2 * Math.PI * t)) / 2) ** 2.5;
  let d = '';
  for (let x = 0; x <= 2880; x += 12) {
    const height = swells.reduce(
      (sum, [wavelength, weight, phase]) => sum + weight * crest(x / wavelength + phase),
      0,
    );
    d += `${x === 0 ? 'M' : 'L'}${x} ${(baseline - (amplitude * height) / totalWeight).toFixed(1)} `;
  }
  return `${d}V320 H0 Z`;
}

const WAVE_PATHS = {
  back: wavePath(170, 150, [
    [480, 1, 0],
    [288, 0.6, 0.3],
    [720, 0.8, 0.6],
  ]),
  mid: wavePath(225, 170, [
    [360, 1, 0.2],
    [240, 0.5, 0.7],
    [1440, 0.7, 0],
  ]),
  front: wavePath(285, 110, [
    [720, 1, 0.5],
    [480, 0.6, 0],
    [288, 0.3, 0.4],
  ]),
};

/** One layer of rolling sea. */
function Wave({ layer }: { layer: keyof typeof WAVE_PATHS }) {
  return (
    <svg
      className={`storm__wave storm__wave--${layer}`}
      viewBox="0 0 2880 320"
      preserveAspectRatio="none"
    >
      <path d={WAVE_PATHS[layer]} />
    </svg>
  );
}

interface Drop {
  x: number;
  y: number;
  length: number;
  speed: number;
}

/** Horizontal drift of the rain per pixel fallen (wind from the left). */
const WIND = 0.25;

/** Rain streaks drawn on a canvas. Does nothing when reduced motion is on. */
function RainCanvas({ density }: { density: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || prefersReducedMotion()) return;

    let drops: Drop[] = [];
    let frame = 0;

    const newDrop = (width: number, height: number, anywhere: boolean): Drop => {
      const length = 10 + Math.random() * 22;
      return {
        x: Math.random() * width * 1.3 - width * 0.3,
        y: anywhere ? Math.random() * height : -length,
        length,
        speed: 12 + Math.random() * 12,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 2500) * density);
      drops = Array.from({ length: count }, () => newDrop(w, h, true));
    };

    const draw = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(205, 222, 235, 0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const drop of drops) {
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.length * WIND, drop.y + drop.length);
        drop.x += drop.speed * WIND;
        drop.y += drop.speed;
        if (drop.y > h) Object.assign(drop, newDrop(w, h, false));
      }
      ctx.stroke();
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return <canvas ref={ref} className="storm__rain" />;
}

/** A small Greek ship with a square sail, riding the middle wave. */
function Ship() {
  return (
    <svg className="storm__ship" viewBox="0 0 120 100">
      <path d="M8 70 Q60 92 112 66 L104 80 Q60 98 18 82 Z" />
      <path d="M58 72 V12" className="storm__ship-mast" />
      <path d="M34 20 Q58 14 84 20 L80 58 Q58 52 38 58 Z" className="storm__ship-sail" />
    </svg>
  );
}

export interface StormSceneProps {
  /** Increase to trigger a lightning strike. 0 means no strike yet. */
  flashKey?: number;
  /** Horizontal position of the lightning bolt, as a percentage of the width. */
  boltX?: number;
  /** A quieter storm (lighter rain) for screens with forms on top. */
  calm?: boolean;
  /** How the background video plays. Defaults to showing its last frame. */
  videoState?: StormVideoState;
}

/**
 * How the background video should behave:
 * - `waiting`: paused on the first frame (before the visitor enters).
 * - `play`: play once, then stay on the last frame (Poseidon risen).
 * - `end`: jump straight to the last frame.
 */
export type StormVideoState = 'waiting' | 'play' | 'end';

/**
 * Shows the video's last frame, waiting for its length to be known if needed.
 *
 * @param video - The video element to move to its end.
 */
function showLastFrame(video: HTMLVideoElement): void {
  video.pause();
  const seek = () => {
    video.currentTime = Math.max(0, video.duration - 0.05);
  };
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) seek();
  else video.addEventListener('loadedmetadata', seek, { once: true });
}

/** Animated storm background. Place content on top of it with a positioned layer. */
export function StormScene({
  flashKey = 0,
  boltX = 30,
  calm = false,
  videoState = 'end',
}: StormSceneProps) {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // A cached video can finish loading before React starts listening for it.
  useEffect(() => {
    if ((videoRef.current?.readyState ?? 0) >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setVideoReady(true);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (videoState === 'waiting') {
      video.pause();
      video.currentTime = 0;
    } else if (videoState === 'play' && !prefersReducedMotion()) {
      // play() fails if the browser blocks it; the drawn storm still shows.
      video.play().catch(() => showLastFrame(video));
    } else {
      showLastFrame(video);
    }
  }, [videoState]);

  return (
    <div className={calm ? 'storm storm--calm' : 'storm'} aria-hidden="true">
      {/* Drawn storm: shown while the video loads, or if it cannot play. */}
      <div className="storm__sky" />
      <div className="storm__clouds storm__clouds--far" />
      <div className="storm__clouds storm__clouds--near" />
      <div className="storm__mist" />
      <div className="storm__sea">
        <Wave layer="back" />
        <Wave layer="mid" />
        <Ship />
        <Wave layer="front" />
      </div>

      <video
        ref={videoRef}
        className={videoReady ? 'storm__video storm__video--ready' : 'storm__video'}
        src={stormVideo}
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
      />

      {flashKey > 0 && (
        <div key={flashKey} className="storm__strike">
          <svg className="storm__bolt" style={{ left: `${boltX}%` }} viewBox="0 0 60 300">
            <polyline points="34,0 24,80 38,86 16,170 32,176 8,300" />
          </svg>
          <div className="storm__flash" />
        </div>
      )}
      <RainCanvas density={calm ? 0.4 : 1} />
      <div className="storm__vignette" />
    </div>
  );
}
