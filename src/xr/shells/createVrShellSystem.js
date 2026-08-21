import * as THREE from '../../vendor/three.js';
import { createObjectWireframeData } from '../visuals/createObjectWireframeData.js';

const TAU = Math.PI * 2;
const ASSET_IDS = Object.freeze(Array.from({ length: 6 }, (_, index) => `shell-relic-${index + 1}`));
const SUFFIXES = Object.freeze(['a', 'b', 'c']);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function createVrShellSystem({ parent, assetManager, baseRadius, centerY = 0, emissionSettings = {},
  idleMotionSettings = {}, direction = 1 }) {
  if (!parent?.add || !assetManager?.cloneGltfScene) throw new Error('VrShellSystem requires parent and assetManager.');
  if (!Number.isFinite(baseRadius) || baseRadius <= 0) throw new Error('VrShellSystem requires a positive baseRadius.');
  if (direction !== 1 && direction !== -1) throw new Error('VrShellSystem direction must be 1 or -1.');
  const claimedMin = emissionSettings.claimedEmissionMin ?? 1;
  const claimedMax = emissionSettings.claimedEmissionMax ?? 2;
  const claimedDuration = emissionSettings.claimedEmissionPulseDuration ?? 1.4;
  const idleAmplitude = idleMotionSettings.verticalAmplitude ?? 0.20;
  const idleAngularSpeed = TAU / (idleMotionSettings.verticalCycleDuration ?? 4.8);
  const idleRotationSpeed = idleMotionSettings.rotationSpeed ?? 0.12;
  const object = new THREE.Group(); object.name = 'VrShellSystem'; object.visible = false; parent.add(object);
  let active = false, interactionEnabled = false, elapsed = 0, disposed = false, currentDelta = 0;
  const instances = [], records = [], ownedMaterials = new Set(), panelWireframes = new Map();
  const scratchQuaternion = new THREE.Quaternion();

  ASSET_IDS.forEach((assetId, assetIndex) => SUFFIXES.forEach((suffix, copyIndex) => {
    const index = assetIndex * SUFFIXES.length + copyIndex;
    const shell = assetManager.cloneGltfScene(assetId);
    if (!panelWireframes.has(assetId)) panelWireframes.set(assetId, createObjectWireframeData(shell));
    const panelWireframe = panelWireframes.get(assetId);
    const emissiveMaterials = [], materialBaselines = [];
    shell.traverse((child) => { if (!child.isMesh || !child.material) return;
      const cloneMaterial = (material) => { const clone = material.clone(); ownedMaterials.add(clone);
        if ('emissiveIntensity' in clone) { clone.emissiveIntensity = 0; emissiveMaterials.push(clone); }
        materialBaselines.push({ material: clone, color: clone.color?.clone(), emissive: clone.emissive?.clone(),
          emissiveIntensity: clone.emissiveIntensity ?? 0, opacity: clone.opacity ?? 1, transparent: clone.transparent ?? false });
        return clone; };
      child.material = Array.isArray(child.material) ? child.material.map(cloneMaterial) : cloneMaterial(child.material);
    });
    shell.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(shell).getBoundingSphere(new THREE.Sphere());
    const attractorId = `shell-${String(assetIndex + 1).padStart(2, '0')}-${suffix}`;
    const record = { object: shell, emissiveMaterials, materialBaselines, panelWireframe,
      boundingCenter: shell.worldToLocal(bounds.center.clone()), boundingRadius: bounds.radius,
      radius: baseRadius * (1 + index / 17), phase: index * GOLDEN_ANGLE, inclination: -Math.PI / 3 + (index % 7) * Math.PI / 18,
      ascendingNode: (index * GOLDEN_ANGLE * 0.61) % TAU, angularSpeed: 0.035 + (index % 5) * 0.006,
      direction,
      selfRotationAxis: new THREE.Vector3(Math.sin((index + 1) * 1.71), 0.45 + ((index * 7) % 5) * 0.17,
        Math.cos((index + 1) * 2.13)).normalize(), selfRotationSpeed: 0.10 + (index % 7) * 0.02,
      initialQuaternion: shell.quaternion.clone(), initialScale: shell.scale.clone(), orbitPosition: new THREE.Vector3(), returnStart: new THREE.Vector3(),
      returnElapsed: 0, returnDuration: 0.8, returnEmissionStart: 0, returning: false,
      placedPosition: new THREE.Vector3(), placedQuaternion: new THREE.Quaternion(), placedAt: 0,
      idlePhase: (index * GOLDEN_ANGLE) % TAU };
    shell.name = attractorId;
    Object.assign(shell.userData, { attractorTarget: false, attractorType: 'shell', attractorId, shellState: 'orbiting',
      shellAssetId: assetId, panelWireframe, shellOrbit: Object.freeze({ radius: record.radius, phase: record.phase, inclination: record.inclination,
        ascendingNode: record.ascendingNode, angularSpeed: record.angularSpeed, direction: record.direction }),
      selfRotationAxis: record.selfRotationAxis.clone(), selfRotationSpeed: record.selfRotationSpeed });
    object.add(shell); instances.push(shell); records.push(record);
  }));

  function setEmission(shell, value) { const record = records.find((item) => item.object === shell);
    record?.emissiveMaterials.forEach((material) => { material.emissiveIntensity = value; }); }
  function getRecord(shell) { return records.find((item) => item.object === shell) ?? null; }
  function applyPositions() { records.forEach((record) => {
    const angle = record.phase + elapsed * record.angularSpeed * record.direction;
    const x = Math.cos(angle) * record.radius, planeY = Math.sin(angle) * record.radius;
    const y = centerY + planeY * Math.sin(record.inclination), z = planeY * Math.cos(record.inclination);
    const cosNode = Math.cos(record.ascendingNode), sinNode = Math.sin(record.ascendingNode);
    record.orbitPosition.set(x * cosNode - z * sinNode, y, x * sinNode + z * cosNode);
    const state = record.object.userData.shellState;
    if (record.returning) { record.returnElapsed += currentDelta; const t = Math.min(1, record.returnElapsed / record.returnDuration);
      const eased = t * t * (3 - 2 * t); record.object.position.lerpVectors(record.returnStart, record.orbitPosition, eased);
      setEmission(record.object, record.returnEmissionStart * (1 - eased));
      if (t >= 1) { record.returning = false; record.object.userData.shellState = 'orbiting';
        record.object.userData.attractorTarget = interactionEnabled; setEmission(record.object, 0); }
    } else if (['orbiting', 'targeted'].includes(state)) { record.object.position.copy(record.orbitPosition); setEmission(record.object, 0); }
    if (state === 'placed') {
      const idleElapsed = elapsed - record.placedAt;
      const yOffset = idleAmplitude * 0.5 * (Math.sin(record.idlePhase + idleElapsed * idleAngularSpeed)
        - Math.sin(record.idlePhase));
      record.object.position.copy(record.placedPosition); record.object.position.y += yOffset;
      record.object.quaternion.copy(record.placedQuaternion).multiply(
        scratchQuaternion.setFromAxisAngle(record.selfRotationAxis, idleElapsed * idleRotationSpeed * record.direction));
    }
    if (!['held', 'placed', 'capture_ready', 'inserted', 'consuming', 'consumed'].includes(state)) record.object.quaternion.copy(record.initialQuaternion).multiply(
      scratchQuaternion.setFromAxisAngle(record.selfRotationAxis, elapsed * record.selfRotationSpeed * record.direction));
    if (state === 'capture_ready') setEmission(record.object, 1);
    if (state === 'held' || state === 'placed') setEmission(record.object, claimedMin + (claimedMax - claimedMin)
      * (0.5 + 0.5 * Math.sin(elapsed * TAU / claimedDuration)));
  }); }
  function syncTargetEligibility() { records.forEach((record) => {
    if (['orbiting', 'targeted'].includes(record.object.userData.shellState)) record.object.userData.attractorTarget = interactionEnabled;
  }); }
  function setPresentationVisible(value) { if (!disposed) { active = Boolean(value); object.visible = active; } }
  function setInteractionEnabled(value) { if (!disposed) { interactionEnabled = Boolean(value); syncTargetEligibility(); } }
  // Compatibility seam used by the explicit post-P1 QA path.
  function setActive(value) { setPresentationVisible(value); setInteractionEnabled(value); }
  function update(deltaSeconds) { if (disposed || !active) return; currentDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    elapsed += currentDelta; applyPositions(); }
  function returnToOrbit(shell, duration = 0.8) { const record = getRecord(shell); if (!record || disposed || shell.userData.shellState === 'placed') return false;
    object.attach(shell); record.returnStart.copy(shell.position); record.returnElapsed = 0; record.returnDuration = Math.max(0.001, duration);
    record.returnEmissionStart = record.emissiveMaterials[0]?.emissiveIntensity ?? 0; record.returning = true;
    shell.userData.shellState = 'returning'; shell.userData.attractorTarget = false; return true; }
  function placeInstance(shell) { const record = getRecord(shell); if (!record || disposed) return false;
    record.placedPosition.copy(shell.position); record.placedQuaternion.copy(shell.quaternion); record.placedAt = elapsed;
    shell.userData.shellState = 'placed'; shell.userData.attractorTarget = false; return true; }
  function restoreMaterialBaseline(record) { record.materialBaselines.forEach((baseline) => {
    if (baseline.material.color && baseline.color) baseline.material.color.copy(baseline.color);
    if (baseline.material.emissive && baseline.emissive) baseline.material.emissive.copy(baseline.emissive);
    if ('emissiveIntensity' in baseline.material) baseline.material.emissiveIntensity = baseline.emissiveIntensity;
    baseline.material.opacity = baseline.opacity; baseline.material.transparent = baseline.transparent;
  }); }
  function restoreInstanceToOrbit(shell) { const record = getRecord(shell); if (!record || disposed) return false;
    if (shell.parent !== object) object.attach(shell);
    record.returning = false; record.returnElapsed = 0; shell.visible = true; shell.scale.copy(record.initialScale);
    shell.quaternion.copy(record.initialQuaternion); shell.userData.shellState = 'orbiting';
    shell.userData.attractorTarget = interactionEnabled; restoreMaterialBaseline(record); applyPositions(); return true; }
  function consumeInstance(shell) { const record = getRecord(shell); if (!record || disposed) return false;
    if (shell.parent !== object) object.attach(shell);
    record.returning = false; shell.userData.shellState = 'consumed'; shell.userData.attractorTarget = false;
    shell.visible = false; return true; }
  function reset() { if (disposed) return; active = false; interactionEnabled = false; object.visible = false; elapsed = 0; currentDelta = 0; records.forEach((record) => {
    restoreInstanceToOrbit(record.object);
  }); applyPositions(); }
  function applyAbsorbedShellIds(absorbedShellIds) {
    if (!absorbedShellIds || typeof absorbedShellIds[Symbol.iterator] !== 'function')
      throw new TypeError('absorbedShellIds must be iterable');
    records.forEach((record) => restoreInstanceToOrbit(record.object));
    const absorbed = new Set(absorbedShellIds);
    absorbed.forEach((assetId) => {
      if (!ASSET_IDS.includes(assetId)) throw new TypeError(`Unknown absorbed shell asset id: ${assetId}`);
      const record = records.find((candidate) => candidate.object.userData.shellAssetId === assetId
        && candidate.object.userData.shellState === 'orbiting');
      if (record) consumeInstance(record.object);
    });
  }
  function dispose() { if (disposed) return; disposed = true; active = false; object.visible = false;
    object.remove(...instances); parent.remove(object); ownedMaterials.forEach((material) => material.dispose()); ownedMaterials.clear();
    instances.length = 0; records.length = 0; }
  applyPositions();
  return { object, instances, records, innerRadius: baseRadius, outerRadius: baseRadius * 2,
    panelWireframes, getPanelWireframe: (assetId) => panelWireframes.get(assetId) ?? null,
    get active() { return active; }, get interactionEnabled() { return interactionEnabled; }, getRecord, setEmission, setActive,
    setPresentationVisible, setInteractionEnabled, update, returnToOrbit, placeInstance, consumeInstance,
    restoreInstanceToOrbit, applyAbsorbedShellIds, reset, dispose };
}
