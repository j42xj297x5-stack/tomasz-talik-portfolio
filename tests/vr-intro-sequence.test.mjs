import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroSequence, VR_INTRO_COPY, VR_INTRO_STATE } from '../src/xr/guidance/createVrIntroSequence.js';

assert.equal(VR_INTRO_COPY.pl.invitation[0].label, 'IDĘ');
assert.equal(VR_INTRO_COPY.en.invitation[0].label, "I'LL GO");
assert.match(VR_INTRO_COPY.pl.threshold[0], /próg/);
assert.match(VR_INTRO_COPY.en.threshold[0], /threshold/);

function fixture({ bypass = false } = {}) {
  const monkeyAnchor = new THREE.Group();
  const playerRig = new THREE.Group();
  const glyphRing = new THREE.Group();
  const platformFixturesRoot = new THREE.Group();
  const sector = new THREE.Group(); sector.userData.branchId = 'creative';
  const progressFloor = { object: new THREE.Group() }; progressFloor.object.add(sector);
  let override = null; let message = ''; let ended = 0; let radius = 4;
  const monkeyGuide = { showMessage(value) { message = value; }, setDialogueOverride(value) { override = value; } };
  const locomotion = { reset() { radius = 4; }, setWalkRadius(value) { radius = value; } };
  const settings = { enabled: true, locale: 'en', startOutsideMargin: 2.6, thresholdStopMargin: 0.35,
    guideSpeed: 1, pauseDistance: 3.2, resumeDistance: 2.4, revealProgress: 0.72, lineDuration: 0.01 };
  const sequence = createVrIntroSequence({ monkeyGuide, monkeyAnchor, playerRig, glyphRing, progressFloor,
    platformFixturesRoot, locomotion, ringRadius: 4, entryDirection: new THREE.Vector3(0, 0, 1), settings,
    bypass, onEndSession: () => { ended += 1; } });
  return { sequence, monkeyAnchor, playerRig, glyphRing, platformFixturesRoot, sector,
    getOverride: () => override, getMessage: () => message, getRadius: () => radius, getEnded: () => ended };
}

const intro = fixture();
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.VOID);
assert.equal(intro.sector.visible, false); assert.equal(intro.platformFixturesRoot.visible, false);
assert.equal(intro.glyphRing.visible, false); assert.ok(Math.hypot(intro.playerRig.position.x, intro.playerRig.position.z) > 4);
for (let i = 0; i < 6; i += 1) intro.sequence.update(0.02);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.WAIT_HOVER);
intro.getOverride().onMonkeyHover(); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.WAIT_TRIGGER);
intro.getOverride().onMonkeyPress();
for (let i = 0; i < 3; i += 1) intro.sequence.update(0.02);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.INVITATION);
intro.sequence.chooseInvitation('where'); for (let i = 0; i < 3; i += 1) intro.sequence.update(0.02);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.INVITATION, 'where returns to invitation');
intro.sequence.chooseInvitation('go'); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.FOLLOWING);
assert.equal(intro.getRadius(), Infinity);
intro.playerRig.position.z = 10; intro.sequence.update(1);
assert.equal(intro.sequence.isGuidePaused(), true); const pausedZ = intro.monkeyAnchor.position.z;
intro.sequence.update(1); assert.equal(intro.monkeyAnchor.position.z, pausedZ, 'guide never retreats while paused');
intro.playerRig.position.z = intro.monkeyAnchor.position.z + 2; intro.sequence.update(1);
assert.equal(intro.sequence.isGuidePaused(), false, 'resume threshold provides hysteresis');
for (let i = 0; i < 10 && intro.sequence.getState() === VR_INTRO_STATE.FOLLOWING; i += 1) intro.sequence.update(1);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.THRESHOLD); assert.equal(intro.glyphRing.visible, true);
intro.sequence.chooseThreshold('cross'); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.CROSSING);
intro.playerRig.position.z = 4.1; intro.sequence.update(0.1); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.CROSSING);
intro.playerRig.position.z = 3.9; intro.sequence.update(0.1);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.INSIDE_RING_READY, 'only physical crossing completes intro');
assert.equal(intro.getRadius(), 4);
intro.sequence.reset(); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.VOID, 'session reset is deterministic');

const refusal = fixture(); refusal.sequence.chooseInvitation('no');
for (let i = 0; i < 3; i += 1) refusal.sequence.update(0.02);
assert.equal(refusal.getEnded(), 1);
const bypassed = fixture({ bypass: true }); assert.equal(bypassed.sequence.getState(), VR_INTRO_STATE.BYPASSED);
assert.equal(bypassed.sector.visible, true); assert.equal(bypassed.platformFixturesRoot.visible, true);
console.log('VR intro sequence assertions passed');
