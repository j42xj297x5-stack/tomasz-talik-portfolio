import * as THREE from '../../vendor/three.js';

const TAU = Math.PI * 2;
const ASSET_IDS = Object.freeze(Array.from({ length: 6 }, (_, index) => `shell-relic-${index + 1}`));
const SUFFIXES = Object.freeze(['a', 'b', 'c']);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function createVrShellSystem({ parent, assetManager, baseRadius }) {
  if (!parent?.add || !assetManager?.cloneGltfScene) throw new Error('VrShellSystem requires parent and assetManager.');
  if (!Number.isFinite(baseRadius) || baseRadius <= 0) throw new Error('VrShellSystem requires a positive baseRadius.');
  const object = new THREE.Group();
  object.name = 'VrShellSystem';
  object.visible = false;
  parent.add(object);
  let active = false;
  let elapsed = 0;
  let disposed = false;
  const instances = [];
  const records = [];

  ASSET_IDS.forEach((assetId, assetIndex) => SUFFIXES.forEach((suffix, copyIndex) => {
    const index = assetIndex * SUFFIXES.length + copyIndex;
    const shell = assetManager.cloneGltfScene(assetId);
    const attractorId = `shell-${String(assetIndex + 1).padStart(2, '0')}-${suffix}`;
    const record = {
      object: shell, radius: baseRadius * (1 + index / 17), phase: index * GOLDEN_ANGLE,
      inclination: -Math.PI / 3 + (index % 7) * Math.PI / 18,
      ascendingNode: (index * GOLDEN_ANGLE * 0.61) % TAU,
      angularSpeed: 0.035 + (index % 5) * 0.006, direction: index % 2 === 0 ? 1 : -1,
      selfRotationAxis: new THREE.Vector3(
        Math.sin((index + 1) * 1.71),
        0.45 + ((index * 7) % 5) * 0.17,
        Math.cos((index + 1) * 2.13)
      ).normalize(),
      selfRotationSpeed: 0.10 + (index % 7) * 0.02,
      initialRotation: shell.rotation.clone(), initialQuaternion: shell.quaternion.clone(),
      orbitPosition: new THREE.Vector3(), returnStart: new THREE.Vector3(), returnElapsed: 0, returning: false
    };
    shell.name = attractorId;
    Object.assign(shell.userData, {
      attractorTarget: true, attractorType: 'shell', attractorId, shellState: 'orbiting', shellAssetId: assetId,
      shellOrbit: Object.freeze({ radius: record.radius, phase: record.phase, inclination: record.inclination,
        ascendingNode: record.ascendingNode, angularSpeed: record.angularSpeed, direction: record.direction }),
      selfRotationAxis: record.selfRotationAxis.clone(), selfRotationSpeed: record.selfRotationSpeed
    });
    object.add(shell);
    instances.push(shell);
    records.push(record);
  }));

  function applyPositions() {
    records.forEach((record) => {
      const angle = record.phase + elapsed * record.angularSpeed * record.direction;
      const x = Math.cos(angle) * record.radius;
      const planeY = Math.sin(angle) * record.radius;
      const y = planeY * Math.sin(record.inclination);
      const z = planeY * Math.cos(record.inclination);
      const cosNode = Math.cos(record.ascendingNode);
      const sinNode = Math.sin(record.ascendingNode);
      record.orbitPosition.set(x * cosNode - z * sinNode, y, x * sinNode + z * cosNode);
      const state = record.object.userData.shellState;
      if (record.returning) {
        record.returnElapsed += currentDelta;
        const t = Math.min(1, record.returnElapsed / record.returnDuration);
        const eased = t * t * (3 - 2 * t);
        record.object.position.lerpVectors(record.returnStart, record.orbitPosition, eased);
        if (t >= 1) { record.returning = false; record.object.userData.shellState = 'orbiting'; }
      } else if (state !== 'pulling' && state !== 'held') record.object.position.copy(record.orbitPosition);
      record.object.quaternion.copy(record.initialQuaternion).multiply(
        scratchQuaternion.setFromAxisAngle(record.selfRotationAxis, elapsed * record.selfRotationSpeed * record.direction));
    });
  }
  const scratchQuaternion = new THREE.Quaternion();
  let currentDelta = 0;
  function setActive(value) { if (!disposed) { active = Boolean(value); object.visible = active; } }
  function update(deltaSeconds) {
    if (disposed || !active) return;
    currentDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    elapsed += currentDelta;
    applyPositions();
  }
  function returnToOrbit(shell, duration = 0.8) {
    const record = records.find((candidate) => candidate.object === shell);
    if (!record || disposed) return false;
    object.attach(shell); record.returnStart.copy(shell.position); record.returnElapsed = 0;
    record.returnDuration = Math.max(0.001, duration); record.returning = true; shell.userData.shellState = 'orbiting';
    return true;
  }
  function reset() { if (!disposed) { elapsed = 0; currentDelta = 0; records.forEach((record) => {
    if (record.object.parent !== object) object.attach(record.object);
    record.returning = false; record.returnElapsed = 0; record.object.userData.shellState = 'orbiting';
  }); applyPositions(); } }
  function dispose() {
    if (disposed) return;
    disposed = true; active = false; object.visible = false;
    object.remove(...instances); parent.remove(object); instances.length = 0; records.length = 0;
  }
  applyPositions();
  return { object, instances, innerRadius: baseRadius, outerRadius: baseRadius * 2,
    get active() { return active; }, setActive, update, returnToOrbit, reset, dispose };
}
