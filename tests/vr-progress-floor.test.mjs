import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrProgressFloor, FLOOR_WORLD_Y_OFFSET } from '../src/xr/floor/createVrProgressFloor.js';

const CONTRACTS = {
  creative: { base: 'VR_PROGRESS_SECTOR_FIRE_BASE', prefix: 'VR_PROGRESS_CARD_FIRE_', panelCount: 3 },
  ethics: { base: 'VR_PROGRESS_SECTOR_EARTH_BASE', prefix: 'VR_PROGRESS_CARD_EARTH_', panelCount: 3 },
  water: { base: 'VR_PROGRESS_SECTOR_WATER_BASE', prefix: 'VR_PROGRESS_CARD_WATER_', panelCount: 5 },
  metal: { base: 'VR_PROGRESS_SECTOR_METAL_BASE', prefix: 'VR_PROGRESS_CARD_METAL_', panelCount: 4 },
  wood: { base: 'VR_PROGRESS_SECTOR_WOOD_BASE', prefix: 'VR_PROGRESS_CARD_WOOD_', panelCount: 3 }
};

function createSectorModel(sourceType, { missingObject = null, radialStep = 1.25, radii = null } = {}) {
  const contract = CONTRACTS[sourceType];
  const source = new THREE.Group();
  source.name = `${sourceType}FloorSource`;
  if (contract.base !== missingObject) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()]);
    base.name = contract.base;
    source.add(base);
  }
  for (let order = 1; order <= contract.panelCount; order += 1) {
    const name = `${contract.prefix}${String(order).padStart(2, '0')}`;
    if (name === missingObject) continue;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x222222, emissive: order === 1 ? 0x000000 : 0x551100 })
    );
    panel.name = name;
    panel.position.set(radii?.[order - 1] ?? order * radialStep, 0.05, 0);
    source.add(panel);
  }
  const ornament = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  ornament.name = `${sourceType}Ornament`;
  source.add(ornament);
  return source;
}

function panelMaterial(sector, order) {
  const contract = CONTRACTS[sector.userData.sourceType];
  return sector.getObjectByName(`${contract.prefix}${String(order).padStart(2, '0')}`).material;
}
const meshMaterials = (object) => Array.isArray(object.material) ? object.material : [object.material];

const parent = new THREE.Group();
const creativeSource = createSectorModel('creative');
const ethicsSource = createSectorModel('ethics');
const waterSource = createSectorModel('water');
const metalSource = createSectorModel('metal');
const woodSource = createSectorModel('wood');
const floor = createVrProgressFloor({
  parent, creativeSectorModel: creativeSource, ethicsSectorModel: ethicsSource, haikuSectorModel: waterSource,
  digSectorModel: metalSource,
  aiGuideSectorModel: woodSource,
  emission: { stableIntensity: 1.5, pulseIntensity: 3, pulseDuration: 0.1, responseSpeed: 100 }
});
const sectors = floor.object.children.filter(({ name }) => name.startsWith('VrProgressFloorSector:'));
const tierRings = floor.object.children.filter(({ name }) => name.startsWith('VrProgressTierRing:'));
const expected = [
  ['spotify-digger', 'metal', false, 'metal'],
  ['haiku-cosmos', 'water', false, 'water'],
  ['ai-guide', 'wood', false, 'wood'],
  ['creative-ai', 'fire', false, 'creative'],
  ['ethics-life-protection', 'earth', false, 'ethics']
];

assert.equal(parent.children[0], floor.object);
assert.equal(floor.object.name, 'VrTiltableFloorRoot');
assert.equal(FLOOR_WORLD_Y_OFFSET, -1.05);
assert.deepEqual(floor.object.position.toArray(), [0, -1.05, 0]);
assert.deepEqual(floor.object.rotation.toArray().slice(0, 3), [0, 0, 0]);
assert.deepEqual(floor.object.scale.toArray(), [1, 1, 1]);
assert.equal(sectors.length, 5);
assert.equal(tierRings.length, 5);
assert.deepEqual(tierRings.map(({ userData }) => userData.tier), [1, 2, 3, 4, 5]);
assert.deepEqual(tierRings.map(({ userData }) => userData.radius), [1.25, 2.5, 3.75, 5, 6.25]);
assert.ok(tierRings.every((ring, index) => index === 0 || ring.userData.radius > tierRings[index - 1].userData.radius));
assert.ok(tierRings.every(({ material }) => material.opacity === 0 && material.transparent && material.depthWrite === false));
assert.ok(tierRings.every(({ geometry }) => geometry.type === 'RingGeometry'), 'tiers 4 and 5 also use full RingGeometry');
assert.deepEqual(sectors.map(({ name }) => name), expected.map(([glyphId]) => `VrProgressFloorSector:${glyphId}`));

sectors.forEach((sector, index) => {
  const [glyphId, branchId, placeholder, sourceType] = expected[index];
  assert.ok(Math.abs(sector.rotation.y - index * Math.PI * 2 / 5) < 1e-12);
  assert.deepEqual(sector.position.toArray(), [0, 0, 0]);
  assert.deepEqual(
    { glyphId: sector.userData.glyphId, branchId: sector.userData.branchId, rotationIndex: sector.userData.rotationIndex,
      placeholder: sector.userData.placeholder, sourceType: sector.userData.sourceType },
    { glyphId, branchId, rotationIndex: index, placeholder, sourceType }
  );
  const contract = CONTRACTS[sourceType];
  for (let order = 1; order <= contract.panelCount; order += 1) {
    assert.ok(sector.getObjectByName(`${contract.prefix}${String(order).padStart(2, '0')}`));
    assert.equal(panelMaterial(sector, order).opacity, 1);
    assert.equal(panelMaterial(sector, order).depthWrite, true);
  }
  meshMaterials(sector.getObjectByName(contract.base)).forEach((material) => {
    assert.equal(material.transparent, true);
    assert.equal(material.opacity, 0);
    assert.equal(material.depthWrite, false);
  });
  assert.equal(sector.getObjectByName(`${sourceType}Ornament`).material.opacity, 1);
});
assert.equal(new Set(sectors.map(({ userData }) => userData.sourceType)).size, 5);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'creative').length, 1);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'ethics').length, 1);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'water').length, 1);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'metal').length, 1);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'wood').length, 1);
assert.equal(sectors.some(({ userData }) => userData.placeholder), false);

for (let first = 0; first < sectors.length; first += 1) {
  for (let second = first + 1; second < sectors.length; second += 1) {
    if (CONTRACTS[sectors[first].userData.sourceType].panelCount >= 1) assert.notEqual(panelMaterial(sectors[first], 1), panelMaterial(sectors[second], 1));
  }
}
assert.notEqual(panelMaterial(sectors[1], 1), waterSource.getObjectByName('VR_PROGRESS_CARD_WATER_01').material);
assert.notEqual(panelMaterial(sectors[0], 1), metalSource.getObjectByName('VR_PROGRESS_CARD_METAL_01').material);
assert.notEqual(panelMaterial(sectors[2], 1), woodSource.getObjectByName('VR_PROGRESS_CARD_WOOD_01').material);
assert.equal(waterSource.getObjectByName('VR_PROGRESS_CARD_WATER_01').material.emissiveIntensity, 1);
assert.equal(panelMaterial(sectors[1], 1).emissive.getHex(), 0x35a9ff, 'Water receives its cool fallback');
assert.equal(panelMaterial(sectors[0], 1).emissive.getHex(), 0x8cd1ff, 'Metal receives its cool fallback');
assert.equal(panelMaterial(sectors[2], 1).emissive.getHex(), 0x29e86f, 'Wood receives its green fallback');

const assertOnlyLit = (targetSector, order) => sectors.forEach((sector) => {
  const count = CONTRACTS[sector.userData.sourceType].panelCount;
  for (let candidate = 1; candidate <= count; candidate += 1) {
    const shouldBeLit = sector === targetSector && candidate === order;
    assert.equal(panelMaterial(sector, candidate).emissiveIntensity > 0, shouldBeLit);
  }
});
assert.equal(floor.activatePage({ glyphId: 'creative-ai', order: 1 }), true);
floor.update(0.05);
assertOnlyLit(sectors[3], 1);
assert.equal(floor.activatePage({ glyphId: 'creative-ai', order: 1 }), false);

assert.equal(floor.activatePage({ glyphId: 'ethics-life-protection', order: 1 }), true);
assert.equal(floor.activatePage({ glyphId: 'haiku-cosmos', order: 1 }), true);
assert.equal(floor.activatePage({ glyphId: 'spotify-digger', order: 1 }), true);
floor.update(0.05);
assert.equal(panelMaterial(sectors[0], 1).emissiveIntensity > 0, true);
assert.equal(panelMaterial(sectors[2], 1).emissiveIntensity, 0, 'METAL 01 does not light WOOD 01');
assert.equal(floor.activatePage({ glyphId: 'ai-guide', order: 1 }), true);
floor.update(0.05);
assert.equal(panelMaterial(sectors[2], 1).emissiveIntensity > 0, true);
assert.equal(panelMaterial(sectors[3], 1).emissiveIntensity > 0, true, 'AI Guide does not alter FIRE 01');
assert.equal(floor.activatePage({ glyphId: 'ai-guide', order: 1 }), false);
for (let order = 2; order <= 3; order += 1) assert.equal(floor.activatePage({ glyphId: 'ai-guide', order }), true);
assert.equal(floor.activatePage({ glyphId: 'ai-guide', order: 4 }), false);
for (let order = 2; order <= 4; order += 1) assert.equal(floor.activatePage({ glyphId: 'spotify-digger', order }), true);
for (let order = 2; order <= 5; order += 1) assert.equal(floor.activatePage({ glyphId: 'haiku-cosmos', order }), true);
for (let order = 2; order <= 3; order += 1) {
  assert.equal(floor.activatePage({ glyphId: 'creative-ai', order }), true);
  assert.equal(floor.activatePage({ glyphId: 'ethics-life-protection', order }), true);
}
assert.equal(floor.activatePage({ glyphId: 'creative-ai', order: 4 }), false);
assert.equal(floor.activatePage({ glyphId: 'ethics-life-protection', order: 4 }), false);
assert.equal(floor.activatePage({ glyphId: 'haiku-cosmos', order: 6 }), false);
const beforeUnsupported = floor.getActivatedEntries();
assert.equal(floor.activatePage({ glyphId: 'spotify-digger', order: 4 }), false);
assert.equal(floor.activatePage({ glyphId: 'spotify-digger', order: 5 }), false);
assert.equal(floor.activatePage({ glyphId: 'unknown', order: 1 }), false);
assert.equal(floor.activatePage(null), false);
assert.deepEqual(floor.getActivatedEntries(), beforeUnsupported);
assert.equal(floor.getActivatedEntries().filter(({ order }) => order === 1).length, 5, 'same order activates independently per glyph');
const activatedCopy = floor.getActivatedEntries();
activatedCopy[0].glyphId = 'changed';
activatedCopy.length = 0;
assert.notEqual(floor.getActivatedEntries()[0].glyphId, 'changed');
assert.ok(floor.getActivatedEntries().length > 0);
assert.ok(floor.getActivatedEntries().some(({ glyphId, order }) => glyphId === 'spotify-digger' && order === 4));

assert.equal(floor.completeTier(0), false);
assert.equal(floor.completeTier(6), false);
assert.equal(floor.completeTier(1), true);
assert.equal(floor.completeTier(1), false);
floor.update(0.02);
assert.ok(tierRings[0].material.opacity > 0, 'completion begins the light impulse');
assert.equal(tierRings[1].material.opacity, 0, 'uncompleted rings stay unlit');
const pulseOpacity = tierRings[0].material.opacity;
floor.update(1);
floor.update(1);
assert.ok(tierRings[0].material.opacity > 0 && tierRings[0].material.opacity < pulseOpacity, 'impulse settles to a subtle stable glow');
for (let tier = 2; tier <= 5; tier += 1) assert.equal(floor.completeTier(tier), true);
floor.update(1);
assert.ok(tierRings.every(({ material }) => material.opacity > 0), 'completed tier rings accumulate');
assert.deepEqual(floor.getCompletedTiers(), [1, 2, 3, 4, 5]);
const completedCopy = floor.getCompletedTiers();
completedCopy.length = 0;
assert.deepEqual(floor.getCompletedTiers(), [1, 2, 3, 4, 5]);

for (const missingObject of ['VR_PROGRESS_CARD_WATER_04', 'VR_PROGRESS_CARD_WATER_05']) {
  assert.throws(() => createVrProgressFloor({
    parent: new THREE.Group(), creativeSectorModel: createSectorModel('creative'), ethicsSectorModel: createSectorModel('ethics'),
    haikuSectorModel: createSectorModel('water', { missingObject }), digSectorModel: createSectorModel('metal'),
    aiGuideSectorModel: createSectorModel('wood')
  }), new RegExp(`Missing required object "${missingObject}" for sector "haiku-cosmos" \\(source: water\\)`));
}
assert.throws(() => createVrProgressFloor({
  parent: new THREE.Group(), creativeSectorModel: createSectorModel('creative'), ethicsSectorModel: createSectorModel('ethics'),
  haikuSectorModel: createSectorModel('water'), digSectorModel: createSectorModel('metal', { missingObject: 'VR_PROGRESS_CARD_METAL_04' }),
  aiGuideSectorModel: createSectorModel('wood')
}), /Missing required object "VR_PROGRESS_CARD_METAL_04" for sector "spotify-digger" \(source: metal\)/);
assert.throws(() => createVrProgressFloor({
  parent: new THREE.Group(), creativeSectorModel: createSectorModel('creative'), ethicsSectorModel: createSectorModel('ethics'),
  haikuSectorModel: createSectorModel('water'), digSectorModel: createSectorModel('metal'),
  aiGuideSectorModel: createSectorModel('wood', { missingObject: 'VR_PROGRESS_CARD_WOOD_03' })
}), /Missing required object "VR_PROGRESS_CARD_WOOD_03" for sector "ai-guide" \(source: wood\)/);
assert.throws(() => createVrProgressFloor({
  parent: new THREE.Group(), creativeSectorModel: creativeSource, ethicsSectorModel: ethicsSource, haikuSectorModel: waterSource
}), /valid DIG Engine sector model/);
assert.throws(() => createVrProgressFloor({
  parent: new THREE.Group(), creativeSectorModel: creativeSource, ethicsSectorModel: ethicsSource,
  haikuSectorModel: waterSource, digSectorModel: metalSource
}), /valid AI Guide sector model/);
assert.throws(() => createVrProgressFloor({
  parent: new THREE.Group(), creativeSectorModel: createSectorModel('creative', { radialStep: 0 }),
  ethicsSectorModel: createSectorModel('ethics', { radialStep: 0 }),
  haikuSectorModel: createSectorModel('water', { radialStep: 0 }),
  digSectorModel: createSectorModel('metal', { radialStep: 0 }),
  aiGuideSectorModel: createSectorModel('wood', { radialStep: 0 })
}), /Cannot derive a valid radius for tier 1 from panel centers/);

const createFloorWithRadii = (radii, rings = {}) => createVrProgressFloor({
  parent: new THREE.Group(),
  creativeSectorModel: createSectorModel('creative', { radii }),
  ethicsSectorModel: createSectorModel('ethics', { radii }),
  haikuSectorModel: createSectorModel('water', { radii }),
  digSectorModel: createSectorModel('metal', { radii }),
  aiGuideSectorModel: createSectorModel('wood', { radii }),
  rings
});
const readRingRadii = (targetFloor) => targetFloor.object.children
  .filter(({ name }) => name.startsWith('VrProgressTierRing:'))
  .map(({ userData }) => userData.radius);
const originalWarn = console.warn;
const normalizationWarnings = [];
console.warn = (...args) => normalizationWarnings.push(args);
const nonMonotonicFloor = createFloorWithRadii([1.3, 2.6, 3.9, 3.7, 5.2]);
const nonMonotonicRadii = readRingRadii(nonMonotonicFloor);
assert.equal(nonMonotonicRadii.length, 5);
assert.ok(nonMonotonicRadii.every((radius, index) => radius > 0 && (index === 0 || radius > nonMonotonicRadii[index - 1])));
assert.deepEqual(nonMonotonicRadii, [1.3, 2.6, 3.7, 3.9, 5.2]);
nonMonotonicFloor.dispose();

const closeRadiiFloor = createFloorWithRadii([1.3, 2.6, 3.9, 3.91, 5.2], { ringThickness: 0.1 });
const closeRadii = readRingRadii(closeRadiiFloor);
assert.ok(closeRadii[3] - closeRadii[2] >= 0.2 - 1e-12, 'close candidates respect twice the ring thickness');
assert.ok(closeRadii.every((radius, index) => index === 0 || radius > closeRadii[index - 1]));
closeRadiiFloor.dispose();
console.warn = originalWarn;
assert.equal(normalizationWarnings.length, 2, 'normalization emits one developer warning per constructed floor');

const ownedWaterMaterial = panelMaterial(sectors[1], 1);
const ownedMetalMaterial = panelMaterial(sectors[0], 1);
const ownedWoodMaterial = panelMaterial(sectors[2], 1);
let ringGeometryDisposed = false;
let ringMaterialDisposed = false;
tierRings[0].geometry.addEventListener('dispose', () => { ringGeometryDisposed = true; });
tierRings[0].material.addEventListener('dispose', () => { ringMaterialDisposed = true; });
floor.dispose();
assert.equal(floor.object.parent, null);
assert.equal(ownedWaterMaterial.version > 0, true, 'owned cloned materials are disposed');
assert.equal(ownedMetalMaterial.version > 0, true, 'owned cloned Metal materials are disposed');
assert.equal(ownedWoodMaterial.version > 0, true, 'owned cloned Wood materials are disposed');
assert.equal(ringGeometryDisposed, true, 'owned ring geometries are disposed');
assert.equal(ringMaterialDisposed, true, 'owned ring materials are disposed');
floor.dispose();
console.log('VR progress floor assertions passed');
