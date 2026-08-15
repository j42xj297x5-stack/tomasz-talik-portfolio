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

const anchor = new THREE.Group(); const energy = new THREE.Group(); anchor.add(energy); energy.position.y = -.2;
const model = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1), new THREE.MeshBasicMaterial());
const controller = new THREE.Group(); controller.position.z = 1; anchor.add(controller); controller.updateMatrixWorld(true);
const record = { handedness: 'right', controller, ray: { visible: true }, isConnected: true, currentRayLength: 2.3, reportRayHit() {} };
let chamber = 'CLOSED', processProgress = 0, processKind = null, claims = 0;
const production = createVrAstroAttractorProductionController({ model, contentAnchor: anchor, energyCell: energy, controllers: [record],
  processDriver: { canStartConstruction: () => true, startConstruction: (kind) => { processKind = kind; return true; },
    getProgress: () => processProgress, getProcessKind: () => processKind },
  getChamberState: () => chamber, getRightMode: () => 'NORMAL_HAND', canRequest: () => runtime.getCurrentPointId() === '3.50',
  onRequested: () => runtime.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCTION_REQUESTED),
  onProduced: () => runtime.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCED),
  onClaimed: () => { claims += 1; runtime.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_CLAIMED); } });
assert.equal(production.requestCreate(), true); assert.equal(runtime.getCurrentPointId(), '3.60');
assert.equal(production.getState(), 'BUILDING'); assert.equal(processKind, ASTRO_ATTRACTOR_CONSTRUCTION);
processProgress = .5; production.update(.1); assert.equal(runtime.getCurrentPointId(), '3.60');
processProgress = 1; production.update(.1); assert.equal(runtime.getCurrentPointId(), '3.70');
assert.equal(production.getState(), 'AVAILABLE'); assert.equal(production.object.parent, anchor);
production.update(0); assert.equal(production.claim(record), false);
chamber = 'OPEN'; production.update(0); assert.equal(production.claim(record), true);
production.update(.2); assert.equal(runtime.getCurrentPointId(), '3.70');
production.update(.3); assert.equal(runtime.getCurrentPointId(), '3.80'); assert.equal(production.getState(), 'EARNED');
assert.equal(claims, 1); assert.equal(runtime.can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO), true);
assert.equal(runtime.can(VR_SCENARIO_CAPABILITY.CAN_TARGET_SHELLS), true);
assert.equal(production.claim(record), false); assert.equal(claims, 1);
production.dispose(); runtime.dispose();
model.geometry.dispose(); model.material.dispose();
console.log('vr astro first physical claim live flow: ok');
