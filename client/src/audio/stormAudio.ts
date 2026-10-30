/**
 * @module audio/stormAudio
 *
 * Storm sound effects generated in the browser with the Web Audio API: a
 * looping sea-and-rain ambience plus thunder claps on demand. Everything is
 * synthesised from noise, so there are no audio files to license or download.
 *
 * Browsers only allow sound after a user gesture, so call {@link StormAudio.start}
 * from a click handler. In environments without Web Audio (e.g. tests) every
 * method is a safe no-op.
 */

/** Overall volume when sound is on (0–1). */
const MASTER_VOLUME = 0.8;

/**
 * Fills a buffer with noise.
 *
 * @param ctx - Audio context that will play the buffer.
 * @param seconds - Length of the buffer.
 * @param brown - `true` for deep "brown" noise (rumble), `false` for white noise (hiss).
 */
function createNoiseBuffer(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }
  return buffer;
}

/** Plays the storm ambience and thunder. One instance per intro screen. */
export class StormAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private brownNoise: AudioBuffer | null = null;
  private whiteNoise: AudioBuffer | null = null;

  /** Whether sound has been started and not stopped. */
  get isRunning(): boolean {
    return this.ctx !== null;
  }

  /** Starts the ambience (fading in). Safe to call more than once. */
  start(): void {
    if (this.ctx || typeof window === 'undefined' || !window.AudioContext) return;

    const ctx = new window.AudioContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(MASTER_VOLUME, ctx.currentTime + 3);
    master.connect(ctx.destination);

    this.ctx = ctx;
    this.master = master;
    this.brownNoise = createNoiseBuffer(ctx, 8, true);
    this.whiteNoise = createNoiseBuffer(ctx, 4, false);

    this.startSea();
    this.startRain();
  }

  /** Fades the sound in or out without stopping it. */
  setMuted(muted: boolean): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.25);
  }

  /**
   * Plays one thunder clap: a sharp crack followed by a long rolling rumble.
   *
   * @param strength - Loudness from 0 to 1.
   */
  thunder(strength = 1): void {
    const { ctx, master, brownNoise, whiteNoise } = this;
    if (!ctx || !master || !brownNoise || !whiteNoise) return;
    const t = ctx.currentTime;

    // Crack: a short burst of hiss swept downwards.
    const crack = ctx.createBufferSource();
    crack.buffer = whiteNoise;
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(2500, t);
    crackFilter.frequency.exponentialRampToValueAtTime(200, t + 0.6);
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0, t);
    crackGain.gain.linearRampToValueAtTime(0.5 * strength, t + 0.01);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    crack.connect(crackFilter).connect(crackGain).connect(master);
    crack.start(t, Math.random() * 3);
    crack.stop(t + 1);

    // Rumble: deep noise that swells, rolls, then dies away.
    const duration = 5 + Math.random() * 3;
    const rumble = ctx.createBufferSource();
    rumble.buffer = brownNoise;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(400, t);
    rumbleFilter.frequency.exponentialRampToValueAtTime(90, t + duration);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0, t);
    rumbleGain.gain.linearRampToValueAtTime(1.6 * strength, t + 0.12);
    rumbleGain.gain.exponentialRampToValueAtTime(0.7 * strength, t + 0.9);
    rumbleGain.gain.linearRampToValueAtTime(1.1 * strength, t + 1.6);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    rumble.connect(rumbleFilter).connect(rumbleGain).connect(master);
    rumble.start(t, Math.random() * 2);
    rumble.stop(t + duration);
  }

  /** Fades out and releases the audio device. */
  stop(): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => void ctx.close(), 1500);
    this.ctx = null;
    this.master = null;
  }

  /** Low, surging wash of waves: filtered noise whose volume rises and falls. */
  private startSea(): void {
    const { ctx, master, brownNoise } = this;
    if (!ctx || !master || !brownNoise) return;

    const source = ctx.createBufferSource();
    source.buffer = brownNoise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.45;

    // A slow oscillator makes the volume swell like breaking waves.
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.12;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.3;
    swell.connect(swellDepth).connect(gain.gain);

    source.connect(filter).connect(gain).connect(master);
    source.start();
    swell.start();
  }

  /** Steady rain hiss: high-passed white noise. */
  private startRain(): void {
    const { ctx, master, whiteNoise } = this;
    if (!ctx || !master || !whiteNoise) return;

    const source = ctx.createBufferSource();
    source.buffer = whiteNoise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = ctx.createGain();
    gain.gain.value = 0.06;

    source.connect(filter).connect(gain).connect(master);
    source.start();
  }
}
