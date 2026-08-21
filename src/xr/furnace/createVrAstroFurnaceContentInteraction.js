import * as THREE from '../../vendor/three.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { isWorldPointInsideChamberCylinder, resolveChamberCylinder, resolveFurnaceContentSnapTarget } from './vrAstroFurnaceChamberCylinder.js';
import { ASTRO_FURNACE_PROCESS_KINDS, processRotationPulse01 } from './createVrAstroFurnaceActivateInteraction.js';

export const ASTRO_FURNACE_CONTENT_STATES = Object.freeze({
  EMPTY: 'EMPTY', CANDIDATE_VALID: 'CANDIDATE_VALID', CANDIDATE_INVALID: 'CANDIDATE_INVALID',
  INSERTED: 'INSERTED', CONSUMING: 'CONSUMING', CONSUMED: 'CONSUMED'
});
export const ASTRO_FURNACE_CONTENT_KINDS = Object.freeze({ SHELL: 'SHELL', SMALL_GLYPH: 'SMALL_GLYPH' });

const VALID_ASSET_IDS = new Set(Array.from({ length: 6 }, (_, index) => `shell-relic-${index + 1}`));
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smoothstep = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export function processRotationPulse(angle) { return 3 * processRotationPulse01(angle); }
export function setObjectWorldScale(object, desired, target = new THREE.Vector3()) {
  object.scale.set(1, 1, 1); object.updateWorldMatrix(true, false); object.getWorldScale(target);
  object.scale.set(desired.x / Math.max(Math.abs(target.x), 1e-8), desired.y / Math.max(Math.abs(target.y), 1e-8),
    desired.z / Math.max(Math.abs(target.z), 1e-8)); object.updateWorldMatrix(false, false); return object.scale;
}
export function constrainHeldShellToDeviceSurfaces({ shell, shellCenter, origin, radius, deviceRoots = [],
  excludedRoots = [], clearance = 0.006, raycaster = new THREE.Raycaster() }) {
  const axis = new THREE.Vector3().subVectors(shellCenter, origin), targetDistance = axis.length();
  if (!shell?.parent || targetDistance <= 1e-8) return false;
  axis.multiplyScalar(1 / targetDistance); raycaster.set(origin, axis); raycaster.near = 0; raycaster.far = targetDistance;
  const isExcluded = (object) => excludedRoots.some((root) => root && (object === root || root.getObjectById?.(object.id)));
  const hit = deviceRoots.flatMap((root) => raycaster.intersectObject(root, true)).filter(({ object }) => object.isMesh
    && object.visible !== false && !isExcluded(object)
    && !/(helper|feedback|ray|halo|panel|button|insert_volume|content_anchor)/.test(object.name.toLowerCase()))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!hit || hit.distance >= targetDistance) return false;
  const distance = Math.max(0, hit.distance - Math.max(0, radius) - Math.max(0, clearance));
  const objectOrigin = shell.getWorldPosition(new THREE.Vector3());
  const constrainedOrigin = origin.clone().addScaledVector(axis, distance).sub(shellCenter.clone().sub(objectOrigin));
  shell.parent.worldToLocal(constrainedOrigin); shell.position.copy(constrainedOrigin); return true;
}

export function createVrAstroFurnaceContentInteraction({
  furnace, shellSystem, smallGlyphSystem, protoAstroTuningController, openInteraction, activateInteraction,
  progressionController, settings = {}, takeHeldShell = () => true, takeHeldSmallGlyph = () => false,
  isModeActive = () => true, isSmallGlyphModeActive = () => false, canExtractSmallGlyphEssence = () => false
}) {
  [takeHeldShell, takeHeldSmallGlyph, isModeActive, isSmallGlyphModeActive, canExtractSmallGlyphEssence].forEach((dependency) => {
    if (typeof dependency !== 'function') throw new TypeError('Astro furnace content dependencies must be functions.');
  });
  if (!smallGlyphSystem || typeof smallGlyphSystem.restoreInstanceToField !== 'function')
    throw new TypeError('smallGlyphSystem must expose restoreInstanceToField.');
  if (!protoAstroTuningController || typeof protoAstroTuningController.canExtractSmallGlyph !== 'function'
    || typeof protoAstroTuningController.commitExtractedSmallGlyph !== 'function')
    throw new TypeError('protoAstroTuningController must expose extraction APIs.');
  const states = ASTRO_FURNACE_CONTENT_STATES;
  const kinds = ASTRO_FURNACE_CONTENT_KINDS;
  const config = { enabled: true, snapDuration: .42, chamberClearance: .012, contentClearance: .012,
    guideOpacity: .07, validFeedbackOpacity: .58, invalidFeedbackOpacity: .62, releaseGrace: .035,
    surfaceClearance: .006, validColor: 0x49d17d, invalidColor: 0xe05252, ...settings };
  const volume = furnace?.nodes?.VR_FURNACE_INSERT_VOLUME, anchor = furnace?.nodes?.VR_FURNACE_CONTENT_ANCHOR;
  const chamber = furnace?.nodes?.komora, chamberCylinder = resolveChamberCylinder(chamber, config.chamberClearance);
  const insertionReady = config.enabled !== false && Boolean(volume && anchor && chamberCylinder);
  if (volume) volume.visible = false;
  if (config.enabled !== false && !insertionReady) console.warn('[Experience VR] Astro furnace content insertion is disabled: chamber geometry, insert marker, or content anchor is missing.');
  const feedbackGeometry = insertionReady ? new THREE.CylinderGeometry(chamberCylinder.radius, chamberCylinder.radius, chamberCylinder.height, 24, 1, true) : null;
  const feedbackMaterial = insertionReady ? new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false,
    depthWrite: false, side: THREE.DoubleSide, color: config.validColor }) : null;
  const feedback = insertionReady ? new THREE.Mesh(feedbackGeometry, feedbackMaterial) : null;
  if (feedback) { feedback.name = 'VrAstroFurnaceInsertFeedback'; feedback.renderOrder = 1000; feedback.visible = false; furnace.object.add(feedback); }

  const position = new THREE.Vector3(), local = new THREE.Vector3(), worldScale = new THREE.Vector3();
  const baselines = new WeakMap(), materialBases = [], listeners = new Set();
  let state = states.EMPTY, insertedContent = null, insertedKind = null, pendingShellAssetId = null;
  let reportedHeldShell = null, reportedHeldSmallGlyph = null, snapElapsed = 0, elapsed = 0, disposed = false;
  let baseScale = null, snapStartPosition = null, snapStartQuaternion = null, snapStartScale = null;
  let snapTarget = null, desiredWorldScale = null;
  function setState(next) { if (state === next) return; state = next; listeners.forEach((listener) => listener(next)); }
  function shellAssetId(shell) { return shell?.userData?.shellAssetId ?? null; }
  function shellRecord(shell) { return shellSystem?.getRecord?.(shell) ?? shellSystem?.records?.find((record) => record.object === shell) ?? null; }
  function worldCenter(object, target = position) {
    object.updateWorldMatrix(true, true); const center = insertedKind === kinds.SHELL || object?.userData?.shellAssetId
      ? shellRecord(object)?.boundingCenter : null;
    if (center) return target.copy(center).applyMatrix4(object.matrixWorld);
    const box = new THREE.Box3().setFromObject(object); return box.isEmpty() ? object.getWorldPosition(target) : box.getCenter(target);
  }
  function worldRadius(object) { const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere()); return sphere.radius; }
  function isNear(object) { return Boolean(object && insertionReady
    && isWorldPointInsideChamberCylinder(worldCenter(object), chamber, chamberCylinder, local)); }
  function validateShell(shell) { const id = shellAssetId(shell); return isModeActive() && VALID_ASSET_IDS.has(id)
    && progressionController?.canAbsorbShell?.(id) === true; }
  function resolveSmallGlyph(glyph) { return resolveVrSmallGlyphProtoAstro(glyph); }
  function validateSmallGlyph(glyph) { return isSmallGlyphModeActive() && canExtractSmallGlyphEssence() === true
    && Boolean(resolveSmallGlyph(glyph)) && protoAstroTuningController.canExtractSmallGlyph(glyph) === true; }
  function canEvaluate(kind) { return insertionReady && !disposed && !insertedContent
    && (kind === kinds.SHELL ? isModeActive() : isSmallGlyphModeActive())
    && openInteraction?.getState?.() === 'OPEN' && activateInteraction?.getState?.() === 'IDLE'; }
  function showFeedback(valid = true) { if (!feedback) return; feedback.material.color.setHex(valid ? config.validColor : config.invalidColor);
    feedback.material.opacity = (valid ? config.validFeedbackOpacity : config.invalidFeedbackOpacity)
      * (.82 + .18 * Math.sin(elapsed * Math.PI * 4)); feedback.visible = true; }
  function hideFeedback() { if (feedback) feedback.visible = false; }
  function syncFeedbackTransform() { if (!feedback) return; chamber.updateWorldMatrix(true, false); furnace.object.updateWorldMatrix(true, false);
    const matrix = new THREE.Matrix4().multiplyMatrices(furnace.object.matrixWorld.clone().invert(), chamber.matrixWorld);
    matrix.decompose(feedback.position, feedback.quaternion, feedback.scale);
    feedback.position.add(chamberCylinder.center.clone().multiply(feedback.scale).applyQuaternion(feedback.quaternion)); }
  function ownShellMaterials(shell) { materialBases.length = 0; shell.traverse((node) => {
    if (!node.isMesh || !node.material) return; (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) =>
      materialBases.push({ material, color: material.color?.clone(), emissive: material.emissive?.clone(),
        emissiveIntensity: material.emissiveIntensity ?? 0, opacity: material.opacity ?? 1, transparent: material.transparent ?? false })); }); }
  function accept(content, kind) {
    const valid = kind === kinds.SHELL ? validateShell(content) : validateSmallGlyph(content);
    const take = kind === kinds.SHELL ? takeHeldShell : takeHeldSmallGlyph;
    if (!content || !canEvaluate(kind) || !valid || take(content) !== true) return false;
    insertedContent = content; insertedKind = kind; pendingShellAssetId = null;
    baseScale = baselines.get(content) ?? content.getWorldScale(new THREE.Vector3()); baselines.set(content, baseScale.clone());
    if (kind === kinds.SHELL) ownShellMaterials(content); else materialBases.length = 0;
    anchor.attach(content); snapStartPosition = content.position.clone(); snapStartQuaternion = content.quaternion.clone(); snapStartScale = content.scale.clone();
    const size = new THREE.Box3().setFromObject(content).getSize(new THREE.Vector3());
    const available = new THREE.Vector3(chamberCylinder.radius * 2, chamberCylinder.height, chamberCylinder.radius * 2);
    const fit = Math.min(1, ...['x', 'y', 'z'].map((axis) => size[axis] > 1e-6 ? available[axis] / size[axis] : 1));
    desiredWorldScale = baseScale.clone().multiplyScalar(fit);
    setObjectWorldScale(content, desiredWorldScale, worldScale);
    snapTarget = resolveFurnaceContentSnapTarget({ object: content, anchor,
      energyCell: furnace?.nodes?.energy_cell ?? furnace?.nodes?.fire_cell, contentClearance: config.contentClearance,
      desiredWorldScale,
      localGeometryCenter: kind === kinds.SHELL ? shellRecord(content)?.boundingCenter ?? null : null });
    if (kind === kinds.SHELL) { content.userData.furnaceDesiredWorldScale = desiredWorldScale;
      content.userData.furnaceSnapTarget = snapTarget; content.userData.shellState = 'inserted'; content.userData.attractorTarget = false; }
    snapElapsed = 0; setState(states.INSERTED); hideFeedback(); return true;
  }
  function updateCandidate() {
    const candidateKind = isSmallGlyphModeActive() ? kinds.SMALL_GLYPH : kinds.SHELL;
    const held = candidateKind === kinds.SMALL_GLYPH ? reportedHeldSmallGlyph : reportedHeldShell;
    if (!held || !canEvaluate(candidateKind) || !isNear(held)) {
      if ([states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) setState(states.EMPTY);
      return;
    }
    const valid = candidateKind === kinds.SHELL ? validateShell(held) : validateSmallGlyph(held);
    setState(valid ? states.CANDIDATE_VALID : states.CANDIDATE_INVALID); showFeedback(valid);
    if (valid) accept(held, candidateKind);
  }
  function updateSnap(delta) { if (state !== states.INSERTED || !insertedContent || snapElapsed >= config.snapDuration) return;
    snapElapsed = Math.min(config.snapDuration, snapElapsed + delta); const t = smoothstep(snapElapsed / Math.max(config.snapDuration, 1e-6));
    insertedContent.position.lerpVectors(snapStartPosition, snapTarget, t);
    insertedContent.quaternion.slerpQuaternions(snapStartQuaternion, new THREE.Quaternion(), t);
    const targetScale = desiredWorldScale.clone(); insertedContent.parent.getWorldScale(worldScale);
    targetScale.set(targetScale.x / Math.abs(worldScale.x), targetScale.y / Math.abs(worldScale.y), targetScale.z / Math.abs(worldScale.z));
    insertedContent.scale.lerpVectors(snapStartScale, targetScale, t); }
  function consumeInsertedContent() { if (state !== states.INSERTED || !insertedContent) return false;
    pendingShellAssetId = insertedKind === kinds.SHELL ? shellAssetId(insertedContent) : null;
    if (insertedKind === kinds.SHELL) { insertedContent.userData.shellState = 'consuming'; insertedContent.userData.attractorTarget = false; }
    setState(states.CONSUMING); return true; }
  function updateConsumption() { if (state !== states.CONSUMING || !insertedContent) return;
    const progress = activateInteraction?.getExtractionProgress?.() ?? 0;
    if (insertedKind === kinds.SHELL) { const t = smoothstep(progress), pulse = processRotationPulse(activateInteraction?.getProcessAngle?.() ?? 0);
      materialBases.forEach(({ material, color, emissive, emissiveIntensity, opacity }) => {
        if (material.color && color) material.color.copy(color).lerp(new THREE.Color(1, 1, 1), t * .35);
        if (material.emissive) material.emissive.copy(emissive ?? new THREE.Color()).lerp(new THREE.Color(1, 1, 1), t);
        if ('emissiveIntensity' in material) material.emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity + pulse, 7, t);
        material.transparent = true; material.opacity = THREE.MathUtils.lerp(opacity, 0, t); }); }
    if (progress >= 1) { if (insertedKind === kinds.SHELL) { insertedContent.visible = false; insertedContent.userData.shellState = 'consumed'; }
      setState(states.CONSUMED); } }
  function commitConsumedContent() { if (state !== states.CONSUMED || activateInteraction?.getState?.() !== 'COMPLETE' || !insertedContent) return false;
    if (insertedKind === kinds.SHELL) { if (!pendingShellAssetId || !progressionController.commitAbsorbedShell(pendingShellAssetId)) return false;
      shellSystem.removeInstance?.(insertedContent);
    } else { if (activateInteraction?.getProcessKind?.() !== ASTRO_FURNACE_PROCESS_KINDS.SMALL_GLYPH_ESSENCE_EXTRACTION)
        throw new Error('Small glyph content completed with an invalid furnace process kind.');
      if (!protoAstroTuningController.commitExtractedSmallGlyph(insertedContent))
        throw new Error('Proto-Astro tuning controller rejected an accepted small glyph extraction.');
      if (!smallGlyphSystem.restoreInstanceToField(insertedContent))
        throw new Error('Small glyph system rejected restoration after essence extraction.'); }
    insertedContent = null; insertedKind = null; pendingShellAssetId = null; snapTarget = null; desiredWorldScale = null;
    materialBases.length = 0; setState(states.EMPTY); return true; }
  function update(delta = 0) { if (disposed) return; const step = Math.max(0, Number.isFinite(delta) ? delta : 0); elapsed += step;
    if (!insertedContent) updateCandidate();
    if (state === states.INSERTED) { updateSnap(step); if (['SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN'].includes(activateInteraction?.getState?.())) consumeInsertedContent(); }
    [reportedHeldShell, reportedHeldSmallGlyph].filter(Boolean).forEach((held) => {
      const center = worldCenter(held, new THREE.Vector3()), origin = held.parent?.getWorldPosition(new THREE.Vector3());
      if (origin) constrainHeldShellToDeviceSurfaces({ shell: held, shellCenter: center, origin, radius: worldRadius(held),
        deviceRoots: [furnace.object], excludedRoots: openInteraction?.getState?.() === 'OPEN' ? [chamber] : [], clearance: config.surfaceClearance }); });
    syncFeedbackTransform(); if (state === states.EMPTY && (canEvaluate(kinds.SHELL) || canEvaluate(kinds.SMALL_GLYPH))) {
      if (feedback) { feedback.material.opacity = config.guideOpacity; feedback.visible = true; }
    } else if (![states.CANDIDATE_VALID, states.CANDIDATE_INVALID].includes(state)) hideFeedback();
    updateConsumption(); commitConsumedContent(); reportedHeldShell = null; reportedHeldSmallGlyph = null; }
  function reset() { hideFeedback(); if (insertedContent) {
      if (insertedKind === kinds.SMALL_GLYPH) smallGlyphSystem.restoreInstanceToField(insertedContent);
      else shellSystem.removeInstance?.(insertedContent); }
    insertedContent = null; insertedKind = null; pendingShellAssetId = null; snapTarget = null; desiredWorldScale = null;
    reportedHeldShell = null; reportedHeldSmallGlyph = null;
    materialBases.length = 0; setState(states.EMPTY); }
  function dispose() { if (disposed) return; reset(); disposed = true; listeners.clear(); feedback?.removeFromParent(); feedbackGeometry?.dispose(); feedbackMaterial?.dispose(); }
  return { update, reset, dispose, getInsertedContentKind: () => insertedKind,
    getInsertedShell: () => insertedKind === kinds.SHELL ? insertedContent : null,
    getInsertedShellAssetId: () => insertedKind === kinds.SHELL ? shellAssetId(insertedContent) : null,
    getInsertedShellWireframe: () => insertedKind === kinds.SHELL ? insertedContent?.userData?.panelWireframe ?? null : null,
    getInsertedSmallGlyph: () => insertedKind === kinds.SMALL_GLYPH ? insertedContent : null,
    getInsertedSmallGlyphProtoAstro: () => insertedKind === kinds.SMALL_GLYPH ? resolveSmallGlyph(insertedContent) : null,
    hasInsertedContent: () => [states.INSERTED, states.CONSUMING, states.CONSUMED].includes(state),
    hasValidInsertedContent: () => state === states.INSERTED && (insertedKind === kinds.SHELL
      ? validateShell(insertedContent) : validateSmallGlyph(insertedContent)),
    canAcceptShell: (shell = null) => canEvaluate(kinds.SHELL) && (!shell || validateShell(shell)),
    reportHeldShell: (shell) => { reportedHeldShell = shell ?? null; },
    reportHeldSmallGlyph: (glyph) => { reportedHeldSmallGlyph = glyph ?? null; },
    consumeInsertedContent, commitConsumedContent, getState: () => state, isInsertionReady: () => insertionReady,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    get pendingShellAssetId() { return pendingShellAssetId; }, chamberCylinder, feedback };
}
