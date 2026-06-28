(function () {
  "use strict";

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.enabled = false;
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.muted = false;
    }

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.12;
      this.sfxGain.gain.value = 0.28;
      this.bgmGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.enabled = true;
    }

    resume() {
      if (!this.ctx) this.init();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 1;
      return this.muted;
    }

    startBgm() {
      if (!this.enabled || this.bgmTimer) return;
      const scale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
      this.bgmTimer = setInterval(() => {
        if (!this.ctx || this.muted) return;
        const freq = scale[this.bgmStep % scale.length];
        this.bgmStep++;
        this._tone(freq, 0.18, "square", 0.06, this.bgmGain);
        if (this.bgmStep % 2 === 0) {
          this._tone(freq / 2, 0.28, "sine", 0.04, this.bgmGain);
        }
      }, 280);
    }

    stopBgm() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    _tone(freq, duration, type, volume, dest) {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(dest || this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);
    }

    _noise(duration, volume) {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(t);
    }

    playShoot() {
      if (!this.enabled) return;
      this._tone(880, 0.05, "square", 0.08);
    }

    playHit() {
      if (!this.enabled) return;
      this._tone(220, 0.08, "sawtooth", 0.1);
    }

    playExplode() {
      if (!this.enabled) return;
      this._noise(0.15, 0.2);
      this._tone(110, 0.2, "sawtooth", 0.12);
    }

    playPickup() {
      if (!this.enabled) return;
      this._tone(523, 0.08, "sine", 0.15);
      setTimeout(() => this._tone(784, 0.12, "sine", 0.12), 80);
    }

    playDamage() {
      if (!this.enabled) return;
      this._tone(150, 0.25, "sawtooth", 0.18);
      this._noise(0.1, 0.12);
    }

    playBoss() {
      if (!this.enabled) return;
      [200, 250, 300].forEach((f, i) => {
        setTimeout(() => this._tone(f, 0.3, "square", 0.14), i * 200);
      });
    }

    playAllySuccess() {
      if (!this.enabled) return;
      [392, 523, 659, 784].forEach((f, i) => {
        setTimeout(() => this._tone(f, 0.15, "sine", 0.12), i * 100);
      });
    }

    playAllyFail() {
      if (!this.enabled) return;
      this._tone(180, 0.4, "sawtooth", 0.1);
    }
  }

  window.GameAudio = new AudioManager();
})();