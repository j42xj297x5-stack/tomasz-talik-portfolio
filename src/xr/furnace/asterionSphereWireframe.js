const FACE_BASIS = Object.freeze({
  '+X': [[1, 0, 0], [0, 0, -1], [0, 1, 0]], '-X': [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  '+Y': [[0, 1, 0], [1, 0, 0], [0, 0, -1]], '-Y': [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  '+Z': [[0, 0, 1], [1, 0, 0], [0, 1, 0]], '-Z': [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]
});

export function transformPatchUv(u, v, patch, scaleMultiplier = 1) {
  const flippedU = patch.flipU ? -u : u, flippedV = patch.flipV ? -v : v;
  const angle = patch.rotationDegrees * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
  return [(flippedU * cosine - flippedV * sine) * patch.scale * scaleMultiplier, (flippedU * sine + flippedV * cosine) * patch.scale * scaleMultiplier];
}

export function cubeFaceToSphere(face, u, v) {
  const basis = FACE_BASIS[face];
  if (!basis) throw new Error(`Unknown cube face: ${face}`);
  const [normal, tangentU, tangentV] = basis;
  const point = normal.map((value, axis) => value + u * tangentU[axis] + v * tangentV[axis]);
  const length = Math.hypot(...point);
  return point.map((value) => value / length);
}

export function subdivideSegment(segment, { maxUvStep = .18, maxFragments = 8 } = {}) {
  const fragments = Math.min(maxFragments, Math.max(1, Math.ceil(Math.hypot(segment[2] - segment[0], segment[3] - segment[1]) / maxUvStep)));
  return Array.from({ length: fragments + 1 }, (_, index) => {
    const t = index / fragments;
    return [segment[0] + (segment[2] - segment[0]) * t, segment[1] + (segment[3] - segment[1]) * t];
  });
}

export const assemblyOrderForIndex = (index, count) => count <= 1 ? 0 : ((index * 37) % count) / (count - 1);
export const assemblySegmentVisible = (segment, progress) => progress > 0 && segment.assemblyOrder <= Math.min(1, progress);
export const resolveConstructionPatchOpacity = (formationProgress) => 1 - .86 * Math.max(0, Math.min(1, formationProgress));

const modelWireframeCache = new WeakMap();
export function createAsterionModelWireframeMap(model, { maxSegments = 900, minLength = .012, thresholdAngle = 28 } = {}) {
  if (!model) return Object.freeze({ segments: Object.freeze([]), cacheHit: false });
  if (modelWireframeCache.has(model)) return modelWireframeCache.get(model);
  model.updateWorldMatrix(true, true);
  const inverseRoot = model.matrixWorld.clone().invert(), raw = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  model.traverse((node) => {
    if (!node.isMesh || node.visible === false || !node.geometry) return;
    const edges = new THREE.EdgesGeometry(node.geometry, thresholdAngle), positions = edges.getAttribute('position');
    const matrix = inverseRoot.clone().multiply(node.matrixWorld);
    for (let index = 0; index + 1 < positions.count; index += 2) {
      a.fromBufferAttribute(positions, index).applyMatrix4(matrix); b.fromBufferAttribute(positions, index + 1).applyMatrix4(matrix);
      if (a.distanceTo(b) >= minLength) raw.push({ a: a.clone(), b: b.clone() });
    } edges.dispose();
  });
  const bounds = new THREE.Box3(); raw.forEach((segment) => { bounds.expandByPoint(segment.a); bounds.expandByPoint(segment.b); });
  const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * .5 || 1, stride = Math.max(1, Math.ceil(raw.length / maxSegments));
  const sampled = raw.filter((_, index) => index % stride === 0).slice(0, maxSegments).map((segment, index, list) => Object.freeze({
    a: Object.freeze(segment.a.sub(center).multiplyScalar(1 / radius).toArray()),
    b: Object.freeze(segment.b.sub(center).multiplyScalar(1 / radius).toArray()),
    assemblyOrder: assemblyOrderForIndex(index, list.length)
  }));
  const map = Object.freeze({ segments: Object.freeze(sampled), sourceSegmentCount: raw.length, cacheHit: false });
  modelWireframeCache.set(model, map); return map;
}

export function createAsterionPatchGeometry(patches, { scaleMultiplier = 1, ...subdivisionOptions } = {}) {
  return Object.fromEntries(patches.map((patch) => {
    const fragments = [];
    patch.segments2d.forEach((segment, sourceIndex) => {
      const points = subdivideSegment(segment, subdivisionOptions).map(([u, v]) => {
        const transformed = transformPatchUv(u, v, patch, scaleMultiplier);
        return cubeFaceToSphere(patch.face, transformed[0], transformed[1]);
      });
      const assemblyOrder = assemblyOrderForIndex(sourceIndex, patch.segments2d.length);
      for (let index = 0; index + 1 < points.length; index++) fragments.push({ a: points[index], b: points[index + 1], sourceIndex, assemblyOrder });
    });
    return [patch.assetId, Object.freeze({ assetId: patch.assetId, sourceSegmentCount: patch.segments2d.length, fragments: Object.freeze(fragments) })];
  }));
}

export function resolvePatchVisualStates(progress, { assetId, contentState, phase, extractionProgress = 0 } = {}) {
  const absorbed = new Set((progress?.shells ?? []).filter((shell) => shell.absorbed).map((shell) => shell.assetId));
  return Object.fromEntries((progress?.shells ?? []).map((shell) => {
    const pending = shell.assetId === assetId && !absorbed.has(shell.assetId) && ['CONSUMING', 'CONSUMED'].includes(contentState);
    const assemblyProgress = pending ? (phase === 'EXTRACTION' ? extractionProgress : phase === 'COOLDOWN' ? 1 : 0) : 0;
    return [shell.assetId, { committed: absorbed.has(shell.assetId), pending, assemblyProgress }];
  }));
}
import * as THREE from '../../vendor/three.js';
