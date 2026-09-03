import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_BANDS, VR_RIGHT_HAND_MODES } from '../input/createVrHandModeController.js';
import { createVrAttractorScanCone, selectAttractorConeTarget } from '../tools/createVrAttractorScanCone.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';
import { VR_RUNE_STONE_STATE } from './createVrRuneStoneActor.js';

const LOCAL_DIRECTION = new THREE.Vector3(0, 0, -1);
const clamp01 = (value) => Math.min(1, Math.max(0, value));
export const RUNE_STONE_PLATFORM_MIN_RADIUS_M = 9.0;

export function createVrRuneStoneAttractorInteraction({ controllers, runeStoneActor, etherRuneStoneActor = null,
  isFamilyTargetable = () => false, handModeController, semanticInput, attractorTool,
  maxTargetDistance, settings, haloSettings, platformCenter, getPlayerWorldPosition,
  tryBeginInstallationHandoff = () => false,
  onPullStart = () => {}, onPullCancel = () => {}, onHandoff = () => {},
  isHigherPriorityInteractionActive = () => false }) {
  if (!Array.isArray(controllers)) throw new TypeError('controllers must be an array.');
  if (!runeStoneActor?.getStones || !runeStoneActor?.getBoundingSphere
    || !runeStoneActor?.lockByAstro || !runeStoneActor?.beginCarriedOrbit
    || !runeStoneActor?.releaseFromAstro || !runeStoneActor?.isPresentationVisible) {
    throw new TypeError('runeStoneActor must expose physical records, live bounds and Astro transport commands.');
  }
  if (typeof isFamilyTargetable !== 'function') throw new TypeError('isFamilyTargetable must be a function.');
  if (!Number.isFinite(maxTargetDistance) || maxTargetDistance <= 0) {
    throw new TypeError('maxTargetDistance must be positive.');
  }
  if (!platformCenter?.getWorldPosition || typeof getPlayerWorldPosition !== 'function') {
    throw new TypeError('platformCenter and getPlayerWorldPosition are required.');
  }
  ['scanThreshold', 'triggerThreshold', 'pullAcceleration', 'maxPullSpeed'].forEach((key) => {
    if (!Number.isFinite(settings?.[key]) || settings[key] < 0) {
      throw new TypeError(`settings.${key} must be non-negative.`);
    }
  });
  if (!Number.isFinite(settings?.handoffRadiusMeters)
    || settings.handoffRadiusMeters <= RUNE_STONE_PLATFORM_MIN_RADIUS_M) {
    throw new TypeError(`settings.handoffRadiusMeters must be greater than ${RUNE_STONE_PLATFORM_MIN_RADIUS_M}.`);
  }

  const sources = [runeStoneActor, etherRuneStoneActor].filter(Boolean);
  const records = sources.flatMap((source) => source.getStones().map((record) => ({ record, source })));
  const scanCone = createVrAttractorScanCone({ parent: null, length: maxTargetDistance, settings: settings.scanCone });
  const halos = new Map(records.map(({ record }) => [record, createVrTargetHalo({ root: record.root, settings: haloSettings })]));
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const stonePosition = new THREE.Vector3();
  const playerPosition = new THREE.Vector3();
  const centerPosition = new THREE.Vector3();
  const candidatePosition = new THREE.Vector3();
  const radialDirection = new THREE.Vector3();
  const localPosition = new THREE.Vector3();
  const candidates = records.map(({ record, source }) => ({
    target: record,
    source,
    radius: 0,
    getWorldCenter(result) {
      const sphere = source.getBoundingSphere(record.branchId ?? record.familyCode);
      this.radius = sphere?.radius ?? 0;
      return record.root.getWorldPosition(result);
    }
  }));
  let target = null;
  let active = null;
  let pullSpeed = 0;
  let transportStartRadius = RUNE_STONE_PLATFORM_MIN_RADIUS_M;
  let transportStartY = 0;
  let disposed = false;

  const rightRecord = () => controllers.find(({ handedness }) => handedness === 'right') ?? null;
  const ownsBand = () => handModeController.getRightMode() === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR
    && handModeController.getAttractorBand() === VR_ATTRACTOR_BANDS.RUNESTONES;
  const isTargetableFamily = (record) => isFamilyTargetable(record.familyCode) === true;
  const sourceFor = (record) => records.find(({ record: candidate }) => candidate === record)?.source ?? null;
  const recordKey = (record) => record.branchId ?? record.familyCode;
  const isPhysical = (record) => sourceFor(record)?.isPresentationVisible() === true
    && record?.descriptor && record.root?.parent
    && record.root.visible !== false;
  const isFreeCandidate = (record) => isPhysical(record)
    && sourceFor(record)?.getState(recordKey(record)) === VR_RUNE_STONE_STATE.FREE
    && isTargetableFamily(record);
  function setTarget(next) {
    if (target === next) return;
    if (target) halos.get(target)?.setVisible(false);
    target = next;
    if (target) halos.get(target)?.setVisible(true);
  }
  function clearTool() {
    if (!ownsBand()) return;
    attractorTool.setTarget(null);
    attractorTool.setPullStrength(0);
    attractorTool.setState(VR_ATTRACTOR_STATES.IDLE);
  }
  function setRootWorldPosition(root, worldPosition) {
    localPosition.copy(worldPosition);
    root.parent.worldToLocal(localPosition);
    root.position.copy(localPosition);
  }
  function releaseActive() {
    if (active) {
      sourceFor(active)?.releaseFromAstro(recordKey(active));
      onPullCancel(active);
    }
    active = null;
    pullSpeed = 0;
    setTarget(null);
    clearTool();
  }
  function handoffActive() {
    onHandoff(active);
    active = null;
    pullSpeed = 0;
    setTarget(null);
    clearTool();
  }
  function beginTransport(record) {
    platformCenter.updateWorldMatrix(true, false);
    record.root.updateWorldMatrix(true, false);
    platformCenter.getWorldPosition(centerPosition);
    record.root.getWorldPosition(stonePosition);
    transportStartRadius = Math.hypot(stonePosition.x - centerPosition.x, stonePosition.z - centerPosition.z);
    transportStartY = stonePosition.y;
    pullSpeed = 0;
    return sourceFor(record)?.beginCarriedOrbit(recordKey(record)) === true;
  }
  function updateTransport(delta) {
    platformCenter.updateWorldMatrix(true, false);
    active.root.updateWorldMatrix(true, false);
    platformCenter.getWorldPosition(centerPosition);
    active.root.getWorldPosition(stonePosition);
    getPlayerWorldPosition(playerPosition);

    pullSpeed = Math.min(settings.maxPullSpeed, pullSpeed + settings.pullAcceleration * delta);
    direction.subVectors(playerPosition, stonePosition);
    const distance = direction.length();
    candidatePosition.copy(stonePosition);
    if (distance > 0) candidatePosition.addScaledVector(direction, Math.min(distance, pullSpeed * delta) / distance);

    radialDirection.set(candidatePosition.x - centerPosition.x, 0, candidatePosition.z - centerPosition.z);
    let radius = radialDirection.length();
    if (radius < RUNE_STONE_PLATFORM_MIN_RADIUS_M) {
      if (radius <= Number.EPSILON) {
        radialDirection.set(stonePosition.x - centerPosition.x, 0, stonePosition.z - centerPosition.z);
        if (radialDirection.lengthSq() <= Number.EPSILON) radialDirection.set(1, 0, 0);
      }
      radialDirection.normalize();
      radius = RUNE_STONE_PLATFORM_MIN_RADIUS_M;
      candidatePosition.x = centerPosition.x + radialDirection.x * radius;
      candidatePosition.z = centerPosition.z + radialDirection.z * radius;
    }

    const radialTravel = Math.max(0, transportStartRadius - RUNE_STONE_PLATFORM_MIN_RADIUS_M);
    const surfaceProgress = radialTravel <= Number.EPSILON
      ? 1 : clamp01((transportStartRadius - radius) / radialTravel);
    candidatePosition.y = THREE.MathUtils.lerp(transportStartY, centerPosition.y, surfaceProgress);
    if (radius <= RUNE_STONE_PLATFORM_MIN_RADIUS_M) candidatePosition.y = centerPosition.y;
    setRootWorldPosition(active.root, candidatePosition);

    attractorTool.setTarget({ target: active.root, targetClass: 'runeStone', branchId: active.branchId,
      familyCode: active.familyCode, distance, proximity: 1 });
    attractorTool.setPullStrength(clamp01(pullSpeed / settings.maxPullSpeed));
    attractorTool.setState(VR_ATTRACTOR_STATES.PULLING);
    if (active.descriptor.natural === true
      && candidatePosition.distanceTo(centerPosition) <= settings.handoffRadiusMeters
      && tryBeginInstallationHandoff(active) === true) handoffActive();
  }
  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    const right = rightRecord();
    const { primaryAction = 0, grabAction = 0 } = semanticInput.getState();
    const scanning = ownsBand() && grabAction > settings.scanThreshold;
    if (!right?.controller || !right.isConnected || !scanning) {
      scanCone.update(delta, false);
      if (active) releaseActive();
      else { setTarget(null); clearTool(); }
      return;
    }
    if (scanCone.object.parent !== right.controller) right.controller.add(scanCone.object);
    scanCone.update(delta, true);
    if (active) {
      if (primaryAction <= settings.triggerThreshold || !ownsBand()
        || !isPhysical(active) || !isTargetableFamily(active)
        || isHigherPriorityInteractionActive(right) === true) {
        releaseActive();
        return;
      }
      setTarget(active);
      halos.get(active)?.update(delta);
      if (sourceFor(active)?.getState(recordKey(active)) === VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO
        && !beginTransport(active)) {
        releaseActive();
        return;
      }
      updateTransport(delta);
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
    attractorTool.setTarget(hit ? { target: target.root, targetClass: 'runeStone', branchId: target.branchId,
      familyCode: target.familyCode, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) } : null);
    attractorTool.setPullStrength(0);
    attractorTool.setState(hit ? VR_ATTRACTOR_STATES.TARGETING : VR_ATTRACTOR_STATES.IDLE);
    if (target) halos.get(target)?.update(delta);
    if (target && primaryAction > settings.triggerThreshold
      && sourceFor(target)?.lockByAstro(recordKey(target)) === true) {
      active = target;
      onPullStart(active);
    }
  }
  function reset() {
    releaseActive();
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
