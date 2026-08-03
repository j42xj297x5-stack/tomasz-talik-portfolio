import * as THREE from '../../vendor/three.js';

export const ASTRO_FURNACE_CONTENT_STATES = Object.freeze({
  EMPTY: 'EMPTY', CANDIDATE_VALID: 'CANDIDATE_VALID', CANDIDATE_INVALID: 'CANDIDATE_INVALID',
  INSERTED: 'INSERTED', CONSUMING: 'CONSUMING', CONSUMED: 'CONSUMED'
});

const VALID_ASSET_IDS = new Set(Array.from({ length: 6 }, (_, index) => `shell-relic-${index + 1}`));
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smoothstep = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

export function createVrAstroFurnaceContentInteraction({
  furnace, shellSystem, openInteraction, activateInteraction, progressionController, settings = {}
}) {
  const states = ASTRO_FURNACE_CONTENT_STATES;
  const config = {
    enabled: true, volumeRadius: 0.122, proximityRadiusMultiplier: 1.15, snapDuration: 0.42, insertedScale: 0.72,
    contentClearance: 0.012, rejectDuration: 0.28, rejectDistanceMultiplier: 1.35,
    feedbackOpacity: 0.20, validColor: 0x49d17d, invalidColor: 0xe05252,
    consumeStartProgress: 0.18, consumeEndProgress: 0.78, ...settings
  };
  const volume = furnace?.nodes?.VR_FURNACE_INSERT_VOLUME;
  const anchor = furnace?.nodes?.VR_FURNACE_CONTENT_ANCHOR;
  const chamber = furnace?.nodes?.komora;
  const hasGeometryVolume = Boolean(volume?.geometry);
  let insertionReady = config.enabled !== false && Boolean(volume && anchor)
    && (hasGeometryVolume || Number(config.volumeRadius) > 0);
  if (volume) volume.visible = false;
  if (config.enabled !== false && !insertionReady) {
    console.warn('[Experience VR] Astro furnace shell insertion is disabled: insert volume, content anchor, or fallback radius is missing.');
  }
  if (volume?.geometry && !volume.geometry.boundingSphere) volume.geometry.computeBoundingSphere();
  const localSphere = volume?.geometry?.boundingSphere?.clone() ?? new THREE.Sphere(new THREE.Vector3(), config.volumeRadius);
  const worldCenter = new THREE.Vector3(), worldScale = new THREE.Vector3(), shellPosition = new THREE.Vector3();
  const chamberBox = new THREE.Box3().makeEmpty();
  const chamberInverse = new THREE.Matrix4(), lanceDirection = new THREE.Vector3(), blockedLocal = new THREE.Vector3();
  const shellBaselines = new WeakMap();
  if (chamber) {
    chamber.updateWorldMatrix(true, true); chamberInverse.copy(chamber.matrixWorld).invert();
    chamber.traverse((node) => { if (!node.geometry) return; if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      if (node.geometry.boundingBox) chamberBox.union(node.geometry.boundingBox.clone().applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(chamberInverse, node.matrixWorld))); });
  }
  const feedbackGeometry = insertionReady ? new THREE.SphereGeometry(1, 20, 12) : null;
  const feedbackMaterial = insertionReady ? new THREE.MeshBasicMaterial({ transparent: true, opacity: 0,
    depthWrite: false, side: THREE.DoubleSide, color: config.validColor }) : null;
  const feedback = insertionReady ? new THREE.Mesh(feedbackGeometry, feedbackMaterial) : null;
  if (feedback) { feedback.name = 'VrAstroFurnaceInsertFeedback'; feedback.visible = false; furnace.object.add(feedback); }

  let state = states.EMPTY, insertedShell = null, pendingShellAssetId = null, reportedHeldShell = null;
  let previousHeldShell = null, candidateWasValid = false, snapElapsed = 0, elapsed = 0, disposed = false;
  let baseScale = null, snapStartPosition = null, snapStartQuaternion = null, snapStartScale = null;
  const materialBases = [], ownedMaterials = new Set();
  const listeners = new Set(), rejects = [];
  function setState(next) { if (state === next) return; state = next; listeners.forEach((listener) => listener(next)); }

  function sphereWorld() {
    volume.updateWorldMatrix(true, false);
    worldCenter.copy(localSphere.center).applyMatrix4(volume.matrixWorld);
    volume.getWorldScale(worldScale);
    return { center: worldCenter, radius: localSphere.radius * Math.max(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z)) };
  }
  function validAssetId(shell) { return shell?.userData?.shellAssetId; }
  function validate(shell) {
    const assetId = validAssetId(shell);
    return VALID_ASSET_IDS.has(assetId) && progressionController?.canAbsorbShell?.(assetId) === true;
  }
  function baselineScale(shell) {
    let baseline = shellBaselines.get(shell);
    if (!baseline) { baseline = shell.scale.clone(); shellBaselines.set(shell, baseline); }
    return baseline;
  }
  function blockClosedChamber(shell) {
    if (!shell || chamberBox.isEmpty() || openInteraction?.getState?.() === 'OPEN') return;
    chamber.updateWorldMatrix(true, false); chamberInverse.copy(chamber.matrixWorld).invert();
    shell.getWorldPosition(shellPosition); blockedLocal.copy(shellPosition).applyMatrix4(chamberInverse);
    const center = chamberBox.getCenter(new THREE.Vector3()), size = chamberBox.getSize(new THREE.Vector3());
    const halfDepth = size.z / 2, radius = Math.max(size.x, size.y) / 2;
    const dx = blockedLocal.x - center.x, dy = blockedLocal.y - center.y;
    if (dx * dx + dy * dy >= radius * radius || Math.abs(blockedLocal.z - center.z) >= halfDepth) return;
    // The held shell is parented below the controller. Moving along its parent's local +Z
    // reverses the controller lance without discarding the authored chamber orientation.
    lanceDirection.set(0, 0, 1).applyQuaternion(shell.parent?.getWorldQuaternion?.(new THREE.Quaternion()) ?? new THREE.Quaternion()).normalize();
    for (let distance = 0; distance <= radius * 4; distance += Math.max(radius / 16, .002)) {
      const candidate = shellPosition.clone().addScaledVector(lanceDirection, distance);
      blockedLocal.copy(candidate).applyMatrix4(chamberInverse);
      const cx = blockedLocal.x - center.x, cy = blockedLocal.y - center.y;
      if (cx * cx + cy * cy >= radius * radius || Math.abs(blockedLocal.z - center.z) >= halfDepth) {
        shell.parent.worldToLocal(candidate); shell.position.copy(candidate); return;
      }
    }
  }
  function canAcceptShell(shell = null) {
    return insertionReady && !disposed && state !== states.INSERTED && state !== states.CONSUMING && state !== states.CONSUMED
      && openInteraction?.getState?.() === 'OPEN' && activateInteraction?.getState?.() === 'IDLE'
      && (!shell || shell !== insertedShell);
  }
  function canEvaluateCandidate() { return insertionReady && !disposed && openInteraction?.getState?.() === 'OPEN'
    && activateInteraction?.getState?.() === 'IDLE'; }
  function isNear(shell) {
    if (!shell || !insertionReady) return false;
    const sphere = sphereWorld(); shell.getWorldPosition(shellPosition);
    return shellPosition.distanceTo(sphere.center) <= sphere.radius * config.proximityRadiusMultiplier;
  }
  function showFeedback(valid) {
    if (!feedback) return;
    const sphere = sphereWorld(); furnace.object.worldToLocal(feedback.position.copy(sphere.center));
    furnace.object.getWorldScale(worldScale);
    feedback.scale.setScalar(sphere.radius * config.proximityRadiusMultiplier / Math.max(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z), 1e-6));
    feedback.material.color.setHex(valid ? config.validColor : config.invalidColor);
    feedback.material.opacity = config.feedbackOpacity * (0.82 + 0.18 * Math.sin(elapsed * Math.PI * 3));
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
  function resolveSnapTarget(shell) {
    const savedPosition = shell.position.clone(), savedQuaternion = shell.quaternion.clone(), savedScale = shell.scale.clone();
    shell.position.set(0, 0, 0); shell.quaternion.identity(); shell.scale.copy(baseScale).multiplyScalar(shell.userData.furnaceInsertedScale); shell.updateWorldMatrix(true, true);
    const shellBox = boxInAnchor(shell), energy = furnace?.nodes?.energy_cell ?? furnace?.nodes?.fire_cell;
    const energyBox = energy ? boxInAnchor(energy) : new THREE.Box3().makeEmpty();
    const target = new THREE.Vector3();
    if (!shellBox.isEmpty() && !energyBox.isEmpty()) target.y = energyBox.min.y - config.contentClearance - shellBox.max.y;
    shell.position.copy(savedPosition); shell.quaternion.copy(savedQuaternion); shell.scale.copy(savedScale); shell.updateWorldMatrix(true, true);
    return target;
  }
  function accept(shell) {
    if (!shell || !canAcceptShell(shell) || !validate(shell)) return false;
    insertedShell = shell; pendingShellAssetId = null; baseScale = baselineScale(shell).clone(); ownMaterials(shell);
    anchor.attach(shell); snapStartPosition = shell.position.clone(); snapStartQuaternion = shell.quaternion.clone(); snapStartScale = shell.scale.clone();
    const baselineBox = boxInAnchor(shell), volumeBox = boxInAnchor(volume);
    const shellSize = baselineBox.getSize(new THREE.Vector3()), available = volumeBox.getSize(new THREE.Vector3());
    const fitScale = Math.min(1, ...['x', 'y', 'z'].map((axis) => shellSize[axis] > 1e-6 ? available[axis] / shellSize[axis] : 1));
    shell.userData.furnaceInsertedScale = fitScale;
    shell.userData.furnaceSnapTarget = resolveSnapTarget(shell);
    shell.userData.shellState = 'inserted'; shell.userData.attractorTarget = false;
    snapElapsed = 0; setState(states.INSERTED); hideFeedback(); return true;
  }
  function reject(shell) {
    const sphere = sphereWorld(), start = new THREE.Vector3(); shell.getWorldPosition(start);
    const direction = start.clone().sub(sphere.center); if (direction.lengthSq() < 1e-8) direction.set(1, 0, 0);
    const end = sphere.center.clone().add(direction.normalize().multiplyScalar(sphere.radius * config.proximityRadiusMultiplier * config.rejectDistanceMultiplier));
    shell.userData.shellState = 'rejecting'; rejects.push({ shell, elapsed: 0, start, end });
  }
  function updateCandidate() {
    const held = reportedHeldShell;
    const releasedShell = !held ? previousHeldShell : null;
    const releasedWasValid = candidateWasValid;
    if (held && canEvaluateCandidate() && isNear(held)) {
      candidateWasValid = canAcceptShell(held) && validate(held); setState(candidateWasValid ? states.CANDIDATE_VALID : states.CANDIDATE_INVALID);
      showFeedback(candidateWasValid);
    } else if ([states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) {
      setState(insertedShell ? states.INSERTED : states.EMPTY); candidateWasValid = false; hideFeedback();
    }
    if (releasedShell && releasedWasValid && isNear(releasedShell)) accept(releasedShell);
    else if (releasedShell && !releasedWasValid && isNear(releasedShell) && canEvaluateCandidate()) reject(releasedShell);
    previousHeldShell = held;
  }
  function updateSnap(delta) {
    if (state !== states.INSERTED || !insertedShell || snapElapsed >= config.snapDuration) return;
    snapElapsed = Math.min(config.snapDuration, snapElapsed + delta);
    const t = smoothstep(snapElapsed / Math.max(config.snapDuration, 1e-6));
    insertedShell.position.lerpVectors(snapStartPosition, insertedShell.userData.furnaceSnapTarget, t);
    insertedShell.quaternion.slerpQuaternions(snapStartQuaternion, new THREE.Quaternion(), t);
    insertedShell.scale.lerpVectors(snapStartScale, baseScale.clone().multiplyScalar(insertedShell.userData.furnaceInsertedScale), t);
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
    const progress = activateInteraction?.getProgress?.() ?? 0;
    const t = smoothstep((progress - config.consumeStartProgress) / Math.max(config.consumeEndProgress - config.consumeStartProgress, 1e-6));
    // Absorption is communicated by light and opacity; the physical shell stays settled.
    materialBases.forEach(({ material, color, emissive, emissiveIntensity, opacity }) => {
      if (material.color && color) material.color.copy(color).lerp(new THREE.Color(1, 1, 1), t * 0.35);
      if (material.emissive) material.emissive.copy(emissive ?? new THREE.Color()).lerp(new THREE.Color(1, 1, 1), t);
      if ('emissiveIntensity' in material) material.emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity, 7, t);
      material.transparent = true; material.opacity = THREE.MathUtils.lerp(opacity, 0, t);
    });
    if (progress >= config.consumeEndProgress) { insertedShell.visible = false; insertedShell.userData.shellState = 'consumed'; setState(states.CONSUMED); }
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
      insertedShell.scale.copy(baseScale);
      insertedShell = null; pendingShellAssetId = null; materialBases.length = 0; ownedMaterials.clear(); setState(states.EMPTY); hideFeedback();
    } else if ([states.EMPTY, states.CANDIDATE_VALID, states.CANDIDATE_INVALID, states.INSERTED].includes(state)) updateCandidate();
    if (reportedHeldShell) blockClosedChamber(reportedHeldShell);
    if (state === states.INSERTED) {
      if (insertedShell) { insertedShell.userData.shellState = openInteraction?.getState?.() === 'OPEN' ? 'placed' : 'inserted';
        insertedShell.userData.attractorTarget = false; updateSnap(step);
        if (['SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN'].includes(activateInteraction?.getState?.())) consumeInsertedContent(); }
    }
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
    hasInsertedContent: () => [states.INSERTED, states.CONSUMING, states.CONSUMED].includes(state),
    hasValidInsertedContent: () => state === states.INSERTED && validate(insertedShell), canAcceptShell, reportHeldShell,
    consumeInsertedContent, commitConsumedContent, getState: () => state, isInsertionReady: () => insertionReady,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get pendingShellAssetId() { return pendingShellAssetId; }, feedback };
}
