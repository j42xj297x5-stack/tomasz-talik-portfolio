import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroSequence, VR_INTRO_COPY, VR_INTRO_STATE } from '../src/xr/guidance/createVrIntroSequence.js';

function fixture({ bypass = false } = {}) {
  const platformRoot = new THREE.Group(); const progressFloor = { object: new THREE.Group() }; progressFloor.object.add(platformRoot);
  const monkeyMotionRoot = new THREE.Group(); monkeyMotionRoot.position.set(0, 1.25, -0.5); progressFloor.object.add(monkeyMotionRoot);
  const playerRig = new THREE.Group(); const head = new THREE.Vector3(0, 1.7, 20);
  const glyphRing = new THREE.Group(); const platformFixturesRoot = new THREE.Group(); const sector = new THREE.Group(); sector.userData.branchId = 'x'; progressFloor.object.add(sector);
  const monkeyStoneRoot = new THREE.Group(); progressFloor.object.add(monkeyStoneRoot);
  let message = ''; let override = null; let radius = 4; let attention = 0; let rays = 0;
  const panel = { open: false, view: 'MENU', section: null, isOpen() { return this.open; }, getViewState() { return this.view; }, getActiveSectionId() { return this.section; } };
  const fog = { progress: 0, restart() { this.progress = 0; }, start() {}, update(d) { this.progress = Math.min(1, this.progress + d / 10); }, skipToEnd() { this.progress = 1; }, getSnapshot() { return { progress: this.progress }; } };
  const monkeyGuide = { showMessage(v) { message = v; return { lineCount: v ? 1 : 0 }; }, setDialogueOverride(v) { override = v; }, setInteractionEnabled() {}, notifyAttention() { attention += 1; } };
  const locomotion = { reset() { radius = 4; }, setWalkRadius(v, options) { radius = v; this.lastOptions = options; } };
  const settings = { enabled: true, locale: 'en', introRevealDuration: 10, postRevealSilenceDuration: 2, insideSafeMargin: .75, glyphFreeExploreDuration: 60, guideSpeed: 2, guideTurnDuration: 1, followGraceDistance: 3, pauseDistance: 3.2, resumeDistance: 2.4, revealProgress: .72, messageDisplayDuration: 0, messageGapDuration: 0, questionGapDuration: 0 };
  const spatial = { entryDirection: { x: 0, y: 0, z: 1 }, playerStartRadius: 20, monkeyStartRadius: 18, monkeyFinal: { x: 0, y: 0, z: 0 }, ringRadius: 4, thresholdOutsideDistance: 1 };
  const sequence = createVrIntroSequence({ monkeyGuide, monkeyMotionRoot, monkeyVisualRoot: new THREE.Group(), monkeyStoneRoot, platformRoot, playerRig, playerGuidePanel: panel, fogReveal: fog, glyphRing, progressFloor, platformFixturesRoot, locomotion, spatial, settings, getHeadPosition: () => head.clone(), onOpeningRaysReady: () => { rays += 1; }, bypass });
  return { sequence, monkeyMotionRoot, monkeyStoneRoot, glyphRing, head, panel, fog, locomotion, getMessage: () => message, getOverride: () => override, getRadius: () => radius, getAttention: () => attention, getRays: () => rays };
}
assert.deepEqual(VR_INTRO_COPY.pl.opening, ['Dobrze.', 'Masz ręce.', 'Sprawdźmy tylko, gdzie co masz.']);
assert.equal(VR_INTRO_COPY.pl.panelPrompt, 'Naciśnij Y, żeby wejść do menu.');
assert.equal(VR_INTRO_COPY.en.panelPrompt, 'Press Y to open the menu.');
const f = fixture(); assert.equal(f.sequence.getState(), VR_INTRO_STATE.XR_CALIBRATING);
assert.equal(f.monkeyStoneRoot.visible, false);
f.sequence.beginAfterXrCalibration();
assert.ok(Math.abs(f.sequence.getDebugSnapshot().monkeyRadius - 18) < 1e-6);
f.head.x = 5; f.sequence.reset(); f.sequence.beginAfterXrCalibration();
assert.ok(Math.abs(f.sequence.getDebugSnapshot().monkeyRadius - 18) < 1e-6, 'physical head offset never changes Monkey start');
f.head.x = 0;
f.sequence.update(5); assert.equal(f.sequence.getState(), VR_INTRO_STATE.FOG_REVEAL); assert.ok(f.fog.progress > 0 && f.fog.progress < 1);
f.sequence.update(5); assert.equal(f.sequence.getState(), VR_INTRO_STATE.POST_REVEAL_SILENCE); assert.equal(f.getMessage(), '');
f.sequence.update(1.99); assert.equal(f.getMessage(), ''); f.sequence.update(.01); assert.equal(f.getMessage(), VR_INTRO_COPY.en.opening[0]);
for (let i = 0; i < 10; i += 1) f.sequence.update(.01);
assert.equal(f.sequence.getState(), VR_INTRO_STATE.WAIT_PLAYER_PANEL_OPEN); assert.equal(f.getMessage(), VR_INTRO_COPY.en.panelPrompt);
f.sequence.update(1000); assert.equal(f.getMessage(), VR_INTRO_COPY.en.panelPrompt, 'Y prompt has no timeout');
f.panel.open = true; f.sequence.update(0); assert.equal(f.sequence.getState(), VR_INTRO_STATE.WAIT_CONTROLS_VIEW); assert.equal(f.getMessage(), '');
f.panel.section = 'controls'; f.panel.view = 'DETAIL'; f.sequence.update(0); assert.equal(f.sequence.getState(), VR_INTRO_STATE.WAIT_PANEL_CLOSE);
f.sequence.update(1); assert.equal(f.sequence.getState(), VR_INTRO_STATE.WAIT_PANEL_CLOSE); f.panel.open = false; f.sequence.update(0); for (let i = 0; i < 10; i += 1) f.sequence.update(.01);
assert.equal(f.sequence.getState(), VR_INTRO_STATE.WAIT_HOVER); assert.equal(f.getRays(), 1);
f.getOverride().onMonkeyHover(); f.getOverride().onMonkeyPress(); for (let i = 0; i < 8; i += 1) f.sequence.update(.01); f.sequence.chooseInvitation('go');
assert.ok(f.sequence.getDebugSnapshot().monkeyRadius > 5, 'FOLLOWING has positive distance from radius 18 to threshold 5');
const stationaryStonePosition = f.monkeyStoneRoot.position.clone();
// First check pauses once, then resolving it permanently disables distance pauses.
f.head.z = 40; f.sequence.update(1.5); f.sequence.update(.1); assert.equal(f.sequence.isGuidePaused(), true); f.head.copy(f.monkeyMotionRoot.getWorldPosition(new THREE.Vector3())); f.sequence.update(.1); assert.equal(f.sequence.getDebugSnapshot().followCheckResolved, true);
f.head.z = 40; for (let i = 0; i < 20 && f.sequence.getState() === VR_INTRO_STATE.FOLLOWING; i += 1) f.sequence.update(.5); assert.equal(f.sequence.getState(), VR_INTRO_STATE.THRESHOLD); assert.equal(f.sequence.isGuidePaused(), false);
assert.deepEqual(f.monkeyStoneRoot.position.toArray(), stationaryStonePosition.toArray(), 'stone is stationary during FOLLOWING');
assert.equal(f.glyphRing.visible, true); assert.equal(f.monkeyStoneRoot.visible, true, 'stone appears with ring reveal');
f.sequence.chooseThreshold('cross'); f.head.set(0, 1.7, 3.99); const before = f.playerRig?.position?.clone?.(); f.sequence.update(.1); assert.equal(f.sequence.getDebugSnapshot().playerSafelyInside, false); assert.equal(f.getRadius(), Infinity);
f.head.z = 3.2; for (let i = 0; i < 20 && f.sequence.getState() !== VR_INTRO_STATE.GLYPH_FREE_EXPLORE; i += 1) f.sequence.update(.25);
assert.equal(f.sequence.getState(), VR_INTRO_STATE.GLYPH_FREE_EXPLORE); assert.deepEqual(f.locomotion.lastOptions, { clamp: false });
assert.deepEqual(f.monkeyMotionRoot.position.toArray(), [0, 0, 0], 'Monkey settles at canonical final origin');
f.sequence.update(20); f.sequence.notifyGlyphExploreSuccess(); f.sequence.update(100); assert.equal(f.getAttention(), 0);
const hint = fixture(); hint.sequence.beginAfterXrCalibration(); hint.sequence.getDebugSnapshot(); // bypass choreography for timer is covered through public flow above
const bypassed = fixture({ bypass: true }); assert.equal(bypassed.sequence.getState(), VR_INTRO_STATE.BYPASSED); assert.equal(bypassed.fog.progress, 1); assert.equal(bypassed.monkeyStoneRoot.visible, true);
f.sequence.reset(); assert.equal(f.sequence.getState(), VR_INTRO_STATE.XR_CALIBRATING); assert.equal(f.sequence.getDebugSnapshot().glyphExploreResolved, false);
console.log('VR intro sequence assertions passed');
