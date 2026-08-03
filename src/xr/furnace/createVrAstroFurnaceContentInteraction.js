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
    enabled: true, proximityRadiusMultiplier: 1.15, snapDuration: 0.32, insertedScale: 0.72,
    feedbackOpacity: 0.20, validColor: 0x49d17d, invalidColor: 0xe05252,
    consumeStartProgress: 0.18, consumeEndProgress: 0.78, ...settings
  };
  const volume = furnace?.nodes?.VR_FURNACE_INSERT_VOLUME;
  const anchor = furnace?.nodes?.VR_FURNACE_CONTENT_ANCHOR;
  let insertionReady = config.enabled !== false && Boolean(volume?.geometry && anchor);
  if (volume) volume.visible = false;
  if (config.enabled !== false && !insertionReady) {
    console.warn('[Experience VR] Astro furnace shell insertion is disabled: insert volume geometry or content anchor is missing.');
  }
  if (volume?.geometry && !volume.geometry.boundingSphere) volume.geometry.computeBoundingSphere();
  const localSphere = volume?.geometry?.boundingSphere?.clone() ?? new THREE.Sphere();
  const worldCenter = new THREE.Vector3(), worldScale = new THREE.Vector3(), shellPosition = new THREE.Vector3();
  const feedbackGeometry = insertionReady ? new THREE.SphereGeometry(1, 20, 12) : null;
  const feedbackMaterial = insertionReady ? new THREE.MeshBasicMaterial({ transparent: true, opacity: 0,
    depthWrite: false, side: THREE.DoubleSide, color: config.validColor }) : null;
  const feedback = insertionReady ? new THREE.Mesh(feedbackGeometry, feedbackMaterial) : null;
  if (feedback) { feedback.name = 'VrAstroFurnaceInsertFeedback'; feedback.visible = false; furnace.object.add(feedback); }

  let state = states.EMPTY, insertedShell = null, pendingShellAssetId = null, reportedHeldShell = null;
  let previousHeldShell = null, candidateWasValid = false, snapElapsed = 0, elapsed = 0, disposed = false;
  let baseScale = null, snapStartPosition = null, snapStartQuaternion = null, snapStartScale = null;
  const materialBases = [], ownedMaterials = new Set();

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
  function canAcceptShell(shell = null) {
    return insertionReady && !disposed && state !== states.INSERTED && state !== states.CONSUMING && state !== states.CONSUMED
      && openInteraction?.getState?.() === 'OPEN' && activateInteraction?.getState?.() === 'IDLE'
      && (!shell || shell !== insertedShell);
  }
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
  function accept(shell) {
    if (!shell || !canAcceptShell(shell) || !validate(shell)) return false;
    insertedShell = shell; pendingShellAssetId = null; baseScale = shell.scale.clone(); ownMaterials(shell);
    anchor.attach(shell); snapStartPosition = shell.position.clone(); snapStartQuaternion = shell.quaternion.clone(); snapStartScale = shell.scale.clone();
    shell.userData.shellState = 'inserted'; shell.userData.attractorTarget = false;
    snapElapsed = 0; state = states.INSERTED; hideFeedback(); return true;
  }
  function updateCandidate() {
    const held = reportedHeldShell;
    const releasedShell = !held ? previousHeldShell : null;
    const releasedWasValid = candidateWasValid;
    if (held && canAcceptShell(held) && isNear(held)) {
      candidateWasValid = validate(held); state = candidateWasValid ? states.CANDIDATE_VALID : states.CANDIDATE_INVALID;
      showFeedback(candidateWasValid);
    } else if ([states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) {
      state = states.EMPTY; candidateWasValid = false; hideFeedback();
    }
    if (releasedShell && releasedWasValid && isNear(releasedShell)) accept(releasedShell);
    previousHeldShell = held;
  }
  function updateSnap(delta) {
    if (state !== states.INSERTED || !insertedShell || snapElapsed >= config.snapDuration) return;
    snapElapsed = Math.min(config.snapDuration, snapElapsed + delta);
    const t = smoothstep(snapElapsed / Math.max(config.snapDuration, 1e-6));
    insertedShell.position.lerpVectors(snapStartPosition, new THREE.Vector3(), t);
    insertedShell.quaternion.slerpQuaternions(snapStartQuaternion, new THREE.Quaternion(), t);
    insertedShell.scale.lerpVectors(snapStartScale, baseScale.clone().multiplyScalar(config.insertedScale), t);
  }
  function consumeInsertedContent() {
    if (state !== states.INSERTED || !insertedShell) return false;
    pendingShellAssetId = validAssetId(insertedShell); state = states.CONSUMING;
    insertedShell.userData.shellState = 'consuming'; insertedShell.userData.attractorTarget = false; return true;
  }
  function updateConsumption() {
    if (state !== states.CONSUMING || !insertedShell) return;
    const progress = activateInteraction?.getProgress?.() ?? 0;
    const t = smoothstep((progress - config.consumeStartProgress) / Math.max(config.consumeEndProgress - config.consumeStartProgress, 1e-6));
    insertedShell.scale.copy(baseScale).multiplyScalar(THREE.MathUtils.lerp(config.insertedScale, 0.05, t));
    materialBases.forEach(({ material, color, emissive, emissiveIntensity, opacity }) => {
      if (material.color && color) material.color.copy(color).lerp(new THREE.Color(1, 1, 1), t * 0.35);
      if (material.emissive) material.emissive.copy(emissive ?? new THREE.Color()).lerp(new THREE.Color(1, 1, 1), t);
      if ('emissiveIntensity' in material) material.emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity, 7, t);
      material.transparent = true; material.opacity = THREE.MathUtils.lerp(opacity, 0, t);
    });
    if (progress >= config.consumeEndProgress) { insertedShell.visible = false; insertedShell.userData.shellState = 'consumed'; state = states.CONSUMED; }
  }
  function commitConsumedContent() {
    if (state !== states.CONSUMED || activateInteraction?.getState?.() !== 'COMPLETE' || !pendingShellAssetId) return false;
    if (!progressionController.commitAbsorbedShell(pendingShellAssetId)) return false;
    shellSystem.removeInstance?.(insertedShell); insertedShell = null; pendingShellAssetId = null; materialBases.length = 0;
    ownedMaterials.clear(); state = states.EMPTY; return true;
  }
  function update(delta = 0) {
    if (disposed) return; const step = Math.max(0, Number.isFinite(delta) ? delta : 0); elapsed += step;
    if ([states.EMPTY, states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) updateCandidate();
    if (state === states.INSERTED) {
      if (reportedHeldShell === insertedShell) { insertedShell = null; pendingShellAssetId = null; materialBases.length = 0;
        ownedMaterials.clear(); state = states.EMPTY; hideFeedback(); }
      else { insertedShell.userData.shellState = openInteraction?.getState?.() === 'OPEN' ? 'placed' : 'inserted';
        insertedShell.userData.attractorTarget = false; updateSnap(step);
        if (['SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN'].includes(activateInteraction?.getState?.())) consumeInsertedContent(); }
    }
    updateConsumption(); commitConsumedContent(); reportedHeldShell = null;
  }
  function reportHeldShell(shell) { reportedHeldShell = shell ?? null; }
  function reset() {
    hideFeedback();
    if (insertedShell) { ownedMaterials.forEach((material) => material.dispose?.()); shellSystem.removeInstance?.(insertedShell); }
    insertedShell = null; pendingShellAssetId = null; reportedHeldShell = null; previousHeldShell = null;
    candidateWasValid = false; materialBases.length = 0; ownedMaterials.clear(); state = states.EMPTY;
  }
  function dispose() { if (disposed) return; reset(); disposed = true; feedback?.removeFromParent(); feedbackGeometry?.dispose(); feedbackMaterial?.dispose(); }
  return { update, reset, dispose, getInsertedShell: () => insertedShell,
    getInsertedShellAssetId: () => insertedShell ? validAssetId(insertedShell) : null,
    hasInsertedContent: () => [states.INSERTED, states.CONSUMING, states.CONSUMED].includes(state),
    hasValidInsertedContent: () => state === states.INSERTED && validate(insertedShell), canAcceptShell, reportHeldShell,
    consumeInsertedContent, commitConsumedContent, getState: () => state,
    get pendingShellAssetId() { return pendingShellAssetId; }, feedback };
}
