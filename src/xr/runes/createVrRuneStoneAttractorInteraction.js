import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_BANDS, VR_RIGHT_HAND_MODES } from '../input/createVrHandModeController.js';
import { createVrAttractorScanCone, selectAttractorConeTarget } from '../tools/createVrAttractorScanCone.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';
import { VR_RUNE_STONE_STATE } from './createVrRuneStoneActor.js';

const LOCAL_DIRECTION = new THREE.Vector3(0, 0, -1);
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createVrRuneStoneAttractorInteraction({ controllers, runeStoneActor,
  runeStoneAttractorBandProjection, handModeController, semanticInput, attractorTool,
  maxTargetDistance, settings, haloSettings, isHigherPriorityInteractionActive = () => false }) {
  if (!Array.isArray(controllers)) throw new TypeError('controllers must be an array.');
  if (!runeStoneActor?.getStones || !runeStoneActor?.getBoundingSphere
    || !runeStoneActor?.lockByAstro || !runeStoneActor?.unlockFromAstro) {
    throw new TypeError('runeStoneActor must expose physical records, live bounds and Astro lock commands.');
  }
  if (!runeStoneAttractorBandProjection?.isFamilyTargetable) {
    throw new TypeError('runeStoneAttractorBandProjection must expose target permission.');
  }
  if (!Number.isFinite(maxTargetDistance) || maxTargetDistance <= 0) {
    throw new TypeError('maxTargetDistance must be positive.');
  }
  ['scanThreshold', 'triggerThreshold'].forEach((key) => {
    if (!Number.isFinite(settings?.[key]) || settings[key] < 0) {
      throw new TypeError(`settings.${key} must be non-negative.`);
    }
  });

  const records = runeStoneActor.getStones().filter(({ descriptor }) => descriptor?.natural === true);
  const scanCone = createVrAttractorScanCone({ parent: null, length: maxTargetDistance, settings: settings.scanCone });
  const halos = new Map(records.map((record) => [record, createVrTargetHalo({ root: record.root, settings: haloSettings })]));
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const candidates = records.map((record) => ({
    target: record,
    radius: 0,
    getWorldCenter(result) {
      const sphere = runeStoneActor.getBoundingSphere(record.branchId);
      this.radius = sphere?.radius ?? 0;
      return record.root.getWorldPosition(result);
    }
  }));
  let target = null;
  let active = null;
  let disposed = false;

  const rightRecord = () => controllers.find(({ handedness }) => handedness === 'right') ?? null;
  const ownsBand = () => handModeController.getRightMode() === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR
    && handModeController.getAttractorBand() === VR_ATTRACTOR_BANDS.RUNESTONES;
  const isTargetableFamily = (record) => runeStoneAttractorBandProjection
    .isFamilyTargetable(record.familyCode) === true;
  const isPhysical = (record) => record?.descriptor?.natural === true && record.root?.parent
    && record.root.visible !== false;
  const isFreeCandidate = (record) => isPhysical(record)
    && runeStoneActor.getState(record.branchId) === VR_RUNE_STONE_STATE.FREE
    && isTargetableFamily(record);
  function setTarget(next) {
    if (target === next) return;
    if (target) halos.get(target)?.setVisible(false);
    target = next;
    if (target) halos.get(target)?.setVisible(true);
  }
  function clearTool() {
    attractorTool.setTarget(null);
    attractorTool.setPullStrength(0);
    if (ownsBand()) attractorTool.setState(VR_ATTRACTOR_STATES.IDLE);
  }
  function unlockActive() {
    if (active) runeStoneActor.unlockFromAstro(active.branchId);
    active = null;
    setTarget(null);
    clearTool();
  }
  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    const right = rightRecord();
    const { primaryAction = 0, grabAction = 0 } = semanticInput.getState();
    const scanning = ownsBand() && grabAction > settings.scanThreshold;
    if (!right?.controller || !right.isConnected || !scanning) {
      scanCone.update(delta, false);
      if (active) unlockActive();
      else { setTarget(null); clearTool(); }
      return;
    }
    if (scanCone.object.parent !== right.controller) right.controller.add(scanCone.object);
    scanCone.update(delta, true);
    if (active) {
      if (primaryAction <= settings.triggerThreshold || !ownsBand()
        || !isPhysical(active) || !isTargetableFamily(active)
        || isHigherPriorityInteractionActive(right) === true) {
        unlockActive();
        return;
      }
      setTarget(active);
      halos.get(active)?.update(delta);
      attractorTool.setTarget({ target: active.root, branchId: active.branchId,
        familyCode: active.familyCode, distance: 0, proximity: 1 });
      attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.TARGETING);
      return;
    }
    if (isHigherPriorityInteractionActive(right) === true) {
      setTarget(null);
      clearTool();
      return;
    }
    right.controller.getWorldPosition(origin);
    right.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize();
    const hit = selectAttractorConeTarget({ candidates: candidates.filter(({ target: record }) => isFreeCandidate(record)),
      origin, direction, maxDistance: maxTargetDistance, halfAngleRadians: scanCone.halfAngleRadians });
    setTarget(hit?.target ?? null);
    attractorTool.setTarget(hit ? { target: target.root, branchId: target.branchId,
      familyCode: target.familyCode, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) } : null);
    attractorTool.setPullStrength(0);
    attractorTool.setState(hit ? VR_ATTRACTOR_STATES.TARGETING : VR_ATTRACTOR_STATES.IDLE);
    if (target) halos.get(target)?.update(delta);
    if (target && primaryAction > settings.triggerThreshold
      && runeStoneActor.lockByAstro(target.branchId) === true) active = target;
  }
  function reset() {
    unlockActive();
    scanCone.update(0, false);
    halos.forEach((halo) => halo.setVisible(false));
  }
  function dispose() {
    if (disposed) return;
    reset();
    scanCone.dispose();
    halos.forEach((halo) => halo.dispose());
    halos.clear();
    disposed = true;
  }
  return { scanCone, update, reset, dispose, getTarget: () => target, getLockedStone: () => active };
}
