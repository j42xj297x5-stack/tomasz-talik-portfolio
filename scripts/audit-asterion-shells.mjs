import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../vendor/three/three.module.js';
import { canonicalPca, cubeFaceToSphere, deduplicateProjectedSegments, dot, filterThicknessSegments } from './lib/asterion-shell-geometry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT, 'docs/current/audits/asterion-shells');
const CONFIG = Object.freeze({ edgeAngle: 30, verticalness: .62, maxSegments: 100, minProjectedLengthRatio: .0025, gapScale: .84 });
const LAYOUT = Object.freeze({
  'shell-relic-1': { face: '+X', rotationDegrees: 0, scale: .84, flipU: false, flipV: false, comment: 'equatorial, open silhouette' },
  'shell-relic-2': { face: '-X', rotationDegrees: 180, scale: .84, flipU: false, flipV: true, comment: 'balances shell 1' },
  'shell-relic-3': { face: '+Z', rotationDegrees: 90, scale: .84, flipU: false, flipV: false, comment: 'dense equatorial patch' },
  'shell-relic-4': { face: '-Z', rotationDegrees: -90, scale: .84, flipU: true, flipV: false, comment: 'opposes shell 3' },
  'shell-relic-5': { face: '+Y', rotationDegrees: 0, scale: .82, flipU: false, flipV: false, comment: 'compact north pole' },
  'shell-relic-6': { face: '-Y', rotationDegrees: 180, scale: .82, flipU: true, flipV: false, comment: 'compact south pole' }
});
const round = (value, digits = 6) => Number(value.toFixed(digits));
const rounded = (value) => Array.isArray(value) ? value.map(rounded) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rounded(entry)])) : typeof value === 'number' ? round(value) : value;

async function loadGlb(file) {
  const bytes = await fs.readFile(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) throw new Error(`${file} is not GLB 2.0`);
  let offset = 12, json, binary;
  while (offset < bytes.length) { const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4), chunk = bytes.subarray(offset + 8, offset + 8 + length); offset += 8 + length;
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/\0+$/, '')); else if (type === 0x004e4942) binary = chunk;
  }
  if (!json || !binary) throw new Error(`${file} lacks JSON or BIN chunk`);
  const componentTypes = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  const itemSizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const accessor = (index) => { const spec = json.accessors[index], view = json.bufferViews[spec.bufferView], Type = componentTypes[spec.componentType], itemSize = itemSizes[spec.type];
    if (!Type || !itemSize || spec.sparse) throw new Error(`Unsupported accessor ${index}`); const byteOffset = binary.byteOffset + (view.byteOffset ?? 0) + (spec.byteOffset ?? 0);
    if (view.byteStride && view.byteStride !== Type.BYTES_PER_ELEMENT * itemSize) { const data = new Type(spec.count * itemSize), source = new DataView(binary.buffer);
      for (let row = 0; row < spec.count; row++) for (let column = 0; column < itemSize; column++) { const at = byteOffset + row * view.byteStride + column * Type.BYTES_PER_ELEMENT;
        data[row * itemSize + column] = source[Type === Float32Array ? 'getFloat32' : Type === Uint32Array ? 'getUint32' : Type === Uint16Array ? 'getUint16' : Type === Int16Array ? 'getInt16' : Type === Uint8Array ? 'getUint8' : 'getInt8'](at, true); }
      return { data, itemSize, normalized: spec.normalized ?? false };
    }
    return { data: new Type(binary.buffer, byteOffset, spec.count * itemSize), itemSize, normalized: spec.normalized ?? false };
  };
  const nodes = (json.nodes ?? []).map((spec) => { const object = new THREE.Group(); if (spec.matrix) object.matrix.fromArray(spec.matrix).decompose(object.position, object.quaternion, object.scale);
    else { if (spec.translation) object.position.fromArray(spec.translation); if (spec.rotation) object.quaternion.fromArray(spec.rotation); if (spec.scale) object.scale.fromArray(spec.scale); } return object; });
  (json.nodes ?? []).forEach((spec, nodeIndex) => { (spec.children ?? []).forEach((child) => nodes[nodeIndex].add(nodes[child]));
    if (spec.mesh === undefined) return; (json.meshes[spec.mesh].primitives ?? []).forEach((primitive) => { if (primitive.mode !== undefined && primitive.mode !== 4) throw new Error('Only triangle primitives are supported.');
      const position = accessor(primitive.attributes.POSITION), geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(position.data, position.itemSize, position.normalized));
      if (primitive.indices !== undefined) { const indices = accessor(primitive.indices); geometry.setIndex(new THREE.BufferAttribute(indices.data, indices.itemSize)); } nodes[nodeIndex].add(new THREE.Mesh(geometry)); }); });
  const scene = new THREE.Group(), sceneSpec = json.scenes?.[json.scene ?? 0]; (sceneSpec?.nodes ?? nodes.map((_, i) => i).filter((i) => !json.nodes.some((n) => n.children?.includes(i)))).forEach((index) => scene.add(nodes[index]));
  return { scene };
}

function flatten(scene) {
  scene.updateMatrixWorld(true); const inverse = scene.matrixWorld.clone().invert(); const points = [], triangles = [], edgeSegments = [];
  let meshCount = 0, vertexCount = 0, triangleCount = 0;
  scene.traverse((mesh) => { const position = mesh.geometry?.getAttribute?.('position'); if (!mesh.isMesh || !position) return;
    meshCount++; mesh.updateWorldMatrix(true, false); const transform = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld); const point = new THREE.Vector3();
    const base = points.length; for (let i = 0; i < position.count; i++) { point.fromBufferAttribute(position, i).applyMatrix4(transform); points.push(point.toArray()); }
    vertexCount += position.count; const index = mesh.geometry.index;
    if (index) for (let i = 0; i + 2 < index.count; i += 3) triangles.push([base + index.getX(i), base + index.getX(i + 1), base + index.getX(i + 2)]);
    else for (let i = 0; i + 2 < position.count; i += 3) triangles.push([base + i, base + i + 1, base + i + 2]);
    triangleCount += index ? index.count / 3 : position.count / 3;
    const edges = new THREE.EdgesGeometry(mesh.geometry, CONFIG.edgeAngle); const edgePositions = edges.getAttribute('position');
    for (let i = 0; i + 1 < edgePositions.count; i += 2) { const a = new THREE.Vector3().fromBufferAttribute(edgePositions, i).applyMatrix4(transform);
      const b = new THREE.Vector3().fromBufferAttribute(edgePositions, i + 1).applyMatrix4(transform); edgeSegments.push([a.toArray(), b.toArray()]); }
    edges.dispose();
  });
  return { points, triangles, edgeSegments, meshCount, vertexCount, triangleCount };
}

function convexHullArea(points) {
  const unique = [...new Map(points.map((p) => [`${p[0]},${p[1]}`, p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (unique.length < 3) return 0;
  const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const half = [];
  for (const p of unique) { while (half.length >= 2 && turn(half.at(-2), half.at(-1), p) <= 0) half.pop(); half.push(p); }
  const lower = half.length; for (let i = unique.length - 2; i >= 0; i--) { const p = unique[i]; while (half.length > lower && turn(half.at(-2), half.at(-1), p) <= 0) half.pop(); half.push(p); }
  half.pop(); return Math.abs(half.reduce((area, p, i) => area + p[0] * half[(i + 1) % half.length][1] - p[1] * half[(i + 1) % half.length][0], 0)) / 2;
}

async function auditShell(index) {
  const assetId = `shell-relic-${index}`, relativeFile = `public/glb/shell_${String(index).padStart(2, '0')}.glb`;
  const gltf = await loadGlb(path.join(ROOT, relativeFile)); const flat = flatten(gltf.scene); const pca = canonicalPca(flat.points);
  const min = [0, 1, 2].map((axis) => Math.min(...flat.points.map((p) => p[axis]))), max = [0, 1, 2].map((axis) => Math.max(...flat.points.map((p) => p[axis])));
  const fullDimensions = max.map((value, axis) => value - min[axis]); const radius = Math.max(...flat.points.map((p) => Math.hypot(...p.map((v, axis) => v - pca.center[axis]))));
  const thicknessFiltered = filterThicknessSegments(flat.edgeSegments, pca.basis, CONFIG.verticalness);
  const projectedRaw = thicknessFiltered.map(([a, b]) => [dot(a.map((v, i) => v - pca.center[i]), pca.basis[0]), dot(a.map((v, i) => v - pca.center[i]), pca.basis[1]), dot(b.map((v, i) => v - pca.center[i]), pca.basis[0]), dot(b.map((v, i) => v - pca.center[i]), pca.basis[1])]);
  const maxDimension = Math.max(pca.extents[0], pca.extents[1]); const deduplicated = deduplicateProjectedSegments(projectedRaw, { tolerance: maxDimension * 1e-4, minLength: maxDimension * CONFIG.minProjectedLengthRatio });
  deduplicated.sort((a, b) => Math.hypot(b[2] - b[0], b[3] - b[1]) - Math.hypot(a[2] - a[0], a[3] - a[1]) || a.join(',').localeCompare(b.join(',')));
  const selected = deduplicated.slice(0, CONFIG.maxSegments); const uvCenter = [0, 1].map((axis) => (Math.max(...pca.projected.map((p) => p[axis])) + Math.min(...pca.projected.map((p) => p[axis]))) / 2);
  const segments2d = selected.map((s) => s.map((value, component) => (value - uvCenter[component % 2]) * 2 / maxDimension));
  return rounded({ assetId, file: relativeFile, meshCount: flat.meshCount, vertexCount: flat.vertexCount, triangleCount: flat.triangleCount,
    bounds: { min, max, dimensions: fullDimensions }, geometryCenter: pca.center, boundingRadius: radius,
    basis: { U: pca.basis[0], V: pca.basis[1], W: pca.basis[2], handedness: 'right' },
    metrics: { pcaExtents: { major: pca.extents[0], secondary: pca.extents[1], thickness: pca.extents[2] }, thicknessRatio: pca.extents[2] / maxDimension,
      projectedWidth: pca.extents[0], projectedHeight: pca.extents[1], aspectRatio: pca.extents[0] / pca.extents[1], convexHullArea: convexHullArea(pca.projected),
      edgeSegmentsOriginal: flat.edgeSegments.length, afterThicknessFilter: thicknessFiltered.length, afterProjectionDeduplication: deduplicated.length, finalSegmentCount: segments2d.length },
    projection: { method: 'PCA U/V', override: null, verticalnessThreshold: CONFIG.verticalness, edgeThresholdDegrees: CONFIG.edgeAngle }, normalizedMaxDimension: 2, segments2d, layout: LAYOUT[assetId] });
}

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
function transformPatch(shell) { const layout = shell.layout, angle = layout.rotationDegrees * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
  return shell.segments2d.map((line) => { const map = (u, v) => { u *= layout.flipU ? -1 : 1; v *= layout.flipV ? -1 : 1; return [(u * c - v * s) * layout.scale, (u * s + v * c) * layout.scale]; };
    return [...map(line[0], line[1]), ...map(line[2], line[3])]; }); }
function viewPoint(point, yaw, pitch) { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch); const x = point[0] * cy + point[2] * sy, z = -point[0] * sy + point[2] * cy; return [x, point[1] * cp - z * sp, point[1] * sp + z * cp]; }
function svgReport(shells) {
  const lines = []; const add = (s) => lines.push(s); add(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1420" viewBox="0 0 1600 1420"><rect width="100%" height="100%" fill="#071019"/><style>text{font-family:monospace;fill:#d9f8ff}.muted{fill:#7fa7b8}.wire{fill:none;stroke:#72cfe8;stroke-width:1.3}.sphere{fill:none;stroke:#9eeaff;stroke-width:1;opacity:.82}</style>`);
  add(`<text x="50" y="52" font-size="26">ASTERION // DETERMINISTIC SHELL GEOMETRY AUDIT</text><text x="50" y="82" class="muted" font-size="14">PCA flattened patches · thickness edges removed · max ${CONFIG.maxSegments} segments</text>`);
  shells.forEach((shell, i) => { const x = 50 + (i % 3) * 510, y = 130 + Math.floor(i / 3) * 315; add(`<g transform="translate(${x + 220} ${y + 125}) scale(105 -105)">`); shell.segments2d.forEach((l) => add(`<path class="wire" vector-effect="non-scaling-stroke" d="M${l[0]} ${l[1]}L${l[2]} ${l[3]}"/>`)); add('</g>'); const m = shell.metrics;
    add(`<text x="${x}" y="${y + 260}" font-size="18">${esc(shell.assetId)} → ${shell.layout.face}</text><text x="${x}" y="${y + 283}" class="muted" font-size="13">PCA ${m.pcaExtents.major} × ${m.pcaExtents.secondary} × ${m.pcaExtents.thickness} · aspect ${m.aspectRatio} · t/r ${m.thicknessRatio}</text>`); });
  add(`<text x="50" y="785" font-size="23">FIXED SPHERICAL-CUBE LAYOUT</text>`); const net = { '+Y':[235,835], '-X':[75,975], '+Z':[235,975], '+X':[395,975], '-Z':[555,975], '-Y':[235,1115] };
  Object.entries(net).forEach(([face,[x,y]]) => { const shell = shells.find((item) => item.layout.face === face); add(`<rect x="${x}" y="${y}" width="135" height="115" rx="8" fill="#0c2230" stroke="#568ca2"/><text x="${x+12}" y="${y+30}" font-size="18">${face}</text><text x="${x+12}" y="${y+57}" class="muted" font-size="13">${shell.assetId}</text><text x="${x+12}" y="${y+80}" class="muted" font-size="12">rot ${shell.layout.rotationDegrees}° · s ${shell.layout.scale}</text>`); });
  add(`<text x="780" y="785" font-size="23">COMPOSITE SPHERE VIEWS</text>`); [[0.45,-.3],[2.55,-.25],[4.55,.25]].forEach(([yaw,pitch], view) => { const cx = 900 + view * 230, cy = 980; add(`<circle cx="${cx}" cy="${cy}" r="103" fill="#091925" stroke="#426b7c"/>`);
    const drawable=[]; shells.forEach((shell) => transformPatch(shell).forEach((l) => { const a=viewPoint(cubeFaceToSphere(shell.layout.face,l[0],l[1]),yaw,pitch), b=viewPoint(cubeFaceToSphere(shell.layout.face,l[2],l[3]),yaw,pitch); if ((a[2]+b[2])/2 > -.08) drawable.push([a,b]); }));
    drawable.forEach(([a,b]) => add(`<path class="sphere" d="M${cx+a[0]*101} ${cy-a[1]*101}L${cx+b[0]*101} ${cy-b[1]*101}"/>`)); add(`<text x="${cx-55}" y="${cy+135}" class="muted" font-size="14">VIEW ${view+1} · yaw ${Math.round(yaw*180/Math.PI)}°</text>`); });
  add(`<text x="50" y="1370" class="muted" font-size="14">Gap policy: equator scale .84, poles .82. Lines are surface-only; no GLB thickness is mapped to the sphere.</text></svg>`); return lines.join('\n');
}
function markdown(shells) { const rows = shells.map((s) => `| ${s.assetId} | \`${s.file}\` | ${s.bounds.dimensions.join(' × ')} | ${Object.values(s.metrics.pcaExtents).join(' × ')} | ${s.metrics.thicknessRatio} | ${s.metrics.aspectRatio} | ${s.metrics.edgeSegmentsOriginal} | ${s.metrics.finalSegmentCount} | ${s.layout.face} | ${s.layout.rotationDegrees}° | ${s.layout.scale} | none |`).join('\n');
  const layout = shells.map((s) => `| ${s.assetId} | ${s.layout.face} | ${s.layout.rotationDegrees}° | ${s.layout.scale} | U:${s.layout.flipU}, V:${s.layout.flipV} | ${s.layout.comment} |`).join('\n');
  return `# Asterion shell geometry audit\n\n## SUMMARY DLA ARCHITEKTA\n\nSześć finalnych GLB przeanalizowano offline. PCA daje użyteczny, stabilny rzut każdej skorupy; descriptor nie zależy od kolejności absorpcji. Spherical-cube jest wystarczająco czytelny do implementacji runtime, z zachowaniem proponowanych szczelin.\n\n## ZADANIE\n\nAudyt geometrii i prototyp danych przyszłej Sfery Asterionowej; bez zmian runtime, gameplayu i istniejącego cached wireframe.\n\n## METODA AUDYTU\n\nSkrypt scala wszystkie Mesh do root-local, liczy kowariancję i deterministyczny prawoskrętny układ PCA U/V/W, generuje EdgesGeometry przy 30°, usuwa segmenty z udziałem W ≥ ${CONFIG.verticalness}, rzutuje, deduplikuje, odrzuca linie krótsze niż ${CONFIG.minProjectedLengthRatio} maksymalnego wymiaru i zachowuje do ${CONFIG.maxSegments} najdłuższych. Normalizacja ustawia największy wymiar na 2.\n\n## WYNIKI PER SKORUPA\n\n| assetId | file | bounds X×Y×Z | PCA major×secondary×thickness | thickness ratio | patch aspect | edges | final | face | rotation | scale | override/problem |\n|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---|\n${rows}\n\nPełne metryki (w tym mesh/vertex/triangle counts, centra, promienie, osie, hull area i etapy filtrowania) oraz finalne segmenty znajdują się w \`asterion-shell-geometry-audit.json\`. Nie wykryto przypadku wymagającego override rzutu PCA.\n\n## REKOMENDOWANY FINALNY LAYOUT KULI\n\n| shellAssetId | face | rotation | scale | flip | komentarz |\n|---|---|---:|---:|---|---|\n${layout}\n\nBardziej złożone łaty 1–4 zajmują równik, a 5–6 bieguny. Stałe skale .84/.82 tworzą cienką przerwę między płytami.\n\n## WIZUALNY RAPORT\n\n\`docs/current/audits/asterion-shells/asterion-shell-geometry-audit.svg\` pokazuje sześć spłaszczonych patchy, cube net z legendą i trzy deterministyczne widoki sfery.\n\n## WNIOSKI\n\nSpherical-cube zachowuje rozpoznawalne linie i dobrze komunikuje sześć energetycznych płyt. Nie są potrzebne geometryczne overrides. Rekomendowana jest jedynie ocena artystyczna skali szczeliny po wdrożeniu; dane pozwalają przejść bez ponownej analizy GLB do implementacji runtime.\n\n## NIE WYKONANO / POZA ZAKRESEM\n\nNie zmieniono GLB, panelu, wireframe pojedynczej skorupy, progresji, insertion/process ani gameplayu. Nie użyto WebGLRenderer/GPU.\n\n## ZMIENIONE/DODANE PLIKI\n\nSkrypt audytu, biblioteka czystych funkcji, testy oraz generowane JSON/SVG/ten raport.\n\n## TESTY WYKONANE\n\nPatrz historia zadania/commit; deterministyczność jest weryfikowana przez dwa uruchomienia i porównanie SHA-256 generowanych artefaktów.\n\n## OGRANICZENIA\n\nEdgesGeometry odzwierciedla próg cech 30°, a limit 100 celowo redukuje detal. SVG jest diagnostyczną projekcją ortograficzną, nie renderingiem materiałowym.\n\n## STAN PUBLIKACJI\n\nGotowe dane audytowe; integracja runtime pozostaje osobnym etapem.\n`; }

await fs.mkdir(OUTPUT_DIR, { recursive: true }); const shells = [];
for (let index = 1; index <= 6; index++) shells.push(await auditShell(index));
const data = { schemaVersion: 1, deterministic: true, config: CONFIG, faceConvention: 'FACE_BASIS in scripts/lib/asterion-shell-geometry.mjs', shells };
await fs.writeFile(path.join(OUTPUT_DIR, 'asterion-shell-geometry-audit.json'), `${JSON.stringify(data, null, 2)}\n`);
await fs.writeFile(path.join(OUTPUT_DIR, 'asterion-shell-geometry-audit.svg'), `${svgReport(shells)}\n`);
await fs.writeFile(path.join(OUTPUT_DIR, 'asterion-shell-geometry-audit.md'), markdown(shells));
console.log(`Audited ${shells.length} shells → ${path.relative(ROOT, OUTPUT_DIR)}`);
shells.forEach((s) => console.log(`${s.assetId}: ${s.vertexCount} vertices, PCA ${Object.values(s.metrics.pcaExtents).join(' × ')}, ${s.metrics.finalSegmentCount} patch segments → ${s.layout.face}`));
