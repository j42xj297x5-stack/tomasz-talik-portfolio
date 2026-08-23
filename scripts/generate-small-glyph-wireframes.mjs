import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../vendor/three/three.module.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = resolve(ROOT, 'src/xr/furnace/smallGlyphWireframeData.js');
const THRESHOLD_ANGLE = 35;
const QUANTIZATION = 1e-4;
const COMPONENTS = Object.freeze({ 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array,
  5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array });
const ITEM_SIZES = Object.freeze({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 });
const SOURCES = Object.freeze(Array.from({ length: 6 }, (_, index) => ({
  assetId: `small-glyph-relic-${index + 1}`,
  sourcePath: `/glb/small_glyph_${String(index + 1).padStart(2, '0')}.glb`
})));

function parseGlb(buffer, sourcePath) {
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) {
    throw new Error(`${sourcePath} must be a GLB 2.0 asset.`);
  }
  let offset = 12;
  let document = null;
  let binary = null;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) document = JSON.parse(chunk.toString('utf8').replace(/\0+$/, ''));
    else if (type === 0x004e4942) binary = chunk;
    offset += 8 + length;
  }
  if (!document || !binary) throw new Error(`${sourcePath} must contain JSON and BIN chunks.`);
  return { document, binary };
}

function createAccessorReader(document, binary) {
  return (accessorIndex) => {
    const accessor = document.accessors[accessorIndex];
    if (accessor.sparse) throw new Error('Sparse GLTF accessors are not supported by this generator.');
    const view = document.bufferViews[accessor.bufferView];
    const ArrayType = COMPONENTS[accessor.componentType];
    const itemSize = ITEM_SIZES[accessor.type];
    if (!ArrayType || !itemSize) throw new Error(`Unsupported GLTF accessor ${accessorIndex}.`);
    const componentBytes = ArrayType.BYTES_PER_ELEMENT;
    const stride = view.byteStride ?? itemSize * componentBytes;
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const values = new ArrayType(accessor.count * itemSize);
    for (let item = 0; item < accessor.count; item += 1) {
      for (let component = 0; component < itemSize; component += 1) {
        values[item * itemSize + component] = new ArrayType(binary.buffer,
          binary.byteOffset + start + item * stride + component * componentBytes, 1)[0];
      }
    }
    return { accessor, values, itemSize };
  };
}

function nodeMatrix(node) {
  if (node.matrix) return new THREE.Matrix4().fromArray(node.matrix);
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...(node.translation ?? [0, 0, 0])),
    new THREE.Quaternion(...(node.rotation ?? [0, 0, 0, 1])),
    new THREE.Vector3(...(node.scale ?? [1, 1, 1]))
  );
}

function collectNodeMatrices(document) {
  const scene = document.scenes[document.scene ?? 0];
  const rootMatrix = new THREE.Matrix4();
  const matrices = new Map();
  const visit = (nodeIndex, parentMatrix) => {
    const matrix = parentMatrix.clone().multiply(nodeMatrix(document.nodes[nodeIndex]));
    matrices.set(nodeIndex, matrix);
    (document.nodes[nodeIndex].children ?? []).forEach((child) => visit(child, matrix));
  };
  scene.nodes.forEach((nodeIndex) => visit(nodeIndex, rootMatrix));
  return matrices;
}

const quantize = (value) => {
  const result = Math.round(value / QUANTIZATION) * QUANTIZATION;
  return Object.is(result, -0) ? 0 : Number(result.toFixed(4));
};
const pointKey = (point) => `${point[0].toFixed(4)},${point[1].toFixed(4)}`;

function generateWireframe(document, binary) {
  const readAccessor = createAccessorReader(document, binary);
  const matrices = collectNodeMatrices(document);
  const rawSegments = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  matrices.forEach((matrixToRoot, nodeIndex) => {
    const node = document.nodes[nodeIndex];
    if (node.mesh === undefined) return;
    document.meshes[node.mesh].primitives.forEach((primitive) => {
      if ((primitive.mode ?? 4) !== 4) throw new Error('Small Glyph primitives must use TRIANGLES mode.');
      const position = readAccessor(primitive.attributes.POSITION);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(position.values, position.itemSize));
      if (primitive.indices !== undefined) {
        const index = readAccessor(primitive.indices);
        geometry.setIndex(new THREE.BufferAttribute(index.values, 1));
      }
      const edges = new THREE.EdgesGeometry(geometry, THRESHOLD_ANGLE);
      const positions = edges.getAttribute('position');
      for (let index = 0; index + 1 < positions.count; index += 2) {
        a.fromBufferAttribute(positions, index).applyMatrix4(matrixToRoot);
        b.fromBufferAttribute(positions, index + 1).applyMatrix4(matrixToRoot);
        rawSegments.push([[a.x, a.y], [b.x, b.y]]);
      }
      edges.dispose();
      geometry.dispose();
    });
  });

  const bounds = rawSegments.reduce((box, segment) => {
    segment.forEach(([x, y]) => box.expandByPoint(new THREE.Vector3(x, y, 0)));
    return box;
  }, new THREE.Box3());
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 2 / (Math.max(size.x, size.y) || 1);
  const deduplicated = new Map();
  rawSegments.forEach(([start, end]) => {
    const projectedStart = [quantize((start[0] - center.x) * scale), quantize(-(start[1] - center.y) * scale)];
    const projectedEnd = [quantize((end[0] - center.x) * scale), quantize(-(end[1] - center.y) * scale)];
    const startKey = pointKey(projectedStart);
    const endKey = pointKey(projectedEnd);
    if (startKey === endKey) return;
    const forward = startKey < endKey;
    const segment = forward ? [...projectedStart, ...projectedEnd] : [...projectedEnd, ...projectedStart];
    deduplicated.set(forward ? `${startKey}|${endKey}` : `${endKey}|${startKey}`, segment);
  });
  return { sourceSegmentCount: rawSegments.length, segments2d: [...deduplicated.values()] };
}

const byAssetId = {};
for (const source of SOURCES) {
  const diskPath = resolve(ROOT, `public${source.sourcePath}`);
  const buffer = await readFile(diskPath);
  const { document, binary } = parseGlb(buffer, source.sourcePath);
  const wireframe = generateWireframe(document, binary);
  byAssetId[source.assetId] = {
    sourcePath: source.sourcePath,
    sourceSha256: createHash('sha256').update(buffer).digest('hex'),
    sourceSegmentCount: wireframe.sourceSegmentCount,
    finalSegmentCount: wireframe.segments2d.length,
    segments2d: wireframe.segments2d
  };
}

const dataset = {
  version: 1,
  defaults: { thresholdAngle: THRESHOLD_ANGLE, projection: 'XY', rotationDegrees: 0,
    flipX: false, flipY: false, quantization: QUANTIZATION },
  byAssetId
};
const output = `// Generated by scripts/generate-small-glyph-wireframes.mjs. Do not edit manually.\n`
  + `export const SMALL_GLYPH_WIREFRAME_DATA = Object.freeze(${JSON.stringify(dataset)});\n`;
await writeFile(OUTPUT_PATH, output, 'utf8');
console.log(`Generated ${OUTPUT_PATH} with ${Object.keys(byAssetId).length} Small Glyph wireframes.`);
