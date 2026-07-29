import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculateVrEntryTarget, createVrEntryTransition, smoothstep } from '../src/xr/createVrEntryTransition.js';

function fixture({ enabled = true } = {}) {
  const scene = new THREE.Scene();
  const playerRig = new THREE.Group();
  const camera = new THREE.PerspectiveCamera();
  playerRig.position.set(4, 7, 6);
  camera.position.set(0.5, 1.7, -0.25);
  playerRig.add(camera);
  scene.add(playerRig);
  scene.updateMatrixWorld(true);
  let completions = 0;
  const transition = createVrEntryTransition({
    playerRig,
    renderer: { xr: { getCamera: (baseCamera) => baseCamera } },
    camera,
    settings: { enabled, durationSeconds: 2, target: { x: 0, z: 1.8 }, easing: 'smoothstep' },
    onComplete: () => { completions += 1; }
  });
  return { playerRig, camera, transition, get completions() { return completions; } };
}

assert.equal(smoothstep(0), 0);
assert.equal(smoothstep(0.5), 0.5);
assert.equal(smoothstep(1), 1);
assert.ok(smoothstep(0.25) < 0.25);
assert.ok(smoothstep(0.75) > 0.75);

const moving = fixture();
assert.equal(moving.transition.start(), true);
assert.equal(moving.transition.start(), false);
assert.equal(moving.transition.state, 'moving');
moving.transition.update(0.5);
assert.equal(moving.playerRig.position.y, 7);
assert.equal(moving.playerRig.position.x, 4 + (0 - 4.5) * smoothstep(0.25));
assert.equal(moving.playerRig.position.z, 6 + (1.8 - 5.75) * smoothstep(0.25));
moving.transition.update(1.5);
assert.equal(moving.transition.state, 'arrived');
assert.equal(moving.playerRig.position.x, -0.5);
assert.equal(moving.playerRig.position.z, 2.05);
assert.equal(moving.playerRig.position.y, 7);
assert.equal(moving.completions, 1);
moving.transition.update(10);
assert.equal(moving.transition.start(), false);
assert.equal(moving.completions, 1);

moving.transition.reset();
assert.equal(moving.transition.state, 'idle');
moving.playerRig.position.set(4, 7, 6);
moving.playerRig.parent.updateMatrixWorld(true);
assert.equal(moving.transition.start(), true);
moving.transition.reset();
moving.transition.update(10);
assert.equal(moving.transition.state, 'idle');
assert.equal(moving.completions, 1);

const immediate = fixture({ enabled: false });
assert.equal(immediate.transition.start(), true);
assert.equal(immediate.transition.state, 'arrived');
assert.equal(immediate.playerRig.position.x, -0.5);
assert.equal(immediate.playerRig.position.z, 2.05);
assert.equal(immediate.playerRig.position.y, 7);
assert.equal(immediate.completions, 1);
immediate.transition.dispose();
immediate.transition.dispose();
assert.equal(immediate.transition.start(), false);

console.log('VR entry transition assertions passed');

const target = calculateVrEntryTarget({ ringCenter: { x: 0, z: 0 }, spawnPosition: { x: 0, z: 8.6 }, effectiveRingRadius: 7.6, targetRadiusFactor: 0.76 });
assert.deepEqual(target, { x: 0, z: 5.776 });
assert.ok(Math.abs(Math.hypot(target.x, target.z) - 5.8) < 0.03);
