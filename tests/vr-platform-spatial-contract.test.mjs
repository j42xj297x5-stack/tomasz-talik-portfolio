import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrPortalDisplay } from '../src/xr/createVrPortalDisplay.js';
import { createVrAstroFurnace } from '../src/xr/furnace/createVrAstroFurnace.js';
import { createVrCrystalReliquary } from '../src/xr/createVrCrystalReliquary.js';

const world = new THREE.Scene();
const floor = new THREE.Group(); floor.name = 'VrTiltableFloorRoot'; world.add(floor);
const monkeyMotionRoot = new THREE.Group(); monkeyMotionRoot.name = 'VrMonkeyMotionRoot'; floor.add(monkeyMotionRoot);
const guide = new THREE.Group(); guide.name = 'VrMonkeyGuide'; guide.position.set(0, 2, 0); monkeyMotionRoot.add(guide);
const fixtures = new THREE.Group(); fixtures.name = 'VrPlatformFixturesRoot'; floor.add(fixtures);

const portalModel = new THREE.Group(); portalModel.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.2)));
const portal = createVrPortalDisplay({ parent: fixtures, portalModel,
  settings: { enabled: true, position: { x: 2, y: 0, z: 0.5 }, maxWidth: 2, maxHeight: 2, floorOffset: 0 } });
portal.place();
const furnaceModel = new THREE.Group(); furnaceModel.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)));
const furnace = createVrAstroFurnace({ parent: fixtures, model: furnaceModel, settings: {
  enabled: true, position: { x: -2, y: 0, z: 0.5 }, floorOffset: 0, scale: 1,
  rotationDegrees: { x: 0, y: 0, z: 0 }, content: { enabled: false }, debug: false
} });
const reliquaryModel = new THREE.Group(); reliquaryModel.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5)));
const reliquary = createVrCrystalReliquary({ parent: fixtures, reliquaryModel, settings: { enabled: true, distanceFromPortal: 1, heightOffset: 0,
    insertFeedback: { proximityRadiusMultiplier: 1, opacity: 0.2, rejectDuration: 0.2, rejectDistance: 0.1 } } });
const activateRoot = new THREE.Group(); const releaseRoot = new THREE.Group();
reliquary.attachCompanion({ id: 'activate', model: activateRoot,
  settings: { scale: 1, forwardDistance: 1, lateralOffset: 0.5, verticalOffset: 0 }, side: 'left' });
reliquary.attachCompanion({ id: 'release', model: releaseRoot,
  settings: { scale: 1, forwardDistance: 1, lateralOffset: 0.5, verticalOffset: 0 }, side: 'right' });
fixtures.attach(portal.object); fixtures.attach(furnace.object); fixtures.attach(reliquary.object);
world.updateMatrixWorld(true);

const tracked = [portal.object, furnace.object, reliquary.object, activateRoot, releaseRoot, floor];
const before = tracked.map((object) => object.getWorldPosition(new THREE.Vector3()));
const guideBefore = guide.getWorldPosition(new THREE.Vector3());
const crystalCenterBefore = floor.getWorldPosition(new THREE.Vector3());
monkeyMotionRoot.position.x += 10; monkeyMotionRoot.position.z += 4;
world.updateMatrixWorld(true);
tracked.forEach((object, index) => assert.ok(object.getWorldPosition(new THREE.Vector3()).distanceTo(before[index]) < 1e-10));
assert.ok(guide.getWorldPosition(new THREE.Vector3()).distanceTo(guideBefore.clone().add(new THREE.Vector3(10, 0, 4))) < 1e-10);
assert.ok(floor.getWorldPosition(new THREE.Vector3()).distanceTo(crystalCenterBefore) < 1e-10);

portal.place(); furnace.place(); reliquary.place(); world.updateMatrixWorld(true);
assert.ok(portal.object.getWorldPosition(new THREE.Vector3()).distanceTo(before[0]) < 1e-10);
assert.ok(furnace.object.getWorldPosition(new THREE.Vector3()).distanceTo(before[1]) < 1e-10);
console.log('VR platform spatial independence assertions passed');
