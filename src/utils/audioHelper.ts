import { MusicPreset } from '../types/wedding';

// Presets are managed by the Master panel and stored on the server.
export const MUSIC_PRESETS: MusicPreset[] = [];

/**
 * Procedural Romantic Piano & Bells Synthesizer using Web Audio API.
 * Ensures the wedding music ALWAYS works offline, regardless of network or CORS restrictions.
 */
class ProceduralWeddingSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private masterGain: GainNode | null = null;
  private currentStep = 0;

  // Chord progression: Cmaj7 - Am7 - Fmaj7 - Gsus4/G
  private chordProgression = [
    [261.63, 329.63, 392.00, 493.88], // C, E, G, B
    [220.00, 261.63, 329.63, 392.00], // A, C, E, G
    [174.61, 261.63, 329.63, 349.23], // F, C, E, F
    [196.00, 246.94, 293.66, 392.00], // G, B, D, G
    [164.81, 246.94, 329.63, 392.00], // E, B, E, G
    [220.00, 261.63, 349.23, 440.00], // A, C, F, A
    [174.61, 220.00, 261.63, 329.63], // F, A, C, E
    [196.00, 293.66, 392.00, 493.88], // G, D, G, B
  ];

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      const safeVol = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setTargetAtTime(safeVol * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  public start(volume = 0.6) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.setVolume(volume);

    // Keep currentStep when resuming after pause so the progression continues.
    this.playNextArpeggio();
  }

  private playTone(freq: number, duration: number, delay = 0, gainLevel = 0.15) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    // Soft warm triangle + sine combination for mellow electric piano/celesta sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime + delay);

    const now = this.ctx.currentTime + delay;
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(gainLevel * 0.3, now + 0.3);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  private playNextArpeggio() {
    if (!this.isPlaying || !this.ctx) return;

    const chord = this.chordProgression[this.currentStep % this.chordProgression.length];
    
    // Play warm bass root note
    this.playTone(chord[0] / 2, 2.4, 0, 0.22);

    // Arpeggiate chord notes smoothly
    chord.forEach((note, index) => {
      this.playTone(note, 1.8, index * 0.28, 0.14);
      // Delicate higher octave bell sparkle
      if (index === 2 || index === 3) {
        this.playTone(note * 2, 1.2, index * 0.28 + 0.14, 0.06);
      }
    });

    this.currentStep++;
    // schedule next measure in 1.8 seconds
    this.timer = window.setTimeout(() => {
      this.playNextArpeggio();
    }, 1800);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.masterGain) this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
  }

  public isCurrentlyPlaying() {
    return this.isPlaying;
  }
}

export const proceduralWeddingSynth = new ProceduralWeddingSynth();
