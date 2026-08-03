import * as THREE from '../../vendor/three.js';

const TAU = Math.PI * 2;
const ASSET_IDS = Object.freeze(Array.from({ length: 6 }, (_, index) => `shell-relic-${index + 1}`));
const SUFFIXES = Object.freeze(['a', 'b', 'c']);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function createVrShellSystem({ parent, assetManager, baseRadius, emissionSettings = {} }) {
  if (!parent?.add || !assetManager?.cloneGltfScene) throw new Error('VrShellSystem requires parent and assetManager.');
  if (!Number.isFinite(baseRadius) || baseRadius <= 0) throw new Error('VrShellSystem requires a positive baseRadius.');
  const claimedMin = emissionSettings.claimedEmissionMin ?? 1;
  const claimedMax = emissionSettings.claimedEmissionMax ?? 2;
  const claimedDuration = emissionSettings.claimedEmissionPulseDuration ?? 1.4;
  const object = new THREE.Group(); object.name = 'VrShellSystem'; object.visible = false; parent.add(object);
  let active = false, elapsed = 0, disposed = false, currentDelta = 0;
  const instances = [], records = [], ownedMaterials = new Set();
  const scratchQuaternion = new THREE.Quaternion();

  ASSET_IDS.forEach((assetId, assetIndex) => SUFFIXES.forEach((suffix, copyIndex) => {
    const index = assetIndex * SUFFIXES.length + copyIndex;
    const shell = assetManager.cloneGltfScene(assetId);
    const emissiveMaterials = [];
    shell.traverse((child) => { if (!child.isMesh || !child.material) return;
      const cloneMaterial = (material) => { const clone = material.clone(); ownedMaterials.add(clone);
        if ('emissiveIntensity' in clone) { clone.emissiveIntensity = 0; emissiveMaterials.push(clone); } return clone; };
      child.material = Array.isArray(child.material) ? child.material.map(cloneMaterial) : cloneMaterial(child.material);
    });
    shell.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(shell).getBoundingSphere(new THREE.Sphere());
    const attractorId = `shell-${String(assetIndex + 1).padStart(2, '0')}-${suffix}`;
    const record = { object: shell, emissiveMaterials, boundingCenter: shell.worldToLocal(bounds.center.clone()), boundingRadius: bounds.radius,
      radius: baseRadius * (1 + index / 17), phase: index * GOLDEN_ANGLE, inclination: -Math.PI / 3 + (index % 7) * Math.PI / 18,
      ascendingNode: (index * GOLDEN_ANGLE * 0.61) % TAU, angularSpeed: 0.035 + (index % 5) * 0.006,
      direction: index % 2 === 0 ? 1 : -1,
      selfRotationAxis: new THREE.Vector3(Math.sin((index + 1) * 1.71), 0.45 + ((index * 7) % 5) * 0.17,
        Math.cos((index + 1) * 2.13)).normalize(), selfRotationSpeed: 0.10 + (index % 7) * 0.02,
      initialQuaternion: shell.quaternion.clone(), orbitPosition: new THREE.Vector3(), returnStart: new THREE.Vector3(),
      returnElapsed: 0, returnDuration: 0.8, returnEmissionStart: 0, returning: false };
    shell.name = attractorId;
    Object.assign(shell.userData, { attractorTarget: true, attractorType: 'shell', attractorId, shellState: 'orbiting',
      shellAssetId: assetId, shellOrbit: Object.freeze({ radius: record.radius, phase: record.phase, inclination: record.inclination,
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
    const y = planeY * Math.sin(record.inclination), z = planeY * Math.cos(record.inclination);
    const cosNode = Math.cos(record.ascendingNode), sinNode = Math.sin(record.ascendingNode);
    record.orbitPosition.set(x * cosNode - z * sinNode, y, x * sinNode + z * cosNode);
    const state = record.object.userData.shellState;
    if (record.returning) { record.returnElapsed += currentDelta; const t = Math.min(1, record.returnElapsed / record.returnDuration);
      const eased = t * t * (3 - 2 * t); record.object.position.lerpVectors(record.returnStart, record.orbitPosition, eased);
      setEmission(record.object, record.returnEmissionStart * (1 - eased));
      if (t >= 1) { record.returning = false; record.object.userData.shellState = 'orbiting';
        record.object.userData.attractorTarget = true; setEmission(record.object, 0); }
    } else if (['orbiting', 'targeted'].includes(state)) { record.object.position.copy(record.orbitPosition); setEmission(record.object, 0); }
    if (!['held', 'placed', 'capture_ready', 'inserted', 'consuming', 'consumed'].includes(state)) record.object.quaternion.copy(record.initialQuaternion).multiply(
      scratchQuaternion.setFromAxisAngle(record.selfRotationAxis, elapsed * record.selfRotationSpeed * record.direction));
    if (state === 'capture_ready') setEmission(record.object, 1);
    if (state === 'held' || state === 'placed') setEmission(record.object, claimedMin + (claimedMax - claimedMin)
      * (0.5 + 0.5 * Math.sin(elapsed * TAU / claimedDuration)));
  }); }
  function setActive(value) { if (!disposed) { active = Boolean(value); object.visible = active; } }
  function update(deltaSeconds) { if (disposed || !active) return; currentDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    elapsed += currentDelta; applyPositions(); }
  function returnToOrbit(shell, duration = 0.8) { const record = getRecord(shell); if (!record || disposed || shell.userData.shellState === 'placed') return false;
    object.attach(shell); record.returnStart.copy(shell.position); record.returnElapsed = 0; record.returnDuration = Math.max(0.001, duration);
    record.returnEmissionStart = record.emissiveMaterials[0]?.emissiveIntensity ?? 0; record.returning = true;
    shell.userData.shellState = 'returning'; shell.userData.attractorTarget = false; return true; }
  function reset() { if (disposed) return; elapsed = 0; currentDelta = 0; records.forEach((record) => {
    if (record.object.userData.shellState === 'placed') return;
    if (record.object.parent !== object) object.attach(record.object); record.returning = false; record.returnElapsed = 0;
    record.object.userData.shellState = 'orbiting'; record.object.userData.attractorTarget = true; setEmission(record.object, 0);
  }); applyPositions(); }
  function removeInstance(shell) { const record = getRecord(shell); if (!record || disposed) return false;
    const recordIndex = records.indexOf(record); if (recordIndex >= 0) records.splice(recordIndex, 1);
    const instanceIndex = instances.indexOf(shell); if (instanceIndex >= 0) instances.splice(instanceIndex, 1);
    shell.traverse((child) => { const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach((material) => { if (ownedMaterials.delete(material)) material.dispose?.(); }); });
    shell.removeFromParent(); return true; }
  function dispose() { if (disposed) return; disposed = true; active = false; object.visible = false;
    object.remove(...instances); parent.remove(object); ownedMaterials.forEach((material) => material.dispose()); ownedMaterials.clear();
    instances.length = 0; records.length = 0; }
  applyPositions();
  return { object, instances, records, innerRadius: baseRadius, outerRadius: baseRadius * 2,
    get active() { return active; }, getRecord, setEmission, setActive, update, returnToOrbit, removeInstance, reset, dispose };
}
