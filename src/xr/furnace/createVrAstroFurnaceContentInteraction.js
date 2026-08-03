import * as THREE from '../../vendor/three.js';
import { isWorldPointInsideChamberCylinder, resolveChamberCylinder } from './vrAstroFurnaceChamberCylinder.js';
import { processRotationPulse01 } from './createVrAstroFurnaceActivateInteraction.js';

export const ASTRO_FURNACE_CONTENT_STATES = Object.freeze({
  EMPTY: 'EMPTY', CANDIDATE_VALID: 'CANDIDATE_VALID', CANDIDATE_INVALID: 'CANDIDATE_INVALID',
  INSERTED: 'INSERTED', CONSUMING: 'CONSUMING', CONSUMED: 'CONSUMED'
});

const VALID_ASSET_IDS = new Set(Array.from({ length: 6 }, (_, index) => `shell-relic-${index + 1}`));
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smoothstep = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

export function processRotationPulse(angle) {
  return 3 * processRotationPulse01(angle);
}

export function setObjectWorldScale(object, desired, target = new THREE.Vector3()) {
  object.scale.set(1, 1, 1); object.updateWorldMatrix(true, false); object.getWorldScale(target);
  object.scale.set(desired.x / Math.max(Math.abs(target.x), 1e-8),
    desired.y / Math.max(Math.abs(target.y), 1e-8), desired.z / Math.max(Math.abs(target.z), 1e-8));
  object.updateWorldMatrix(false, false); return object.scale;
}

export function constrainHeldShellToDeviceSurfaces({ shell, shellCenter, origin, radius, deviceRoots = [],
  excludedRoots = [], clearance = 0.006, raycaster = new THREE.Raycaster() }) {
  const axis = new THREE.Vector3().subVectors(shellCenter, origin), targetDistance = axis.length();
  if (!shell?.parent || targetDistance <= 1e-8) return false;
  axis.multiplyScalar(1 / targetDistance); raycaster.set(origin, axis); raycaster.near = 0; raycaster.far = targetDistance;
  const isExcluded = (object) => excludedRoots.some((root) => root && (object === root || root.getObjectById?.(object.id)));
  const hit = deviceRoots.flatMap((root) => raycaster.intersectObject(root, true)).filter(({ object }) => {
    if (!object.isMesh || object.visible === false || isExcluded(object)) return false;
    return !/(helper|feedback|ray|halo|panel|button|insert_volume|content_anchor)/.test(object.name.toLowerCase());
  }).sort((a, b) => a.distance - b.distance)[0];
  if (!hit || hit.distance >= targetDistance) return false;
  const distance = Math.max(0, hit.distance - Math.max(0, radius) - Math.max(0, clearance));
  const shellOrigin = shell.getWorldPosition(new THREE.Vector3());
  const constrainedOrigin = origin.clone().addScaledVector(axis, distance).sub(shellCenter.clone().sub(shellOrigin));
  shell.parent.worldToLocal(constrainedOrigin); shell.position.copy(constrainedOrigin); return true;
}

export function createVrAstroFurnaceContentInteraction({
  furnace, shellSystem, openInteraction, activateInteraction, progressionController, settings = {}, takeHeldShell = () => true,
  isModeActive = () => true
}) {
  const states = ASTRO_FURNACE_CONTENT_STATES;
  const config = {
    enabled: true, snapDuration: 0.42,
    chamberClearance: 0.012, contentClearance: 0.012, rejectDuration: 0.28, rejectDistanceMultiplier: 1.35,
    guideOpacity: 0.07, validFeedbackOpacity: 0.58, invalidFeedbackOpacity: 0.62,
    releaseGrace: 0.035, surfaceClearance: 0.006, validColor: 0x49d17d, invalidColor: 0xe05252, ...settings
  };
  const volume = furnace?.nodes?.VR_FURNACE_INSERT_VOLUME;
  const anchor = furnace?.nodes?.VR_FURNACE_CONTENT_ANCHOR;
  const chamber = furnace?.nodes?.komora;
  const chamberCylinder = resolveChamberCylinder(chamber, config.chamberClearance);
  let insertionReady = config.enabled !== false && Boolean(volume && anchor && chamberCylinder);
  if (volume) volume.visible = false;
  if (config.enabled !== false && !insertionReady) {
    console.warn('[Experience VR] Astro furnace shell insertion is disabled: chamber geometry, insert marker, or content anchor is missing.');
  }
  const feedbackRoot = furnace?.object;
  const worldCenter = new THREE.Vector3(), shellPosition = new THREE.Vector3(), worldScale = new THREE.Vector3();
  const chamberInverse = new THREE.Matrix4(), lanceDirection = new THREE.Vector3(), blockedLocal = new THREE.Vector3();
  const shellBaselines = new WeakMap();
  const feedbackGeometry = insertionReady ? new THREE.CylinderGeometry(chamberCylinder.radius, chamberCylinder.radius,
    chamberCylinder.height, 24, 1, true) : null;
  const feedbackMaterial = insertionReady ? new THREE.MeshBasicMaterial({ transparent: true, opacity: 0,
    depthTest: false, depthWrite: false, side: THREE.DoubleSide, color: config.validColor }) : null;
  const feedback = insertionReady ? new THREE.Mesh(feedbackGeometry, feedbackMaterial) : null;
  if (feedback) { feedback.name = 'VrAstroFurnaceInsertFeedback'; feedback.renderOrder = 1000;
    feedback.visible = false; feedbackRoot.add(feedback); }

  let state = states.EMPTY, insertedShell = null, pendingShellAssetId = null, reportedHeldShell = null;
  let previousHeldShell = null, candidateWasValid = false, snapElapsed = 0, elapsed = 0, disposed = false;
  let baseScale = null, snapStartPosition = null, snapStartQuaternion = null, snapStartScale = null;
  const materialBases = [], ownedMaterials = new Set();
  const listeners = new Set(), rejects = [];
  function setState(next) { if (state === next) return; state = next; listeners.forEach((listener) => listener(next)); }

  function cylinderWorldCenter() { chamber.updateWorldMatrix(true, false); return worldCenter.copy(chamberCylinder.center).applyMatrix4(chamber.matrixWorld); }
  function validAssetId(shell) { return shell?.userData?.shellAssetId; }
  function validate(shell) {
    const assetId = validAssetId(shell);
    return VALID_ASSET_IDS.has(assetId) && progressionController?.canAbsorbShell?.(assetId) === true;
  }
  function baselineScale(shell) {
    let baseline = shellBaselines.get(shell);
    if (!baseline) { baseline = shell.getWorldScale(new THREE.Vector3()); shellBaselines.set(shell, baseline); }
    return baseline;
  }
  function shellRecord(shell) { return shellSystem?.getRecord?.(shell)
    ?? shellSystem?.records?.find((record) => record.object === shell) ?? null; }
  function shellWorldCenter(shell, target = shellPosition) {
    shell.updateWorldMatrix(true, true); const center = shellRecord(shell)?.boundingCenter;
    return center ? target.copy(center).applyMatrix4(shell.matrixWorld) : shell.getWorldPosition(target);
  }
  function shellWorldRadius(shell) { const record = shellRecord(shell); shell.getWorldScale(worldScale);
    return (record?.boundingRadius ?? 0) * Math.max(...worldScale.toArray().map(Math.abs)); }
  function syncFeedbackTransform() {
    if (!feedback) return; chamber.updateWorldMatrix(true, false); feedbackRoot.updateWorldMatrix(true, false);
    const matrix = new THREE.Matrix4().multiplyMatrices(feedbackRoot.matrixWorld.clone().invert(), chamber.matrixWorld);
    matrix.decompose(feedback.position, feedback.quaternion, feedback.scale);
    const offset = chamberCylinder.center.clone().multiply(feedback.scale).applyQuaternion(feedback.quaternion);
    feedback.position.add(offset);
  }
  function ejectHeldFromCylinder(shell) {
    if (!shell || !chamberCylinder || !isNear(shell)) return false;
    chamber.updateWorldMatrix(true, false); chamberInverse.copy(chamber.matrixWorld).invert();
    shellWorldCenter(shell, shellPosition); blockedLocal.copy(shellPosition).applyMatrix4(chamberInverse);
    const center = chamberCylinder.center, radius = chamberCylinder.radius;
    const dx = blockedLocal.x - center.x, dz = blockedLocal.z - center.z;
    if (dx * dx + dz * dz >= radius * radius || Math.abs(blockedLocal.y - center.y) >= chamberCylinder.halfHeight) return;
    // The held shell is parented below the controller. Moving along its parent's local +Z
    // reverses the controller lance without discarding the authored chamber orientation.
    lanceDirection.set(0, 0, 1).applyQuaternion(shell.parent?.getWorldQuaternion?.(new THREE.Quaternion()) ?? new THREE.Quaternion()).normalize();
    for (let distance = 0; distance <= radius * 4; distance += Math.max(radius / 16, .002)) {
      const candidate = shellPosition.clone().addScaledVector(lanceDirection, distance);
      blockedLocal.copy(candidate).applyMatrix4(chamberInverse);
      const cx = blockedLocal.x - center.x, cz = blockedLocal.z - center.z;
      if (cx * cx + cz * cz >= radius * radius || Math.abs(blockedLocal.y - center.y) >= chamberCylinder.halfHeight) {
        const offset = candidate.sub(shellPosition); const shellOrigin = shell.getWorldPosition(new THREE.Vector3()).add(offset);
        shell.parent.worldToLocal(shellOrigin); shell.position.copy(shellOrigin); shell.updateWorldMatrix(true, true); return true;
      }
    }
    return false;
  }
  function blockClosedChamber(shell) {
    if (!shell || !chamberCylinder || openInteraction?.getState?.() === 'OPEN') return;
    ejectHeldFromCylinder(shell);
  }
  function canAcceptShell(shell = null) {
    return insertionReady && !disposed && isModeActive() && state !== states.INSERTED && state !== states.CONSUMING && state !== states.CONSUMED
      && openInteraction?.getState?.() === 'OPEN' && activateInteraction?.getState?.() === 'IDLE'
      && (!shell || shell !== insertedShell);
  }
  function canEvaluateCandidate() { return insertionReady && !disposed && isModeActive() && openInteraction?.getState?.() === 'OPEN'
    && activateInteraction?.getState?.() === 'IDLE'; }
  function isNear(shell) {
    if (!shell || !insertionReady) return false;
    shellWorldCenter(shell, shellPosition);
    return isWorldPointInsideChamberCylinder(shellPosition, chamber, chamberCylinder, blockedLocal);
  }
  function showFeedback(kind) {
    if (!feedback) return;
    const valid = kind !== 'invalid';
    feedback.material.color.setHex(valid ? config.validColor : config.invalidColor);
    const pulse = 0.82 + 0.18 * Math.sin(elapsed * Math.PI * 4);
    feedback.material.opacity = kind === 'guide' ? config.guideOpacity : (valid
      ? config.validFeedbackOpacity : config.invalidFeedbackOpacity) * pulse;
    feedback.visible = true;
  }
  function hideFeedback() { if (feedback) feedback.visible = false; }
  function ownMaterials(shell) {
    materialBases.length = 0;
    shell.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const source = Array.isArray(node.material) ? node.material : [node.material];
      source.forEach((material) => materialBases.push({ material, color: material.color?.clone(), emissive: material.emissive?.clone(),
        emissiveIntensity: material.emissiveIntensity ?? 0, opacity: material.opacity ?? 1, transparent: material.transparent ?? false }));
    });
  }
  function boxInAnchor(object) {
    const worldBox = new THREE.Box3().setFromObject(object), result = new THREE.Box3().makeEmpty();
    if (worldBox.isEmpty()) return result;
    anchor.updateWorldMatrix(true, false); const inverse = anchor.matrixWorld.clone().invert();
    for (const x of [worldBox.min.x, worldBox.max.x]) for (const y of [worldBox.min.y, worldBox.max.y])
      for (const z of [worldBox.min.z, worldBox.max.z]) result.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
    return result;
  }
  function boxInChamber(object) {
    const worldBox = new THREE.Box3().setFromObject(object), result = new THREE.Box3().makeEmpty();
    if (worldBox.isEmpty()) return result;
    chamber.updateWorldMatrix(true, false); const inverse = chamber.matrixWorld.clone().invert();
    for (const x of [worldBox.min.x, worldBox.max.x]) for (const y of [worldBox.min.y, worldBox.max.y])
      for (const z of [worldBox.min.z, worldBox.max.z]) result.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
    return result;
  }
  function resolveSnapTarget(shell) {
    const savedPosition = shell.position.clone(), savedQuaternion = shell.quaternion.clone(), savedScale = shell.scale.clone();
    shell.position.set(0, 0, 0); shell.quaternion.identity(); setObjectWorldScale(shell, shell.userData.furnaceDesiredWorldScale, worldScale); shell.updateWorldMatrix(true, true);
    const shellBox = boxInAnchor(shell), energy = furnace?.nodes?.energy_cell ?? furnace?.nodes?.fire_cell;
    const energyBox = energy ? boxInAnchor(energy) : new THREE.Box3().makeEmpty();
    const target = new THREE.Vector3();
    if (!shellBox.isEmpty() && !energyBox.isEmpty()) target.y = energyBox.min.y - config.contentClearance - shellBox.max.y;
    const geometryCenter = shellRecord(shell)?.boundingCenter;
    if (geometryCenter) {
      const centerInAnchor = geometryCenter.clone().applyMatrix4(shell.matrixWorld); anchor.worldToLocal(centerInAnchor);
      target.x -= centerInAnchor.x; target.z -= centerInAnchor.z;
    }
    shell.position.copy(savedPosition); shell.quaternion.copy(savedQuaternion); shell.scale.copy(savedScale); shell.updateWorldMatrix(true, true);
    return target;
  }
  function accept(shell) {
    if (!shell || !canAcceptShell(shell) || !validate(shell)) return false;
    if (!takeHeldShell(shell)) return false;
    insertedShell = shell; pendingShellAssetId = null; baseScale = baselineScale(shell).clone(); ownMaterials(shell);
    anchor.attach(shell); snapStartPosition = shell.position.clone(); snapStartQuaternion = shell.quaternion.clone(); snapStartScale = shell.scale.clone();
    const baselineBox = boxInChamber(shell);
    const shellSize = baselineBox.getSize(new THREE.Vector3());
    const available = new THREE.Vector3(chamberCylinder.radius * 2, chamberCylinder.height, chamberCylinder.radius * 2);
    const fitScale = Math.min(1, ...['x', 'y', 'z'].map((axis) => shellSize[axis] > 1e-6 ? available[axis] / shellSize[axis] : 1));
    shell.userData.furnaceInsertedScale = fitScale;
    shell.userData.furnaceDesiredWorldScale = baseScale.clone().multiplyScalar(fitScale);
    setObjectWorldScale(shell, shell.userData.furnaceDesiredWorldScale, worldScale);
    shell.userData.furnaceSnapTarget = resolveSnapTarget(shell);
    shell.userData.shellState = 'inserted'; shell.userData.attractorTarget = false;
    snapElapsed = 0; setState(states.INSERTED); hideFeedback(); return true;
  }
  function reject(shell) {
    const center = cylinderWorldCenter().clone(), start = new THREE.Vector3(); shell.getWorldPosition(start);
    const direction = start.clone().sub(center); if (direction.lengthSq() < 1e-8) direction.set(1, 0, 0);
    const end = center.clone().add(direction.normalize().multiplyScalar(chamberCylinder.radius * config.rejectDistanceMultiplier));
    shell.userData.shellState = 'rejecting'; rejects.push({ shell, elapsed: 0, start, end });
  }
  function isWithinReleaseGrace(shell) {
    shellWorldCenter(shell, shellPosition); chamber.updateWorldMatrix(true, false);
    blockedLocal.copy(shellPosition).applyMatrix4(chamberInverse.copy(chamber.matrixWorld).invert()).sub(chamberCylinder.center);
    return Math.hypot(blockedLocal.x, blockedLocal.z) <= chamberCylinder.radius + config.releaseGrace
      && Math.abs(blockedLocal.y) <= chamberCylinder.halfHeight + config.releaseGrace;
  }
  function updateCandidate() {
    const held = reportedHeldShell;
    const releasedShell = !held ? previousHeldShell : null;
    const releasedWasValid = candidateWasValid;
    if (held && canEvaluateCandidate() && isNear(held)) {
      candidateWasValid = canAcceptShell(held) && validate(held); setState(candidateWasValid ? states.CANDIDATE_VALID : states.CANDIDATE_INVALID);
      showFeedback(candidateWasValid ? 'valid' : 'invalid');
      if (candidateWasValid) { accept(held); reportedHeldShell = null; }
      else ejectHeldFromCylinder(held);
    } else if ([states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) {
      setState(insertedShell ? states.INSERTED : states.EMPTY); candidateWasValid = false; hideFeedback();
    }
    if (releasedShell && !releasedWasValid && (isNear(releasedShell) || isWithinReleaseGrace(releasedShell)) && canEvaluateCandidate()) {
      ejectHeldFromCylinder(releasedShell); reject(releasedShell);
    }
    previousHeldShell = held;
  }
  function updateSnap(delta) {
    if (state !== states.INSERTED || !insertedShell || snapElapsed >= config.snapDuration) return;
    snapElapsed = Math.min(config.snapDuration, snapElapsed + delta);
    const t = smoothstep(snapElapsed / Math.max(config.snapDuration, 1e-6));
    insertedShell.position.lerpVectors(snapStartPosition, insertedShell.userData.furnaceSnapTarget, t);
    insertedShell.quaternion.slerpQuaternions(snapStartQuaternion, new THREE.Quaternion(), t);
    const targetScale = insertedShell.userData.furnaceDesiredWorldScale.clone(), parentScale = insertedShell.parent.getWorldScale(worldScale);
    targetScale.set(targetScale.x / Math.abs(parentScale.x), targetScale.y / Math.abs(parentScale.y), targetScale.z / Math.abs(parentScale.z));
    insertedShell.scale.lerpVectors(snapStartScale, targetScale, t);
  }
  function updateRejects(delta) { for (let index = rejects.length - 1; index >= 0; index--) {
    const item = rejects[index]; item.elapsed += delta; const raw = Math.min(1, item.elapsed / Math.max(config.rejectDuration, 1e-6));
    const t = smoothstep(raw), world = item.start.clone().lerp(item.end, t); item.shell.parent.worldToLocal(world); item.shell.position.copy(world);
    if (raw === 1) { item.shell.userData.shellState = 'placed'; item.shell.userData.attractorTarget = false; rejects.splice(index, 1); }
  } }
  function consumeInsertedContent() {
    if (state !== states.INSERTED || !insertedShell) return false;
    pendingShellAssetId = validAssetId(insertedShell); setState(states.CONSUMING);
    insertedShell.userData.shellState = 'consuming'; insertedShell.userData.attractorTarget = false; return true;
  }
  function updateConsumption() {
    if (state !== states.CONSUMING || !insertedShell) return;
    const extractionProgress = activateInteraction?.getExtractionProgress?.() ?? 0;
    const t = smoothstep(extractionProgress);
    const pulse = processRotationPulse(activateInteraction?.getProcessAngle?.() ?? 0);
    // Absorption is communicated by light and opacity; the physical shell stays settled.
    materialBases.forEach(({ material, color, emissive, emissiveIntensity, opacity }) => {
      if (material.color && color) material.color.copy(color).lerp(new THREE.Color(1, 1, 1), t * 0.35);
      if (material.emissive) material.emissive.copy(emissive ?? new THREE.Color()).lerp(new THREE.Color(1, 1, 1), t);
      if ('emissiveIntensity' in material) material.emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity + pulse, 7, t);
      material.transparent = true; material.opacity = THREE.MathUtils.lerp(opacity, 0, t);
    });
    if (extractionProgress >= 1) { insertedShell.visible = false; insertedShell.userData.shellState = 'consumed'; setState(states.CONSUMED); }
  }
  function commitConsumedContent() {
    if (state !== states.CONSUMED || activateInteraction?.getState?.() !== 'COMPLETE' || !pendingShellAssetId) return false;
    if (!progressionController.commitAbsorbedShell(pendingShellAssetId)) return false;
    shellSystem.removeInstance?.(insertedShell); insertedShell = null; pendingShellAssetId = null; materialBases.length = 0;
    ownedMaterials.clear(); setState(states.EMPTY); return true;
  }
  function update(delta = 0) {
    if (disposed) return; const step = Math.max(0, Number.isFinite(delta) ? delta : 0); elapsed += step;
    if (insertedShell && reportedHeldShell === insertedShell && state === states.INSERTED) {
      setObjectWorldScale(insertedShell, baseScale, worldScale);
      insertedShell = null; pendingShellAssetId = null; materialBases.length = 0; ownedMaterials.clear(); setState(states.EMPTY); hideFeedback();
    } else if ([states.EMPTY, states.CANDIDATE_VALID, states.CANDIDATE_INVALID, states.INSERTED].includes(state)) updateCandidate();
    if (reportedHeldShell) {
      shellWorldCenter(reportedHeldShell, shellPosition);
      const holdOrigin = reportedHeldShell.parent?.getWorldPosition(new THREE.Vector3());
      if (holdOrigin) constrainHeldShellToDeviceSurfaces({ shell: reportedHeldShell, shellCenter: shellPosition.clone(), origin: holdOrigin,
        radius: shellWorldRadius(reportedHeldShell), deviceRoots: [furnace.object],
        excludedRoots: openInteraction?.getState?.() === 'OPEN' ? [chamber] : [], clearance: config.surfaceClearance });
      blockClosedChamber(reportedHeldShell);
    }
    if (state === states.INSERTED) {
      if (insertedShell) { insertedShell.userData.shellState = openInteraction?.getState?.() === 'OPEN' ? 'placed' : 'inserted';
        insertedShell.userData.attractorTarget = false; updateSnap(step);
        if (['SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN'].includes(activateInteraction?.getState?.())) consumeInsertedContent(); }
    }
    syncFeedbackTransform();
    if (state === states.EMPTY && canEvaluateCandidate()) showFeedback('guide');
    else if (![states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) hideFeedback();
    updateConsumption(); commitConsumedContent(); updateRejects(step); reportedHeldShell = null;
  }
  function reportHeldShell(shell) { reportedHeldShell = shell ?? null; }
  function reset() {
    hideFeedback();
    if (insertedShell) { ownedMaterials.forEach((material) => material.dispose?.()); shellSystem.removeInstance?.(insertedShell); }
    insertedShell = null; pendingShellAssetId = null; reportedHeldShell = null; previousHeldShell = null;
    rejects.length = 0; candidateWasValid = false; materialBases.length = 0; ownedMaterials.clear(); setState(states.EMPTY);
  }
  function dispose() { if (disposed) return; reset(); disposed = true; listeners.clear(); feedback?.removeFromParent(); feedbackGeometry?.dispose(); feedbackMaterial?.dispose(); }
  return { update, reset, dispose, getInsertedShell: () => insertedShell,
    getInsertedShellAssetId: () => insertedShell ? validAssetId(insertedShell) : null,
    getInsertedShellWireframe: () => insertedShell?.userData?.panelWireframe ?? null,
    hasInsertedContent: () => [states.INSERTED, states.CONSUMING, states.CONSUMED].includes(state),
    hasValidInsertedContent: () => state === states.INSERTED && validate(insertedShell), canAcceptShell, reportHeldShell,
    consumeInsertedContent, commitConsumedContent, getState: () => state, isInsertionReady: () => insertionReady,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get pendingShellAssetId() { return pendingShellAssetId; }, chamberCylinder, feedback };
}
