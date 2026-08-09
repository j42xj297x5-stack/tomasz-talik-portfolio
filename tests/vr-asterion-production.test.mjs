import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrAstroFurnaceProgressionController, REQUIRED_ASTERION_SHELLS } from '../src/xr/furnace/createVrAstroFurnaceProgressionController.js';
import { createVrAsterionProductionController, resolveAsterionFormationProgress, VR_ASTERION_PRODUCTION_STATES as STATES } from '../src/xr/asterion/createVrAsterionProductionController.js';
import { createVrAsterionSphere } from '../src/xr/asterion/createVrAsterionSphere.js';
import { createVrHandModeController } from '../src/xr/input/createVrHandModeController.js';
import { resolveChamberCylinder } from '../src/xr/furnace/vrAstroFurnaceChamberCylinder.js';
import { assemblySegmentVisible, createAsterionModelWireframeMap, resolveConstructionPatchOpacity } from '../src/xr/furnace/asterionSphereWireframe.js';

function harness({ complete = false, completedShellCycle = false } = {}) {
  const progression = createVrAstroFurnaceProgressionController();
  REQUIRED_ASTERION_SHELLS.slice(0, complete ? 6 : 5).forEach((id) => progression.commitAbsorbedShell(id));
  const contentAnchor = new THREE.Group(), socket = new THREE.Group();
  const object = new THREE.Mesh(new THREE.SphereGeometry(.1), new THREE.MeshStandardMaterial({ color: 0x123456, emissive: 0x010203, opacity: .8 }));
  object.visible = false; socket.add(object);
  let presented = false, mode = 'NORMAL_HAND', equips = 0, starts = 0, stops = 0, chamberState = 'CLOSED', contentState = 'EMPTY';
  let processState = completedShellCycle ? 'COMPLETE' : 'IDLE';
  let processKind = completedShellCycle ? 'SHELL_EXTRACTION' : null, processProgress = completedShellCycle ? 1 : 0;
  const sphere = { object, socket, presentAt(parent, scale) { parent.add(socket); socket.scale.setScalar(scale); object.visible = true; presented = true; return true; },
    setPresentationScale(scale) { socket.scale.setScalar(scale); return true; },
    setMaterializationProgress(progress) { object.material.opacity = .8 * progress; object.material.emissiveIntensity = THREE.MathUtils.lerp(10, 0, progress); },
    restorePresentationMaterials() { object.material.opacity = .8; object.material.emissiveIntensity = 0; },
    clearPresentation() { socket.removeFromParent(); object.visible = false; presented = false; }, isPresented: () => presented };
  const leftController = new THREE.Group(); leftController.position.z = 1;
  const rightController = new THREE.Group(); rightController.position.z = 1;
  const left = { handedness: 'left', controller: leftController, ray: { visible: true }, currentRayLength: 2.3, reportRayHit() {} };
  const right = { handedness: 'right', controller: rightController, ray: { visible: true }, currentRayLength: 2.3, reportRayHit() {} };
  const handModes = { getLeftMode: () => mode, equipLeftAsterion() { mode = 'ASTERION_SPHERE'; equips += 1; return true; } };
  const processDriver = { canStartConstruction: () => (processState === 'IDLE' && processKind == null)
      || (processState === 'COMPLETE' && processKind === 'SHELL_EXTRACTION'),
    startConstruction() { if (!this.canStartConstruction()) return false; processState = completedShellCycle ? 'PREPARING_CONSTRUCTION' : 'SPINUP'; processKind = 'ASTERION_CONSTRUCTION'; return true; },
    getState: () => processState, getProcessKind: () => processKind, getProgress: () => processProgress };
  const production = createVrAsterionProductionController({ progressionController: progression, sphere, contentAnchor,
    controllers: [left, right], handModeController: handModes, processDriver, getChamberState: () => chamberState,
    getContentState: () => contentState, settings: { buildDurationSeconds: 18, rayMaxDistance: 2.3 },
    onBuildStart() { starts += 1; }, onBuildStop() { stops += 1; } });
  return { progression, production, sphere, left, right, handModes, contentAnchor,
    setChamber: (value) => { chamberState = value; }, setContent: (value) => { contentState = value; },
    setProcess: (progress) => { processProgress = progress; if (progress >= 1) processState = 'COMPLETE'; },
    counts: () => ({ equips, starts, stops }) };
}
{
  const h = harness({ complete: true, completedShellCycle: true });
  assert.equal(h.production.canCreate(), true, '6/6 + EMPTY + CLOSED + completed shell extraction enables UTWÓRZ');
  assert.equal(h.production.requestCreate(), true, 'the hardware regression path accepts UTWÓRZ without opening the chamber');
  assert.equal(h.production.getState(), STATES.BUILDING, 'accepted create transitions READY to BUILDING immediately');
  assert.equal(h.production.getSnapshot().constructionProgress, 0);
  assert.equal(h.production.requestCreate(), false, 'duplicate UTWÓRZ is rejected while the lock is preparing');
  assert.equal(h.counts().starts, 1); h.production.dispose();
}

{
  const h = harness(); assert.equal(h.production.getState(), STATES.LOCKED); assert.equal(h.production.requestCreate(), false);
  h.progression.commitAbsorbedShell(REQUIRED_ASTERION_SHELLS[5]); assert.equal(h.production.getState(), STATES.READY);
  h.setChamber('OPEN'); assert.equal(h.production.requestCreate(), false, 'create requires CLOSED'); h.setChamber('CLOSED');
  h.setContent('INSERTED'); assert.equal(h.production.requestCreate(), false, 'create requires EMPTY'); h.setContent('EMPTY');
  assert.equal(h.production.requestCreate(), true); assert.equal(h.sphere.socket.parent, h.contentAnchor); assert.equal(h.production.requestCreate(), false);
  assert.equal(h.counts().starts, 1); assert.equal(h.production.getDiagnostics().duration, 18);
  h.production.resetSession(); assert.equal(h.production.getState(), STATES.READY); assert.equal(h.sphere.isPresented(), false); h.production.dispose();
}
{
  const h = harness({ complete: true }); h.production.requestCreate();
  for (const [progress, formation] of [[0, 0], [.5833333333, .5], [1, 1]]) { h.setProcess(progress); h.production.update(0);
    assert.ok(Math.abs(h.production.getSnapshot().formationProgress - formation) < 1e-6); }
  assert.equal(h.production.getState(), STATES.AVAILABLE); assert.equal(h.sphere.object.material.opacity, .8, 'authored material restored');
  assert.equal(h.production.getDiagnostics().committedBuilds, 1); assert.equal(h.production.claim(h.left), false, 'claim blocked while CLOSED');
  h.setChamber('OPEN'); h.production.update(0); assert.equal(h.production.claim(h.right), false); assert.equal(h.production.claim(h.left), true);
  assert.equal(h.production.getState(), STATES.EARNED); assert.equal(h.counts().equips, 1); h.production.dispose();
}
assert.equal(resolveAsterionFormationProgress(0), 0); assert.ok(Math.abs(resolveAsterionFormationProgress(7 / 12) - .5) < 1e-9); assert.equal(resolveAsterionFormationProgress(1), 1);

// Hardware regression: NORMAL_HAND owns only hand equipment and cannot erase BUILDING/AVAILABLE presentation.
{
  const root = new THREE.Group(), contentAnchor = new THREE.Group(); contentAnchor.name = 'VR_FURNACE_CONTENT_ANCHOR';
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 1.2), new THREE.MeshBasicMaterial());
  const energyCell = new THREE.Mesh(new THREE.SphereGeometry(.06), new THREE.MeshBasicMaterial()); energyCell.position.y = .25;
  root.add(contentAnchor, chamber, energyCell);
  const model = new THREE.Group(); model.add(new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 12), new THREE.MeshStandardMaterial()));
  const sphere = createVrAsterionSphere({ model, enabled: true, settings: { targetDiameter: .18, holdOffset: { x: 0, y: 0, z: 0 } } });
  const leftGrip = new THREE.Group(); root.add(leftGrip);
  const left = { handedness: 'left', isConnected: true, grip: leftGrip, controller: new THREE.Group(), ray: { visible: true } };
  const semanticInput = { update: () => ({ toggleLeftTool: false, toggleRightTool: false, primaryAction: 0 }), reset() {} };
  const attractor = { setUnlocked() {}, attachToTargetRay() {}, setEquipped() {}, setTrigger() {}, update() {}, reset() {}, dispose() {} };
  let available = false;
  const handModes = createVrHandModeController({ controllers: [left], semanticInput, attractorTool: attractor,
    asterionSphere: sphere, isUnlocked: () => false, isAsterionAvailable: () => available });
  const progression = createVrAstroFurnaceProgressionController(); REQUIRED_ASTERION_SHELLS.forEach((id) => progression.commitAbsorbedShell(id));
  let progress = 0;
  const production = createVrAsterionProductionController({ progressionController: progression, sphere, contentAnchor, chamber,
    chamberCylinder: resolveChamberCylinder(chamber), energyCell, controllers: [], handModeController: handModes,
    processDriver: { canStartConstruction: () => true, startConstruction: () => true,
      getProcessKind: () => 'ASTERION_CONSTRUCTION', getProgress: () => progress } });
  assert.equal(production.requestCreate(), true); assert.equal(production.getState(), STATES.BUILDING);
  assert.equal(sphere.isPresented(), true); assert.equal(sphere.object.visible, true); assert.equal(sphere.socket.parent, contentAnchor);
  for (let frame = 0; frame < 5; frame++) handModes.update(.016);
  assert.equal(sphere.isPresented(), true, 'one or many NORMAL_HAND updates preserve presentation');
  assert.equal(sphere.object.visible, true); assert.equal(sphere.socket.parent, contentAnchor);
  assert.equal(sphere.unequipFromHand(), false, 'unequipFromHand is a presentation no-op');
  progress = 1; production.update(.016); root.updateMatrixWorld(true);
  assert.equal(production.getState(), STATES.AVAILABLE); assert.equal(sphere.socket.parent, contentAnchor);
  assert.deepEqual(sphere.socket.scale.toArray(), [1, 1, 1]);
  const diagnostics = production.getDiagnostics();
  assert.equal(diagnostics.centerInsideChamber, true, 'visible Sphere center is inside the authored chamber cylinder');
  assert.ok(diagnostics.socketLocalPosition[1] > -0.6, 'shared placement keeps the Sphere above the chamber floor');
  const presentedDiameter = diagnostics.sphereWorldDiameter;
  for (let frame = 0; frame < 5; frame++) handModes.update(.016);
  assert.equal(sphere.isPresented(), true, 'AVAILABLE presentation survives subsequent hand-mode frames');
  production.resetSession(); handModes.reset();
  assert.equal(sphere.isPresented(), true, 'AVAILABLE re-entry remains presented regardless of following hand-mode reset');
  sphere.clearPresentation(); available = true; assert.equal(handModes.equipLeftAsterion(), true); root.updateMatrixWorld(true);
  const equippedDiameter = sphere.getDiagnostics().sphereWorldDiameter;
  assert.ok(Math.abs(presentedDiameter - equippedDiameter) < 1e-3, 'production and equipment compare real visible-model bounds at the same diameter');
  handModes.reset(); assert.equal(sphere.isEquipped(), false, 'EQUIPPED -> NORMAL_HAND removes the grip equipment');
  production.dispose(); sphere.dispose();
}
{
  const model = new THREE.Group(); model.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  const first = createAsterionModelWireframeMap(model), second = createAsterionModelWireframeMap(model);
  assert.equal(first, second, 'real-model contour map is cached by model identity'); assert.ok(first.segments.length > 0);
  assert.equal(first.segments.filter((segment) => assemblySegmentVisible(segment, 0)).length, 0);
  assert.ok(first.segments.filter((segment) => assemblySegmentVisible(segment, .5)).length > 0);
  assert.equal(first.segments.filter((segment) => assemblySegmentVisible(segment, 1)).length, first.segments.length);
  assert.deepEqual([0, .5, 1].map(resolveConstructionPatchOpacity), [1, .5700000000000001, .14]);
}
console.log('VR production Asterion tests passed.');
