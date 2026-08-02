import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrShellSystem } from '../src/xr/shells/createVrShellSystem.js';
import { calculateShellCapturePosition, createVrShellAttractorInteraction, selectConeTarget } from '../src/xr/shells/createVrShellAttractorInteraction.js';
import { VR_ATTRACTOR_STATES } from '../src/xr/tools/createVrAttractorTool.js';
import { createVrHandModeController } from '../src/xr/input/createVrHandModeController.js';

{
  const ray = new THREE.Group();
  const handRecord = { handedness: 'right', controller: new THREE.Group(), ray, isConnected: true };
  let toggleRightTool = false;
  const astroModel = { visible: false };
  const handModes = createVrHandModeController({ controllers: [handRecord],
    semanticInput: { update: () => ({ toggleRightTool, primaryAction: 0 }), reset() {} }, isUnlocked: () => true,
    attractorTool: { setUnlocked() {}, attachToTargetRay() {}, setTrigger() {}, update() {},
      setEquipped(equipped) { astroModel.visible = equipped; }, reset() { astroModel.visible = false; }, dispose() {} } });
  handModes.update(0); assert.equal(ray.visible, true); assert.equal(astroModel.visible, false);
  toggleRightTool = true; handModes.update(0); assert.equal(ray.visible, false, 'Astro hides the right visible ray');
  assert.equal(astroModel.visible, true, 'A equips and shows Astro');
  toggleRightTool = false; handModes.update(0); toggleRightTool = true; handModes.update(0);
  assert.equal(ray.visible, true, 'returning to normal hand restores the connected ray');
  assert.equal(astroModel.visible, false, 'a second A unequips and hides Astro');
  handModes.dispose();
}

const capturePosition = calculateShellCapturePosition({ masterRingWorldPosition: new THREE.Vector3(1, 2, 3),
  controllerRayDirection: new THREE.Vector3(0, 0, -1), shellCaptureForwardDistance: 1.3 });
assert.deepEqual(capturePosition.toArray(), [1, 2, 1.7], 'capture point is offset from Master Ring, not controller origin');

const parent = new THREE.Group();
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const authoredMaterial = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.4 });
authoredMaterial.emissiveMap = new THREE.Texture();
const assetManager = { cloneGltfScene() { const root = new THREE.Group(); root.add(new THREE.Mesh(geometry, authoredMaterial)); return root; } };
const shellSettings = { targetDistanceRadiusMultiplier: 3, scanThreshold: 0.1, triggerThreshold: 0.1,
  shellCaptureForwardDistance: 1.3, pullAcceleration: 10, maxPullSpeed: 8.5,
  captureRadius: 0.28, returnDuration: 0.8, claimedEmissionMin: 1, claimedEmissionMax: 2,
  claimedEmissionPulseDuration: 1.4, scanCone: { color: 0x78ff9c, halfAngleDegrees: 2.5,
    opacityMin: 0.035, opacityMax: 0.065, pulseDuration: 1.6, radialSegments: 14 } };
const shellSystem = createVrShellSystem({ parent, assetManager, baseRadius: 10, emissionSettings: shellSettings });
shellSystem.setActive(true);
const rightController = new THREE.Group(), leftController = new THREE.Group(); parent.add(rightController, leftController);
const rightRayHits = [];
const right = { handedness: 'right', controller: rightController, holdSocket: new THREE.Group(), isConnected: true,
  currentRayLength: 2.3, reportRayHit: (distance) => rightRayHits.push(distance) };
const leftRayHits = [];
const left = { handedness: 'left', controller: leftController, holdSocket: new THREE.Group(), isConnected: true, currentRayLength: 2.3, reportRayHit: (distance) => leftRayHits.push(distance) };
rightController.add(right.holdSocket); leftController.add(left.holdSocket);
let primaryAction = 0, grabAction = 0, mode = 'ASTRO_ATTRACTOR', higherPriority = false;
const calls = { states: [], targets: [], strengths: [] };
const masterRingPosition = new THREE.Vector3(0.4, 0.2, -0.5);
const tool = { setState(v) { calls.states.push(v); }, setTarget(v) { calls.targets.push(v); }, setPullStrength(v) { calls.strengths.push(v); },
  getMasterRingWorldPosition(target) { return target.copy(masterRingPosition); } };
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
leftController.position.copy(shell.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 0, 3)); parent.worldToLocal(leftController.position); parent.updateMatrixWorld(true);
interaction.update(0.016); assert.equal(left.currentShellHit, null, 'shell beyond the ordinary 2.3m ray is not hit');
leftController.dispatchEvent({ type: 'squeezestart' }); assert.equal(shell.userData.shellState, 'capture_ready', 'squeeze without a ray hit does not claim');
leftController.position.copy(shell.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 0, 2)); parent.worldToLocal(leftController.position); parent.updateMatrixWorld(true);
interaction.update(0.016);
assert.equal(left.currentShellHit, shell); assert.ok(leftRayHits.at(-1) <= 2.3);
assert.ok(shell.getObjectByName('VrTargetHalo:mesh')?.visible, 'left ray reuses the shell halo');
leftController.dispatchEvent({ type: 'squeezestart' }); assert.equal(shell.userData.shellState, 'held'); assert.equal(shell.parent, left.holdSocket);
primaryAction = 0; interaction.update(0.016); assert.equal(shell.userData.shellState, 'held', 'right release cannot return a claimed shell');
shellSystem.update(0.35); const pulseA = shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity;
shellSystem.update(0.35); const pulseB = shellSystem.getRecord(shell).emissiveMaterials[0].emissiveIntensity;
assert.ok(pulseA >= 1 && pulseA <= 2 && pulseB >= 1 && pulseB <= 2 && pulseA !== pulseB);
leftController.dispatchEvent({ type: 'squeezeend' }); assert.equal(shell.userData.shellState, 'placed'); assert.equal(shell.parent, parent);
assert.equal(shell.userData.attractorTarget, false);
interaction.update(0.016);
assert.equal(left.currentPlacedShellHit, shell, 'a placed shell is reacquired by the ordinary left ray');
assert.ok(leftRayHits.at(-1) <= 2.3, 'placed-shell targeting reports a hit within the ordinary 2.3m ray');
assert.ok(shell.getObjectByName('VrTargetHalo:mesh')?.visible, 'placed targeting reuses VrTargetHalo');
assert.equal(interaction.hasCurrentShellHit(left), true, 'shell hit can take priority over crystal grab');
leftController.dispatchEvent({ type: 'squeezestart' }); assert.equal(shell.userData.shellState, 'held');
leftController.dispatchEvent({ type: 'squeezeend' }); assert.equal(shell.userData.shellState, 'placed');
interaction.update(0.016); leftController.dispatchEvent({ type: 'squeezestart' });
assert.equal(shell.userData.shellState, 'held', 'placed -> held can be repeated without a claim limit');
leftController.dispatchEvent({ type: 'squeezeend' });

mode = 'ASTRO_ATTRACTOR'; interaction.update(0.016);
assert.equal(right.currentPlacedShellHit, null, 'the right ordinary shell ray is disabled while Astro is equipped');
mode = 'NORMAL_HAND';
rightController.position.copy(shell.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 0, 2));
parent.worldToLocal(rightController.position); parent.updateMatrixWorld(true); interaction.update(0.016);
assert.equal(right.currentPlacedShellHit, shell, 'the right normal hand targets a placed shell');
assert.ok(rightRayHits.at(-1) <= 2.3); rightController.dispatchEvent({ type: 'squeezestart' });
assert.equal(shell.parent, right.holdSocket, 'the right normal hand grabs its placed-shell ray hit');
assert.equal(shell.userData.attractorTarget, false); rightController.dispatchEvent({ type: 'squeezeend' });
assert.equal(shell.userData.shellState, 'placed');

const stateCallsBeforeNormalFinish = calls.states.length; grabAction = 0; interaction.update(0.016);
assert.equal(calls.states.length, stateCallsBeforeNormalFinish, 'finishTool cannot promote unequipped Astro to IDLE in NORMAL_HAND');
leftController.position.set(10, 0, 0); rightController.position.set(-10, 0, 0); parent.updateMatrixWorld(true); interaction.update(0.016);
assert.equal(interaction.hasCurrentShellHit(left), false, 'without a shell hit the crystal grab path remains unblocked');
assert.equal(shell.getObjectByName('VrTargetHalo:mesh')?.visible, false, 'losing the placed hit disables its halo');
const materialOne = shellSystem.getRecord(shellSystem.instances[0]).emissiveMaterials[0];
const materialTwo = shellSystem.getRecord(shellSystem.instances[1]).emissiveMaterials[0];
assert.notEqual(materialOne, materialTwo); assert.equal(materialOne.emissiveMap, authoredMaterial.emissiveMap);
materialOne.emissiveIntensity = 7; assert.notEqual(materialTwo.emissiveIntensity, 7);

function assertLateHandednessLifecycle({ leftIndex, rightIndex }) {
  const lifecycleParent = new THREE.Group();
  const lifecycleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const lifecycleMaterial = new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 0.4 });
  const lifecycleAssets = { cloneGltfScene() { const root = new THREE.Group();
    root.add(new THREE.Mesh(lifecycleGeometry, lifecycleMaterial)); return root; } };
  const lifecycleShellSystem = createVrShellSystem({ parent: lifecycleParent, assetManager: lifecycleAssets,
    baseRadius: 10, emissionSettings: shellSettings });
  lifecycleShellSystem.setActive(true);
  const records = [0, 1].map(() => {
    const controller = new THREE.Group(), holdSocket = new THREE.Group(); controller.add(holdSocket); lifecycleParent.add(controller);
    return { handedness: '', controller, holdSocket, isConnected: false, currentRayLength: 2.3, reportRayHit() {} };
  });
  let lifecyclePrimaryAction = 0, lifecycleGrabAction = 1;
  const lifecycleTool = { setState() {}, setTarget() {}, setPullStrength() {}, getMasterRingWorldPosition(target) { return target.set(0, 0, 0); } };
  let lifecycleInteraction;
  assert.doesNotThrow(() => { lifecycleInteraction = createVrShellAttractorInteraction({ controllers: records,
    shellSystem: lifecycleShellSystem, handModeController: { getMode: () => 'ASTRO_ATTRACTOR' },
    semanticInput: { getState: () => ({ primaryAction: lifecyclePrimaryAction, grabAction: lifecycleGrabAction }) },
    attractorTool: lifecycleTool, settings: shellSettings, haloSettings: {}, settledParent: lifecycleParent }); });
  assert.equal(lifecycleInteraction.scanCone.object.parent, null, 'cone has no hand parent before WebXR connected');
  assert.equal(lifecycleInteraction.scanCone.object.visible, false);
  assert.doesNotThrow(() => lifecycleInteraction.update(0.016));
  assert.equal(lifecycleInteraction.target, null);

  const leftRecord = records[leftIndex], rightRecord = records[rightIndex];
  leftRecord.handedness = 'left'; leftRecord.isConnected = true;
  rightRecord.handedness = 'right'; rightRecord.isConnected = true;
  const lifecycleShell = lifecycleShellSystem.instances[0]; lifecycleShell.position.set(0, 0, -12);
  lifecycleParent.updateMatrixWorld(true); lifecycleInteraction.update(0.016);
  assert.equal(lifecycleInteraction.scanCone.object.parent, rightRecord.controller, 'cone attaches to the runtime right hand');
  assert.equal(lifecycleInteraction.target, lifecycleShell, 'runtime right hand performs targeting');

  rightRecord.handedness = ''; rightRecord.isConnected = false;
  assert.doesNotThrow(() => lifecycleInteraction.update(0.016));
  assert.equal(lifecycleInteraction.scanCone.object.visible, false, 'right disconnect hides the cone');
  assert.equal(lifecycleInteraction.target, null, 'right disconnect clears targeting');
  rightRecord.handedness = 'right'; rightRecord.isConnected = true;
  lifecycleInteraction.update(0.016); lifecyclePrimaryAction = 1; lifecycleInteraction.update(0.016);
  lifecycleShell.position.copy(lifecycleInteraction.captureAnchor.getWorldPosition(new THREE.Vector3()));
  lifecycleParent.worldToLocal(lifecycleShell.position); lifecycleParent.updateMatrixWorld(true); lifecycleInteraction.update(0.016);
  leftRecord.controller.position.copy(lifecycleShell.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 0, 2));
  lifecycleParent.worldToLocal(leftRecord.controller.position); lifecycleParent.updateMatrixWorld(true); lifecycleInteraction.update(0.016);
  rightRecord.controller.dispatchEvent({ type: 'squeezestart' });
  assert.equal(lifecycleInteraction.heldShell, null, 'a non-left controller cannot claim the shell');
  leftRecord.controller.dispatchEvent({ type: 'squeezestart' });
  assert.equal(lifecycleInteraction.heldShell, lifecycleShell, 'the runtime left ray and squeeze claim the shell');

  lifecycleInteraction.dispose(); lifecycleShellSystem.dispose(); lifecycleGeometry.dispose(); lifecycleMaterial.dispose();
}

assertLateHandednessLifecycle({ leftIndex: 0, rightIndex: 1 });
assertLateHandednessLifecycle({ leftIndex: 1, rightIndex: 0 });

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
