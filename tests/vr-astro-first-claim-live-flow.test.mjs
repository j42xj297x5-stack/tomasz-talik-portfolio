import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { VR_SCENARIO_CAPABILITY, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';
import { createVrFurnaceIntro, VR_FURNACE_INTRO_COPY } from '../src/xr/guidance/createVrFurnaceIntro.js';
import { ASTRO_ATTRACTOR_CONSTRUCTION, createVrAstroAttractorProductionController } from '../src/xr/tools/createVrAstroAttractorProductionController.js';

let override = null, shown = [], furnaceVisible = false, runtime;
const monkeyGuide = { showMessage: (line) => shown.push(line), setDialogueOverride: (value) => { override = value; }, hasDialogueOverride: () => Boolean(override) };
const intro = createVrFurnaceIntro({ monkeyGuide, revealFurnace: () => { furnaceVisible = true; return true; },
  onCompleted: () => runtime.dispatch(VR_SCENARIO_EVENT.FURNACE_INTRO_COMPLETED) });
const director = new ExperienceDirector({ scenario: vrExperienceScenario });
const handlers = Object.fromEntries(Object.values(VR_SCENARIO_EFFECT).map((effect) => [effect, () => {}]));
handlers[VR_SCENARIO_EFFECT.BEGIN_FURNACE_INTRO] = () => intro.begin();
runtime = new RuntimeExperience({ director, effectHandlers: handlers });
while (runtime.getCurrentPointId() !== '3.40') {
  const point = vrExperienceScenario.points.find(({ id }) => id === runtime.getCurrentPointId());
  const transition = point.transitions.find(({ kind }) => ['COMPLETE', 'EXPLICIT', 'COMPLETE_IF'].includes(kind));
  assert.ok(transition, `setup transition at ${point.id}`);
  runtime.dispatch(transition.event, transition.kind === 'COMPLETE_IF' ? { crossingComplete: true }
    : Number.isFinite(transition.choice) ? { choice: transition.choice } : undefined);
}
assert.equal(furnaceVisible, true); assert.deepEqual(shown, [VR_FURNACE_INTRO_COPY[0]]);
override.onSelect('furnace-intro-next'); assert.equal(runtime.getCurrentPointId(), '3.40'); assert.deepEqual(shown, VR_FURNACE_INTRO_COPY);
override.onSelect('furnace-intro-next'); assert.equal(runtime.getCurrentPointId(), '3.50');
assert.equal(runtime.can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO), false);

const furnaceRoot = new THREE.Group(); furnaceRoot.scale.setScalar(3);
const chamber = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 1.2), new THREE.MeshBasicMaterial()); chamber.name = 'komora';
const anchor = new THREE.Group(); anchor.name = 'VR_FURNACE_CONTENT_ANCHOR'; const energy = new THREE.Group(); anchor.add(energy); energy.position.y = -.2;
furnaceRoot.add(chamber, anchor);
const model = new THREE.Group(); model.name = 'IMPORT_WRAPPER';
const visualRoot = new THREE.Group(); visualRoot.name = 'VR_ATTRACTOR_ROOT';
const visualMesh = new THREE.Mesh(new THREE.BoxGeometry(.12, 1, .2), new THREE.MeshBasicMaterial()); visualRoot.add(visualMesh);
const debugSibling = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial()); debugSibling.name = 'DEBUG_SIBLING';
model.add(visualRoot, debugSibling);
const chamberCylinder = { center: new THREE.Vector3(), radius: .4, halfHeight: .6 };
assert.throws(() => createVrAstroAttractorProductionController({ model: new THREE.Group(), contentAnchor: anchor,
  chamber, chamberCylinder }), /VR_ATTRACTOR_ROOT/, 'missing authoritative visual root is an explicit asset-contract error');
const controller = new THREE.Group(); controller.position.z = 1; furnaceRoot.add(controller); controller.updateMatrixWorld(true);
const record = { handedness: 'right', controller, ray: { visible: true }, isConnected: true, currentRayLength: 2.3, reportRayHit() {} };
let chamberState = 'CLOSED', processProgress = 0, processKind = null, claims = 0;
const production = createVrAstroAttractorProductionController({ model, contentAnchor: anchor, chamber, chamberCylinder,
  energyCell: energy, controllers: [record],
  processDriver: { canStartConstruction: () => true, startConstruction: (kind) => { processKind = kind; return true; },
    getProgress: () => processProgress, getProcessKind: () => processKind },
  getChamberState: () => chamberState, getRightMode: () => 'NORMAL_HAND', canRequest: () => runtime.getCurrentPointId() === '3.50',
  onRequested: () => runtime.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCTION_REQUESTED),
  onProduced: () => runtime.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCED),
  onClaimed: () => { claims += 1; runtime.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_CLAIMED); } });
assert.equal(production.requestCreate(), true); assert.equal(runtime.getCurrentPointId(), '3.60');
assert.equal(production.getState(), 'BUILDING'); assert.equal(processKind, ASTRO_ATTRACTOR_CONSTRUCTION);
assert.equal(production.object.parent, anchor); assert.equal(visualRoot.parent, production.object);
assert.equal(production.object.getObjectByName('DEBUG_SIBLING'), undefined, 'GLB siblings do not enter production output');
const diagnostics = production.getDiagnostics();
assert.equal(diagnostics.visualRootName, 'VR_ATTRACTOR_ROOT'); assert.equal(diagnostics.parentIsContentAnchor, true);
assert.equal(diagnostics.horizontalPresentation, true); assert.ok(Number.isFinite(diagnostics.presentationScale) && diagnostics.presentationScale > 0);
const expectedScale = .4 * .9 / Math.hypot(.12 / 2, 1 / 2);
assert.ok(Math.abs(diagnostics.presentationScale - expectedScale) < 1e-6, 'uniform fit derives from oriented root and chamber dimensions only');
const horizontalAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(production.object.quaternion);
assert.ok(horizontalAxis.distanceTo(new THREE.Vector3(0, 0, -1)) < 1e-10, 'authored +Y aim axis becomes chamber -Z');
processProgress = .5; production.update(.1); assert.equal(runtime.getCurrentPointId(), '3.60');
assert.ok(Math.abs(production.object.scale.x - diagnostics.presentationScale * .5) < 1e-10);
processProgress = 1; production.update(.1); assert.equal(runtime.getCurrentPointId(), '3.70');
assert.equal(production.getState(), 'AVAILABLE'); assert.equal(production.object.parent, anchor);
assert.ok(Math.abs(production.object.scale.x - diagnostics.presentationScale) < 1e-10, 'full formation restores chamber-fit scale exactly');
const fittedBounds = new THREE.Box3().setFromObject(visualRoot); const fittedCenter = fittedBounds.getCenter(new THREE.Vector3());
let radial = 0, vertical = 0;
for (const x of [fittedBounds.min.x, fittedBounds.max.x]) for (const y of [fittedBounds.min.y, fittedBounds.max.y]) for (const z of [fittedBounds.min.z, fittedBounds.max.z]) {
  const point = chamber.worldToLocal(new THREE.Vector3(x, y, z)); const center = chamber.worldToLocal(fittedCenter.clone());
  radial = Math.max(radial, Math.hypot(point.x - center.x, point.z - center.z)); vertical = Math.max(vertical, Math.abs(point.y - center.y));
}
assert.ok(radial <= chamberCylinder.radius * .9 + 1e-10); assert.ok(vertical <= chamberCylinder.halfHeight * .9 + 1e-10);
const availableQuaternion = production.object.quaternion.clone(); production.resetSession();
assert.ok(production.object.quaternion.equals(availableQuaternion)); assert.ok(Math.abs(production.object.scale.x - diagnostics.presentationScale) < 1e-10);
production.update(0); assert.equal(production.claim(record), false);
chamberState = 'OPEN'; production.update(0); assert.equal(production.claim(record), true);
production.update(.2); assert.equal(runtime.getCurrentPointId(), '3.70');
production.update(.3); assert.equal(runtime.getCurrentPointId(), '3.80'); assert.equal(production.getState(), 'EARNED');
assert.equal(claims, 1); assert.equal(runtime.can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO), true);
assert.equal(runtime.can(VR_SCENARIO_CAPABILITY.CAN_TARGET_SHELLS), true);
assert.equal(production.claim(record), false); assert.equal(claims, 1);
production.dispose(); runtime.dispose();
visualMesh.geometry.dispose(); visualMesh.material.dispose(); debugSibling.geometry.dispose(); debugSibling.material.dispose();
chamber.geometry.dispose(); chamber.material.dispose();
console.log('vr astro first physical claim live flow: ok');
