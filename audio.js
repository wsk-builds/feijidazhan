(function () {
  "use strict";

  const UNIVERSE_BGM = [
    {
      root: 261.63,
      scale: [0, 2, 3, 5, 7, 8, 10, 12],
      lead: [0, 3, 5, 7, 5, 3, 2, 0, 5, 7, 8, 7, 5, 3, 2, 0],
      bass: [0, 0, 7, 7, 0, 0, 5, 5],
      pad: [0, 3, 7],
      leadWave: "square",
      padWave: "sine",
    },
    {
      root: 196.0,
      scale: [0, 3, 5, 6, 7, 10, 12],
      lead: [0, 3, 6, 7, 6, 3, 0, 7, 3, 6, 7, 10, 7, 6, 3, 0],
      bass: [0, 0, 6, 6, 0, 0, 7, 7],
      pad: [0, 3, 6],
      leadWave: "sawtooth",
      padWave: "triangle",
    },
    {
      root: 293.66,
      scale: [0, 2, 4, 5, 7, 9, 11, 12],
      lead: [0, 2, 4, 7, 4, 2, 0, 7, 4, 5, 7, 9, 7, 5, 4, 2],
      bass: [0, 0, 5, 5, 0, 0, 7, 7],
      pad: [0, 4, 7],
      leadWave: "square",
      padWave: "sine",
    },
    {
      root: 220.0,
      scale: [0, 2, 4, 6, 8, 10, 12],
      lead: [0, 4, 6, 8, 6, 4, 0, 8, 4, 6, 8, 10, 8, 6, 4, 0],
      bass: [0, 0, 6, 6, 0, 0, 8, 8],
      pad: [0, 4, 8],
      leadWave: "square",
      padWave: "triangle",
    },
  ];

  const BOSS_LEAD = [0, 0, 3, 3, 0, 0, 7, 7, 0, 3, 7, 3, 0, 0, 3, 7];

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.enabled = false;
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.bgmBar = 0;
      this.muted = false;
      this.bgmUniverse = 0;
      this.bgmMode = "normal";
      this.bgmBaseGain = 0.11;
      this.sfxBaseGain = 0.3;
    }

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmBaseGain;
      this.sfxGain.gain.value = this.sfxBaseGain;
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

    setUniverse(index) {
      this.bgmUniverse = ((index % UNIVERSE_BGM.length) + UNIVERSE_BGM.length) % UNIVERSE_BGM.length;
    }

    setBgmMode(mode) {
      if (mode === "normal" || mode === "boss" || mode === "stinger") {
        this.bgmMode = mode;
      }
    }

    _theme() {
      return UNIVERSE_BGM[this.bgmUniverse];
    }

    _note(degree, octaveOffset) {
      const theme = this._theme();
      const idx = ((degree % theme.scale.length) + theme.scale.length) % theme.scale.length;
      const semi = theme.scale[idx] + (octaveOffset || 0) * 12;
      return theme.root * Math.pow(2, semi / 12);
    }

    _duckBgm(duration, level) {
      if (!this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const g = this.bgmGain.gain;
      const target = this.bgmBaseGain * (level == null ? 0.2 : level);
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(target, t + 0.06);
      g.linearRampToValueAtTime(this.bgmBaseGain, t + duration);
    }

    _scheduleTone(freq, at, duration, type, volume, dest, env) {
      if (!this.ctx || !freq) return;
      const t = this.ctx.currentTime + (at || 0);
      const attack = (env && env.attack) || 0.008;
      const decay = (env && env.decay) || Math.max(0.02, duration * 0.35);
      const sustain = (env && env.sustain) != null ? env.sustain : 0.45;
      const release = (env && env.release) || Math.max(0.04, duration - attack - decay);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(volume, t + attack);
      gain.gain.linearRampToValueAtTime(volume * sustain, t + attack + decay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + attack + decay + release);
      osc.connect(gain);
      gain.connect(dest || this.sfxGain);
      osc.start(t);
      osc.stop(t + attack + decay + release + 0.02);
    }

    _scheduleSweep(freqFrom, freqTo, at, duration, type, volume, dest) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + (at || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freqFrom, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t + duration);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(dest || this.sfxGain);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    }

    _layeredNoise(at, duration, volume, lowFreq, highFreq, dest) {
      if (!this.ctx) return;
      const out = dest || this.sfxGain;
      const t = this.ctx.currentTime + (at || 0);
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = lowFreq || 400;
      filter.Q.value = 0.7;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(t);
      const src2 = this.ctx.createBufferSource();
      src2.buffer = buffer;
      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = "highpass";
      filter2.frequency.value = highFreq || 2200;
      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(volume * 0.35, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);
      src2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(out);
      src2.start(t);
    }

    _playSequence(notes, opts) {
      if (!this.enabled) return;
      const gap = (opts && opts.gap) || 0.11;
      const type = (opts && opts.type) || "sine";
      const volume = (opts && opts.volume) || 0.14;
      const dest = (opts && opts.dest) || this.sfxGain;
      const dur = (opts && opts.duration) || 0.14;
      notes.forEach((freq, i) => {
        this._scheduleTone(freq, i * gap, dur, type, volume, dest);
      });
    }

    _bgmTick() {
      if (!this.ctx || this.muted || this.bgmMode === "stinger") return;
      const theme = this._theme();
      const step = this.bgmStep % 16;
      const bar = Math.floor(this.bgmStep / 16);
      const isBoss = this.bgmMode === "boss";
      const leadPat = isBoss ? BOSS_LEAD : theme.lead;
      const bassPat = theme.bass;

      if (step % 4 === 0) {
        const bassDeg = bassPat[Math.floor(step / 2) % bassPat.length];
        this._scheduleTone(
          this._note(bassDeg, -1),
          0,
          isBoss ? 0.22 : 0.28,
          "triangle",
          isBoss ? 0.09 : 0.07,
          this.bgmGain,
        );
      }

      if (step % 2 === 0) {
        this._layeredNoise(0, 0.02, 0.012, 5000, 9000, this.bgmGain);
      }

      if (step % 2 === 1) {
        const leadDeg = leadPat[(step + bar) % leadPat.length];
        this._scheduleTone(
          this._note(leadDeg, 0),
          0,
          isBoss ? 0.1 : 0.14,
          theme.leadWave,
          isBoss ? 0.045 : 0.038,
          this.bgmGain,
        );
      }

      if (step === 0) {
        theme.pad.forEach((deg, i) => {
          this._scheduleTone(
            this._note(deg, 0),
            i * 0.02,
            isBoss ? 0.5 : 0.65,
            theme.padWave,
            isBoss ? 0.028 : 0.022,
            this.bgmGain,
          );
        });
      }

      if (isBoss && step % 8 === 0) {
        this._scheduleTone(this._note(0, -2), 0, 0.18, "sawtooth", 0.06, this.bgmGain);
      }

      this.bgmStep++;
      if (step === 15) this.bgmBar++;
    }

    startBgm() {
      if (!this.enabled) return;
      this.resume();
      if (this.bgmTimer) return;
      this.bgmStep = 0;
      this.bgmBar = 0;
      if (this.bgmMode === "stinger") this.bgmMode = "normal";
      const interval = () => (this.bgmMode === "boss" ? 95 : 108);
      const tick = () => {
        this._bgmTick();
        if (this.bgmTimer) this.bgmTimer = setTimeout(tick, interval());
      };
      this.bgmTimer = setTimeout(tick, interval());
    }

    stopBgm() {
      if (this.bgmTimer) {
        clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    playShoot() {
      if (!this.enabled) return;
      this._scheduleSweep(920, 480, 0, 0.06, "square", 0.07);
      this._layeredNoise(0, 0.02, 0.04, 3000, 5000);
    }

    playHit() {
      if (!this.enabled) return;
      this._scheduleTone(1800, 0, 0.025, "square", 0.06);
      this._scheduleTone(280, 0.005, 0.1, "sawtooth", 0.11, this.sfxGain, { attack: 0.002, decay: 0.04, sustain: 0.3, release: 0.06 });
    }

    playExplode(size) {
      if (!this.enabled) return;
      const tier = size === "large" ? "large" : size === "medium" ? "medium" : "small";
      const cfg = {
        small: { dur: 0.1, vol: 0.14, low: 500, thump: 140, thumpVol: 0.08 },
        medium: { dur: 0.16, vol: 0.2, low: 380, thump: 95, thumpVol: 0.12 },
        large: { dur: 0.28, vol: 0.28, low: 260, thump: 65, thumpVol: 0.18 },
      }[tier];
      this._layeredNoise(0, cfg.dur, cfg.vol, cfg.low, cfg.low * 4);
      this._scheduleTone(cfg.thump, 0, cfg.dur * 0.9, "sawtooth", cfg.thumpVol, this.sfxGain, { attack: 0.003, decay: 0.08, sustain: 0.2, release: 0.15 });
    }

    playPickup(type) {
      if (!this.enabled) return;
      const t = type || "power";
      const seq = {
        power: { notes: [523, 659, 784], type: "square", gap: 0.07, vol: 0.12 },
        shield: { notes: [392, 523], type: "sine", gap: 0.14, vol: 0.16 },
        speed: { sweep: [440, 880], vol: 0.1 },
        bomb: { notes: [110, 82], type: "triangle", gap: 0.1, vol: 0.18 },
        laser: { notes: [880, 1100, 1320], type: "sawtooth", gap: 0.06, vol: 0.09 },
        missile: { notes: [330, 440, 330, 550], type: "square", gap: 0.08, vol: 0.11 },
        health: { notes: [523, 659, 784, 988], type: "sine", gap: 0.09, vol: 0.13 },
        life: { notes: [392, 494, 587, 740], type: "sine", gap: 0.1, vol: 0.14 },
      }[t] || { notes: [523, 784], type: "sine", gap: 0.09, vol: 0.13 };

      if (seq.sweep) {
        this._scheduleSweep(seq.sweep[0], seq.sweep[1], 0, 0.18, "square", seq.vol);
      } else {
        this._playSequence(seq.notes, { gap: seq.gap, type: seq.type, volume: seq.vol, duration: 0.12 });
      }
    }

    playDamage() {
      if (!this.enabled) return;
      this._scheduleTone(90, 0, 0.3, "sawtooth", 0.2, this.sfxGain, { attack: 0.003, decay: 0.1, sustain: 0.25, release: 0.18 });
      this._layeredNoise(0, 0.14, 0.16, 200, 1200);
      this._scheduleSweep(400, 120, 0.04, 0.2, "sawtooth", 0.08);
    }

    playBoss(isMega) {
      if (!this.enabled) return;
      const notes = isMega ? [130, 165, 196, 247, 294] : [165, 196, 247, 294];
      notes.forEach((f, i) => {
        this._scheduleTone(f, i * 0.16, 0.28, "sawtooth", isMega ? 0.16 : 0.13, this.sfxGain);
      });
      if (isMega) {
        this._layeredNoise(0.5, 0.35, 0.12, 180, 800);
        this._scheduleTone(this._note(0, -1), 0.55, 0.4, "square", 0.1, this.sfxGain);
      }
      this.setBgmMode("boss");
    }

    playWaveRetreat() {
      if (!this.enabled) return;
      this._duckBgm(1.2, 0.35);
      const theme = this._theme();
      const notes = [theme.root * 1.5, theme.root * 1.25, theme.root];
      this._playSequence(notes, { gap: 0.14, type: "triangle", volume: 0.12, duration: 0.2 });
      this._layeredNoise(0.42, 0.12, 0.08, 900, 3000);
    }

    playBattlefieldClear() {
      if (!this.enabled) return;
      const theme = this._theme();
      const notes = [theme.root, theme.root * 1.25, theme.root * 1.5, theme.root * 2];
      this._playSequence(notes, { gap: 0.1, type: "sine", volume: 0.1, duration: 0.16 });
    }

    playBossDefeat(isMega) {
      if (!this.enabled) return;
      if (isMega) {
        this._playSequence([392, 494, 587, 740, 880], { gap: 0.1, type: "square", volume: 0.14 });
        this._scheduleTone(110, 0.45, 0.35, "sawtooth", 0.12);
      } else {
        this._playSequence([523, 659, 784], { gap: 0.09, type: "sine", volume: 0.13 });
      }
    }

    playStageClear() {
      if (!this.enabled) return;
      this.setBgmMode("stinger");
      this._duckBgm(1.8, 0);
      const notes = [523, 659, 784, 988, 784, 988, 1175];
      this._playSequence(notes, { gap: 0.12, type: "square", volume: 0.15, duration: 0.18 });
      this._scheduleTone(196, 0.6, 0.5, "triangle", 0.08, this.sfxGain);
    }

    playUniverseJump() {
      if (!this.enabled) return;
      this.setBgmMode("stinger");
      this._duckBgm(3.2, 0);
      this._scheduleSweep(220, 1760, 0, 1.6, "sawtooth", 0.1);
      this._layeredNoise(0.2, 1.4, 0.14, 400, 2400);
      const theme = this._theme();
      [0, 0.5, 1.0, 1.5, 2.0].forEach((at, i) => {
        this._scheduleTone(theme.root * Math.pow(2, (i * 2) / 12), at, 0.35, "sine", 0.1 - i * 0.01, this.sfxGain);
      });
      this._playSequence(
        [theme.root * 2, theme.root * 2.5, theme.root * 3, theme.root * 4],
        { gap: 0.25, type: "square", volume: 0.11, duration: 0.3 },
      );
    }

    playGameOver() {
      if (!this.enabled) return;
      this.setBgmMode("stinger");
      this._playSequence([392, 349, 311, 262, 196], { gap: 0.22, type: "sawtooth", volume: 0.12, duration: 0.35 });
      this._scheduleTone(98, 0.9, 0.8, "triangle", 0.1);
    }

    playStageStart() {
      if (!this.enabled) return;
      this._scheduleTone(this._note(7, 0), 0, 0.08, "sine", 0.08);
    }

    playAllySuccess() {
      if (!this.enabled) return;
      this._playSequence([392, 523, 659, 784], { gap: 0.1, type: "sine", volume: 0.12 });
    }

    playAllyFail() {
      if (!this.enabled) return;
      this._playSequence([220, 185, 165], { gap: 0.15, type: "sawtooth", volume: 0.1, duration: 0.25 });
    }
  }

  window.GameAudio = new AudioManager();
})();