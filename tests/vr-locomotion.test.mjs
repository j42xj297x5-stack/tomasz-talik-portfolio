import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { applyDeadzone, createVrLocomotion } from '../src/xr/createVrLocomotion.js';

assert.equal(applyDeadzone(0.1, 0.2), 0);
assert.equal(applyDeadzone(-0.2, 0.2), 0);
assert.ok(applyDeadzone(0.6, 0.2) > 0);

const rig = new THREE.Group(); rig.position.set(1, 2.5, 3);
const camera = new THREE.PerspectiveCamera(); rig.add(camera); rig.updateMatrixWorld(true);
const sources = [
  { handedness: 'left', gamepad: { axes: [0, 0, 0.5, 0] } },
  { handedness: 'right', gamepad: { axes: [0, 0, 0.5, -1] } }
];
const renderer = { xr: { getSession: () => ({ inputSources: sources }), getCamera: () => camera } };
const locomotion = createVrLocomotion({ playerRig: rig, renderer, camera, settings: { enabled: true, deadzone: 0.2, moveSpeed: 2, turnSpeed: 1 } });
locomotion.update(1);
assert.equal(rig.position.y, 2.5);
assert.notEqual(rig.position.x, 1);
assert.ok(rig.position.z < 3);
assert.ok(rig.rotation.y < 0);
assert.deepEqual(camera.position.toArray(), [0, 0, 0]);
locomotion.dispose();
const position = rig.position.clone(); locomotion.update(1);
assert.deepEqual(rig.position.toArray(), position.toArray());
console.log('VR locomotion assertions passed');
