import { resolveRuneStoneByBranchId } from '../runes/vrRuneStoneRegistry.js';
import { VR_ASTERION_SECTOR_CONTROL_EVENTS } from './createVrAsterionSectorControlInteraction.js';

const CORE_CHANNELS = Object.freeze({
  earth: Object.freeze({ glyphId: 'ethics-life-protection', levelKey: 'alpha' }),
  wood: Object.freeze({ glyphId: 'ai-guide', levelKey: 'beta' }),
  fire: Object.freeze({ glyphId: 'creative-ai', levelKey: 'gamma' })
});
const DEPTH_BANDS = Object.freeze(['NONE', 'FAR', 'MID', 'NEAR']);

function readCoreState(runeStoneProgressionController, sectorControlInteraction) {
  const powered = {};
  const levels = {};
  Object.entries(CORE_CHANNELS).forEach(([branchId, { glyphId, levelKey }]) => {
    const rune = resolveRuneStoneByBranchId(branchId);
    if (!rune) throw new Error(`Missing canonical Rune Stone descriptor for branch: ${branchId}`);
    powered[branchId] = runeStoneProgressionController.isFamilyInstalled(rune.familyCode);
    const level = sectorControlInteraction.getSectorLevel(glyphId);
    levels[levelKey] = Number.isInteger(level) && level >= 0 && level <= 3 ? level : 0;
  });
  return { powered, levels };
}

function createDescriptor(runeStoneProgressionController, sectorControlInteraction) {
  const { powered, levels } = readCoreState(runeStoneProgressionController, sectorControlInteraction);
  const frozenPowered = Object.freeze(powered);
  const frozenLevels = Object.freeze(levels);
  const resonatorExists = powered.earth && powered.wood && powered.fire;
  const leftActive = powered.earth && levels.alpha > 0;
  const rightActive = powered.wood && levels.beta > 0;
  const depthActive = powered.fire && levels.gamma > 0;
  const activeChannelCount = Number(leftActive) + Number(rightActive) + Number(depthActive);
  const fullActiveCore = resonatorExists && leftActive && rightActive && depthActive;
  const lateralSymmetric = leftActive && rightActive && levels.alpha === levels.beta;
  const lateralAsymmetric = (leftActive || rightActive) && !lateralSymmetric;

  return Object.freeze({
    resonatorExists,
    powered: frozenPowered,
    levels: frozenLevels,
    leftActive,
    rightActive,
    depthActive,
    fieldActive: resonatorExists && activeChannelCount > 0,
    fullActiveCore,
    lateralSymmetric,
    lateralAsymmetric,
    primarySymmetricPreset: fullActiveCore && levels.alpha === levels.beta,
    activeChannelCount,
    lateralStrength: (levels.alpha + levels.beta) / 2,
    fieldAsymmetry: levels.alpha - levels.beta,
    depthBand: DEPTH_BANDS[levels.gamma]
  });
}

export function createVrAsterionResonatorFieldActor({
  runeStoneProgressionController,
  sectorControlInteraction
}) {
  const listeners = new Set();
  let descriptor = createDescriptor(runeStoneProgressionController, sectorControlInteraction);
  let signature = JSON.stringify(descriptor);
  let disposed = false;

  function synchronize() {
    if (disposed) return descriptor;
    const nextDescriptor = createDescriptor(runeStoneProgressionController, sectorControlInteraction);
    const nextSignature = JSON.stringify(nextDescriptor);
    if (nextSignature === signature) return descriptor;
    descriptor = nextDescriptor;
    signature = nextSignature;
    [...listeners].forEach((listener) => {
      try {
        listener(descriptor);
      } catch (error) {
        console.warn('[VrAsterionResonatorFieldActor] Field listener failed.', error);
      }
    });
    return descriptor;
  }

  const unsubscribeRunes = runeStoneProgressionController.subscribe(synchronize);
  const unsubscribeSectorControl = sectorControlInteraction.subscribe((event) => {
    if (event?.type === VR_ASTERION_SECTOR_CONTROL_EVENTS.DETENT_COMMITTED) synchronize();
  });

  function dispose() {
    if (disposed) return;
    unsubscribeRunes();
    unsubscribeSectorControl();
    listeners.clear();
    disposed = true;
  }

  return {
    getDescriptor: () => descriptor,
    isResonatorPresent: () => descriptor.resonatorExists,
    isFieldActive: () => descriptor.fieldActive,
    synchronize,
    subscribe(listener) {
      if (disposed || typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: synchronize,
    dispose
  };
}
