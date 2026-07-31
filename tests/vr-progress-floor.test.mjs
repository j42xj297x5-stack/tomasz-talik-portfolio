import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrProgressFloor, FLOOR_WORLD_Y_OFFSET } from '../src/xr/floor/createVrProgressFloor.js';

const CONTRACTS = {
  creative: { base: 'VR_PROGRESS_SECTOR_FIRE_BASE', prefix: 'VR_PROGRESS_CARD_FIRE_' },
  ethics: { base: 'VR_PROGRESS_SECTOR_EARTH_BASE', prefix: 'VR_PROGRESS_CARD_EARTH_' }
};

function createSectorModel(sourceType, { missingObject = null } = {}) {
  const contract = CONTRACTS[sourceType];
  const source = new THREE.Group();
  source.name = `${sourceType}FloorSource`;
  if (contract.base !== missingObject) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()]
    );
    base.name = contract.base;
    source.add(base);
  }
  for (let order = 1; order <= 3; order += 1) {
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

function meshMaterials(object) {
  return Array.isArray(object.material) ? object.material : [object.material];
}

const parent = new THREE.Group();
const creativeSource = createSectorModel('creative');
const ethicsSource = createSectorModel('ethics');
const floor = createVrProgressFloor({
  parent,
  creativeSectorModel: creativeSource,
  ethicsSectorModel: ethicsSource,
  emission: { stableIntensity: 1.5, pulseIntensity: 3, pulseDuration: 0.1, responseSpeed: 100 }
});
const sectors = floor.object.children;
const expected = [
  ['spotify-digger', 'metal', true, 'creative'],
  ['haiku-cosmos', 'water', true, 'creative'],
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
  assert.deepEqual(sector.position.toArray(), [0, 0, 0], 'sectors form a circle without offsets');
  assert.deepEqual(
    { glyphId: sector.userData.glyphId, branchId: sector.userData.branchId, rotationIndex: sector.userData.rotationIndex,
      placeholder: sector.userData.placeholder, sourceType: sector.userData.sourceType },
    { glyphId, branchId, rotationIndex: index, placeholder, sourceType }
  );
  const contract = CONTRACTS[sourceType];
  assert.ok(sector.getObjectByName(contract.base));
  for (let order = 1; order <= 3; order += 1) {
    assert.ok(sector.getObjectByName(`${contract.prefix}${String(order).padStart(2, '0')}`));
  }
  meshMaterials(sector.getObjectByName(contract.base)).forEach((material) => {
    assert.equal(material.transparent, true);
    assert.equal(material.opacity, 0);
    assert.equal(material.depthWrite, false);
  });
  for (let order = 1; order <= 3; order += 1) {
    assert.equal(panelMaterial(sector, order).opacity, 1, 'progress panels remain visible');
    assert.equal(panelMaterial(sector, order).depthWrite, true, 'progress panels retain depth writing');
  }
  assert.equal(sector.getObjectByName(`${sourceType}Ornament`).material.opacity, 1, 'ornament remains visible');
});

assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'ethics').length, 1);
assert.equal(sectors.filter(({ userData }) => userData.sourceType === 'creative').length, 4);
assert.equal(sectors[3].userData.glyphId, 'creative-ai', 'Creative AI owns the target upper-left rotation slot');
assert.equal(sectors[2].userData.glyphId, 'ai-guide', 'AI Guide owns the target upper-right placeholder slot');
assert.equal(sectors[4].userData.glyphId, 'ethics-life-protection', 'Ethics owns the target lower-left slot');

for (let first = 0; first < sectors.length; first += 1) {
  for (let second = first + 1; second < sectors.length; second += 1) {
    assert.notEqual(panelMaterial(sectors[first], 1), panelMaterial(sectors[second], 1));
  }
}
assert.equal(creativeSource.getObjectByName('VR_PROGRESS_CARD_FIRE_01').material.emissiveIntensity, 1);
assert.equal(ethicsSource.getObjectByName('VR_PROGRESS_CARD_EARTH_01').material.emissiveIntensity, 1);
assert.notEqual(panelMaterial(sectors[0], 1).emissive.getHex(), 0, 'black panel emission receives the warm fallback');

for (let order = 1; order <= 3; order += 1) {
  assert.equal(floor.activateOrder(order), true);
  floor.update(0.05);
  sectors.forEach((sector) => assert.ok(panelMaterial(sector, order).emissiveIntensity > 0));
}
assert.equal(floor.activateOrder(1), false, 'activation is idempotent');
assert.equal(floor.activateOrder(0), false);
assert.equal(floor.activateOrder(4), false);
assert.deepEqual(floor.getActivatedOrders(), [1, 2, 3]);
const activatedCopy = floor.getActivatedOrders();
activatedCopy.length = 0;
assert.deepEqual(floor.getActivatedOrders(), [1, 2, 3]);

assert.throws(
  () => createVrProgressFloor({
    parent: new THREE.Group(),
    creativeSectorModel: createSectorModel('creative'),
    ethicsSectorModel: createSectorModel('ethics', { missingObject: 'VR_PROGRESS_CARD_EARTH_02' })
  }),
  /Missing required object "VR_PROGRESS_CARD_EARTH_02" for sector "ethics-life-protection" \(source: ethics\)/
);

floor.dispose();
assert.equal(floor.object.parent, null);
console.log('VR progress floor assertions passed');
