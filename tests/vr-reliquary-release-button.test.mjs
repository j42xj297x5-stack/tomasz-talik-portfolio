import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.js';
import { ASSET_STAGES, getPreloadAssets } from '../src/assets/assetManifest.js';
import { createVrReliquaryReleaseButton } from '../src/xr/createVrReliquaryReleaseButton.js';

const asset = getPreloadAssets([ASSET_STAGES.DEFERRED_WARM]).find(({ id }) => id === 'vr-crystal-reliquary-button-release-model');
assert.deepEqual({ label: asset.label, path: asset.path, type: asset.type }, {
  label: 'VR crystal reliquary release button', path: '/glb/portal_crystal_reliquary_button_release.glb', type: 'model'
});
const runtime = await readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8');
assert.match(runtime, /getGltf\('vr-crystal-reliquary-button-release-model'\)/);
assert.match(runtime, /cloneGltfScene\('vr-crystal-reliquary-button-release-model'\)/);
assert.match(runtime, /animations: releaseButtonGltf\?\.animations \?\? \[\]/);

const model = new THREE.Group();
const root = new THREE.Group(); root.name = 'RELIQUARY_RELEASE_BUTTON_ROOT';
const trigger = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); trigger.name = 'RELIQUARY_RELEASE_TRIGGER_SURFACE';
trigger.userData = { reliquary_role: 'crystal_release_trigger', reliquary_button_id: 'release',
  reliquary_action: 'release_active_crystal', reliquary_emission_inactive: 0, reliquary_emission_hover: 1, reliquary_emission_pressed: 5 };
const front = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ emissive: 0xffffff }));
front.name = 'RELIQUARY_RELEASE_BUTTON_FRONT'; root.add(front, trigger); model.add(root);
const clip = new THREE.AnimationClip('Relic_Reliquary_ReleaseButton_Press', 0.2, []);
const controller = new THREE.Group(); const record = { controller, currentRayLength: 3 };
let available = false; let releases = 0; let completed = 0;
const button = createVrReliquaryReleaseButton({ buttonModel: model, animations: [clip],
  reliquary: { object: { visible: true } }, controllers: [record], settings: { enabled: true, rayMaxDistance: 3, releaseDelaySeconds: 1 },
  canRelease: () => available, onRelease: () => { releases += 1; return true; }, onReleaseComplete: () => { completed += 1; } });
assert.equal(trigger.visible, true);
assert.equal(trigger.material.opacity, 0); assert.equal(trigger.material.colorWrite, false);
assert.equal(front.material.emissiveIntensity, 0);
button.hits.set(record, true); assert.equal(button.press(record), false, 'empty reliquary cannot release');
available = true; button.hits.set(record, true); assert.equal(button.press(record), true);
assert.equal(button.state, 'releasing'); assert.equal(front.material.emissiveIntensity, 5); assert.equal(button.action.isRunning(), true);
assert.equal(button.press(record), false, 'repeat presses are locked');
button.update(0.99); assert.equal(releases, 0);
button.update(0.02); assert.equal(releases, 1); assert.equal(completed, 1);
assert.equal(button.state, 'idle'); assert.equal(front.material.emissiveIntensity, 0);
button.reset(); button.reset(); assert.equal(button.state, 'idle');
button.dispose();
console.log('VR reliquary release-button assertions passed');
