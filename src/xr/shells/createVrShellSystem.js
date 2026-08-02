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
      selfRotationSpeed: 0.025 + (index % 4) * 0.008,
      initialRotation: shell.rotation.clone()
    };
    shell.name = attractorId;
    Object.assign(shell.userData, {
      attractorTarget: true, attractorType: 'shell', attractorId, shellState: 'orbiting', shellAssetId: assetId,
      shellOrbit: Object.freeze({ radius: record.radius, phase: record.phase, inclination: record.inclination,
        ascendingNode: record.ascendingNode, angularSpeed: record.angularSpeed, direction: record.direction })
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
      record.object.position.set(x * cosNode - z * sinNode, y, x * sinNode + z * cosNode);
      record.object.rotation.copy(record.initialRotation);
      record.object.rotation.y += elapsed * record.selfRotationSpeed * record.direction;
    });
  }
  function setActive(value) { if (!disposed) { active = Boolean(value); object.visible = active; } }
  function update(deltaSeconds) {
    if (disposed || !active) return;
    elapsed += Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    applyPositions();
  }
  function reset() { if (!disposed) { elapsed = 0; applyPositions(); } }
  function dispose() {
    if (disposed) return;
    disposed = true; active = false; object.visible = false;
    object.remove(...instances); parent.remove(object); instances.length = 0; records.length = 0;
  }
  applyPositions();
  return { object, instances, innerRadius: baseRadius, outerRadius: baseRadius * 2,
    get active() { return active; }, setActive, update, reset, dispose };
}
