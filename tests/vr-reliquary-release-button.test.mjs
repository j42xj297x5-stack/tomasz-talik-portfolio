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

function parseGlbJson(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'glTF', 'invalid GLB magic');
  const chunkLength = buffer.readUInt32LE(12);
  assert.equal(buffer.toString('ascii', 16, 20), 'JSON', 'first GLB chunk must be JSON');
  return JSON.parse(buffer.toString('utf8', 20, 20 + chunkLength));
}
const glb = parseGlbJson(await readFile(new URL('../public/glb/portal_crystal_reliquary_button_release.glb', import.meta.url)));
const nodeNames = glb.nodes?.map(({ name }) => name).filter(Boolean) ?? [];
const extras = glb.nodes?.map(({ extras }) => extras).filter(Boolean) ?? [];
const animationNames = glb.animations?.map(({ name }) => name).filter(Boolean) ?? [];
assert.ok(nodeNames.includes('RELIQUARY_RELEASE_TRIGGER_SURFACE')
  || extras.some((data) => data.reliquary_role === 'crystal_release_trigger' || data.reliquary_runtime_raycast === true),
`release trigger contract missing; nodes=${nodeNames.join(', ')}; animations=${animationNames.join(', ')}`);
assert.ok(extras.some((data) => data.reliquary_press_animation === 'Relic_Reliquary_ReleaseButton_Press'),
`release animation contract missing; nodes=${nodeNames.join(', ')}; animations=${animationNames.join(', ')}`);

const model = new THREE.Group();
const root = new THREE.Group(); root.name = 'RELIQUARY_RELEASE_BUTTON_ROOT';
const trigger = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); trigger.name = 'RELIQUARY_RELEASE_TRIGGER_SURFACE';
trigger.userData = { reliquary_role: 'crystal_release_trigger', reliquary_button_id: 'release',
  reliquary_action: 'release_active_crystal', reliquary_emission_inactive: 0, reliquary_emission_hover: 1, reliquary_emission_pressed: 5 };
const front = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ emissive: 0xffffff }));
front.name = 'RELIQUARY_RELEASE_BUTTON_FRONT'; root.add(front, trigger); model.add(root);
const clip = new THREE.AnimationClip('Relic_Reliquary_ReleaseButton_Press', 0.2, []);
const controller = new THREE.Group(); const record = { controller, currentRayLength: 3 };
let crystalState = 'inserted'; let releases = 0; let completed = 0;
const button = createVrReliquaryReleaseButton({ buttonModel: model, animations: [clip],
  reliquary: { object: { visible: true } }, controllers: [record], settings: { enabled: true, rayMaxDistance: 3, releaseDelaySeconds: 1 },
  canRelease: () => crystalState === 'active', onRelease: () => { releases += 1; crystalState = 'released'; return true; },
  onReleaseComplete: () => { completed += 1; } });
assert.equal(trigger.visible, true);
assert.equal(trigger.material.opacity, 0); assert.equal(trigger.material.colorWrite, false);
assert.equal(button.raycastTarget.name, 'VrReliquaryReleaseButtonHitArea');
assert.equal(button.raycastTarget.visible, true); assert.equal(button.raycastTarget.frustumCulled, false);
assert.equal(front.material.emissiveIntensity, 0);
button.hits.set(record, true); assert.equal(button.press(record), false, 'inserted crystal cannot release before Activate');
const targetPosition = button.raycastTarget.getWorldPosition(new THREE.Vector3());
controller.position.copy(targetPosition).add(new THREE.Vector3(0, 0, 2));
controller.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), targetPosition.clone().sub(controller.position).normalize());
model.updateWorldMatrix(true, true);
button.update(0);
assert.equal(button.hovered, false, 'inserted crystal has no Release hover');
assert.equal(front.material.emissiveIntensity, 0, 'inserted crystal has no Release emission');
assert.equal(crystalState, 'inserted', 'blocked press leaves the crystal inserted');
crystalState = 'active';
button.update(0);
assert.equal(button.hovered, true, 'a real controller ray intersects the runtime proxy');
assert.equal(front.material.emissiveIntensity, 1);
controller.dispatchEvent({ type: 'selectstart' });
assert.equal(button.state, 'releasing'); assert.equal(front.material.emissiveIntensity, 5); assert.equal(button.action.isRunning(), true);
assert.equal(button.press(record), false, 'repeat presses are locked');
button.update(0.99); assert.equal(releases, 0);
button.update(0.02); assert.equal(releases, 1); assert.equal(completed, 1);
assert.equal(crystalState, 'released', 'active crystal follows the existing release flow');
assert.equal(button.state, 'idle'); assert.equal(front.material.emissiveIntensity, 0);
button.reset(); button.reset(); assert.equal(button.state, 'idle');
button.dispose();
console.log('VR reliquary release-button assertions passed');
