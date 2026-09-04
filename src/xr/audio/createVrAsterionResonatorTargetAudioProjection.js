import * as THREE from '../../vendor/three.js';

const AIM_PATHS = Object.freeze(Array.from({ length: 4 }, (_, index) => `/audio/resonator_aim_0${index + 1}.mp3`));
const LOCK_PATHS = Object.freeze(Array.from({ length: 4 }, (_, index) => `/audio/resonator_lock_0${index + 1}.mp3`));
export const VR_ASTERION_RESONATOR_TARGET_AUDIO = Object.freeze([...AIM_PATHS, ...LOCK_PATHS]);

export function createVrAsterionResonatorTargetAudioProjection({ audioBridge, acquisitionActor, settings,
  setTimer = setTimeout, clearTimer = clearTimeout }) {
  if (!audioBridge?.startSpatialProcessSource || !acquisitionActor?.subscribe) {
    throw new TypeError('Resonator target audio requires audio and acquisition observers.');
  }
  const { maxDistanceMeters, refDistanceMeters, aimFadeOutSeconds, lockFadeOutSeconds } = settings ?? {};
  if (!(maxDistanceMeters > 0) || !(refDistanceMeters > 0 && refDistanceMeters < maxDistanceMeters)
    || !(aimFadeOutSeconds >= 0) || !(lockFadeOutSeconds >= 0)) {
    throw new TypeError('Invalid Resonator target audio settings.');
  }
  const targets = new Map();
  const worldPosition = new THREE.Vector3();
  let aimCursor = 0, lockCursor = 0, generation = 0, disposed = false;

  function stopHandle(handle) { try { handle?.stop?.(); } catch (_) { /* Optional audio is fail-soft. */ } }
  function retire(entry, kind, fadeSeconds) {
    const slot = entry[kind];
    slot.token += 1;
    slot.pending = false;
    const handle = slot.handle;
    slot.handle = null;
    if (slot.timer !== null) {
      clearTimer(slot.timer);
      stopHandle(slot.retiringHandle);
    }
    slot.timer = null;
    slot.retiringHandle = null;
    try { handle?.rampTo?.(0, fadeSeconds); } catch (_) { /* Optional audio is fail-soft. */ }
    if (handle && fadeSeconds > 0) {
      slot.retiringHandle = handle;
      if (kind !== 'lock') slot.owned = false;
      slot.timer = setTimer(() => {
        slot.timer = null;
        slot.retiringHandle = null;
        stopHandle(handle);
        if (kind === 'lock') slot.owned = false;
      }, fadeSeconds * 1000);
    } else {
      stopHandle(handle);
      slot.owned = false;
    }
  }
  function start(entry, kind, path) {
    const slot = entry[kind];
    if (slot.pending || slot.handle || (kind === 'lock' && (slot.owned || slot.retiringHandle))) return false;
    slot.owned = true;
    slot.pending = true;
    const token = ++slot.token, expectedGeneration = generation;
    void audioBridge.startSpatialProcessSource(path, 'DEVICE', {
      loop: true, maxDistanceMeters, refDistanceMeters,
      panningModel: 'HRTF', distanceModel: 'linear', rolloffFactor: 1
    }).then((handle) => {
      if (slot.token === token) slot.pending = false;
      if (!handle) return;
      if (disposed || generation !== expectedGeneration || slot.token !== token) { stopHandle(handle); return; }
      entry.anchor.updateWorldMatrix(true, false);
      entry.anchor.getWorldPosition(worldPosition);
      handle.setPosition(worldPosition.x, worldPosition.y, worldPosition.z);
      slot.handle = handle;
      handle.onEnded?.(() => { if (slot.handle === handle) slot.handle = null; });
    });
    return true;
  }
  function observe(state) {
    if (disposed) return;
    const entry = targets.get(state?.id);
    if (!entry) return;
    if (!entry.state.insideField && state.insideField && state.ringCount < 3
      && start(entry, 'aim', AIM_PATHS[aimCursor % AIM_PATHS.length])) aimCursor += 1;
    if ((entry.state.insideField && !state.insideField)
      || (entry.state.ringCount < 3 && state.ringCount === 3)) retire(entry, 'aim', aimFadeOutSeconds);
    if (entry.state.ringCount < 3 && state.ringCount === 3
      && start(entry, 'lock', LOCK_PATHS[lockCursor % LOCK_PATHS.length])) lockCursor += 1;
    else if (entry.state.ringCount > 0 && state.ringCount === 0) retire(entry, 'lock', lockFadeOutSeconds);
    entry.state = state;
  }
  const unsubscribe = acquisitionActor.subscribe(observe);
  function reset() {
    generation += 1;
    targets.forEach((entry) => {
      retire(entry, 'aim', 0); retire(entry, 'lock', 0);
      entry.state = Object.freeze({ id: entry.id, insideField: false, ringCount: 0, signVisible: false, pullReady: false });
    });
  }
  return {
    registerTarget({ id, anchor } = {}) {
      if (disposed || !id || !anchor?.getWorldPosition || targets.has(id)) throw new TypeError('Unique target id and anchor are required.');
      targets.set(id, { id, anchor, state: acquisitionActor.getTargetState(id) ?? { id, insideField: false, ringCount: 0 },
        aim: { handle: null, token: 0, timer: null, retiringHandle: null, pending: false, owned: false },
        lock: { handle: null, token: 0, timer: null, retiringHandle: null, pending: false, owned: false } });
    },
    update() {
      if (disposed) return;
      targets.forEach((entry) => {
        if (!entry.aim.handle && !entry.lock.handle) return;
        entry.anchor.updateWorldMatrix(true, false);
        entry.anchor.getWorldPosition(worldPosition);
        entry.aim.handle?.setPosition(worldPosition.x, worldPosition.y, worldPosition.z);
        entry.lock.handle?.setPosition(worldPosition.x, worldPosition.y, worldPosition.z);
      });
    },
    reset,
    dispose() { if (disposed) return; reset(); unsubscribe(); targets.clear(); disposed = true; }
  };
}
