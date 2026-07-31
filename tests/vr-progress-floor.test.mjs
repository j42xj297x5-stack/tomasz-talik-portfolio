import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrProgressFloor, FLOOR_WORLD_Y_OFFSET } from '../src/xr/floor/createVrProgressFloor.js';

function createSectorModel({ missingPanel = null } = {}) {
  const source = new THREE.Group();
  source.name = 'CreativeFloorSource';
  const sectorBase = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 1),
    [new THREE.MeshStandardMaterial({ color: 0x440000 }), new THREE.MeshStandardMaterial({ color: 0x220000 })]
  );
  sectorBase.name = 'VR_PROGRESS_SECTOR_FIRE_BASE';
  source.add(sectorBase);
  for (let order = 1; order <= 3; order += 1) {
    const name = `VR_PROGRESS_CARD_FIRE_${String(order).padStart(2, '0')}`;
    if (name === missingPanel) continue;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.1, 1),
      new THREE.MeshStandardMaterial({ color: 0x222222, emissive: order === 1 ? 0x000000 : 0x551100 })
    );
    panel.name = name;
    source.add(panel);
  }
  const ornament = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  ornament.name = 'Ornament';
  source.add(ornament);
  return source;
}

function panelMaterial(sector, order) {
  return sector.getObjectByName(`VR_PROGRESS_CARD_FIRE_${String(order).padStart(2, '0')}`).material;
}

function meshMaterials(object) {
  return Array.isArray(object.material) ? object.material : [object.material];
}

const parent = new THREE.Group();
const source = createSectorModel();
const sourceMaterials = source.children.map(({ material }) => material);
const floor = createVrProgressFloor({
  parent,
  sectorModel: source,
  emission: { stableIntensity: 1.5, pulseIntensity: 3, pulseDuration: 0.1, responseSpeed: 100 }
});
const sectors = floor.object.children;
assert.equal(parent.children[0], floor.object);
assert.equal(floor.object.name, 'VrTiltableFloorRoot');
assert.equal(FLOOR_WORLD_Y_OFFSET, -1.05);
assert.deepEqual(floor.object.position.toArray(), [0, -1.05, 0]);
assert.deepEqual(floor.object.rotation.toArray().slice(0, 3), [0, 0, 0]);
assert.deepEqual(floor.object.scale.toArray(), [1, 1, 1]);
assert.equal(sectors.length, 5);
sectors.forEach((sector, index) => {
  assert.equal(sector.name, `VrProgressFloorSector:${String(index + 1).padStart(2, '0')}`);
  assert.ok(Math.abs(sector.rotation.y - index * Math.PI * 2 / 5) < 1e-12);
  assert.deepEqual(sector.position.toArray(), [0, 0, 0]);
  for (let order = 1; order <= 3; order += 1) assert.ok(panelMaterial(sector, order));
  meshMaterials(sector.getObjectByName('VR_PROGRESS_SECTOR_FIRE_BASE')).forEach((material) => {
    assert.equal(material.transparent, true);
    assert.equal(material.opacity, 0);
    assert.equal(material.depthWrite, false);
  });
  for (let order = 1; order <= 3; order += 1) {
    const material = panelMaterial(sector, order);
    assert.equal(material.opacity, 1, 'progress panels remain visible');
    assert.equal(material.depthWrite, true, 'progress panels retain depth writing');
  }
  const ornamentMaterial = sector.getObjectByName('Ornament').material;
  assert.equal(ornamentMaterial.opacity, 1, 'ornament remains visible');
  assert.equal(ornamentMaterial.depthWrite, true, 'ornament retains depth writing');
});

for (let index = 0; index < sectors.length; index += 1) {
  sectors[index].traverse((object) => {
    if (!object.isMesh) return;
    assert.notEqual(object.material, sourceMaterials[source.children.findIndex(({ name }) => name === object.name)]);
  });
}
assert.notEqual(panelMaterial(sectors[0], 1), panelMaterial(sectors[1], 1));
assert.equal(source.getObjectByName('VR_PROGRESS_CARD_FIRE_01').material.emissiveIntensity, 1);
assert.notEqual(panelMaterial(sectors[0], 1).emissive.getHex(), 0, 'black panel emission receives the warm fallback');

assert.equal(floor.activateOrder(1), true);
floor.update(0.05);
sectors.forEach((sector) => {
  assert.ok(panelMaterial(sector, 1).emissiveIntensity > 0);
  assert.equal(panelMaterial(sector, 2).emissiveIntensity, 0);
  assert.equal(panelMaterial(sector, 3).emissiveIntensity, 0);
});
assert.equal(floor.activateOrder(1), false, 'activation is idempotent');
assert.deepEqual(floor.getActivatedOrders(), [1]);
assert.equal(floor.activateOrder(0), false);
assert.equal(floor.activateOrder(4), false);
assert.equal(floor.activateOrder(2), true);
floor.update(0.05);
assert.equal(floor.activateOrder(3), true);
floor.update(0.05);
assert.deepEqual(floor.getActivatedOrders(), [1, 2, 3]);
sectors.forEach((sector) => {
  for (let order = 1; order <= 3; order += 1) assert.ok(panelMaterial(sector, order).emissiveIntensity > 0);
});
const activatedCopy = floor.getActivatedOrders();
activatedCopy.length = 0;
assert.deepEqual(floor.getActivatedOrders(), [1, 2, 3]);

assert.throws(
  () => createVrProgressFloor({ parent: new THREE.Group(), sectorModel: createSectorModel({ missingPanel: 'VR_PROGRESS_CARD_FIRE_02' }) }),
  /Missing required object "VR_PROGRESS_CARD_FIRE_02" in sector 1/
);

floor.dispose();
assert.equal(floor.object.parent, null);
console.log('VR progress floor assertions passed');
