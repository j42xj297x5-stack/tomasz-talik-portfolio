import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS } from '../src/config/experienceVrSettings.js';
import { createVrPortalDisplay } from '../src/xr/createVrPortalDisplay.js';
import { createVrAstroFurnace } from '../src/xr/furnace/createVrAstroFurnace.js';
import { createVrCrystalReliquary } from '../src/xr/createVrCrystalReliquary.js';

const EPSILON = 1e-6;
const assertVector = (actual, expected, message) => assert.ok(actual.distanceTo(expected) < EPSILON, message);

const world = new THREE.Scene();
const floor = new THREE.Group(); floor.name = 'VrTiltableFloorRoot'; world.add(floor);
const monkeyMotionRoot = new THREE.Group(); monkeyMotionRoot.name = 'VrMonkeyMotionRoot'; floor.add(monkeyMotionRoot);
const guide = new THREE.Group(); guide.name = 'VrMonkeyGuide'; guide.position.set(0, 2, 0); monkeyMotionRoot.add(guide);
const fixtures = new THREE.Group(); fixtures.name = 'VrPlatformFixturesRoot'; floor.add(fixtures);

const portalModel = new THREE.Group(); portalModel.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.2)));
const portal = createVrPortalDisplay({ parent: fixtures, portalModel, settings: DEFAULT_EXPERIENCE_VR_SETTINGS.portal });
portal.place();
const furnaceModel = new THREE.Group(); furnaceModel.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)));
const furnace = createVrAstroFurnace({ parent: fixtures, model: furnaceModel, settings: {
  ...DEFAULT_EXPERIENCE_VR_SETTINGS.furnace, content: { enabled: false }, scale: 1
} });
const reliquaryModel = new THREE.Group(); reliquaryModel.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5)));
const reliquary = createVrCrystalReliquary({
  parent: fixtures, portalAnchor: portal.object, reliquaryModel,
  settings: { ...DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary, heightOffset: 0 }
});
const activateRoot = new THREE.Group(); const releaseRoot = new THREE.Group();
reliquary.attachCompanion({ id: 'activate', model: activateRoot,
  settings: DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary.buttons, side: 'left' });
reliquary.attachCompanion({ id: 'release', model: releaseRoot,
  settings: DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary.buttons, side: 'right' });
world.updateMatrixWorld(true);

const portalPosition = portal.object.getWorldPosition(new THREE.Vector3());
const furnacePosition = furnace.object.getWorldPosition(new THREE.Vector3());
assertVector(portalPosition, new THREE.Vector3(-2.910428, 0, -0.727607), 'portal uses its canonical position');
assertVector(furnacePosition, new THREE.Vector3(2.910428, 0, -0.727607), 'furnace uses its canonical position');
assert.ok(Math.abs(portalPosition.length() - 3) < EPSILON, 'portal is 3 m from Monkey');
assert.ok(Math.abs(furnacePosition.length() - 3) < EPSILON, 'furnace is 3 m from Monkey');
assertVector(furnacePosition, portalPosition.clone().setX(-portalPosition.x), 'furnace mirrors portal across X=0');

const portalForward = new THREE.Vector3(0, 0, 1)
  .applyQuaternion(portal.object.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
const reliquaryPosition = reliquary.object.getWorldPosition(new THREE.Vector3());
assertVector(reliquaryPosition, portalPosition.clone().addScaledVector(portalForward, 1.5),
  'reliquary is 1.5 m along portal forward');
assert.ok(reliquaryPosition.distanceTo(new THREE.Vector3(-2.769004, 0, 0.765712)) < 2e-6,
  'reliquary control position matches the rounded validation value');

const activatePosition = activateRoot.getWorldPosition(new THREE.Vector3());
const releasePosition = releaseRoot.getWorldPosition(new THREE.Vector3());
const buttonCenter = activatePosition.clone().add(releasePosition).multiplyScalar(0.5);
const reliquaryPositionBeforeMove = reliquaryPosition.clone();
assertVector(buttonCenter, reliquaryPosition.clone().addScaledVector(reliquary.portalForward, 1),
  'button center is 1 m along reliquary forward');
assert.ok(Math.abs(activatePosition.clone().sub(buttonCenter).dot(reliquary.portalLeft) - 0.5) < EPSILON);
assert.ok(Math.abs(releasePosition.clone().sub(buttonCenter).dot(reliquary.portalLeft) + 0.5) < EPSILON);

portal.object.position.add(new THREE.Vector3(0.75, 0, -0.25));
portal.object.rotation.y += 0.2;
reliquary.place(); world.updateMatrixWorld(true);
const movedPortalPosition = portal.object.getWorldPosition(new THREE.Vector3());
const movedPortalForward = new THREE.Vector3(0, 0, 1)
  .applyQuaternion(portal.object.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
assertVector(reliquary.object.getWorldPosition(new THREE.Vector3()),
  movedPortalPosition.clone().addScaledVector(movedPortalForward, 1.5),
  'reliquary follows portal translation and rotation');
assert.ok(reliquary.object.getWorldPosition(new THREE.Vector3()).distanceTo(reliquaryPositionBeforeMove) > 0.1);

const tracked = [portal.object, furnace.object, reliquary.object, activateRoot, releaseRoot, floor];
const beforeMonkeyMove = tracked.map((object) => object.getWorldPosition(new THREE.Vector3()));
const guideBefore = guide.getWorldPosition(new THREE.Vector3());
monkeyMotionRoot.position.x += 10; monkeyMotionRoot.position.z += 4;
world.updateMatrixWorld(true);
tracked.forEach((object, index) => assertVector(object.getWorldPosition(new THREE.Vector3()), beforeMonkeyMove[index]));
assertVector(guide.getWorldPosition(new THREE.Vector3()), guideBefore.clone().add(new THREE.Vector3(10, 0, 4)));

console.log('VR platform spatial contract assertions passed');
