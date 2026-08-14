import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { experienceVrPages } from '../src/content/experienceVrPages.js';
import { createVrIntroSequence, VR_INTRO_STATE } from '../src/xr/guidance/createVrIntroSequence.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';
import { VR_SCENARIO_CAPABILITY, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';
import { getVrQaCheckpointHydration, getVrQaPlayerRadius, resolveVrQaCheckpoint, VR_QA_CHECKPOINT } from '../src/xr/progression/resolveVrQaCheckpoint.js';

assert.equal(resolveVrQaCheckpoint(''), VR_QA_CHECKPOINT.NORMAL);
assert.equal(resolveVrQaCheckpoint('?debug'), VR_QA_CHECKPOINT.NORMAL);
assert.equal(resolveVrQaCheckpoint('?p9'), VR_QA_CHECKPOINT.NORMAL);
assert.equal(resolveVrQaCheckpoint('?p=0'), VR_QA_CHECKPOINT.NORMAL);
assert.equal(resolveVrQaCheckpoint('?p0'), VR_QA_CHECKPOINT.P0);
assert.equal(resolveVrQaCheckpoint('?p0&p1'), VR_QA_CHECKPOINT.P0, 'explicit P0 wins over legacy QA parameters');

function createCheckpointFlow(search) {
  const checkpoint = resolveVrQaCheckpoint(search);
  const hydration = getVrQaCheckpointHydration(checkpoint);
  const director = new ExperienceDirector({ scenario: vrExperienceScenario,
    initialPointId: hydration.initialPointId, initialMilestones: hydration.initialMilestones });
  const progression = createVrProgressionController({ pages: experienceVrPages });
  const floor = { revealed: [], activated: [], completed: [],
    getRevealedSectorIds() { return [...this.revealed]; }, getActivatedEntries() { return [...this.activated]; },
    getCompletedTiers() { return [...this.completed]; } };
  const world = { monkey: false, stone: false, glyphs: false, portal: false, reliquary: false,
    furnace: false, shells: false, rays: false };
  const progressRoot = new THREE.Group();
  const monkeyMotionRoot = new THREE.Group(); const monkeyVisualRoot = new THREE.Group();
  const monkeyStoneRoot = new THREE.Group(); const playerRig = new THREE.Group(); const glyphRing = new THREE.Group();
  const platformFixturesRoot = new THREE.Group(); progressRoot.add(monkeyMotionRoot, monkeyStoneRoot, platformFixturesRoot);
  const sequence = createVrIntroSequence({
    monkeyGuide: { setDialogueOverride() {}, showMessage() { return { lineCount: 0 }; }, setInteractionEnabled() {} },
    monkeyMotionRoot, monkeyVisualRoot, monkeyStoneRoot, playerRig, glyphRing,
    progressFloor: { object: progressRoot }, platformFixturesRoot,
    locomotion: { reset() {}, setWalkRadius() {} },
    fogReveal: { restart() {}, skipToEnd() {}, setRadius() {}, getSnapshot() { return {}; }, update() {} },
    spatial: { entryDirection: { x: 0, y: 0, z: 1 }, monkeyStartRadius: 18,
      monkeyFinal: { x: 0, y: 0, z: 0 }, ringRadius: 7.6, thresholdOutsideDistance: 1 },
    settings: { enabled: true, locale: 'en', insideSafeMargin: .75 }, bypass: hydration.skipIntro,
    onProgressionFixturesHidden() { world.portal = world.reliquary = world.furnace = false; },
    onBypassReady() { world.rays = true; }, getHeadPosition: () => new THREE.Vector3(0, 1.6, 6.85)
  });
  world.monkey = monkeyVisualRoot.visible; world.stone = monkeyStoneRoot.visible; world.glyphs = glyphRing.visible;
  return { director, progression, floor, world, sequence,
    playerRadius: getVrQaPlayerRadius(checkpoint, { ringRadius: 7.6, insideSafeMargin: .75 }) };
}

const normal = createCheckpointFlow('');
assert.equal(normal.director.getCurrentPointId(), '1.10');
assert.equal(normal.sequence.getState(), VR_INTRO_STATE.XR_CALIBRATING);
assert.equal(normal.world.rays, false);

const p0 = createCheckpointFlow('?p0');
assert.equal(p0.sequence.getState(), VR_INTRO_STATE.BYPASSED, 'P0 skips choreography without dispatching Intro facts');
assert.equal(p0.director.getCurrentPointId(), '2.10');
assert.equal(p0.director.can(VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS), true);
assert.equal(p0.director.getDebugSnapshot().lastEvent, null, 'hydration creates no artificial event history');
assert.deepEqual(p0.progression.getActivatedPageIds(), []);
assert.equal(p0.progression.isTierComplete(1), false);
assert.equal(p0.progression.getCurrentTier(), 1);
assert.deepEqual(p0.floor.getRevealedSectorIds(), []);
assert.deepEqual(p0.floor.getActivatedEntries(), []);
assert.deepEqual(p0.floor.getCompletedTiers(), []);
assert.deepEqual(p0.world, { monkey: true, stone: true, glyphs: true, portal: false, reliquary: false,
  furnace: false, shells: false, rays: true });
assert.ok(p0.playerRadius > 0 && p0.playerRadius < 7.6, 'P0 player is safely inside the canonical ring');

p0.director.resetSession(); p0.sequence.reset();
assert.equal(p0.director.getCurrentPointId(), '2.10');
assert.equal(p0.sequence.getState(), VR_INTRO_STATE.BYPASSED);
assert.deepEqual(p0.progression.getActivatedPageIds(), []);
assert.deepEqual(p0.floor.getActivatedEntries(), []);
assert.equal(p0.director.getDebugSnapshot().lastEvent, null);
console.log('VR QA checkpoint P0 production-path smoke assertions passed');
