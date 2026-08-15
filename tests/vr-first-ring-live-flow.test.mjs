import assert from 'node:assert/strict';
import { experienceVrPages } from '../src/content/experienceVrPages.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { createVrFirstRingFlow } from '../src/xr/progression/createVrFirstRingFlow.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';
import {
  VR_SCENARIO_EFFECT,
  VR_SCENARIO_EVENT,
  vrExperienceScenario
} from '../src/xr/progression/vrExperienceScenario.js';

const director = new ExperienceDirector({ scenario: vrExperienceScenario });
const consequences = [];
const effectHandlers = Object.fromEntries(vrExperienceScenario.vocabulary.effects.map((effect) => [effect, () => {}]));
effectHandlers[VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION] = () => consequences.push(VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION);
effectHandlers[VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS] = () => consequences.push(VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS);
let firstRingFlow;
const runtimeExperience = new RuntimeExperience({ director, effectHandlers: {
  ...effectHandlers,
  [VR_SCENARIO_EFFECT.COMPLETE_FIRST_RING_PRESENTATION]: () => firstRingFlow.beginPresentation()
} });

// Deterministic preparation is allowed before the production flow under test starts at 2.30.
for (const [event, payload] of [
  [VR_SCENARIO_EVENT.XR_CALIBRATED],
  [VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE],
  [VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE],
  [VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE],
  [VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS],
  [VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE],
  [VR_SCENARIO_EVENT.MONKEY_HOVERED],
  [VR_SCENARIO_EVENT.MONKEY_TRIGGERED],
  [VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 }],
  [VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD],
  [VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 1 }],
  [VR_SCENARIO_EVENT.PLAYER_ENTERED_RING, { crossingComplete: true }],
  [VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED],
  [VR_SCENARIO_EVENT.MONKEY_TRIGGERED],
  [VR_SCENARIO_EVENT.RELIQUARY_REVEAL_COMPLETED]
]) runtimeExperience.dispatch(event, payload);
assert.equal(runtimeExperience.getCurrentPointId(), '2.30');

const progressionController = createVrProgressionController({ pages: experienceVrPages });
let presentationStarts = 0;
firstRingFlow = createVrFirstRingFlow({
  progressionController,
  progressFloor: { completeTier(tier) { assert.equal(tier, 1); presentationStarts += 1; return false; } },
  dispatch: (event, payload) => runtimeExperience.dispatch(event, payload)
});
const tierOnePages = experienceVrPages.filter(({ order }) => order === 1);
assert.equal(tierOnePages.length, 5);

for (const [index, page] of tierOnePages.entries()) {
  assert.equal(progressionController.commitPage(page), true);
  const tierCompleted = progressionController.isTierComplete(1);
  firstRingFlow.commitPage(page, { tierCompleted });
  assert.equal(tierCompleted, index === 4);
  assert.equal(runtimeExperience.getCurrentPointId(), index === 4 ? '2.40' : '2.30');
}
assert.equal(presentationStarts, 1, 'the first-ring presentation starts exactly once');

firstRingFlow.update(0.1);
assert.equal(runtimeExperience.getCurrentPointId(), '2.40', 'the presentation beat must not complete early');
firstRingFlow.update(1);
assert.equal(runtimeExperience.getCurrentPointId(), '3.10', 'the production presentation owner completes 2.40');
assert.deepEqual(consequences, [
  VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION,
  VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS
], 'entering 3.10 executes both authored Runtime consequences');

firstRingFlow.update(10);
assert.equal(presentationStarts, 1);
assert.equal(runtimeExperience.getCurrentPointId(), '3.10', 'completion is emitted exactly once');

console.log('VR first-ring live flow smoke test passed.');
