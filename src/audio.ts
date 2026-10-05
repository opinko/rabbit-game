// Tiny Web Audio synthesizer: all sound effects and music are generated in code,
// so the game needs no audio files.
import { load, save } from './storage';

type Wave = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private engine: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;
  private musicTempo = 1;

  get muted(): boolean {
    return load().muted;
  }

  get musicOn(): boolean {
    return load().music;
  }

  constructor() {
    // Silence everything while the tab is hidden.
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** Must be called from a user gesture (browsers block audio before that). */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 0.22 : 0;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    const muted = !this.muted;
    save({ muted });
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    return muted;
  }

  toggleMusic(): boolean {
    const music = !this.musicOn;
    save({ music });
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(music ? 0.22 : 0, this.ctx.currentTime, 0.05);
    return music;
  }

  private tone(freq: number, dur: number, opts: { type?: Wave; vol?: number; slideTo?: number; delay?: number; dest?: AudioNode } = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
    const vol = opts.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(opts.dest ?? this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, opts: { vol?: number; freq?: number; delay?: number; q?: number } = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = opts.freq ?? 1000;
    filter.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.vol ?? 0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t0);
  }

  carrot(combo: number): void {
    const base = 660 * Math.pow(1.06, Math.min(combo, 12));
    this.tone(base, 0.09, { type: 'square', vol: 0.12 });
    this.tone(base * 1.5, 0.12, { type: 'square', vol: 0.1, delay: 0.05 });
  }

  golden(): void {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.14, { type: 'triangle', vol: 0.18, delay: i * 0.06 }));
  }

  powerUp(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.12, { type: 'square', vol: 0.12, delay: i * 0.05 }));
  }

  upgrade(): void {
    [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, { type: 'triangle', vol: 0.2, delay: i * 0.07 }));
  }

  hit(): void {
    this.tone(220, 0.25, { type: 'sawtooth', vol: 0.18, slideTo: 70 });
    this.noise(0.18, { vol: 0.25, freq: 400 });
  }

  shieldPop(): void {
    this.tone(900, 0.15, { type: 'sine', vol: 0.2, slideTo: 300 });
    this.noise(0.1, { vol: 0.15, freq: 3000 });
  }

  move(): void {
    this.tone(420, 0.05, { type: 'sine', vol: 0.06, slideTo: 520 });
  }

  combo(): void {
    [880, 1109, 1319].forEach((f, i) => this.tone(f, 0.1, { type: 'square', vol: 0.1, delay: i * 0.04 }));
  }

  warning(): void {
    this.tone(880, 0.12, { type: 'square', vol: 0.08 });
    this.tone(660, 0.12, { type: 'square', vol: 0.08, delay: 0.14 });
  }

  click(): void {
    this.tone(600, 0.06, { type: 'triangle', vol: 0.15, slideTo: 900 });
  }

  broken(): void {
    this.noise(0.5, { vol: 0.3, freq: 250, q: 1.5 });
    this.tone(300, 0.6, { type: 'sawtooth', vol: 0.12, slideTo: 60, delay: 0.05 });
    this.tone(1200, 0.08, { type: 'square', vol: 0.08, delay: 0.3 });
    this.tone(1000, 0.08, { type: 'square', vol: 0.08, delay: 0.4 });
  }

  splat(): void {
    this.noise(0.45, { vol: 0.5, freq: 300, q: 0.6 });
    this.tone(160, 0.5, { type: 'sine', vol: 0.35, slideTo: 40 });
    [523, 440, 349, 262].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', vol: 0.16, delay: 0.5 + i * 0.22 }));
  }

  levelUp(): void {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => this.tone(f, 0.18, { type: 'square', vol: 0.12, delay: i * 0.09 }));
    this.tone(1568, 0.5, { type: 'triangle', vol: 0.15, delay: notes.length * 0.09 });
  }

  // --- Combine engine rumble (volume grows when it gets close) ---
  startEngine(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.engine) return;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.value = 48;
    osc2.frequency.value = 24.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(this.master);
    osc.start();
    osc2.start();
    this.engine = { osc, osc2, gain, filter };
  }

  setEngine(closeness: number, rpm: number): void {
    if (!this.engine || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.engine.gain.gain.setTargetAtTime(0.03 + closeness * 0.16, t, 0.1);
    this.engine.osc.frequency.setTargetAtTime(40 + rpm * 30, t, 0.1);
    this.engine.osc2.frequency.setTargetAtTime(20 + rpm * 15.5, t, 0.1);
    this.engine.filter.frequency.setTargetAtTime(200 + closeness * 500, t, 0.1);
  }

  stopEngine(): void {
    if (!this.engine || !this.ctx) return;
    const { osc, osc2, gain } = this.engine;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    osc.stop(this.ctx.currentTime + 0.3);
    osc2.stop(this.ctx.currentTime + 0.3);
    this.engine = null;
  }

  // --- Cheerful looping chiptune ---
  private static readonly MELODY = [
    72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 81, 0, 79, 77, 76, 74,
    72, 0, 76, 0, 79, 0, 84, 0, 83, 81, 79, 77, 76, 0, 0, 0,
    74, 0, 77, 0, 81, 0, 77, 0, 79, 0, 83, 0, 81, 79, 77, 76,
    74, 0, 77, 76, 74, 0, 71, 0, 72, 0, 76, 79, 84, 0, 0, 0,
  ];
  private static readonly BASS = [48, 48, 53, 53, 55, 55, 48, 48, 50, 50, 53, 53, 55, 55, 48, 43];

  startMusic(tempo = 1): void {
    this.musicTempo = tempo;
    if (!this.ctx || this.musicTimer !== null) return;
    this.musicStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 50);
  }

  setMusicTempo(tempo: number): void {
    this.musicTempo = tempo;
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const stepDur = 0.135 / this.musicTempo;
    while (this.nextNoteTime < ctx.currentTime + 0.2) {
      const i = this.musicStep;
      const note = Sfx.MELODY[i % Sfx.MELODY.length];
      const t = this.nextNoteTime;
      if (note) this.musicNote(note, stepDur * 1.6, 'square', 0.25, t);
      if (i % 4 === 0) this.musicNote(Sfx.BASS[(i / 4) % Sfx.BASS.length], stepDur * 3.5, 'triangle', 0.6, t);
      if (i % 2 === 0) this.hat(t, i % 8 === 4 ? 0.12 : 0.05);
      this.nextNoteTime += stepDur;
      this.musicStep++;
    }
  }

  private musicNote(midi: number, dur: number, type: Wave, vol: number, t: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.musicGain!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private hat(t: number, vol: number): void {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.04);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.musicGain!);
    src.start(t);
  }
}

export const sfx = new Sfx();
