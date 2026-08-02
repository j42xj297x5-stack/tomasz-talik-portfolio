import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrShellSystem } from '../src/xr/shells/createVrShellSystem.js';
import { createVrShellAttractorInteraction } from '../src/xr/shells/createVrShellAttractorInteraction.js';
import { VR_ATTRACTOR_STATES } from '../src/xr/tools/createVrAttractorTool.js';
import { createVrHandModeController } from '../src/xr/input/createVrHandModeController.js';

{
  const ray = new THREE.Group();
  const handRecord = { handedness: 'right', controller: new THREE.Group(), ray, isConnected: true };
  let toggleRightTool = false;
  const handModes = createVrHandModeController({ controllers: [handRecord],
    semanticInput: { update: () => ({ toggleRightTool, primaryAction: 0 }), reset() {} }, isUnlocked: () => true,
    attractorTool: { setUnlocked() {}, attachToTargetRay() {}, setTrigger() {}, update() {}, setEquipped() {}, reset() {}, dispose() {} } });
  handModes.update(0); assert.equal(ray.visible, true);
  toggleRightTool = true; handModes.update(0); assert.equal(ray.visible, false, 'Astro hides the right visible ray');
  toggleRightTool = false; handModes.update(0); toggleRightTool = true; handModes.update(0);
  assert.equal(ray.visible, true, 'returning to normal hand restores the connected ray');
  handModes.dispose();
}

const parent = new THREE.Group();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial();
const assetManager = { cloneGltfScene() { const root = new THREE.Group(); root.add(new THREE.Mesh(geometry, material)); return root; } };
const shellSystem = createVrShellSystem({ parent, assetManager, baseRadius: 10 });
shellSystem.setActive(true);
const controller = new THREE.Group(); controller.position.set(0, 0, 0); parent.add(controller);
const record = { handedness: 'right', controller, isConnected: true, ray: new THREE.Group(), currentRayLength: 2.3 };
let primaryAction = 0, mode = 'ASTRO_ATTRACTOR', higherPriority = false;
const calls = { states: [], targets: [], strengths: [] };
const tool = { setState(v) { calls.states.push(v); }, setTarget(v) { calls.targets.push(v); }, setPullStrength(v) { calls.strengths.push(v); } };
const interaction = createVrShellAttractorInteraction({ controllers: [record], shellSystem,
  handModeController: { getMode: () => mode }, semanticInput: { getState: () => ({ primaryAction }) }, attractorTool: tool,
  settings: { targetDistanceRadiusMultiplier: 3, triggerThreshold: 0.1, captureDistance: 0.8,
    pullAcceleration: 10, maxPullSpeed: 8.5, captureRadius: 0.28, returnDuration: 0.8 },
  haloSettings: {}, isHigherPriorityInteractionActive: () => higherPriority });
assert.equal(interaction.maxTargetDistance, 30);
const shell = shellSystem.instances[0]; shell.position.set(0, 0, -12); parent.updateMatrixWorld(true);
interaction.update(0.016);
assert.equal(interaction.target, shell, 'nearest valid shell on controller local -Z is targeted');
assert.equal(shell.userData.shellState, 'targeted');
assert.ok(shell.getObjectByName('VrTargetHalo:mesh')?.visible, 'the reused halo is visible');
higherPriority = true; interaction.update(0.016);
assert.equal(interaction.target, null); assert.equal(shell.userData.shellState, 'orbiting');
higherPriority = false; interaction.update(0.016); primaryAction = 1; interaction.update(0.016);
assert.equal(shell.userData.shellState, 'pulling');
const before = shell.getWorldPosition(new THREE.Vector3()).distanceTo(interaction.captureAnchor.getWorldPosition(new THREE.Vector3()));
interaction.update(0.1);
const after = shell.getWorldPosition(new THREE.Vector3()).distanceTo(interaction.captureAnchor.getWorldPosition(new THREE.Vector3()));
assert.ok(after < before && after > 0.28, 'pull advances smoothly without teleporting');
const locked = interaction.activePull;
shellSystem.instances[1].position.set(0, 0, -2); parent.updateMatrixWorld(true); interaction.update(0.1);
assert.equal(interaction.activePull, locked, 'active pull cannot switch targets');
shell.position.copy(interaction.captureAnchor.getWorldPosition(new THREE.Vector3())); parent.worldToLocal(shell.position); interaction.update(0.016);
assert.equal(shell.userData.shellState, 'held'); assert.equal(calls.states.at(-1), VR_ATTRACTOR_STATES.CAPTURED);
primaryAction = 0; interaction.update(0.016); assert.equal(shell.userData.shellState, 'orbiting');
const returnStart = shell.position.clone(); shellSystem.update(0.4); assert.notDeepEqual(shell.position.toArray(), returnStart.toArray());
shellSystem.update(0.4); assert.equal(shell.userData.shellState, 'orbiting');
mode = 'NORMAL_HAND'; interaction.update(0.016); assert.equal(interaction.target, null);
interaction.reset(); interaction.dispose();
assert.equal(shell.getObjectByName('VrTargetHalo:mesh'), undefined, 'dispose removes halo meshes');
shellSystem.dispose(); geometry.dispose(); material.dispose();
console.log('VR shell attractor interaction assertions passed');
