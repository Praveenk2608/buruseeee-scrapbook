// Web Audio Synthesizer for sweet scrapbook melodies & sound effects
// Completely offline, zero external dead links, responsive and clean!

class AudioController {
  private ctx: AudioContext | null = null;
  private isMelodyPlaying = false;
  private melodyInterval: number | null = null;
  private gainNode: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.initCtx();
  }

  // Play pleasant acoustic / music-box style note
  public playNote(freq: number, duration = 0.6, type: OscillatorType = 'sine', volume = 0.15) {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback not permitted yet:', e);
    }
  }

  // Sound effects
  public playCardFlip() {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  }

  public playQuizCorrect() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 0.4, 'triangle', 0.18), idx * 90);
    });
  }

  public playQuizWrong() {
    const notes = [392.00, 369.99, 349.23, 311.13]; // Descending comical slide
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 0.25, 'sawtooth', 0.08), idx * 80);
    });
  }

  public playBlowCandles() {
    try {
      const ctx = this.initCtx();
      // Gentle airy white noise burst
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (_) {}
  }

  public playWheelTick() {
    this.playNote(880, 0.04, 'sine', 0.05);
  }

  public playWheelWin() {
    const melody = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    melody.forEach((f, i) => {
      setTimeout(() => this.playNote(f, 0.35, 'triangle', 0.16), i * 80);
    });
  }

  // Lo-Fi Sweet Ambient Birthday Song Loop
  public startBackgroundMelody(onStateChange?: (playing: boolean) => void) {
    if (this.isMelodyPlaying) return;
    const ctx = this.initCtx();
    this.isMelodyPlaying = true;
    onStateChange?.(true);

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    this.gainNode.connect(ctx.destination);

    // Sweet nostalgic music box progression (Happy Birthday & friendship chords)
    // Notes in Hz (C4, D4, E4, F4, G4, A4, B4, C5, D5, E5)
    const melodyNotes = [
      261.63, 261.63, 293.66, 261.63, 349.23, 329.63, // Happy Birthday to you
      261.63, 261.63, 293.66, 261.63, 392.00, 349.23, // Happy Birthday to you
      261.63, 261.63, 523.25, 440.00, 349.23, 329.63, 293.66, // Happy Birthday dear Buruseeee
      466.16, 466.16, 440.00, 349.23, 392.00, 349.23  // Happy Birthday to you!
    ];
    const durations = [
      0.35, 0.35, 0.7, 0.7, 0.7, 1.2,
      0.35, 0.35, 0.7, 0.7, 0.7, 1.2,
      0.35, 0.35, 0.7, 0.7, 0.7, 0.7, 1.2,
      0.35, 0.35, 0.7, 0.7, 0.7, 1.6
    ];

    let noteIndex = 0;
    const playNext = () => {
      if (!this.isMelodyPlaying || !this.ctx) return;
      const freq = melodyNotes[noteIndex];
      const dur = durations[noteIndex];

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle'; // Warm music-box feel
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      oscGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

      osc.connect(oscGain);
      if (this.gainNode) {
        oscGain.connect(this.gainNode);
      }

      osc.start();
      osc.stop(this.ctx.currentTime + dur);

      noteIndex = (noteIndex + 1) % melodyNotes.length;
      this.melodyInterval = window.setTimeout(playNext, (dur + 0.12) * 1000);
    };

    playNext();
  }

  public stopBackgroundMelody(onStateChange?: (playing: boolean) => void) {
    this.isMelodyPlaying = false;
    if (this.melodyInterval) {
      clearTimeout(this.melodyInterval);
      this.melodyInterval = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (_) {}
      this.gainNode = null;
    }
    onStateChange?.(false);
  }

  public isPlaying() {
    return this.isMelodyPlaying;
  }

  public setVolume(val: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, val * 0.2)), this.ctx.currentTime);
    }
  }
}

export const soundManager = new AudioController();
