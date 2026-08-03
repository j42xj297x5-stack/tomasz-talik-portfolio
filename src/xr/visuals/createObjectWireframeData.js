import * as THREE from '../../vendor/three.js';

const DEFAULTS = Object.freeze({ thresholdAngle: 30, maxSegments: 128, minLength: 1e-5 });

/** Builds CPU-only, panel-ready line data without retaining or changing source geometry. */
export function createObjectWireframeData(root, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const collected = [];
  const rootInverse = new THREE.Matrix4();
  const meshToRoot = new THREE.Matrix4();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  root.updateWorldMatrix(true, true);
  rootInverse.copy(root.matrixWorld).invert();

  root.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.geometry?.getAttribute?.('position')) return;
    const edges = new THREE.EdgesGeometry(mesh.geometry, config.thresholdAngle);
    try {
      const positions = edges.getAttribute('position');
      mesh.updateWorldMatrix(true, false);
      meshToRoot.multiplyMatrices(rootInverse, mesh.matrixWorld);
      for (let index = 0; index + 1 < positions.count; index += 2) {
        a.fromBufferAttribute(positions, index).applyMatrix4(meshToRoot);
        b.fromBufferAttribute(positions, index + 1).applyMatrix4(meshToRoot);
        const lengthSq = a.distanceToSquared(b);
        if (lengthSq <= config.minLength * config.minLength) continue;
        collected.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, lengthSq, sourceOrder: collected.length });
      }
    } finally { edges.dispose(); }
  });

  // Long silhouette-defining edges win. Stable source order makes reduction repeatable.
  collected.sort((left, right) => right.lengthSq - left.lengthSq || left.sourceOrder - right.sourceOrder);
  const selected = collected.slice(0, Math.max(0, Math.floor(config.maxSegments)));
  const bounds = new THREE.Box3().makeEmpty();
  selected.forEach((segment) => {
    bounds.expandByPoint(a.set(segment.ax, segment.ay, segment.az));
    bounds.expandByPoint(a.set(segment.bx, segment.by, segment.bz));
  });
  if (bounds.isEmpty()) return Object.freeze({ segments: Object.freeze([]), radius: 0,
    bounds: Object.freeze({ min: Object.freeze([0, 0, 0]), max: Object.freeze([0, 0, 0]) }) });
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z, 1e-8);
  let radius = 0;
  const segments = selected.map((segment, index) => {
    const result = {
      ax: (segment.ax - center.x) * scale, ay: (segment.ay - center.y) * scale, az: (segment.az - center.z) * scale,
      bx: (segment.bx - center.x) * scale, by: (segment.by - center.y) * scale, bz: (segment.bz - center.z) * scale,
      dissolveOrder: selected.length <= 1 ? 0 : ((index * 73) % selected.length) / (selected.length - 1)
    };
    radius = Math.max(radius, Math.hypot(result.ax, result.ay, result.az), Math.hypot(result.bx, result.by, result.bz));
    return Object.freeze(result);
  });
  const normalizedBounds = new THREE.Box3().makeEmpty();
  segments.forEach((segment) => {
    normalizedBounds.expandByPoint(a.set(segment.ax, segment.ay, segment.az));
    normalizedBounds.expandByPoint(a.set(segment.bx, segment.by, segment.bz));
  });
  return Object.freeze({ segments: Object.freeze(segments), radius,
    bounds: Object.freeze({ min: Object.freeze(normalizedBounds.min.toArray()), max: Object.freeze(normalizedBounds.max.toArray()) }) });
}
