import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroCrystalTutorial, VR_INTRO_CRYSTAL_TUTORIAL_COPY } from '../src/xr/guidance/createVrIntroCrystalTutorial.js';

const messages = [];
const monkeyRoot = new THREE.Group();
monkeyRoot.position.set(0, 0, 18);
const crystal = { object: new THREE.Group() };
const entryDirection = new THREE.Vector3(0, 0, 1);
const playerStart = entryDirection.clone().multiplyScalar(20);
const resolvedRadii = [];
let held = false; let removed = 0; let takeovers = 0; let handoffs = 0; let completions = 0; let audio = 0;
const collection = {
  spawnTransientTutorialCrystal(definition, position) { assert.equal(definition.asset, 'water-1'); crystal.object.position.copy(position); return crystal; },
  isHeld: () => held,
  getWorldPosition: (value, out) => value.object.getWorldPosition(out),
  takeoverAndConsumeTransient() { takeovers += 1; held = false; return true; },
  removeTransientCrystal() { removed += 1; return true; }
};
const tutorial = createVrIntroCrystalTutorial({
  monkeyGuide: { showMessage: (text) => messages.push(text), setDialogueOverride() {} },
  monkeyRoot, getWorldPointAtRadius: (radius) => { resolvedRadii.push(radius); return entryDirection.clone().multiplyScalar(radius); }, crystalCollection: collection,
  crystalDefinition: { asset: 'water-1' }, locale: 'pl',
  settings: { spawnRadius: 19, handoffDistanceFromMonkey: 0.5, messageDisplayDuration: 1 },
  onHandoffRequested: () => { handoffs += 1; }, onCompleted: () => { completions += 1; }, playConsume: () => { audio += 1; }
});

assert.equal(tutorial.begin(), true); assert.equal(tutorial.begin(), false);
assert.equal(messages.at(-1), VR_INTRO_CRYSTAL_TUTORIAL_COPY.pl.seen[0]);
tutorial.update(1); tutorial.update(1);
assert.deepEqual(resolvedRadii, [19]);
assert.equal(monkeyRoot.position.length(), 18); assert.equal(crystal.object.position.length(), 19); assert.equal(playerStart.length(), 20);
assert.ok(crystal.object.position.clone().sub(monkeyRoot.position).dot(playerStart.clone().sub(crystal.object.position)) > 0,
  'crystal lies on the canonical radial axis between Monkey and player start');
assert.equal('getPlayerPosition' in tutorial, false, 'tutorial actor has no current-headset spawn dependency');
assert.equal(messages.at(-1), VR_INTRO_CRYSTAL_TUTORIAL_COPY.pl.instruction);
tutorial.update(10); assert.equal(handoffs, 0, 'unheld crystal never requests handoff');
held = true; crystal.object.position.set(0, 0, 18.51); tutorial.update(0); assert.equal(handoffs, 0);
crystal.object.position.z = 18.5; tutorial.update(0); tutorial.update(1); assert.equal(handoffs, 1, 'threshold emits once');
assert.equal(takeovers, 0, 'semantic request does not mutate ownership before acceptance');
assert.equal(tutorial.acceptHandoff(), true); assert.equal(tutorial.acceptHandoff(), false);
assert.equal(takeovers, 1); assert.equal(audio, 1); assert.equal(completions, 0);
assert.equal(messages.at(-1), VR_INTRO_CRYSTAL_TUTORIAL_COPY.pl.unavailable);
tutorial.update(1); assert.equal(messages.at(-1), VR_INTRO_CRYSTAL_TUTORIAL_COPY.pl.complete); assert.equal(completions, 0);
tutorial.update(1); assert.equal(completions, 1, 'completion follows real final-line duration');
tutorial.update(100); assert.equal(completions, 1);
tutorial.reset(); assert.equal(removed, 1); assert.equal(tutorial.getSnapshot().crystal, null);
console.log('VR intro crystal tutorial assertions passed');
