import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroSequence, VR_INTRO_COPY, VR_INTRO_STATE } from '../src/xr/guidance/createVrIntroSequence.js';

assert.equal(VR_INTRO_COPY.pl.invitation[0].label, 'IDĘ');
assert.equal(VR_INTRO_COPY.en.invitation[0].label, "I'LL GO");
assert.match(VR_INTRO_COPY.pl.threshold[0], /próg/);
assert.match(VR_INTRO_COPY.en.threshold[0], /threshold/);

function fixture({ bypass = false } = {}) {
  const monkeyMotionRoot = new THREE.Group();
  monkeyMotionRoot.position.set(0.25, 0, -0.5);
  monkeyMotionRoot.rotation.y = 0.35;
  const visualRoot = new THREE.Group();
  visualRoot.position.set(-0.4, 0.7, 0.2);
  visualRoot.scale.setScalar(1.75);
  monkeyMotionRoot.add(visualRoot);
  const canonicalVisualPosition = visualRoot.position.clone();
  const canonicalVisualScale = visualRoot.scale.clone();
  const canonicalMonkeyPosition = monkeyMotionRoot.position.clone();
  const canonicalMonkeyQuaternion = monkeyMotionRoot.quaternion.clone();
  const playerRig = new THREE.Group();
  const glyphRing = new THREE.Group();
  const platformFixturesRoot = new THREE.Group();
  const sector = new THREE.Group(); sector.userData.branchId = 'creative';
  const progressFloor = { object: new THREE.Group() }; progressFloor.object.add(sector);
  let override = null; let message = ''; let ended = 0; let radius = 4; const messages = [];
  const monkeyGuide = { showMessage(value) { message = value; messages.push(value); }, setDialogueOverride(value) { override = value; } };
  const radiusCalls = [];
  const locomotion = { reset() { radius = 4; radiusCalls.push(['reset', radius]); }, setWalkRadius(value, options) {
    radius = value; radiusCalls.push(['set', value, options]);
  } };
  const settings = { enabled: true, locale: 'en', playerStartRadius: 20, monkeyStartRadius: 18,
    thresholdStopOutsideDistance: 1, guideSpeed: 1, guideTurnDuration: 1, pauseDistance: 3.2,
    resumeDistance: 2.4, revealProgress: 0.72, messageDisplayDuration: 2,
    messageGapDuration: 0.5, questionGapDuration: 2 };
  const sequence = createVrIntroSequence({ monkeyGuide, monkeyMotionRoot, playerRig, glyphRing, progressFloor,
    platformFixturesRoot, locomotion, ringRadius: 4, entryDirection: new THREE.Vector3(0, 0, 1), settings,
    bypass, onEndSession: () => { ended += 1; } });
  return { sequence, monkeyMotionRoot, visualRoot, playerRig, glyphRing, platformFixturesRoot, sector,
    canonicalMonkeyPosition, canonicalMonkeyQuaternion,
    canonicalVisualPosition, canonicalVisualScale,
    getOverride: () => override, getMessage: () => message, getMessages: () => messages, getRadius: () => radius,
    getRadiusCalls: () => radiusCalls, getEnded: () => ended };
}

const intro = fixture();
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.VOID);
assert.equal(intro.sector.visible, false); assert.equal(intro.platformFixturesRoot.visible, false);
assert.equal(intro.glyphRing.visible, false);
assert.equal(Math.hypot(intro.playerRig.position.x, intro.playerRig.position.z), 20, 'player uses an absolute intro radius');
assert.ok(intro.monkeyMotionRoot.position.distanceTo(intro.canonicalMonkeyPosition.clone().add(new THREE.Vector3(0, 0, 18))) < 1e-9,
  'canonical model/pivot offset is preserved beneath the logical 18 m radius');
assert.equal(intro.playerRig.position.z - (intro.monkeyMotionRoot.position.z - intro.canonicalMonkeyPosition.z), 2,
  'player and monkey narrative radii start 2 m apart');
assert.equal(intro.getRadius(), Infinity, 'normal P0 unlocks locomotion before its first frame');
intro.sequence.reset();
assert.deepEqual(intro.visualRoot.position.toArray(), intro.canonicalVisualPosition.toArray(),
  'reset leaves the visual centering offset untouched');
assert.deepEqual(intro.visualRoot.scale.toArray(), intro.canonicalVisualScale.toArray(),
  'reset leaves the visual model scale untouched');
assert.equal(Math.hypot(intro.playerRig.position.x, intro.playerRig.position.z), 20, 'intro spawn does not accumulate');
assert.equal(intro.getRadius(), Infinity, 'reset restores the unlocked intro radius');
intro.sequence.update(1.99); assert.equal(intro.getMessage(), VR_INTRO_COPY.en.opening[0], 'message remains visible for 2 s');
intro.sequence.update(0.01); assert.equal(intro.getMessage(), '', 'message panel is empty during the gap');
intro.sequence.update(0.49); assert.equal(intro.getMessage(), '', 'ordinary gap lasts 0.5 s');
intro.sequence.update(0.01); assert.equal(intro.getMessage(), VR_INTRO_COPY.en.opening[1]);
intro.sequence.reset();
assert.equal(intro.getMessage(), VR_INTRO_COPY.en.opening[0], 'reset during DISPLAY deterministically restores the first line');
intro.sequence.update(2); assert.equal(intro.getMessage(), ''); intro.sequence.reset();
assert.equal(intro.getMessage(), VR_INTRO_COPY.en.opening[0], 'reset during GAP removes the transitional timer');
for (let i = 0; i < 5; i += 1) { intro.sequence.update(2); intro.sequence.update(0.5); }
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.WAIT_HOVER);
intro.getOverride().onMonkeyHover(); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.WAIT_TRIGGER);
intro.getOverride().onMonkeyPress();
intro.sequence.update(2); assert.equal(intro.getMessage(), '', 'seen statement enters an ordinary empty gap');
intro.sequence.update(0.5); assert.equal(intro.getMessage(), VR_INTRO_COPY.en.seen[1]);
intro.sequence.update(2); assert.equal(intro.getMessage(), '');
intro.sequence.update(1.99); assert.equal(intro.getMessage(), '', 'seen waits for the full question gap');
intro.sequence.update(0.01);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.INVITATION);
assert.equal(intro.getMessage(), VR_INTRO_COPY.en.going, 'the invitation question follows the 2 s silence');
intro.sequence.chooseInvitation('where'); for (let i = 0; i < 3; i += 1) intro.sequence.update(0.02);
assert.equal(intro.getMessage(), VR_INTRO_COPY.en.where[0], 'dialogue timing cannot be skipped by input-sized updates');
intro.sequence.update(1.94); intro.sequence.update(0.5); intro.sequence.update(2); intro.sequence.update(2);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.INVITATION, 'where returns to invitation after a question gap');
assert.equal(intro.getMessage(), VR_INTRO_COPY.en.going);
intro.sequence.chooseInvitation('go'); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.FOLLOWING);
assert.equal(intro.getRadius(), Infinity);
const followingStart = intro.monkeyMotionRoot.position.clone();
const originalQuaternion = intro.canonicalMonkeyQuaternion.clone();
intro.playerRig.position.copy(intro.monkeyMotionRoot.position); intro.sequence.update(0.5);
assert.ok(intro.monkeyMotionRoot.position.distanceTo(followingStart) > 0, 'translation starts during the turn');
assert.ok(intro.monkeyMotionRoot.quaternion.angleTo(originalQuaternion) > 0, 'turn starts without an orientation jump');
assert.ok(Math.abs(intro.monkeyMotionRoot.quaternion.angleTo(originalQuaternion) - Math.PI / 2) < 1e-6, 'half turn takes half the duration');
intro.playerRig.position.z = 10; intro.sequence.update(1);
assert.equal(intro.sequence.isGuidePaused(), true); const pausedZ = intro.monkeyMotionRoot.position.z;
intro.sequence.update(1); assert.equal(intro.monkeyMotionRoot.position.z, pausedZ, 'guide never retreats while paused');
intro.playerRig.position.z = intro.monkeyMotionRoot.position.z + 2; intro.sequence.update(1);
assert.equal(intro.sequence.isGuidePaused(), false, 'resume threshold provides hysteresis');
for (let i = 0; i < 20 && intro.sequence.getState() === VR_INTRO_STATE.FOLLOWING; i += 1) {
  intro.playerRig.position.copy(intro.monkeyMotionRoot.position);
  intro.sequence.update(1);
}
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.THRESHOLD); assert.equal(intro.glyphRing.visible, true);
assert.ok(intro.monkeyMotionRoot.position.distanceTo(intro.canonicalMonkeyPosition.clone().add(new THREE.Vector3(0, 0, 5))) < 1e-6,
  'threshold is based on narrative radius, independently of root offset');
intro.sequence.update(2); intro.sequence.update(0.5); intro.sequence.update(2); intro.sequence.update(0.5);
intro.sequence.update(2); intro.sequence.update(1.99);
assert.equal(intro.getMessage(), '', 'threshold sequence uses the long pre-question gap');
intro.sequence.update(0.01); assert.equal(intro.getMessage(), VR_INTRO_COPY.en.threshold.at(-1));
const thresholdQuaternion = intro.monkeyMotionRoot.quaternion.clone();
intro.sequence.chooseThreshold('cross'); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.CROSSING);
const crossingStart = intro.monkeyMotionRoot.position.clone();
intro.playerRig.position.z = 3.9; intro.sequence.update(0.1);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.CROSSING, 'player cannot commit before the monkey enters');
assert.ok(intro.monkeyMotionRoot.position.distanceTo(crossingStart) > 0, 'monkey resumes walking after threshold acceptance');
assert.ok(intro.monkeyMotionRoot.quaternion.angleTo(thresholdQuaternion) < 1e-6, 'monkey does not turn at the threshold');
for (let i = 0; i < 20 && intro.sequence.getState() === VR_INTRO_STATE.CROSSING; i += 1) intro.sequence.update(0.1);
assert.equal(intro.sequence.getState(), VR_INTRO_STATE.INSIDE_RING_READY, 'only physical crossing completes intro');
assert.equal(intro.getRadius(), 4);
assert.ok(intro.monkeyMotionRoot.position.distanceTo(intro.canonicalMonkeyPosition) > 0, 'crossing does not snap the monkey');
for (let i = 0; i < 100 && intro.monkeyMotionRoot.position.distanceTo(intro.canonicalMonkeyPosition) > 1e-4; i += 1) intro.sequence.update(0.1);
assert.ok(intro.monkeyMotionRoot.position.distanceTo(intro.canonicalMonkeyPosition) < 1e-6, 'monkey walks to its canonical position');
assert.ok(intro.monkeyMotionRoot.quaternion.angleTo(intro.canonicalMonkeyQuaternion) < 1e-6, 'arrival restores canonical orientation');
intro.sequence.reset(); assert.equal(intro.sequence.getState(), VR_INTRO_STATE.VOID, 'session reset is deterministic');
assert.ok(intro.monkeyMotionRoot.quaternion.angleTo(intro.canonicalMonkeyQuaternion) < 1e-6, 'reset restores canonical orientation');

const refusal = fixture(); refusal.sequence.chooseInvitation('no');
for (let i = 0; i < 2; i += 1) { refusal.sequence.update(2); refusal.sequence.update(0.5); }
assert.equal(refusal.getEnded(), 1);
const bypassed = fixture({ bypass: true }); assert.equal(bypassed.sequence.getState(), VR_INTRO_STATE.BYPASSED);
assert.equal(bypassed.getRadius(), 4, 'QA bypass keeps the floor walk radius');
assert.equal(bypassed.sector.visible, true); assert.equal(bypassed.platformFixturesRoot.visible, true);
console.log('VR intro sequence assertions passed');
