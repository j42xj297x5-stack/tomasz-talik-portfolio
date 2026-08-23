import * as THREE from '../vendor/three.js';

const TAU = Math.PI * 2;

export function angularDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function createVrGlyphOrbit({ nodes, center = new THREE.Vector3(), settings, entryDirection, radius }) {
  const suspended = new Set();
  const records = nodes.map((node, index) => ({
    node,
    initialAngle: Number.isFinite(node.userData.orbitAngle)
      ? node.userData.orbitAngle : (TAU * index) / nodes.length,
    y: node.position.y,
    rotation: node.rotation.clone()
  }));
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('VR glyph orbit requires one canonical radius.');
  const effectiveRadius = radius;
  let currentRadius = effectiveRadius;
  const entryAngle = Math.atan2(entryDirection.z, entryDirection.x);
  let phase = 0;
  let entryReady = null;
  let disposed = false;

  function applyPositions() {
    records.forEach(({ node, initialAngle, y, rotation }) => {
      const angle = initialAngle + phase;
      const canonicalPosition = new THREE.Vector3(center.x + Math.cos(angle) * currentRadius, center.y + y,
        center.z + Math.sin(angle) * currentRadius);
      const canonicalQuaternion = new THREE.Quaternion().setFromEuler(rotation);
      node.userData.vrCanonicalOrbitTransform = { position: canonicalPosition, quaternion: canonicalQuaternion,
        scale: node.scale.clone() };
      if (suspended.has(node)) return;
      node.position.copy(canonicalPosition);
      // Experience 3D keeps glyph model rotation independent from its orbital phase.
      node.rotation.copy(rotation);
      node.userData.vrOrbitAngle = angle;
      node.userData.vrOrbitRadius = currentRadius;
    });
  }

  function update(delta) {
    if (disposed) return null;
    if (settings.enabled) phase += Math.max(0, Number.isFinite(delta) ? delta : 0)
      * settings.angularSpeed * settings.direction;
    applyPositions();
    let candidate = null;
    let candidateDifference = Infinity;
    for (const { node } of records) {
      const difference = Math.abs(angularDifference(node.userData.vrOrbitAngle, entryAngle));
      if (difference < candidateDifference) { candidate = node; candidateDifference = difference; }
    }
    const currentDifference = entryReady
      ? Math.abs(angularDifference(entryReady.userData.vrOrbitAngle, entryAngle)) : Infinity;
    if (entryReady && currentDifference <= settings.entryAngleThreshold + settings.entryAngleHysteresis
      && candidateDifference + settings.entryAngleHysteresis >= currentDifference) return entryReady;
    entryReady = candidateDifference <= settings.entryAngleThreshold ? candidate : null;
    return entryReady;
  }

  function getRadius() { return currentRadius; }
  function suspendNode(node) { if (!records.some((record) => record.node === node)) return false; suspended.add(node); return true; }
  function getCanonicalTransform(node) { const transform = node?.userData?.vrCanonicalOrbitTransform;
    return transform ? { position: transform.position.clone(), quaternion: transform.quaternion.clone(),
      scale: transform.scale.clone() } : null; }
  function resumeNode(node) { if (!suspended.delete(node)) return false; const transform = getCanonicalTransform(node);
    if (transform) { node.position.copy(transform.position); node.quaternion.copy(transform.quaternion); node.scale.copy(transform.scale); }
    return true; }
  function setRadius(nextRadius) {
    if (disposed || !Number.isFinite(nextRadius) || nextRadius <= 0) return false;
    currentRadius = nextRadius;
    applyPositions();
    return true;
  }
  function reset() {
    if (!disposed) {
      phase = 0;
      entryReady = null;
      currentRadius = effectiveRadius;
      suspended.clear();
      applyPositions();
    }
  }
  function dispose() { if (!disposed) { disposed = true; entryReady = null; records.length = 0; } }
  applyPositions();
  return { effectiveRadius, get entryReady() { return entryReady; }, getRadius, setRadius, suspendNode,
    getCanonicalTransform, resumeNode, update, reset, dispose };
}
