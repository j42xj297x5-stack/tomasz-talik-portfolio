const EPSILON = 1e-10;

export function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
const normalize = (v) => { const length = Math.hypot(...v) || 1; return v.map((value) => value / length); };

function canonicalSign(vector) {
  const index = [0, 1, 2].sort((a, b) => Math.abs(vector[b]) - Math.abs(vector[a]) || a - b)[0];
  return vector[index] < 0 ? vector.map((value) => -value) : vector;
}

/** Symmetric 3x3 Jacobi eigensolver, sorted largest eigenvalue first. */
export function canonicalPca(points) {
  if (!points.length) throw new Error('PCA requires at least one point.');
  const center = [0, 0, 0];
  points.forEach((point) => point.forEach((value, axis) => { center[axis] += value / points.length; }));
  const matrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  points.forEach((point) => { const p = point.map((value, axis) => value - center[axis]);
    for (let row = 0; row < 3; row++) for (let column = row; column < 3; column++) matrix[row][column] += p[row] * p[column] / points.length;
  });
  for (let row = 0; row < 3; row++) for (let column = 0; column < row; column++) matrix[row][column] = matrix[column][row];
  const vectors = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let iteration = 0; iteration < 32; iteration++) {
    let p = 0, q = 1;
    for (const pair of [[0, 1], [0, 2], [1, 2]]) if (Math.abs(matrix[pair[0]][pair[1]]) > Math.abs(matrix[p][q])) [p, q] = pair;
    if (Math.abs(matrix[p][q]) < EPSILON) break;
    const angle = .5 * Math.atan2(2 * matrix[p][q], matrix[q][q] - matrix[p][p]);
    const c = Math.cos(angle), s = Math.sin(angle);
    for (let k = 0; k < 3; k++) { const mp = matrix[k][p], mq = matrix[k][q]; matrix[k][p] = c * mp - s * mq; matrix[k][q] = s * mp + c * mq; }
    for (let k = 0; k < 3; k++) { const mp = matrix[p][k], mq = matrix[q][k]; matrix[p][k] = c * mp - s * mq; matrix[q][k] = s * mp + c * mq; }
    for (let k = 0; k < 3; k++) { const vp = vectors[k][p], vq = vectors[k][q]; vectors[k][p] = c * vp - s * vq; vectors[k][q] = s * vp + c * vq; }
  }
  const eigen = [0, 1, 2].map((index) => ({ value: matrix[index][index], vector: normalize(vectors.map((row) => row[index])) }))
    .sort((a, b) => b.value - a.value || b.vector.findIndex((v) => Math.abs(v) > EPSILON) - a.vector.findIndex((v) => Math.abs(v) > EPSILON));
  const major = canonicalSign(eigen[0].vector), secondaryCandidate = canonicalSign(eigen[1].vector);
  const minor = canonicalSign(normalize(cross(major, secondaryCandidate)));
  const secondary = normalize(cross(minor, major)); // enforce a deterministic right-handed basis
  const basis = [major, secondary, minor];
  const projected = points.map((point) => { const relative = point.map((value, axis) => value - center[axis]); return basis.map((axis) => dot(relative, axis)); });
  const extents = basis.map((_, axis) => Math.max(...projected.map((p) => p[axis])) - Math.min(...projected.map((p) => p[axis])));
  return { center, basis, eigenvalues: eigen.map((entry) => entry.value), projected, extents };
}

export function filterThicknessSegments(segments, basis, verticalness = .62) {
  return segments.filter(([a, b]) => { const delta = b.map((value, index) => value - a[index]); const length = Math.hypot(...delta);
    return length > EPSILON && Math.abs(dot(delta, basis[2])) / length < verticalness;
  });
}

export function deduplicateProjectedSegments(segments, { tolerance = 1e-4, minLength = 1e-3 } = {}) {
  const seen = new Set(), result = [];
  const quantize = (value) => Math.round(value / tolerance);
  segments.forEach((segment) => { let [x1, y1, x2, y2] = segment;
    if (Math.hypot(x2 - x1, y2 - y1) < minLength) return;
    let a = `${quantize(x1)},${quantize(y1)}`, b = `${quantize(x2)},${quantize(y2)}`;
    if (a > b) { [a, b] = [b, a]; [x1, y1, x2, y2] = [x2, y2, x1, y1]; }
    const key = `${a}|${b}`; if (!seen.has(key)) { seen.add(key); result.push([x1, y1, x2, y2]); }
  });
  return result;
}

export const FACE_BASIS = Object.freeze({
  '+X': [[1, 0, 0], [0, 0, -1], [0, 1, 0]], '-X': [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  '+Y': [[0, 1, 0], [1, 0, 0], [0, 0, -1]], '-Y': [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  '+Z': [[0, 0, 1], [1, 0, 0], [0, 1, 0]], '-Z': [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]
});

export function cubeFaceToSphere(face, u, v) {
  const [normal, tangentU, tangentV] = FACE_BASIS[face] ?? [];
  if (!normal) throw new Error(`Unknown cube face: ${face}`);
  return normalize(normal.map((value, axis) => value + u * tangentU[axis] + v * tangentV[axis]));
}
