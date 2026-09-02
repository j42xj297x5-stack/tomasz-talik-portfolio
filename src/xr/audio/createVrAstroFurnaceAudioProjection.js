import * as THREE from '../../vendor/three.js';

const PROCESS_PATHS = Object.freeze({
  ordinary: '/audio/astro_piec_work_01.mp3',
  runeTuning: '/audio/astro_piec_work_03.mp3',
  construction: '/audio/astro_piec_work_create_01.mp3'
});

export function createVrAstroFurnaceAudioProjection({ audioBridge, getEmitterAnchor, spatialSettings }) {
  if (!audioBridge?.startSpatialProcessSource || typeof getEmitterAnchor !== 'function') {
    throw new TypeError('Astro Furnace audio projection requires the VR audio bridge and emitter anchor.');
  }
  const maxDistanceMeters = spatialSettings?.maxDistanceMeters;
  const refDistanceMeters = spatialSettings?.refDistanceMeters;
  if (!(maxDistanceMeters > 0) || !(refDistanceMeters > 0 && refDistanceMeters < maxDistanceMeters)) {
    throw new TypeError('Astro Furnace spatial distances must satisfy 0 < ref < max.');
  }

  const emitterPosition = new THREE.Vector3();
  const transientHandles = new Set();
  const processes = new Map(Object.keys(PROCESS_PATHS).map((kind) => [kind,
    { handle: null, pending: false, token: 0 }]));
  let generation = 0;
  let disposed = false;

  function readEmitterPosition() {
    const anchor = getEmitterAnchor();
    if (!anchor?.getWorldPosition) return false;
    anchor.updateWorldMatrix(true, false);
    anchor.getWorldPosition(emitterPosition);
    return true;
  }
  const sourceOptions = () => ({ loop: false, maxDistanceMeters, refDistanceMeters,
    panningModel: 'HRTF', distanceModel: 'linear', rolloffFactor: 1 });
  function positionHandle(handle) {
    if (!handle || !readEmitterPosition()) return false;
    handle.setPosition(emitterPosition.x, emitterPosition.y, emitterPosition.z);
    return true;
  }
  function playPhysicalOneShot(path) {
    if (disposed || !path || !readEmitterPosition()) return false;
    const expectedGeneration = generation;
    void audioBridge.startSpatialProcessSource(path, 'DEVICE', sourceOptions()).then((handle) => {
      if (!handle) return;
      if (disposed || generation !== expectedGeneration || !positionHandle(handle)) { handle.stop?.(); return; }
      transientHandles.add(handle);
      handle.onEnded?.(() => transientHandles.delete(handle));
    });
    return true;
  }
  function startProcess(kind) {
    const entry = processes.get(kind);
    if (disposed || !entry || entry.handle || entry.pending || !readEmitterPosition()) return false;
    const token = ++entry.token;
    const expectedGeneration = generation;
    entry.pending = true;
    void audioBridge.startSpatialProcessSource(PROCESS_PATHS[kind], 'DEVICE', sourceOptions()).then((handle) => {
      if (entry.token === token) entry.pending = false;
      if (!handle) return;
      if (disposed || generation !== expectedGeneration || entry.token !== token || !positionHandle(handle)) {
        handle.stop?.(); return;
      }
      entry.handle = handle;
      handle.onEnded?.(() => { if (entry.handle === handle) entry.handle = null; });
    });
    return true;
  }
  function stopProcess(kind) {
    const entry = processes.get(kind);
    if (!entry) return;
    entry.token += 1;
    entry.pending = false;
    try { entry.handle?.stop?.(); } catch (_) { /* Optional audio is fail-soft. */ }
    entry.handle = null;
  }
  function update() {
    if (disposed || !readEmitterPosition()) return;
    transientHandles.forEach((handle) => handle.setPosition(emitterPosition.x, emitterPosition.y, emitterPosition.z));
    processes.forEach((entry) => entry.handle?.setPosition(emitterPosition.x, emitterPosition.y, emitterPosition.z));
  }
  function reset() {
    generation += 1;
    transientHandles.forEach((handle) => { try { handle.stop?.(); } catch (_) { /* Optional audio is fail-soft. */ } });
    transientHandles.clear();
    processes.forEach((_, kind) => stopProcess(kind));
  }
  function dispose() { if (disposed) return; reset(); disposed = true; }

  return { playPhysicalOneShot, startProcess, stopProcess, update, reset, dispose };
}
