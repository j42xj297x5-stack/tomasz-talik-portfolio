import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculatePlayerRigYaw } from '../src/xr/playerRigOrientation.js';

const [main, vr, experience3d] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experience3d.js', import.meta.url), 'utf8')
]);

assert.match(main, /await import\('\.\/experienceVr\.js'\)/);
assert.doesNotMatch(main, /^import .*experienceVr/m);
assert.match(vr, /renderer\.xr\.enabled = true/);
assert.match(vr, /requestSession\('immersive-vr'/);
assert.match(vr, /renderer\.setAnimationLoop\(renderFrame\)/);
assert.match(vr, /renderer\.setAnimationLoop\(null\)/);
assert.doesNotMatch(vr, /requestAnimationFrame/);
assert.doesNotMatch(vr, /cameraRig|createOverlay|createBackgroundAtmosphere|createGalaxySpritesLayer/);
assert.doesNotMatch(experience3d, /renderer\.xr|VRButton|immersive-vr|setAnimationLoop/);

const forwardFromYaw = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
const assertFacesTarget = (position, lookAt) => {
  const yaw = calculatePlayerRigYaw(position, lookAt);
  const forward = forwardFromYaw(yaw);
  const targetLength = Math.hypot(lookAt.x - position.x, lookAt.z - position.z);
  assert.ok(targetLength > 0);
  assert.ok(Math.abs(forward.x - (lookAt.x - position.x) / targetLength) < 1e-12);
  assert.ok(Math.abs(forward.z - (lookAt.z - position.z) / targetLength) < 1e-12);
};

assertFacesTarget({ x: 0, y: 0, z: 6 }, { x: 0, y: 1, z: 0 });
assertFacesTarget({ x: -4, y: 2, z: 3 }, { x: 2, y: -5, z: -1 });
assert.equal(calculatePlayerRigYaw({ x: 1, y: 0, z: 1 }, { x: 1, y: 9, z: 1 }), 0);
assert.match(vr, /orientPlayerRig\(playerRig, settings\.spawn\.lookAt\)/);
assert.doesNotMatch(vr, /camera\.rotation|camera\.quaternion|camera\.lookAt/);

console.log('Experience VR static contract assertions passed');
