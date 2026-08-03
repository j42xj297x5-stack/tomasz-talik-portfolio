import assert from 'node:assert/strict';
import { canonicalPca, cubeFaceToSphere, deduplicateProjectedSegments, filterThicknessSegments } from '../scripts/lib/asterion-shell-geometry.mjs';

const points = [[-3,-1,-.1],[-3,1,.1],[3,-1,.1],[3,1,-.1]];
const first = canonicalPca(points), second = canonicalPca(points);
assert.deepEqual(first, second, 'PCA must be stable');
assert.ok(Math.abs(first.extents[0] - 6) < 1e-9 && Math.abs(first.extents[1] - 2) < 1e-9, 'PCA orders major and secondary extents');
assert.ok(first.basis[0][0] > 0, 'canonical major sign is positive on its dominant component');

const segments = [[[0,0,0],[0,0,2]], [[0,0,0],[2,0,.1]]];
assert.deepEqual(filterThicknessSegments(segments, [[1,0,0],[0,1,0],[0,0,1]], .62), [segments[1]], 'thickness edge is rejected');
assert.equal(deduplicateProjectedSegments([[0,0,1,0],[1,0,0,0],[0,0,.00001,0]], { tolerance: 1e-3, minLength: 1e-3 }).length, 1, 'projected lines are undirected and short lines removed');
for (const face of ['+X','-X','+Y','-Y','+Z','-Z']) { const point = cubeFaceToSphere(face, .4, -.3); assert.ok(Math.abs(Math.hypot(...point) - 1) < 1e-12); }
assert.deepEqual(cubeFaceToSphere('+Z', 0, 0), [0,0,1]);
console.log('asterion-shell-geometry tests passed');
