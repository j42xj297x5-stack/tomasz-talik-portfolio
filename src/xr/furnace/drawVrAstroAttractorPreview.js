import * as THREE from '../../vendor/three.js';

const curvePresentationCache = new WeakMap();
const clamp01 = (value) => Math.max(0, Math.min(1, value));

function extractMeshCurves(node, matrix, tolerance, thresholdAngle) {
  const edgesGeometry = new THREE.EdgesGeometry(node.geometry, thresholdAngle);
  const positions = edgesGeometry.getAttribute('position');
  const vertices = new Map(), edges = [], adjacency = new Map();
  const point = new THREE.Vector3();
  const keyFor = ({ x, y, z }) => `${Math.round(x / tolerance)},${Math.round(y / tolerance)},${Math.round(z / tolerance)}`;
  const addVertex = (index) => {
    point.fromBufferAttribute(positions, index).applyMatrix4(matrix);
    const key = keyFor(point);
    if (!vertices.has(key)) vertices.set(key, point.clone());
    return key;
  };
  for (let index = 0; index + 1 < positions.count; index += 2) {
    const a = addVertex(index), b = addVertex(index + 1);
    if (a === b) continue;
    const edgeIndex = edges.length;
    edges.push({ a, b });
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(edgeIndex); adjacency.get(b).push(edgeIndex);
  }
  edgesGeometry.dispose();
  adjacency.forEach((edgeIndexes) => edgeIndexes.sort((left, right) => {
    const leftEdge = edges[left], rightEdge = edges[right];
    return `${leftEdge.a}|${leftEdge.b}`.localeCompare(`${rightEdge.a}|${rightEdge.b}`);
  }));

  const used = new Set(), curves = [];
  const follow = (startKey, firstEdgeIndex) => {
    const keys = [startKey];
    let currentKey = startKey, edgeIndex = firstEdgeIndex;
    while (edgeIndex !== undefined && !used.has(edgeIndex)) {
      used.add(edgeIndex);
      const edge = edges[edgeIndex];
      currentKey = edge.a === currentKey ? edge.b : edge.a;
      keys.push(currentKey);
      if ((adjacency.get(currentKey)?.length ?? 0) !== 2) break;
      edgeIndex = adjacency.get(currentKey).find((candidate) => !used.has(candidate));
    }
    if (keys.length > 1) curves.push(keys.map((key) => vertices.get(key).clone()));
  };
  [...adjacency.keys()].sort().filter((key) => adjacency.get(key).length !== 2).forEach((key) => {
    adjacency.get(key).forEach((edgeIndex) => { if (!used.has(edgeIndex)) follow(key, edgeIndex); });
  });
  edges.forEach((edge, edgeIndex) => { if (!used.has(edgeIndex)) follow([edge.a, edge.b].sort()[0], edgeIndex); });
  return curves;
}

export function createVrFurnaceCurvePresentation(model, { thresholdAngle = 24, groupCount = 6 } = {}) {
  if (!model) throw new Error('A simplified GLB model is required for a Furnace curve presentation.');
  if (curvePresentationCache.has(model)) return curvePresentationCache.get(model);
  model.updateWorldMatrix(true, true);
  const inverseRoot = model.matrixWorld.clone().invert();
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
  const tolerance = Math.max(size.length() * 1e-5, 1e-7);
  const rawCurves = [];
  model.traverse((node) => {
    if (!node.isMesh || node.visible === false || !node.geometry) return;
    const matrix = inverseRoot.clone().multiply(node.matrixWorld);
    rawCurves.push(...extractMeshCurves(node, matrix, tolerance, thresholdAngle));
  });
  if (!rawCurves.length) throw new Error('The simplified GLB did not yield connected Furnace preview curves.');

  const curveBounds = new THREE.Box3();
  rawCurves.forEach((curve) => curve.forEach((entry) => curveBounds.expandByPoint(entry)));
  const center = curveBounds.getCenter(new THREE.Vector3()), curveSize = curveBounds.getSize(new THREE.Vector3());
  const radius = Math.max(curveSize.x, curveSize.y, curveSize.z) * .5 || 1;
  const curves = rawCurves.map((curve) => {
    const points = curve.map((entry) => Object.freeze(entry.sub(center).multiplyScalar(1 / radius).toArray()));
    const cumulativeLengths = [0];
    for (let index = 1; index < points.length; index += 1) {
      cumulativeLengths.push(cumulativeLengths[index - 1] + Math.hypot(
        points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1], points[index][2] - points[index - 1][2]
      ));
    }
    const centroid = points.reduce((sum, entry) => sum.map((value, axis) => value + entry[axis]), [0, 0, 0]).map((value) => value / points.length);
    return { points: Object.freeze(points), cumulativeLengths: Object.freeze(cumulativeLengths), length: cumulativeLengths.at(-1), centroid };
  }).sort((left, right) => left.centroid[1] - right.centroid[1] || left.centroid[0] - right.centroid[0]
    || left.centroid[2] - right.centroid[2] || left.length - right.length);
  const resolvedGroupCount = Math.max(1, Math.min(groupCount, curves.length));
  const groups = Array.from({ length: resolvedGroupCount }, () => []);
  curves.forEach((curve, index) => groups[Math.min(resolvedGroupCount - 1, Math.floor(index * resolvedGroupCount / curves.length))].push(curve));
  const presentation = Object.freeze({
    curves: Object.freeze(curves),
    groups: Object.freeze(groups.map((group) => Object.freeze(group))),
    sourceCurveCount: rawCurves.length
  });
  curvePresentationCache.set(model, presentation);
  return presentation;
}

function project([x, y, z], cx, cy, scale, yaw, pitch) {
  const cosineY = Math.cos(yaw), sineY = Math.sin(yaw), cosineX = Math.cos(pitch), sineX = Math.sin(pitch);
  const rotatedX = x * cosineY + z * sineY, rotatedZ = -x * sineY + z * cosineY;
  const rotatedY = y * cosineX - rotatedZ * sineX;
  const perspective = 1 / Math.max(.72, 1 + (y * sineX + rotatedZ * cosineX) * .16);
  return [cx + rotatedX * scale * perspective, cy - rotatedY * scale * perspective];
}

export function drawVrFurnaceCurvePresentation(context, presentation, {
  cx, cy, scale, elapsed = 0, progress = 1, color = '#c8ac70', bright = false, rotationSpeed = .34, pitch = -.16
}) {
  if (!presentation?.groups?.length || progress <= 0) return;
  const yaw = elapsed * rotationSpeed, groupPosition = clamp01(progress) * presentation.groups.length;
  context.save(); context.strokeStyle = color; context.lineCap = 'round'; context.lineJoin = 'round';
  context.globalAlpha = bright ? .98 : .82; context.lineWidth = bright ? 3.5 : 2.7;
  context.shadowColor = color; context.shadowBlur = bright ? 20 : 10;
  presentation.groups.forEach((group, groupIndex) => {
    const reveal = clamp01(groupPosition - groupIndex);
    if (reveal <= 0) return;
    group.forEach((curve) => {
      const visibleLength = curve.length * reveal;
      context.beginPath();
      const start = project(curve.points[0], cx, cy, scale, yaw, pitch);
      context.moveTo(start[0], start[1]);
      for (let index = 1; index < curve.points.length; index += 1) {
        const segmentStart = curve.cumulativeLengths[index - 1];
        if (segmentStart >= visibleLength) break;
        const segmentEnd = curve.cumulativeLengths[index];
        let target = curve.points[index];
        if (segmentEnd > visibleLength) {
          const local = (visibleLength - segmentStart) / Math.max(segmentEnd - segmentStart, Number.EPSILON);
          target = curve.points[index - 1].map((value, axis) => value + (curve.points[index][axis] - value) * local);
        }
        const projected = project(target, cx, cy, scale, yaw, pitch);
        context.lineTo(projected[0], projected[1]);
        if (segmentEnd > visibleLength) break;
      }
      context.stroke();
    });
  });
  context.restore();
}

export const drawVrAstroAttractorPreview = drawVrFurnaceCurvePresentation;
