import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroSequence, VR_INTRO_STATE } from '../src/xr/guidance/createVrIntroSequence.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { VR_EXPERIENCE_POINT, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

function createIntroActor() {
  const progressFloor = { object: new THREE.Group() };
  const monkeyMotionRoot = new THREE.Group();
  progressFloor.object.add(monkeyMotionRoot);
  const fogReveal = {
    progress: 0,
    restart() { this.progress = 0; }, start() {}, update() {}, setRadius() {}, dispose() {},
    skipToEnd() { this.progress = 1; }, getSnapshot() { return { progress: this.progress, radius: 20 }; }
  };
  return createVrIntroSequence({
    monkeyGuide: { setDialogueOverride() {}, showMessage() { return { lineCount: 1 }; }, setInteractionEnabled() {} },
    monkeyMotionRoot, monkeyVisualRoot: new THREE.Group(), monkeyStoneRoot: new THREE.Group(),
    platformRoot: new THREE.Group(), playerRig: new THREE.Group(),
    playerGuidePanel: { isOpen: () => false, getActiveSectionId: () => null, getViewState: () => 'MENU' },
    fogReveal, largeGlyphActor: { object: new THREE.Group(), setPresentationVisible() { return true; } }, progressFloor, platformFixturesRoot: new THREE.Group(),
    locomotion: { reset() {}, setWalkRadius() {} }, getHeadPosition: () => new THREE.Vector3(0, 1.7, 20),
    spatial: { monkeyFinal: { x: 0, y: 0, z: 0 }, entryDirection: { x: 0, y: 0, z: 1 }, monkeyStartRadius: 18, worldBaseRadius: 7.6 },
    settings: { enabled: true, locale: 'en', messageDisplayDuration: 0, messageGapDuration: 0, questionGapDuration: 0 }
  });
}

const entryCases = [
  [VR_EXPERIENCE_POINT['1.20'], VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL, VR_INTRO_STATE.FOG_REVEAL, 'beginIntroReveal'],
  [VR_EXPERIENCE_POINT['1.30'], VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE, VR_INTRO_STATE.POST_REVEAL_SILENCE, 'beginPostRevealSilence'],
  [VR_EXPERIENCE_POINT['1.40'], VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING, VR_INTRO_STATE.CONTROLLER_ONBOARDING, 'beginControllerOnboarding']
];

for (const [pointId, effect, expectedState, command] of entryCases) {
  const intro = createIntroActor();
  let calls = 0;
  const runtime = new RuntimeExperience({
    director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: pointId }),
    effectHandlers: { [effect]: () => { calls += 1; assert.equal(intro[command](), true); } }
  });
  assert.equal(intro.getState(), VR_INTRO_STATE.XR_CALIBRATING, `${pointId} starts from the actor baseline`);
  assert.deepEqual(runtime.activateCurrentPoint()?.effects, [effect]);
  assert.equal(intro.getState(), expectedState, `${pointId} starts its own beat without a WAIT_RUNTIME_AFTER_* prerequisite`);
  assert.equal(runtime.activateCurrentPoint(), null, `${pointId} activation is exactly once`);
  assert.equal(calls, 1, `${pointId} entry effect executes exactly once`);
}

const naturalEffects = [];
const naturalRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario }),
  effectHandlers: Object.fromEntries(entryCases.map(([, effect]) => [effect, () => naturalEffects.push(effect)]))
});
assert.deepEqual(naturalRuntime.activateCurrentPoint()?.effects, [], '1.10 entry remains the calibration boundary');
naturalRuntime.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
naturalRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
naturalRuntime.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE);
assert.deepEqual(naturalEffects, entryCases.map(([, effect]) => effect), 'natural forward flow retains reveal, silence, onboarding order');

console.log('VR M3A direct point activation regression test passed.');
