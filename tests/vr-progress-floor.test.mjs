import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrProgressFloor, FLOOR_WORLD_Y_OFFSET } from '../src/xr/floor/createVrProgressFloor.js';

const CONTRACTS = {
  creative: { base: 'VR_PROGRESS_SECTOR_FIRE_BASE', prefix: 'VR_PROGRESS_CARD_FIRE_', panelCount: 3 },
  ethics: { base: 'VR_PROGRESS_SECTOR_EARTH_BASE', prefix: 'VR_PROGRESS_CARD_EARTH_', panelCount: 3 },
  water: { base: 'VR_PROGRESS_SECTOR_WATER_BASE', prefix: 'VR_PROGRESS_CARD_WATER_', panelCount: 5 }
};

function createSectorModel(sourceType, { missingObject = null } = {}) {
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
const floor = createVrProgressFloor({
  parent, creativeSectorModel: creativeSource, ethicsSectorModel: ethicsSource, haikuSectorModel: waterSource,
  emission: { stableIntensity: 1.5, pulseIntensity: 3, pulseDuration: 0.1, responseSpeed: 100 }
});
const sectors = floor.object.children;
const expected = [
  ['spotify-digger', 'metal', true, 'creative'],
  ['haiku-cosmos', 'water', false, 'water'],
  ['ai-guide', 'wood', true, 'creative'],
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
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'creative').length, 3);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'ethics').length, 1);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'water').length, 1);

for (let first = 0; first < sectors.length; first += 1) {
  for (let second = first + 1; second < sectors.length; second += 1) {
    if (CONTRACTS[sectors[first].userData.sourceType].panelCount >= 1) assert.notEqual(panelMaterial(sectors[first], 1), panelMaterial(sectors[second], 1));
  }
}
assert.notEqual(panelMaterial(sectors[1], 1), waterSource.getObjectByName('VR_PROGRESS_CARD_WATER_01').material);
assert.equal(waterSource.getObjectByName('VR_PROGRESS_CARD_WATER_01').material.emissiveIntensity, 1);
assert.equal(panelMaterial(sectors[1], 1).emissive.getHex(), 0x35a9ff, 'Water receives its cool fallback');

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
assert.equal(floor.activatePage({ glyphId: 'ai-guide', order: 1 }), true);
assert.equal(floor.activatePage({ glyphId: 'spotify-digger', order: 1 }), true);
for (let order = 2; order <= 5; order += 1) assert.equal(floor.activatePage({ glyphId: 'haiku-cosmos', order }), true);
const beforeUnsupported = floor.getActivatedEntries();
assert.equal(floor.activatePage({ glyphId: 'spotify-digger', order: 4 }), false);
assert.equal(floor.activatePage({ glyphId: 'unknown', order: 1 }), false);
assert.equal(floor.activatePage(null), false);
assert.deepEqual(floor.getActivatedEntries(), beforeUnsupported);
assert.equal(floor.getActivatedEntries().filter(({ order }) => order === 1).length, 5, 'same order activates independently per glyph');
const activatedCopy = floor.getActivatedEntries();
activatedCopy[0].glyphId = 'changed';
activatedCopy.length = 0;
assert.notEqual(floor.getActivatedEntries()[0].glyphId, 'changed');
assert.ok(floor.getActivatedEntries().length > 0);

for (const missingObject of ['VR_PROGRESS_CARD_WATER_04', 'VR_PROGRESS_CARD_WATER_05']) {
  assert.throws(() => createVrProgressFloor({
    parent: new THREE.Group(), creativeSectorModel: createSectorModel('creative'), ethicsSectorModel: createSectorModel('ethics'),
    haikuSectorModel: createSectorModel('water', { missingObject })
  }), new RegExp(`Missing required object "${missingObject}" for sector "haiku-cosmos" \\(source: water\\)`));
}
assert.throws(() => createVrProgressFloor({ parent: new THREE.Group(), creativeSectorModel: creativeSource, ethicsSectorModel: ethicsSource }), /valid Haiku Cosmos sector model/);

const ownedWaterMaterial = panelMaterial(sectors[1], 1);
floor.dispose();
assert.equal(floor.object.parent, null);
assert.equal(ownedWaterMaterial.version > 0, true, 'owned cloned materials are disposed');
floor.dispose();
console.log('VR progress floor assertions passed');
