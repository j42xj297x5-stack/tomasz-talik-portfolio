import * as THREE from '../../vendor/three.js';
import { VR_RUNE_STONE_STATE } from '../runes/createVrRuneStoneActor.js';
import { VR_NATURAL_RUNE_STONE_ASSETS } from '../runes/vrRuneStoneRegistry.js';

const AUDIO_BY_BRANCH = Object.freeze({
  fire: Object.freeze({ loop: '/audio/noise_laud_loop_04.mp3', install: '/audio/creating_02.mp3' }),
  metal: Object.freeze({ loop: '/audio/noise_laud_loop_05.mp3', install: '/audio/creating_04.mp3' }),
  earth: Object.freeze({ loop: '/audio/noise_laud_loop_06.mp3', install: '/audio/creating_01.mp3' }),
  wood: Object.freeze({ loop: '/audio/noise_laud_loop_07.mp3', install: '/audio/creating_03.mp3' }),
  water: Object.freeze({ loop: '/audio/noise_laud_loop_08.mp3', install: '/audio/creating_05.mp3' })
});

export const VR_RUNE_STONE_INSTALL_AUDIO = Object.freeze(
  Object.values(AUDIO_BY_BRANCH).map(({ install }) => install)
);

export function createVrRuneStoneAudioProjection({ audioBridge, runeStoneActor,
  runeStoneProgressionController, getEmitterAnchor, spatialSettings }) {
  if (!audioBridge?.startSpatialProcessSource) {
    throw new TypeError('Rune Stone audio projection requires the VR audio bridge.');
  }
  if (!runeStoneActor?.getState
    || !runeStoneProgressionController?.isFamilyInstalled) {
    throw new TypeError('Rune Stone physical and progression truth are required.');
  }
  if (typeof getEmitterAnchor !== 'function') {
    throw new TypeError('Rune Stone audio projection requires a platform emitter anchor accessor.');
  }
  const maxDistanceMeters = spatialSettings?.maxDistanceMeters;
  const refDistanceMeters = spatialSettings?.refDistanceMeters;
  if (!(maxDistanceMeters > 0) || !(refDistanceMeters > 0 && refDistanceMeters < maxDistanceMeters)) {
    throw new TypeError('Rune Stone spatial distances must satisfy 0 < ref < max.');
  }
  const entries = new Map(VR_NATURAL_RUNE_STONE_ASSETS.map((descriptor) => [descriptor.branchId,
    { descriptor, handle: null, pending: false, token: 0 }]));
  const emitterPosition = new THREE.Vector3();
  let generation = 0, disposed = false;

  const isInstalled = ({ descriptor }) => runeStoneActor.getState(descriptor.branchId) === VR_RUNE_STONE_STATE.INSTALLED
    && runeStoneProgressionController.isFamilyInstalled(descriptor.familyCode);
  function readEmitterPosition(branchId) {
    const anchor = getEmitterAnchor(branchId);
    if (!anchor?.getWorldPosition) return false;
    anchor.updateWorldMatrix(true, false);
    anchor.getWorldPosition(emitterPosition);
    return true;
  }
  function stopEntry(entry) {
    entry.token += 1; entry.pending = false;
    try { entry.handle?.stop?.(); } catch (_) { /* Optional audio is fail-soft. */ }
    entry.handle = null;
  }
  function startEntry(entry) {
    if (entry.handle || entry.pending || !isInstalled(entry)) return;
    if (!readEmitterPosition(entry.descriptor.branchId)) return;
    const token = ++entry.token, expectedGeneration = generation;
    entry.pending = true;
    void audioBridge.startSpatialProcessSource(AUDIO_BY_BRANCH[entry.descriptor.branchId].loop, 'DEVICE', {
      loop: true, maxDistanceMeters, refDistanceMeters,
      panningModel: 'HRTF', distanceModel: 'linear', rolloffFactor: 1
    }).then((handle) => {
      entry.pending = false;
      if (!handle) return;
      if (disposed || generation !== expectedGeneration || entry.token !== token || !isInstalled(entry)) {
        try { handle.stop?.(); } catch (_) { /* Late optional source. */ }
        return;
      }
      if (!readEmitterPosition(entry.descriptor.branchId)) {
        try { handle.stop?.(); } catch (_) { /* Missing platform anchor. */ }
        return;
      }
      handle.setPosition(emitterPosition.x, emitterPosition.y, emitterPosition.z);
      entry.handle = handle;
      handle.onEnded(() => { if (entry.handle === handle) entry.handle = null; });
    });
  }
  function synchronizeInstalledEmitters() {
    if (disposed) return;
    entries.forEach((entry) => { if (isInstalled(entry)) startEntry(entry); else stopEntry(entry); });
  }
  function presentInstallAudioCue(event) {
    if (disposed || !AUDIO_BY_BRANCH[event?.branchId]) return;
    audioBridge.playOneShot(AUDIO_BY_BRANCH[event.branchId].install, 'WORLD');
  }
  function presentInstalled(event) {
    if (disposed || !AUDIO_BY_BRANCH[event?.branchId]) return;
    synchronizeInstalledEmitters();
  }
  function update() {
    if (disposed) return;
    entries.forEach((entry) => {
      if (!entry.handle) return;
      if (!isInstalled(entry) || !readEmitterPosition(entry.descriptor.branchId)) { stopEntry(entry); return; }
      entry.handle.setPosition(emitterPosition.x, emitterPosition.y, emitterPosition.z);
    });
  }
  function reset() { generation += 1; entries.forEach(stopEntry); }
  function dispose() { if (disposed) return; reset(); disposed = true; }
  return { presentInstallAudioCue, presentInstalled, synchronizeInstalledEmitters, update, reset, dispose };
}
