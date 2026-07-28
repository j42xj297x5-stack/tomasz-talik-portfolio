import { publicPath } from '../utils/publicPath.js';

const DEFAULTS = Object.freeze({ master: 0.7, ambient: 0.4, effects: 0.85 });
const CROSSFADE_SECONDS = 5;
const STORAGE_KEY = 'portfolioAudioSettings';
const EFFECT_PATHS = Object.freeze({
  click: ['/audio/click_01.wav'],
  caseToggle: ['/audio/click_02.wav'],
  glyphClick: ['/audio/click_long_01.wav', '/audio/click_long_02.wav'],
  glyphOpen: ['/audio/glyph_open_01.wav', '/audio/glyph_open_02.wav'],
  glyphClose: ['/audio/glyph_close_01.wav', '/audio/glyph_close_02.wav']
});

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const perceptualGain = (value) => Math.pow(clamp01(value), 2);

class AudioManager {
  constructor() {
    this.context = null;
    this.masterNode = null;
    this.ambientBusNode = null;
    this.effectsBusNode = null;
    this.ambientChannels = [];
    this.buffers = new Map();
    this.pendingBuffers = new Map();
    this.arrayBuffers = new Map();
    this.lastVariant = new Map();
    this.activeAmbient = 0;
    this.startedAmbient = false;
    this.masterVolume = DEFAULTS.master;
    this.lastNonZeroVolume = DEFAULTS.master;
    this.muted = false;
    this.ambientVolume = DEFAULTS.ambient;
    this.effectsVolume = DEFAULTS.effects;
    this.listeners = new Set();
    this.loadSettings();
  }

  loadSettings() {
    try {
      const stored = JSON.parse(window.localStorage?.getItem(STORAGE_KEY) || 'null');
      if (Number.isFinite(stored?.master)) this.masterVolume = clamp01(stored.master);
      if (Number.isFinite(stored?.lastNonZero)) this.lastNonZeroVolume = clamp01(stored.lastNonZero) || DEFAULTS.master;
      else if (this.masterVolume > 0) this.lastNonZeroVolume = this.masterVolume;
      this.muted = Boolean(stored?.muted) || this.masterVolume === 0;
    } catch (error) {
      console.warn('[audio] Stored settings could not be read.', error);
    }
  }

  saveSettings() {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ master: this.masterVolume, muted: this.muted, lastNonZero: this.lastNonZeroVolume }));
    } catch (error) {
      console.warn('[audio] Settings could not be saved.', error);
    }
  }

  ensureContext() {
    if (this.context) return this.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      this.context = new AudioContextClass();
      this.masterNode = this.context.createGain();
      this.ambientBusNode = this.context.createGain();
      this.effectsBusNode = this.context.createGain();
      this.ambientBusNode.connect(this.masterNode);
      this.effectsBusNode.connect(this.masterNode);
      this.masterNode.connect(this.context.destination);
      this.applyGains();
      this.createAmbientChannels();
      this.decodePendingArrays();
    } catch (error) {
      console.warn('[audio] Web Audio initialization failed.', error);
      this.context = null;
    }
    return this.context;
  }

  createAmbientChannels() {
    ['/audio/ambient_01.mp3', '/audio/ambient_02.mp3'].forEach((path, index) => {
      const element = new Audio(publicPath(path));
      element.loop = true;
      element.preload = 'auto';
      const gain = this.context.createGain();
      gain.gain.value = index === 0 ? 1 : 0;
      this.context.createMediaElementSource(element).connect(gain).connect(this.ambientBusNode);
      this.ambientChannels.push({ element, gain });
    });
  }

  applyGains() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.masterNode.gain.setTargetAtTime(this.muted ? 0 : perceptualGain(this.masterVolume), now, 0.025);
    this.ambientBusNode.gain.setTargetAtTime(perceptualGain(this.ambientVolume), now, 0.025);
    this.effectsBusNode.gain.setTargetAtTime(perceptualGain(this.effectsVolume), now, 0.025);
  }

  async unlock() {
    const context = this.ensureContext();
    if (!context) return false;
    try {
      if (context.state === 'suspended') await context.resume();
      return context.state === 'running';
    } catch (error) {
      console.warn('[audio] AudioContext could not be resumed.', error);
      return false;
    }
  }

  preloadEntryEffects() { return this.preloadPools(['click', 'caseToggle']); }
  preloadExperienceEffects() { return this.preloadPools(['glyphClick', 'glyphOpen', 'glyphClose']); }

  preloadPools(names) {
    return Promise.allSettled(names.flatMap((name) => EFFECT_PATHS[name].map((path) => this.loadBuffer(path))));
  }

  async loadBuffer(path) {
    if (this.buffers.has(path)) return this.buffers.get(path);
    if (this.pendingBuffers.has(path)) return this.pendingBuffers.get(path);
    const pending = (async () => {
      try {
        const response = await fetch(publicPath(path));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        this.arrayBuffers.set(path, data);
        const context = this.context;
        if (!context) return null;
        const buffer = await context.decodeAudioData(data.slice(0));
        this.buffers.set(path, buffer);
        return buffer;
      } catch (error) {
        console.warn(`[audio] Optional sound unavailable: ${path}`, error);
        return null;
      } finally {
        this.pendingBuffers.delete(path);
      }
    })();
    this.pendingBuffers.set(path, pending);
    return pending;
  }

  decodePendingArrays() {
    for (const [path, data] of this.arrayBuffers) {
      if (this.buffers.has(path) || this.pendingBuffers.has(path)) continue;
      const pending = this.context.decodeAudioData(data.slice(0))
        .then((buffer) => { this.buffers.set(path, buffer); return buffer; })
        .catch((error) => { console.warn(`[audio] Optional sound could not be decoded: ${path}`, error); return null; })
        .finally(() => this.pendingBuffers.delete(path));
      this.pendingBuffers.set(path, pending);
    }
  }

  async playEffect(poolName) {
    if (!EFFECT_PATHS[poolName]) return;
    if (!await this.unlock()) return;
    const paths = EFFECT_PATHS[poolName];
    let index = paths.length === 1 ? 0 : Math.floor(Math.random() * paths.length);
    if (paths.length > 1 && index === this.lastVariant.get(poolName)) index = (index + 1) % paths.length;
    this.lastVariant.set(poolName, index);
    const path = paths[index];
    const buffer = this.buffers.get(path) || await this.loadBuffer(path);
    if (!buffer || !this.context || !this.effectsBusNode) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.effectsBusNode);
    source.start();
  }

  async startAmbient() {
    if (!await this.unlock() || !this.ambientChannels.length) return;
    if (!this.startedAmbient) {
      this.startedAmbient = true;
      this.activeAmbient = 0;
      this.ambientChannels[0].element.currentTime = 0;
      await Promise.allSettled(this.ambientChannels.map(({ element }) => element.play()));
    }
  }

  setProgressLevel(level) {
    const target = Math.abs(Math.round(Number(level) || 0)) % 2;
    if (!this.startedAmbient || target === this.activeAmbient || !this.context) return;
    const now = this.context.currentTime;
    const from = this.ambientChannels[this.activeAmbient];
    const to = this.ambientChannels[target];
    to.element.currentTime = 0;
    void to.element.play().catch((error) => console.warn('[audio] Ambient could not start.', error));
    const samples = 128;
    const fadeOut = new Float32Array(samples);
    const fadeIn = new Float32Array(samples);
    [from.gain.gain, to.gain.gain].forEach((gain) => {
      if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(now);
      else gain.cancelScheduledValues(now);
    });
    const startOut = Math.max(0, from.gain.gain.value);
    const startIn = Math.max(0, to.gain.gain.value);
    const startPhase = Math.atan2(startIn, startOut || 0.000001);
    for (let i = 0; i < samples; i += 1) {
      const phase = startPhase + (i / (samples - 1)) * (Math.PI / 2 - startPhase);
      fadeOut[i] = Math.cos(phase);
      fadeIn[i] = Math.sin(phase);
    }
    from.gain.gain.setValueCurveAtTime(fadeOut, now, CROSSFADE_SECONDS);
    to.gain.gain.setValueCurveAtTime(fadeIn, now, CROSSFADE_SECONDS);
    this.activeAmbient = target;
  }

  setMasterVolume(value) {
    this.masterVolume = clamp01(value);
    this.muted = this.masterVolume === 0;
    if (this.masterVolume > 0) this.lastNonZeroVolume = this.masterVolume;
    this.applyGains(); this.saveSettings(); this.notify();
  }
  setMuted(value) { this.muted = Boolean(value); this.applyGains(); this.saveSettings(); this.notify(); }
  toggleMuted() { if (this.muted || this.masterVolume === 0) { this.masterVolume = this.lastNonZeroVolume || DEFAULTS.master; this.setMuted(false); } else this.setMuted(true); }
  setAmbientVolume(value) { this.ambientVolume = clamp01(value); this.applyGains(); this.notify(); }
  setEffectsVolume(value) { this.effectsVolume = clamp01(value); this.applyGains(); this.notify(); }
  getState() { return { master: this.masterVolume, muted: this.muted, ambient: this.ambientVolume, effects: this.effectsVolume }; }
  subscribe(listener) { this.listeners.add(listener); listener(this.getState()); return () => this.listeners.delete(listener); }
  notify() { const state = this.getState(); this.listeners.forEach((listener) => listener(state)); }
}

export const audioManager = new AudioManager();
