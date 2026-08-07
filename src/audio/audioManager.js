import { publicPath } from '../utils/publicPath.js';

const DEFAULTS = Object.freeze({ master: 0.7, ambient: 1.0, effects: 1.0 });
const CROSSFADE_SECONDS = 5;
const INTRO_DELAY_SECONDS = 5;
const HOVER_FADE_OUT_SECONDS = 0.2;
const AMBIENT_PATHS = Object.freeze([
  '/audio/ambient_01.mp3',
  '/audio/ambient_02.mp3',
  '/audio/ambient_03.mp3',
  '/audio/ambient_04.mp3',
  '/audio/ambient_05.mp3'
]);
const STORAGE_KEY = 'portfolioAudioSettings';
const EFFECT_PATHS = Object.freeze({
  click: ['/audio/turn_page_02.mp3'],
  caseOpen: ['/audio/bell_01.mp3'],
  caseClose: ['/audio/bell_02.mp3'],
  glyphHover: ['/audio/glif_hover_loop.mp3'],
  glyphEarthOpen: ['/audio/glif_earth_4s_01.mp3'],
  glyphEarthClose: ['/audio/glif_earth_4s_02.mp3'],
  glyphFireOpen: ['/audio/glif_fire_4s_01.mp3'],
  glyphFireClose: ['/audio/glif_fire_4s_02.mp3'],
  glyphWoodOpen: ['/audio/glif_wood_4s_01.mp3'],
  glyphWoodClose: ['/audio/glif_wood_4s_02.mp3'],
  glyphWaterOpen: ['/audio/glif_water_4s_01.mp3'],
  glyphWaterClose: ['/audio/glif_water_4s_02.mp3'],
  glyphMetalOpen: ['/audio/glif_metal_4s_01.mp3'],
  glyphMetalClose: ['/audio/glif_metal_4s_02.mp3']
});
const GLYPH_EFFECTS = Object.freeze({
  'ethics-life-protection': Object.freeze({ open: 'glyphEarthOpen', close: 'glyphEarthClose' }),
  'creative-ai': Object.freeze({ open: 'glyphFireOpen', close: 'glyphFireClose' }),
  'ai-guide': Object.freeze({ open: 'glyphWoodOpen', close: 'glyphWoodClose' }),
  'spotify-digger': Object.freeze({ open: 'glyphMetalOpen', close: 'glyphMetalClose' }),
  'haiku-cosmos': Object.freeze({ open: 'glyphWaterOpen', close: 'glyphWaterClose' })
});
const AMBIENT_BY_PROGRESS_LEVEL = Object.freeze([1, 2, 3, 3, 0, 4]);

const resolveAmbientIndex = (level) => {
  const normalizedLevel = Math.min(5, Math.max(0, Math.round(Number(level) || 0)));
  return AMBIENT_BY_PROGRESS_LEVEL[normalizedLevel];
};

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const perceptualGain = (value) => Math.pow(clamp01(value), 2);

class AudioManager {
  constructor() {
    this.context = null;
    this.masterNode = null;
    this.ambientBusNode = null;
    this.effectsBusNode = null;
    this.ambientChannels = [];
    this.introChannel = null;
    this.buffers = new Map();
    this.pendingBuffers = new Map();
    this.arrayBuffers = new Map();
    this.lastVariant = new Map();
    this.activeAmbient = null;
    this.requestedAmbient = null;
    this.startedAmbient = false;
    this.experienceSequenceStarted = false;
    this.crossfadeVersion = 0;
    this.ambientRequestVersion = 0;
    this.crossfadeCleanupTimer = null;
    this.activeGlyphHover = null;
    this.fadingGlyphHover = null;
    this.pendingGlyphHoverStart = false;
    this.glyphHoverRequestVersion = 0;
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
      this.createStreamingChannels();
      this.decodePendingArrays();
    } catch (error) {
      console.warn('[audio] Web Audio initialization failed.', error);
      this.context = null;
    }
    return this.context;
  }

  createStreamingChannels() {
    const introElement = new Audio(publicPath('/audio/start.mp3'));
    introElement.loop = false;
    introElement.preload = 'auto';
    this.context.createMediaElementSource(introElement).connect(this.ambientBusNode);
    this.introChannel = { element: introElement };

    AMBIENT_PATHS.forEach((path) => {
      const element = new Audio(publicPath(path));
      element.loop = true;
      element.preload = 'auto';
      const gain = this.context.createGain();
      gain.gain.value = 0;
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

  preloadEntryEffects() { return this.preloadPools(['click', 'caseOpen', 'caseClose']); }
  preloadExperienceEffects() { return this.preloadPools(['glyphHover', ...new Set(Object.values(GLYPH_EFFECTS).flatMap(Object.values))]); }

  prepareExperienceAudio() {
    this.ensureContext();
    [this.introChannel, ...this.ambientChannels].forEach((channel) => {
      try { channel?.element.load(); } catch (error) { console.warn('[audio] Optional stream could not be prepared.', error); }
    });
  }

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
        this.cacheDecodedBuffer(path, buffer);
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
        .then((buffer) => { this.cacheDecodedBuffer(path, buffer); return buffer; })
        .catch((error) => { console.warn(`[audio] Optional sound could not be decoded: ${path}`, error); return null; })
        .finally(() => this.pendingBuffers.delete(path));
      this.pendingBuffers.set(path, pending);
    }
  }

  cacheDecodedBuffer(path, buffer) {
    this.buffers.set(path, buffer);
  }

  playCaseToggle(isOpen) { return this.playEffect(isOpen ? 'caseOpen' : 'caseClose'); }

  playGlyphPanel(glyphId, action) {
    const poolName = GLYPH_EFFECTS[glyphId]?.[action];
    if (poolName) return this.playEffect(poolName);
    return undefined;
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

  cleanupGlyphHover(handle) {
    if (!handle || handle.cleaned) return;
    handle.cleaned = true;
    if (this.activeGlyphHover === handle) this.activeGlyphHover = null;
    if (this.fadingGlyphHover === handle) this.fadingGlyphHover = null;
    const { source, gain } = handle;
    if (source) source.onended = null;
    try { source?.disconnect(); } catch (_) { /* The optional node may already be disconnected. */ }
    try { gain?.disconnect(); } catch (_) { /* The optional node may already be disconnected. */ }
    handle.source = null;
    handle.gain = null;
  }

  stopGlyphHoverHandle(handle) {
    if (!handle || handle.cleaned || !this.context || handle.stopping) return;
    handle.stopping = true;
    if (this.activeGlyphHover === handle) this.activeGlyphHover = null;
    try {
      const now = this.context.currentTime;
      const fadeDuration = HOVER_FADE_OUT_SECONDS;
      const fadeEndsAt = now + fadeDuration;
      const parameter = handle.gain.gain;
      if (typeof parameter.cancelAndHoldAtTime === 'function') parameter.cancelAndHoldAtTime(now);
      else {
        const currentGain = clamp01(parameter.value);
        parameter.cancelScheduledValues(now);
        parameter.setValueAtTime(currentGain, now);
      }
      const currentGain = clamp01(parameter.value);
      const fadeCurve = this.createFadeCurve(currentGain, 1, false);
      fadeCurve[fadeCurve.length - 1] = 0;
      parameter.setValueCurveAtTime(fadeCurve, now, fadeDuration);
      this.fadingGlyphHover = handle;
      handle.source.stop(fadeEndsAt);
    } catch (error) {
      console.warn('[audio] Glyph hover fade could not be scheduled.', error);
      try { handle.source?.stop(); } catch (_) { /* The optional source may already be stopped. */ }
      this.cleanupGlyphHover(handle);
    }
  }

  async startGlyphHover() {
    if (this.pendingGlyphHoverStart || this.activeGlyphHover || this.fadingGlyphHover) return;
    this.pendingGlyphHoverStart = true;
    const requestVersion = ++this.glyphHoverRequestVersion;
    try {
      if (!await this.unlock() || requestVersion !== this.glyphHoverRequestVersion) return;
      const path = EFFECT_PATHS.glyphHover[0];
      const buffer = this.buffers.get(path) || await this.loadBuffer(path);
      if (requestVersion !== this.glyphHoverRequestVersion || !buffer || !this.context || !this.effectsBusNode) return;

      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      const handle = { source, gain, stopping: false, cleaned: false };
      source.buffer = buffer;
      source.loop = true;
      const now = this.context.currentTime;
      gain.gain.setValueAtTime(1, now);
      source.connect(gain).connect(this.effectsBusNode);
      source.onended = () => this.cleanupGlyphHover(handle);
      this.activeGlyphHover = handle;
      source.start();
    } finally {
      this.pendingGlyphHoverStart = false;
    }
  }

  stopGlyphHover() {
    this.glyphHoverRequestVersion += 1;
    this.stopGlyphHoverHandle(this.activeGlyphHover);
  }

  startExperienceSequence() {
    if (this.experienceSequenceStarted) return;
    this.experienceSequenceStarted = true;
    const attemptStartedAt = performance.now();
    const startAmbientAfter = (delayMilliseconds) => window.setTimeout(() => this.startInitialAmbient(), delayMilliseconds);
    const intro = this.introChannel?.element;
    if (!intro) {
      startAmbientAfter(INTRO_DELAY_SECONDS * 1000);
      return;
    }
    const handleFailure = (error) => {
      console.warn('[audio] Intro sound could not start.', error);
      const elapsed = performance.now() - attemptStartedAt;
      startAmbientAfter(Math.max(0, INTRO_DELAY_SECONDS * 1000 - elapsed));
    };
    try {
      intro.currentTime = 0;
      Promise.resolve(intro.play()).then(() => {
        startAmbientAfter(INTRO_DELAY_SECONDS * 1000);
      }).catch(handleFailure);
    } catch (error) {
      handleFailure(error);
    }
  }

  async startInitialAmbient() {
    if (this.startedAmbient || !this.context || !this.ambientChannels.length) return;
    const target = this.requestedAmbient ?? resolveAmbientIndex(0);
    const channel = this.ambientChannels[target];
    channel.element.currentTime = 0;
    try {
      await channel.element.play();
    } catch (error) {
      console.warn('[audio] Initial ambient could not start.', error);
      return;
    }
    this.startedAmbient = true;
    this.activeAmbient = target;
    this.requestedAmbient = target;
    const now = this.context.currentTime;
    channel.gain.gain.cancelScheduledValues(now);
    channel.gain.gain.setValueAtTime(0, now);
    channel.gain.gain.setValueCurveAtTime(this.createFadeCurve(0, 1, true), now, CROSSFADE_SECONDS);
  }

  setProgressLevel(level) {
    const target = resolveAmbientIndex(level);
    if (target === this.requestedAmbient) return;
    this.requestedAmbient = target;
    const requestVersion = ++this.ambientRequestVersion;
    if (!this.startedAmbient || target === this.activeAmbient || !this.context) return;
    const to = this.ambientChannels[target];
    try {
      to.element.currentTime = 0;
      void Promise.resolve(to.element.play()).then(() => {
        if (requestVersion !== this.ambientRequestVersion) {
          to.element.pause();
          to.element.currentTime = 0;
          return;
        }
        this.crossfadeTo(target);
      }).catch((error) => console.warn('[audio] Ambient could not start.', error));
    } catch (error) {
      console.warn('[audio] Ambient could not start.', error);
    }
  }

  createFadeCurve(start, end, fadeIn) {
    const samples = 128;
    const curve = new Float32Array(samples);
    const safeStart = clamp01(start);
    const startPhase = fadeIn ? Math.asin(safeStart) : Math.acos(safeStart);
    for (let i = 0; i < samples; i += 1) {
      const phase = startPhase + (i / (samples - 1)) * (Math.PI / 2 - startPhase);
      curve[i] = fadeIn ? Math.sin(phase) * end : Math.cos(phase) * end;
    }
    return curve;
  }

  crossfadeTo(target) {
    if (!this.context || target === this.activeAmbient) return;
    const now = this.context.currentTime;
    const version = ++this.crossfadeVersion;
    if (this.crossfadeCleanupTimer) window.clearTimeout(this.crossfadeCleanupTimer);
    this.ambientChannels.forEach((channel, index) => {
      const parameter = channel.gain.gain;
      if (typeof parameter.cancelAndHoldAtTime === 'function') parameter.cancelAndHoldAtTime(now);
      else parameter.cancelScheduledValues(now);
      const start = clamp01(parameter.value);
      parameter.setValueCurveAtTime(this.createFadeCurve(start, 1, index === target), now, CROSSFADE_SECONDS);
    });
    this.activeAmbient = target;
    this.crossfadeCleanupTimer = window.setTimeout(() => {
      if (version !== this.crossfadeVersion) return;
      this.ambientChannels.forEach((channel, index) => {
        if (index === target) return;
        channel.element.pause();
        channel.element.currentTime = 0;
        channel.gain.gain.setValueAtTime(0, this.context.currentTime);
      });
      this.crossfadeCleanupTimer = null;
    }, CROSSFADE_SECONDS * 1000);
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
