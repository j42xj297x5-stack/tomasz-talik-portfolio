export const ASTERION_SECTOR_ACQUISITION_AUDIO = Object.freeze({
  'ethics-life-protection': '/audio/electricity_short_01.mp3',
  'creative-ai': '/audio/electricity_short_02.mp3',
  'ai-guide': '/audio/electricity_short_03.mp3',
  'spotify-digger': '/audio/electricity_short_04.mp3',
  'haiku-cosmos': '/audio/electricity_short_05.mp3'
});
export const ASTERION_SECTOR_DRIVE_AUDIO = Object.freeze({
  earth: '/audio/electricity_long_01.mp3', fire: '/audio/electricity_long_02.mp3',
  wood: '/audio/electricity_long_03.mp3', metal: '/audio/electricity_long_04.mp3',
  water: '/audio/electricity_long_04.mp3'
});

export function createVrAsterionSectorAudioProjection({ audioBridge, acquisitionInteraction, sectorControlInteraction }) {
  if (!audioBridge?.playOneShot || !acquisitionInteraction?.subscribeAcquisitionStarted
    || !sectorControlInteraction?.subscribeDriveActivity || !sectorControlInteraction?.supportsGlyph) {
    throw new TypeError('[VrAsterionSectorAudioProjection] Audio and sector interaction access is required.');
  }
  let disposed = false;
  const unsubscribeAcquisitionStarted = acquisitionInteraction.subscribeAcquisitionStarted(({ glyphId }) => {
    if (disposed || !sectorControlInteraction.supportsGlyph(glyphId)) return;
    const path = ASTERION_SECTOR_ACQUISITION_AUDIO[glyphId];
    if (path) audioBridge.playOneShot(path, 'WORLD');
  });
  const unsubscribeDrive = sectorControlInteraction.subscribeDriveActivity(({ glyphId, branchId, active }) => {
    if (disposed) return;
    if (active) audioBridge.startSectorDrive(glyphId, ASTERION_SECTOR_DRIVE_AUDIO[branchId]);
    else audioBridge.fadeSectorDrive(glyphId);
  });
  function reset() { if (!disposed) audioBridge.resetSectorDriveAudio(); }
  function dispose() { if (disposed) return; disposed = true; unsubscribeAcquisitionStarted(); unsubscribeDrive(); audioBridge.resetSectorDriveAudio(); }
  return { reset, dispose };
}
