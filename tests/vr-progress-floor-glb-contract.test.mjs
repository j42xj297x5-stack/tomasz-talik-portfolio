import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { VR_PROGRESS_FLOOR_SOURCE_CONTRACTS } from '../src/xr/floor/createVrProgressFloor.js';

const ASSETS = [
  { sourceType: 'creative', file: 'floor_creative.glb', base: 'VR_PROGRESS_SECTOR_FIRE_BASE', panelPrefix: 'VR_PROGRESS_CARD_FIRE_', panelCount: 3 },
  { sourceType: 'ethics', file: 'floor_ethic.glb', base: 'VR_PROGRESS_SECTOR_EARTH_BASE', panelPrefix: 'VR_PROGRESS_CARD_EARTH_', panelCount: 3 },
  { sourceType: 'water', file: 'floor_haiku_cosmos.glb', base: 'VR_PROGRESS_SECTOR_WATER_BASE', panelPrefix: 'VR_PROGRESS_CARD_WATER_', panelCount: 5 },
  { sourceType: 'metal', file: 'floor_dig_engine.glb', base: 'VR_PROGRESS_SECTOR_METAL_BASE', panelPrefix: 'VR_PROGRESS_CARD_METAL_', panelCount: 4 },
  { sourceType: 'wood', file: 'floor_ai_guide.glb', base: 'VR_PROGRESS_SECTOR_WOOD_BASE', panelPrefix: 'VR_PROGRESS_CARD_WOOD_', panelCount: 3 }
];

async function readGlbJson(file) {
  const data = await readFile(new URL(`../public/glb/${file}`, import.meta.url));
  assert.equal(data.toString('ascii', 0, 4), 'glTF', `${file} is a binary glTF`);
  let offset = 12;
  while (offset < data.length) {
    const byteLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    offset += 8;
    if (chunkType === 0x4e4f534a) {
      return JSON.parse(data.toString('utf8', offset, offset + byteLength).replace(/[\0 ]+$/, ''));
    }
    offset += byteLength;
  }
  throw new Error(`${file} has no JSON chunk`);
}

const primitiveAlpha = (document, primitive) => primitive.material === undefined
  ? 1
  : (document.materials?.[primitive.material]?.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 1);

for (const asset of ASSETS) {
  const document = await readGlbJson(asset.file);
  const nodesByName = new Map(document.nodes.map((node) => [node.name, node]));
  const runtimeContract = VR_PROGRESS_FLOOR_SOURCE_CONTRACTS[asset.sourceType];
  assert.equal(runtimeContract.referenceBaseName, asset.base, `${asset.file} contracts its required technical BASE`);
  assert.equal(runtimeContract.presentationBodyNames.length, 1, `${asset.file} contracts one authored presentation body`);

  for (const bodyName of [runtimeContract.referenceBaseName, ...runtimeContract.presentationBodyNames]) {
    const node = nodesByName.get(bodyName);
    assert.ok(node, `${asset.file} contains contracted body node ${bodyName}`);
    assert.notEqual(node.mesh, undefined, `${asset.file}:${bodyName} owns a mesh`);
    const primitives = document.meshes[node.mesh].primitives;
    assert.ok(primitives.length > 0, `${asset.file}:${bodyName} has geometry primitives`);
    assert.ok(primitives.every((primitive) => primitiveAlpha(document, primitive) > 0),
      `${asset.file}:${bodyName} has a runtime-visible authored alpha target`);
  }

  for (let order = 1; order <= asset.panelCount; order += 1) {
    const panelName = `${asset.panelPrefix}${String(order).padStart(2, '0')}`;
    const panel = nodesByName.get(panelName);
    assert.ok(panel, `${asset.file} contains ${panelName}`);
    assert.notEqual(panel.mesh, undefined, `${asset.file}:${panelName} owns a mesh`);
    assert.ok(document.meshes[panel.mesh].primitives.every((primitive) => primitiveAlpha(document, primitive) > 0),
      `${asset.file}:${panelName} is authored visibly before runtime emission`);
    assert.ok((panel.translation?.[2] ?? 0) > 0, `${asset.file}:${panelName} is placed radially beyond BASE origin`);
  }
}

console.log('VR progress floor production GLB contract tests passed.');
