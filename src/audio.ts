// Synthesized Web Audio Controller for Web App Offline Game Sound Experience

class AudioController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy init context on first click to prevent browser autoplay warnings
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('bubble_shooter_muted');
      this.isMuted = storedMute === 'true';
    }
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('bubble_shooter_muted', String(muted));
    if (this.ctx && muted && this.ctx.state === 'running') {
      this.ctx.suspend();
    } else if (this.ctx && !muted && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getMute() {
    return this.isMuted;
  }

  toggleMute() {
    this.init();
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  // Generic Synth Sound Generator
  private playTone(
    freqs: number[],
    duration: number,
    type: OscillatorType = 'sine',
    gainValues: number[] = [0.1, 0]
  ) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const gainNode = this.ctx.createGain();
      gainNode.connect(this.ctx.destination);

      // Setup gain envelope
      gainNode.gain.setValueAtTime(gainValues[0], now);
      if (gainValues.length > 1) {
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValues[1]), now + duration);
      } else {
        gainNode.gain.setValueAtTime(0, now + duration);
      }

      const oscs: OscillatorNode[] = [];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.connect(gainNode);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        osc.start(now);
        osc.stop(now + duration);
        oscs.push(osc);
      });
    } catch (e) {
      console.warn('Speaker/audio context error: ', e);
    }
  }

  playClick() {
    this.playTone([600], 0.08, 'triangle', [0.15, 0.001]);
  }

  playShoot() {
    // Sliding frequency for shooting
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  playPop() {
    // Satisfying high-pitched popping sound
    this.playTone([800, 1200], 0.08, 'sine', [0.15, 0.01]);
  }

  playCombo(combo: number) {
    // Bubble shooters increase key or frequency with bigger combos
    const baseFreq = 400 + Math.min(8, combo) * 120;
    this.playTone([baseFreq, baseFreq * 1.5], 0.12, 'sine', [0.2, 0.01]);
  }

  playWallBounce() {
    this.playTone([180], 0.06, 'sine', [0.1, 0.01]);
  }

  playPowerup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const length = 0.4;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(800, now + length);

      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + length);

      osc.start(now);
      osc.stop(now + length);
    } catch (e) {}
  }

  playBombExplode() {
    // Exploding synth sound with low frequency rumble
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Rumble oscillator
      const osc1 = this.ctx.createOscillator();
      const noise = this.ctx.createBufferSource();
      const gainNode = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(90, now);
      osc1.frequency.linearRampToValueAtTime(20, now + 0.6);

      // Create a small buffer of noise for crash textured feel
      const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      // Filter noise to sound deep
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(30, now + 0.5);

      osc1.connect(gainNode);
      noise.connect(filter);
      filter.connect(gainNode);

      gainNode.connect(this.ctx.destination);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.start(now);
      osc1.stop(now + 0.6);
      noise.start(now);
      noise.stop(now + 0.6);
    } catch (e) {}
  }

  playLaserBeam() {
    this.playTone([900, 1800], 0.3, 'sawtooth', [0.08, 0.001]);
  }

  playWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chord arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.setValueAtTime(0.12, noteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch (e) {}
  }

  playLose() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [392.00, 349.23, 311.13, 261.63]; // Desolate descending sad minor-ish notes
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.15;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.setValueAtTime(0.15, noteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    } catch (e) {}
  }
}

export const audio = new AudioController();
