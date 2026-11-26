/**
 * Synthesizes realistic tactile camera sounds offline via Web Audio API.
 */

class ShutterAudio {
  constructor() {
    this.ctx = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a crisp two-curtain mechanical SLR shutter click.
   */
  playShutter() {
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this._noiseBurst(ctx, now, 0.032, 2400, 0.42);
    this._thump(ctx, now, 130, 52, 0.045, 0.32);

    // Second curtain release ~65ms later
    this._noiseBurst(ctx, now + 0.068, 0.026, 3100, 0.28);
    this._thump(ctx, now + 0.068, 160, 70, 0.035, 0.20);
  }

  /**
   * Plays a soft tactile dial click when switching film stocks.
   */
  playDialClick() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this._noiseBurst(ctx, now, 0.012, 4200, 0.12);
  }

  /**
   * Plays a retro quartz self-timer beep.
   */
  playBeep(final = false) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(final ? 1320 : 880, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (final ? 0.18 : 0.09));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (final ? 0.2 : 0.1));
  }

  _noiseBurst(ctx, startTime, duration, filterFreq, level) {
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      const env = Math.pow(1 - i / sampleCount, 2.2);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.setValueAtTime(1.1, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(startTime);
  }

  _thump(ctx, startTime, freqStart, freqEnd, duration, level) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freqStart, startTime);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);

    gain.gain.setValueAtTime(level, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }
}

export const shutterAudio = new ShutterAudio();
