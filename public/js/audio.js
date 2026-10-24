// public/js/audio.js
// Web Audio API Synthesizer for Retro Game Sound Effects & Music

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.musicInterval = null;
    this.musicStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMuted;
  }

  playTone(freq, type, duration, startVol = 0.15, endVol = 0.001) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(startVol, now);
      gain.gain.exponentialRampToValueAtTime(endVol, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio context error fallback
    }
  }

  jump() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  trampoline() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  button() {
    this.playTone(580, 'square', 0.06, 0.12);
  }

  pushBlock() {
    // Subtle rumble
    this.playTone(85, 'sawtooth', 0.08, 0.05);
  }

  key() {
    if (this.isMuted || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.18, 0.18);
        }, idx * 60);
      });
    } catch (e) {}
  }

  doorUnlock() {
    if (this.isMuted || !this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.25, 0.2);
        }, idx * 75);
      });
    } catch (e) {}
  }

  playerEnter() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Cute cat squeak
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  die() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  stageClear() {
    if (this.isMuted || !this.ctx) return;
    try {
      // Triumphant Fanfare (C - G - E - C)
      const fanfare = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.2 },
        { f: 1046.5, d: 0.5 },
      ];
      let delay = 0;
      fanfare.forEach((note) => {
        setTimeout(() => {
          this.playTone(note.f, 'triangle', note.d, 0.25);
        }, delay);
        delay += note.d * 1000 + 30;
      });
    } catch (e) {}
  }

  emote() {
    this.playTone(880, 'sine', 0.1, 0.15);
  }

  startMusic() {
    if (this.isMusicPlaying || this.isMuted) return;
    this.init();
    this.isMusicPlaying = true;

    // Upbeat 8-bit melody progression (C major pentatonic chiptune)
    const melody = [
      523.25, 659.25, 783.99, 659.25,
      523.25, 587.33, 659.25, 523.25,
      440.00, 523.25, 659.25, 523.25,
      587.33, 659.25, 783.99, 880.00
    ];

    const bass = [
      130.81, 130.81, 164.81, 164.81,
      174.61, 174.61, 196.00, 196.00
    ];

    this.musicInterval = setInterval(() => {
      if (!this.isMusicPlaying || this.isMuted || !this.ctx) return;
      const note = melody[this.musicStep % melody.length];
      const bassNote = bass[Math.floor((this.musicStep % 16) / 2)];

      // Play soft high melody
      this.playTone(note, 'triangle', 0.16, 0.04, 0.001);
      // Play soft bass
      if (this.musicStep % 2 === 0) {
        this.playTone(bassNote, 'sine', 0.22, 0.06, 0.001);
      }

      this.musicStep++;
    }, 240); // ~125 BPM
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

window.soundManager = new SoundManager();
