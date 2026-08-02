import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrShellSystem } from '../src/xr/shells/createVrShellSystem.js';
import { createVrShellAttractorInteraction, selectConeTarget } from '../src/xr/shells/createVrShellAttractorInteraction.js';
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
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const authoredMaterial = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.4 });
authoredMaterial.emissiveMap = new THREE.Texture();
const assetManager = { cloneGltfScene() { const root = new THREE.Group(); root.add(new THREE.Mesh(geometry, authoredMaterial)); return root; } };
const shellSettings = { targetDistanceRadiusMultiplier: 3, scanThreshold: 0.1, triggerThreshold: 0.1,
  handCaptureRadius: 0.32, captureDistance: 0.8, pullAcceleration: 10, maxPullSpeed: 8.5,
  captureRadius: 0.28, returnDuration: 0.8, claimedEmissionMin: 1, claimedEmissionMax: 2,
  claimedEmissionPulseDuration: 1.4, scanCone: { color: 0x78ff9c, halfAngleDegrees: 2.5,
    opacityMin: 0.035, opacityMax: 0.065, pulseDuration: 1.6, radialSegments: 14 } };
const shellSystem = createVrShellSystem({ parent, assetManager, baseRadius: 10, emissionSettings: shellSettings });
shellSystem.setActive(true);
const rightController = new THREE.Group(), leftController = new THREE.Group(); parent.add(rightController, leftController);
const right = { handedness: 'right', controller: rightController, holdSocket: new THREE.Group(), isConnected: true };
const left = { handedness: 'left', controller: leftController, holdSocket: new THREE.Group(), isConnected: true };
rightController.add(right.holdSocket); leftController.add(left.holdSocket);
let primaryAction = 0, grabAction = 0, mode = 'ASTRO_ATTRACTOR', higherPriority = false;
const calls = { states: [], targets: [], strengths: [] };
const tool = { setState(v) { calls.states.push(v); }, setTarget(v) { calls.targets.push(v); }, setPullStrength(v) { calls.strengths.push(v); } };
const interaction = createVrShellAttractorInteraction({ controllers: [right, left], shellSystem,
  handModeController: { getMode: () => mode }, semanticInput: { getState: () => ({ primaryAction, grabAction }) }, attractorTool: tool,
  settings: shellSettings, haloSettings: {}, settledParent: parent, isHigherPriorityInteractionActive: () => higherPriority });
assert.equal(interaction.maxTargetDistance, 30);
assert.equal(interaction.scanCone.length, 30); assert.equal(interaction.halfAngleRadians, THREE.MathUtils.degToRad(2.5));
assert.ok(interaction.scanCone.object.geometry === interaction.scanCone.geometry, 'pulse reuses one cone geometry');
const conePositions = interaction.scanCone.geometry.attributes.position;
let minConeZ = Infinity, maxConeZ = -Infinity;
for (let index = 0; index < conePositions.count; index += 1) { minConeZ = Math.min(minConeZ, conePositions.getZ(index)); maxConeZ = Math.max(maxConeZ, conePositions.getZ(index)); }
assert.ok(Math.abs(maxConeZ) < 1e-6 && Math.abs(minConeZ + 30) < 1e-6, 'cone apex is at origin and length follows local -Z');
const shell = shellSystem.instances[0]; shell.position.set(0, 0, -12); parent.updateMatrixWorld(true);
interaction.update(0.016); assert.equal(interaction.scanCone.object.visible, false); assert.equal(interaction.target, null);
primaryAction = 1; interaction.update(0.016); assert.equal(interaction.activePull, null, 'trigger alone cannot pull');
primaryAction = 0; grabAction = 1; interaction.update(0.016);
assert.equal(interaction.scanCone.object.visible, true); assert.equal(interaction.target, shell);
assert.ok(shell.getObjectByName('VrTargetHalo:mesh')?.visible, 'existing halo is visible while scanning a target');
grabAction = 0; interaction.update(0.016); assert.equal(interaction.target, null); assert.equal(shell.getObjectByName('VrTargetHalo:mesh')?.visible, false);
grabAction = 1; interaction.update(0.016); primaryAction = 1; interaction.update(0.016);
assert.equal(shell.userData.shellState, 'pulling'); assert.equal(shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity, 0);
interaction.update(0.2); assert.ok(shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity > 0);
shell.position.copy(interaction.captureAnchor.getWorldPosition(new THREE.Vector3())); parent.worldToLocal(shell.position); parent.updateMatrixWorld(true);
interaction.update(0.016); assert.equal(shell.userData.shellState, 'capture_ready'); assert.equal(interaction.heldShell, null);
assert.equal(shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity, 1);
leftController.position.copy(shell.getWorldPosition(new THREE.Vector3())); parent.worldToLocal(leftController.position); parent.updateMatrixWorld(true);
assert.equal(interaction.isCaptureReadyInHandRange(), true);
leftController.dispatchEvent({ type: 'squeezestart' }); assert.equal(shell.userData.shellState, 'held'); assert.equal(shell.parent, left.holdSocket);
primaryAction = 0; interaction.update(0.016); assert.equal(shell.userData.shellState, 'held', 'right release cannot return a claimed shell');
shellSystem.update(0.35); const pulseA = shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity;
shellSystem.update(0.35); const pulseB = shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity;
assert.ok(pulseA >= 1 && pulseA <= 2 && pulseB >= 1 && pulseB <= 2 && pulseA !== pulseB);
leftController.dispatchEvent({ type: 'squeezeend' }); assert.equal(shell.userData.shellState, 'placed'); assert.equal(shell.parent, parent);
assert.equal(shell.userData.attractorTarget, false);
const materialOne = shellSystem.getRecord(shellSystem.instances[0]).emissiveMaterials[0];
const materialTwo = shellSystem.getRecord(shellSystem.instances[1]).emissiveMaterials[0];
assert.notEqual(materialOne, materialTwo); assert.equal(materialOne.emissiveMap, authoredMaterial.emissiveMap);
materialOne.emissiveIntensity = 7; assert.notEqual(materialTwo.emissiveIntensity, 7);

const candidates = (entries) => entries.map(({ position, radius = 0, shell: candidateShell = {} }) => ({ shell: candidateShell, radius,
  getWorldCenter: (out) => out.copy(position) }));
const cone = { origin: new THREE.Vector3(), direction: new THREE.Vector3(0, 0, -1), maxDistance: 10,
  halfAngleRadians: THREE.MathUtils.degToRad(5) };
assert.ok(selectConeTarget({ ...cone, candidates: candidates([{ position: new THREE.Vector3(0, 0, -5) }]) }));
assert.ok(selectConeTarget({ ...cone, candidates: candidates([{ position: new THREE.Vector3(Math.tan(cone.halfAngleRadians) * 5, 0, -5) }]) }));
assert.equal(selectConeTarget({ ...cone, candidates: candidates([{ position: new THREE.Vector3(Math.tan(cone.halfAngleRadians) * 5 + 0.01, 0, -5) }]) }), null);
assert.equal(selectConeTarget({ ...cone, candidates: candidates([{ position: new THREE.Vector3(0, 0, 1) }]) }), null);
assert.equal(selectConeTarget({ ...cone, candidates: candidates([{ position: new THREE.Vector3(0, 0, -11) }]) }), null);
const central = {}, offAxis = {};
assert.equal(selectConeTarget({ ...cone, candidates: candidates([{ shell: offAxis, position: new THREE.Vector3(0.1, 0, -3) },
  { shell: central, position: new THREE.Vector3(0, 0, -7) }]) }).shell, central, 'axis score wins deterministically');
interaction.reset(); interaction.dispose(); assert.equal(shell.getObjectByName('VrTargetHalo:mesh'), undefined);
shellSystem.dispose(); geometry.dispose(); authoredMaterial.emissiveMap.dispose(); authoredMaterial.dispose();
console.log('VR shell attractor interaction assertions passed');
