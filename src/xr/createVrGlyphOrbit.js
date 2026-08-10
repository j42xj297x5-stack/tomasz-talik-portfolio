import * as THREE from '../vendor/three.js';

const TAU = Math.PI * 2;

export function angularDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function createVrGlyphOrbit({ nodes, center = new THREE.Vector3(), settings, entryDirection, radius }) {
  const records = nodes.map((node, index) => ({
    node,
    initialAngle: Number.isFinite(node.userData.orbitAngle)
      ? node.userData.orbitAngle : (TAU * index) / nodes.length,
    y: node.position.y,
    rotation: node.rotation.clone()
  }));
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('VR glyph orbit requires one canonical radius.');
  const effectiveRadius = radius;
  const entryAngle = Math.atan2(entryDirection.z, entryDirection.x);
  let phase = 0;
  let entryReady = null;
  let disposed = false;

  function applyPositions() {
    records.forEach(({ node, initialAngle, y, rotation }) => {
      const angle = initialAngle + phase;
      node.position.set(center.x + Math.cos(angle) * effectiveRadius, center.y + y, center.z + Math.sin(angle) * effectiveRadius);
      // Experience 3D keeps glyph model rotation independent from its orbital phase.
      node.rotation.copy(rotation);
      node.userData.vrOrbitAngle = angle;
      node.userData.vrOrbitRadius = effectiveRadius;
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

  function reset() { if (!disposed) { phase = 0; entryReady = null; applyPositions(); } }
  function dispose() { if (!disposed) { disposed = true; entryReady = null; records.length = 0; } }
  applyPositions();
  return { effectiveRadius, get entryReady() { return entryReady; }, update, reset, dispose };
}
