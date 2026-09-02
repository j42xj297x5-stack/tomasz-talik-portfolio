export const BINDER_REVEAL_AUDIO = Object.freeze([
  '/audio/electricity_short_06.mp3',
  '/audio/zwornik_01.mp3', '/audio/zwornik_02.mp3',
  '/audio/zwornik_03.mp3', '/audio/zwornik_04.mp3'
]);
const DOCK_AUDIO = Object.freeze({
  earth: '/audio/zwornik_01.mp3', fire: '/audio/zwornik_02.mp3',
  wood: '/audio/zwornik_03.mp3', metal: '/audio/zwornik_04.mp3', water: '/audio/zwornik_03.mp3'
});

export function createVrRuneBinderRevealAudioProjection({ audioBridge, runeBridgeActor }) {
  if (!audioBridge?.playOneShot || !runeBridgeActor?.subscribe) {
    throw new TypeError('[VrRuneBinderRevealAudioProjection] Audio bridge and RuneBridgeActor access are required.');
  }
  let disposed = false;
  const unsubscribe = runeBridgeActor.subscribe((event) => {
    if (disposed) return;
    if (event?.type === 'ARRIVAL_STARTED') audioBridge.playOneShot(BINDER_REVEAL_AUDIO[0], 'WORLD');
    if (event?.type === 'ARRIVAL_COMPLETED' && DOCK_AUDIO[event.branchId]) {
      audioBridge.playOneShot(DOCK_AUDIO[event.branchId], 'WORLD');
    }
  });
  function reset() {}
  function dispose() { if (disposed) return; disposed = true; unsubscribe(); }
  return { reset, dispose };
}
