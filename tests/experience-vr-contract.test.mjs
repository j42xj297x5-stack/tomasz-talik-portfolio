import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculatePlayerRigYaw } from '../src/xr/playerRigOrientation.js';
import * as THREE from '../src/vendor/three.js';
import { createVrControllers } from '../src/xr/createVrControllers.js';
import { createVrSemanticInput, XR_STANDARD_BUTTONS } from '../src/xr/input/createVrSemanticInput.js';
import { createVrHandModeController, VR_LEFT_HAND_MODES } from '../src/xr/input/createVrHandModeController.js';
import { VR_EXPERIENCE_POINT, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const canonicalLivePointIds = [
  '1.10', '1.20', '1.30', '1.40', '1.50', '1.60', '1.70', '1.80',
  '1.100', '1.110', '1.120', '1.130', '2.10', '2.20', '2.30', '2.40',
  '3.10', '3.20', '3.30', '3.40', '100.10'
];
const retiredPointIds = [
  '1.1', '1.2', '1.3', '1.4', '1.4.1', '1.4.2', '1.4.3', '1.4.4',
  '1.4.5', '1.4.5.1', '1.4.5.2', '1.4.5.1.1', '1.4.5.1.1.1', '1.4.5.1.1.2',
  '1.140', '1.150', '1.160', '1.170', '1.170.1', '1.180', '1.180.1'
];
assert.deepEqual(vrExperienceScenario.points.map(({ id }) => id), canonicalLivePointIds);
assert.deepEqual(Object.values(VR_EXPERIENCE_POINT), canonicalLivePointIds);
assert.equal('1.90' in VR_EXPERIENCE_POINT, false, 'reserved crystal tutorial is not LIVE');
for (const retiredId of retiredPointIds) assert.equal(retiredId in VR_EXPERIENCE_POINT, false);
assert.deepEqual(canonicalLivePointIds.filter((id) => id.startsWith('3.')), ['3.10', '3.20', '3.30', '3.40'],
  'post-ring authoring stops at the Furnace-intro boundary');
assert.equal(VR_EXPERIENCE_POINT['1.110'], '1.110', 'FOLLOWING is a flat mainline point');
assert.equal(VR_EXPERIENCE_POINT['1.130'], '1.130', 'CROSSING is a flat mainline point');
for (const removedHintPointId of ['2.10.1', '2.30.1', '2.40.1']) {
  assert.equal(VR_EXPERIENCE_POINT[removedHintPointId], undefined,
    'hint transient state does not have a LIVE point identifier');
}
assert.equal(VR_EXPERIENCE_POINT['100.10'], '100.10', 'EXIT remains unchanged');

const [main, vr, experience3d, vrControllers, glyphInteraction, spatialPlaque, crystalCollection, locomotion, portalDisplay, crystalReliquary, astroFurnace, furnacePanel, semanticInputSource, playerGuidePanelSource, playerGuideContentSource, scenario, reliquaryHints, monkeyGuide, introSequenceSource, progressFloorSource, firstRingFlowSource] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experience3d.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrControllers.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrGlyphInteraction.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrSpatialPlaque.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrCrystalCollection.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrLocomotion.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrPortalDisplay.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrCrystalReliquary.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/furnace/createVrAstroFurnace.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/furnace/createVrAstroFurnacePanel.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/input/createVrSemanticInput.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/createVrPlayerGuidePanel.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/vrPlayerGuideContent.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/progression/vrExperienceScenario.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/createVrReliquaryHints.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/createVrMonkeyGuide.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/createVrIntroSequence.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/floor/createVrProgressFloor.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/progression/createVrFirstRingFlow.js', import.meta.url), 'utf8')
]);

assert.doesNotMatch(introSequenceSource, /progressFloor\.geometryRoot|userData\?\.branchId|userData\.branchId/,
  'Intro cannot discover progress-floor sectors through their geometry or branch metadata');
assert.doesNotMatch(introSequenceSource, /sectors[\s\S]*?\.visible\s*=/,
  'Intro cannot own progress-floor sector visibility');
assert.match(progressFloorSource, /sector\.visible = false;/,
  'ProgressFloor owns the initial hidden sector state');
assert.match(progressFloorSource, /sector\.object\.visible = true;/,
  'ProgressFloor owns the first-reveal visibility transition');

assert.match(main, /await import\('\.\/experienceVr\.js'\)/);
assert.doesNotMatch(main, /^import .*experienceVr/m);

assert.match(vr, /onPlayerEnteredRing: \(crossing\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.PLAYER_ENTERED_RING, crossing\)/);
assert.match(vr, /onMonkeySettled: \(crossing\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.MONKEY_SETTLED, crossing\)/);
assert.match(vr, /onHintTimeout: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.RELIQUARY_HINT_TIMEOUT\)/,
  'Reliquary timer callback dispatches only the semantic timeout fact');
assert.match(vr, /VR_SCENARIO_EFFECT\.SHOW_RELIQUARY_CONTEXT_HINT[\s\S]*reliquaryHints\.showHint\(\)[\s\S]*throw new Error/,
  'Runtime owns the fail-fast reliquary hint continuation');
assert.equal((vr.match(/reliquaryHints\.showHint\(\)/g) ?? []).length, 1,
  'reliquary hint continuation has only the Runtime handler production path');
assert.match(vr, /onGlyphHintTimeout: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.GLYPH_HINT_TIMEOUT\)/,
  'Intro timeout callback dispatches only the semantic fact');
assert.match(vr, /onReliquaryRevealCompleted: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.RELIQUARY_REVEAL_COMPLETED\)/,
  'reveal timer dispatches only the semantic completion fact');
assert.match(vr, /if \(crystal\) \{\s*runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.FIRST_CRYSTAL_DISCOVERED\);/,
  'successful crystal creation dispatches the semantic discovery fact');
assert.match(vr, /VR_SCENARIO_EFFECT\.REVEAL_RELIQUARY[\s\S]*introSequence\.beginFirstCrystalDiscovery\(\)[\s\S]*throw new Error/,
  'Runtime effect owns the first-crystal actor continuation');
assert.equal((vr.match(/introSequence\.beginFirstCrystalDiscovery\(\)/g) ?? []).length, 1,
  'first-crystal continuation has only the Runtime handler production path');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_RELIQUARY_REVEAL[\s\S]*introSequence\.beginReliquaryReveal\(\)[\s\S]*throw new Error/,
  'Runtime owns the fail-fast reliquary reveal continuation');
assert.equal((vr.match(/introSequence\.beginReliquaryReveal\(\)/g) ?? []).length, 1,
  'reliquary reveal continuation has only the Runtime handler production path');
assert.match(vr, /VR_SCENARIO_EFFECT\.COMPLETE_RELIQUARY_REVEAL[\s\S]*introSequence\.completeReliquaryReveal\(\)[\s\S]*throw new Error/,
  'Runtime effect owns reliquary completion');
assert.equal((vr.match(/introSequence\.completeReliquaryReveal\(\)/g) ?? []).length, 1,
  'reliquary completion has only the Runtime handler production path');
assert.doesNotMatch(vr, /notifyGlyphExploreSuccess/, 'legacy direct discovery decision path is removed');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_GLYPH_FREE_EXPLORE[\s\S]*introSequence\.beginGlyphFreeExplore\(\)/);
assert.match(vr, /VR_SCENARIO_EFFECT\.SHOW_GLYPH_HINT[\s\S]*introSequence\.showGlyphHint\(\)[\s\S]*throw new Error/,
  'Runtime owns the fail-fast glyph hint continuation');
assert.equal((vr.match(/introSequence\.showGlyphHint\(\)/g) ?? []).length, 1,
  'glyph hint has no direct or duplicate execution path');
assert.match(vr, /introQaBypass \|\| runtimeExperience\.can\(VR_SCENARIO_CAPABILITY\.CAN_USE_GLYPHS\)/,
  'production glyph permission is Scenario capability-owned while preserving QA bypass');
assert.match(vr, /canUseReliquary: \(\) => runtimeExperience\.can\(VR_SCENARIO_CAPABILITY\.CAN_USE_RELIQUARY\)/,
  'production insertion receives the Scenario-owned global Reliquary permission');
assert.match(vr, /canActivate: \(\) => \(introQaBypass[\s\S]*runtimeExperience\.can\(VR_SCENARIO_CAPABILITY\.CAN_ACTIVATE_RELIQUARY\)\)[\s\S]*crystalReliquary\.isInteractionEnabled\(\)[\s\S]*state === 'inserted'/,
  'Activate combines explicit QA or Scenario permission with local technical validity');
assert.match(vr, /onPreview: \(page\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.CRYSTAL_ACTIVATED, \{ page \}\)/,
  'successful domain activation emits one semantic fact carrying the active page');
assert.match(vr, /canRelease: \(\) => \(introQaBypass[\s\S]*runtimeExperience\.can\(VR_SCENARIO_CAPABILITY\.CAN_RELEASE_RELIQUARY\)\)[\s\S]*crystalReliquary\.isInteractionEnabled\(\)[\s\S]*state === 'active'/,
  'Release combines explicit QA or Scenario permission with local technical validity');
assert.match(vr, /onCommit: firstRingFlow\.commitPage/,
  'successful domain commit emits CARD_COMMITTED with minimal page identity');
assert.doesNotMatch(vr, /runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.RELIQUARY_RELEASED/,
  'temporary release story fact has no production dispatch');
assert.doesNotMatch(vr, /introSequence\?\.getState\(\)|introSequence\.getState\(\)/,
  'production glyph gate no longer reads the Intro actor state');
assert.match(vr, /VR_SCENARIO_EFFECT\.REVEAL_SHELL_FIELD_PRESENTATION[\s\S]*postRingPresentation\.revealShellField\(\)/,
  'Runtime maps the authored shell presentation effect to its actor');
assert.match(vr, /VR_SCENARIO_EFFECT\.ELEVATE_MAIN_GLYPHS[\s\S]*postRingPresentation\.elevateMainGlyphs\(\)/,
  'Runtime maps the authored glyph elevation effect to its actor');
assert.match(vr, /onCompleted: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.POST_RING_WORLD_PRESENTATION_COMPLETED\)/,
  'the presentation actor emits one semantic completion fact back to Runtime');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_OBSERVATION_WINDOW\]: \(\) => \{ observationWindow\.begin\(\); \}/,
  'Runtime maps the authored observation effect to its actor');
assert.match(vr, /onCompleted: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.OBSERVATION_WINDOW_COMPLETED\)/,
  'the observation actor dispatches the authored semantic completion fact');
assert.match(vr, /postRingPresentation\.update\(delta\);\s*observationWindow\.update\(delta\);/,
  'the render loop advances the local observation timer');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_MONKEY_ATTENTION\]: \(\) => \{ postRingMonkeyDialogue\.begin\(\); \}/,
  '3.30 begins the interaction-gated Monkey dialogue actor');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_FURNACE_INTRO\]: \(\) => \{\}/,
  '3.40 remains an explicit Furnace boundary sink');
assert.match(vr, /renderer\.xr\.enabled = true/);
assert.match(vr, /requestSession\('immersive-vr'/);
assert.match(vr, /renderer\.setAnimationLoop\(renderFrame\)/);
assert.match(vr, /renderer\.setAnimationLoop\(null\)/);
assert.doesNotMatch(vr, /requestAnimationFrame/);
assert.match(vr, /await renderer\.xr\.setSession\(requestedSession\);\s*xrStartCalibrationPending = true;/,
  'session entry defers start calibration to an XR animation frame');
assert.match(vr, /if \(xrStartCalibrationPending\)[\s\S]*getXrHeadWorldPosition\(\{ renderer, camera, playerRig \}\)[\s\S]*calibrateXrHeadToPlatform/,
  'the pending frame uses the canonical WebXR matrix reader before calibration');
assert.doesNotMatch(vr, /renderer\.xr\.getCamera\(camera\)\.getWorldPosition\(/,
  'active P0 code must not rebuild the detached WebXR ArrayCamera matrix');
assert.match(vr, /new ExperienceDirector\(\{ scenario: vrExperienceScenario \}\)/);
assert.match(vr, /new RuntimeExperience\(\{[\s\S]*VR_SCENARIO_EFFECT\.BEGIN_INTRO_REVEAL[\s\S]*introSequence\.beginAfterXrCalibration\(\);[\s\S]*if \(introQaBypass\) vrControllers\.setRaysEnabled\(true\);/,
  'RuntimeExperience effect adapter owns Intro start and QA rays');
assert.match(vr, /xrStartCalibrationPending = false;\s*runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.XR_CALIBRATED\);\s*renderer\.render\(scene, camera\);\s*return;/,
  'calibration is one-shot and skips ordinary locomotion/update work in that frame');
const calibrationBlock = vr.match(/if \(xrStartCalibrationPending\)[\s\S]*?\n  }/)?.[0] ?? '';
assert.doesNotMatch(calibrationBlock, /introSequence\.beginAfterXrCalibration|setRaysEnabled\(true\)/,
  'calibration block contains only the semantic dispatch');
assert.equal((vr.match(/introSequence\.beginAfterXrCalibration\(\)/g) ?? []).length, 1,
  'there is no second calibration fallback');
assert.match(vr, /onIntroRevealComplete: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.INTRO_REVEAL_COMPLETE\)/,
  'Intro completion callback performs only semantic dispatch');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_POST_REVEAL_SILENCE[\s\S]*introSequence\.beginPostRevealSilence\(\)[\s\S]*throw new Error/,
  'post-reveal effect resumes the waiting Intro actor and rejects composition bugs explicitly');
assert.equal((vr.match(/introSequence\.beginPostRevealSilence\(\)/g) ?? []).length, 1,
  'there is no second post-reveal silence start path');
assert.match(vr, /onPostRevealSilenceComplete: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.POST_REVEAL_SILENCE_COMPLETE\)/,
  'silence completion callback performs only semantic dispatch');
assert.match(vr, /VR_SCENARIO_EFFECT\.BEGIN_CONTROLLER_ONBOARDING[\s\S]*introSequence\.beginControllerOnboarding\(\)[\s\S]*throw new Error/,
  'controller onboarding effect resumes the waiting Intro actor and rejects composition bugs explicitly');
assert.equal((vr.match(/introSequence\.beginControllerOnboarding\(\)/g) ?? []).length, 1,
  'there is no second controller onboarding start path');
assert.match(vr, /onPlayerOpenedGuide: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.PLAYER_OPENED_GUIDE\)/,
  'Intro guide-open callback performs only semantic dispatch');
assert.match(vr, /onPlayerViewedControls: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.PLAYER_VIEWED_CONTROLS\)/,
  'Intro controls-viewed callback performs only semantic dispatch');
assert.match(vr, /onPlayerClosedGuide: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.PLAYER_CLOSED_GUIDE\)/,
  'Intro guide-closed callback performs only semantic dispatch');
assert.match(vr, /onMonkeyHovered: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.MONKEY_HOVERED\)/,
  'Monkey hover callback performs only semantic dispatch');
assert.match(vr, /onMonkeyTriggered: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.MONKEY_TRIGGERED\)/,
  'Monkey trigger callback performs only semantic dispatch');
assert.match(vr, /onInvitationSelected: \(choice\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.INTRO_INVITATION_SELECTED, \{ choice \}\)/,
  'invitation callback dispatches only the unchanged numeric choice fact');
assert.match(vr, /onMonkeyReachedThreshold: \(\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.MONKEY_REACHED_THRESHOLD\)/,
  'threshold arrival callback dispatches only the semantic producer fact');
assert.match(vr, /onFollowPauseChanged: \(paused\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.FOLLOW_PAUSE_CHANGED, \{ paused \}\)/);
assert.match(vr, /VR_SCENARIO_EFFECT\.APPLY_FOLLOW_PAUSE_STATE[\s\S]*introSequence\.continueFollowPauseChanged\(payload\.paused\)[\s\S]*throw new Error/);
assert.equal((vr.match(/introSequence\.continueFollowPauseChanged\(payload\.paused\)/g) ?? []).length, 1);
assert.match(vr, /onThresholdSelected: \(choice\) => runtimeExperience\.dispatch\(VR_SCENARIO_EVENT\.THRESHOLD_SELECTED, \{ choice \}\)/,
  'threshold callback dispatches only the unchanged numeric choice fact');
assert.match(vr, /VR_SCENARIO_EFFECT\.PRESENT_THRESHOLD_CHOICE[\s\S]*introSequence\.presentThresholdChoice\(\)[\s\S]*throw new Error/,
  'Runtime owns the single fail-fast threshold presentation seam');
assert.equal((vr.match(/introSequence\.presentThresholdChoice\(\)/g) ?? []).length, 1,
  'threshold presentation has no fallback or duplicate effect handler');
assert.match(vr, /VR_SCENARIO_EFFECT\.CONTINUE_THRESHOLD_CHOICE[\s\S]*introSequence\.continueThresholdChoice\(payload\.choice\)[\s\S]*throw new Error/,
  'accepted threshold choice has one fail-fast actor execution seam');
assert.equal((vr.match(/introSequence\.continueThresholdChoice\(payload\.choice\)/g) ?? []).length, 1);
assert.doesNotMatch(vr, /chooseThreshold\s*\(|id === ['"](?:cross|beyond|return)['"]/,
  'composition root cannot regain legacy threshold ownership');
assert.match(vr, /VR_SCENARIO_EFFECT\.CONTINUE_INTRO_INVITATION[\s\S]*introSequence\.continueInvitation\(payload\.choice\)[\s\S]*throw new Error/,
  'accepted invitation choice has one fail-fast actor execution seam');
assert.equal((vr.match(/introSequence\.continueInvitation\(payload\.choice\)/g) ?? []).length, 1);
assert.doesNotMatch(vr, /chooseInvitation|choice === ['"](?:go|where|no)['"]/,
  'composition root cannot regain legacy invitation ownership');
assert.match(vr, /VR_SCENARIO_EFFECT\.CONTINUE_CONTROLLER_ONBOARDING[\s\S]*introSequence\.continueControllerOnboarding\(\)[\s\S]*throw new Error/,
  'guide-open effect alone resumes controller onboarding and rejects composition bugs explicitly');
assert.equal((vr.match(/introSequence\.continueControllerOnboarding\(\)/g) ?? []).length, 1,
  'there is no second controller onboarding continuation fallback');
assert.equal((vr.match(/VR_SCENARIO_EFFECT\.CONTINUE_CONTROLLER_ONBOARDING/g) ?? []).length, 1,
  'Monkey hover adds no separate effect handler');
const guideOpenWiring = vr.match(/introSequence = createVrIntroSequence\(\{[\s\S]*?\n\}\);/)?.[0] ?? '';
assert.doesNotMatch(guideOpenWiring, /playerGuidePanel\.isOpen\(\)/,
  'experienceVr does not interpret panel state for the guide-open decision');
assert.doesNotMatch(vr, /getActiveSectionId|getViewState/,
  'experienceVr does not interpret the controls section or panel view state');
assert.doesNotMatch(vr, /WAIT_HOVER|WAIT_RUNTIME_AFTER_MONKEY_HOVERED|WAIT_TRIGGER|WAIT_RUNTIME_AFTER_MONKEY_TRIGGERED/,
  'experienceVr does not interpret Monkey actor state');
assert.match(vr, /function handleSessionEnd\(\) \{\s*runtimeExperience\.resetSession\(\)/);
assert.match(vr, /async function enterVr\(\)[\s\S]*if \(activeSession\) return;\s*runtimeExperience\.resetSession\(\)/);
assert.match(vr, /catch \(error\)[\s\S]*xrStartCalibrationPending = false;\s*runtimeExperience\.resetSession\(\)/);
assert.match(vr, /window\.addEventListener\('pagehide', \(\) => \{\s*runtimeExperience\.dispose\(\)/);
assert.match(vr, /function handleSessionEnd\(\)[\s\S]*xrStartCalibrationPending = false;[\s\S]*introSequence\.reset\(\)/,
  'session end clears pending calibration and resets the intro for re-entry');
assert.doesNotMatch(vr, /const trackedHead = renderer\.xr\.getCamera\(camera\)/,
  'the stale immediate post-setSession correction is removed');
assert.match(spatialPlaque, /new THREE\.CanvasTexture\(canvas\)/);
assert.match(spatialPlaque, /new THREE\.PlaneGeometry/);
assert.match(vr, /surface: portalDisplay\.canvasSurface/);
assert.doesNotMatch(spatialPlaque, /Raycaster|requestAnimationFrame|tween/i);
assert.doesNotMatch(spatialPlaque, /DOMOverlay|iframe|createElement\(['"](?:div|style)/i);
assert.doesNotMatch(vr, /cameraRig|createOverlay|createBackgroundAtmosphere|createGalaxySpritesLayer/);
assert.doesNotMatch(experience3d, /renderer\.xr|VRButton|immersive-vr|setAnimationLoop/);

const forwardFromYaw = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
const assertFacesTarget = (position, lookAt) => {
  const yaw = calculatePlayerRigYaw(position, lookAt);
  const forward = forwardFromYaw(yaw);
  const targetLength = Math.hypot(lookAt.x - position.x, lookAt.z - position.z);
  assert.ok(targetLength > 0);
  assert.ok(Math.abs(forward.x - (lookAt.x - position.x) / targetLength) < 1e-12);
  assert.ok(Math.abs(forward.z - (lookAt.z - position.z) / targetLength) < 1e-12);
};

assertFacesTarget({ x: 0, y: 0, z: 6 }, { x: 0, y: 1, z: 0 });
assertFacesTarget({ x: -4, y: 2, z: 3 }, { x: 2, y: -5, z: -1 });
assert.equal(calculatePlayerRigYaw({ x: 1, y: 0, z: 1 }, { x: 1, y: 9, z: 1 }), 0);
assert.match(vr, /orientPlayerRig\(playerRig, settings\.spatial\.monkeyFinal\)/);
assert.doesNotMatch(vr, /camera\.rotation|camera\.quaternion|camera\.lookAt/);
assert.doesNotMatch(vr, /createVrEntryTransition|activatedEntryGlyph|entryReady/);
assert.match(vr, /onGlyphHoldComplete:[\s\S]*crystalCollection\.spawnOne/);
const glyphSpawnContract = vr.match(/onGlyphHoldComplete:[\s\S]*?\n  }\n}/)?.[0] ?? '';
assert.match(glyphSpawnContract, /node\.getWorldPosition/);
assert.match(glyphSpawnContract, /progressFloor\.object\.getWorldPosition/);
assert.doesNotMatch(glyphSpawnContract, /monkeyMotionRoot\.getWorldPosition/);
assert.doesNotMatch(glyphSpawnContract, /renderer\.xr|getCamera|getWorldDirection/);
assert.match(vr, /crystalCollection\.reset\(\);\s*reliquaryHints\.reset\(\);\s*activateButton\.reset\(\);\s*releaseButton\.reset\(\);\s*crystalReliquary\.reset\(\);\s*restorePortalWaitingState\(\);\s*locomotion\.reset\(\);\s*resetPlayerRigToSpawn\(\);/);
assert.match(vr, /function handleSessionEnd\(\)[\s\S]*restorePortalWaitingState\(\)/);
assert.match(vr, /crystalCollection\.update\(delta\)/);
assert.match(vr, /glyphOrbit\.update\(delta\)/);
assert.doesNotMatch(vr.match(/onComplete:[\s\S]*?\n  }\n}/)?.[0] ?? '', /portalDisplay\.place|portalCanvas\.hide/);
assert.match(vr, /function restorePortalWaitingState\(\)[\s\S]*portalCanvas\.show/);
assert.match(vr, /locomotion\.setLeftYawLocked\(playerGuidePanel\.isOpen\(\)\)/);
assert.match(vr, /locomotion\.update\(delta\)/);
assert.match(locomotion, /renderer\.xr\.getCamera\(camera\)/);
assert.match(locomotion, /renderer\.xr\.updateCamera\(camera\)/);
assert.match(locomotion, /xrCamera\.isArrayCamera/);
assert.match(locomotion, /playerRig\.position\.addScaledVector/);
assert.match(locomotion, /getPlatformViewerBasis/);
assert.match(locomotion, /constrainRadialStep/);
assert.match(locomotion, /setLeftYawLocked/);
assert.match(locomotion, /if \(!leftYawLocked\) playerRig\.rotateY/);
assert.doesNotMatch(locomotion, /(?:camera|xrCamera|viewerCamera)\.(?:position|rotation|quaternion)\.(?:set|copy|add)/);
assert.doesNotMatch(vr, /createVrGlyphPlaque|createVrPlaqueComposition/);
assert.match(vrControllers, /renderer\.xr\.getController\(0\)/);
assert.match(vrControllers, /renderer\.xr\.getController\(1\)/);
assert.match(glyphInteraction, /new THREE\.Raycaster\(\)/);
assert.match(glyphInteraction, /intersectObjects\(allRaycastObjects, true\)/);
assert.match(glyphInteraction, /objectToGlyph/);
assert.match(crystalCollection, /new THREE\.Raycaster\(\)/);
assert.match(crystalCollection, /currentCrystalHitDistance/);
assert.doesNotMatch(crystalCollection, /currentHit\s*=/);
assert.doesNotMatch(glyphInteraction, /SphereGeometry\(0\.31|VrEntryGlyphMarker|playerRig\.position|playerRig\.rotation/);
assert.doesNotMatch(`${vr}\n${vrControllers}`, /XRControllerModelFactory/);
assert.match(vr, /VR_SCENARIO_EFFECT\.PRESENT_ACTIVE_CARD_PREVIEW[\s\S]*portalCanvas\.show\(resolveExperienceVrPage\(payload\.page, language\)\)/);
assert.equal((vr.match(/portalCanvas\.show\(resolveExperienceVrPage/g) ?? []).length, 1,
  'active-card preview has only the Runtime effect production path');
assert.match(vr, /VR_SCENARIO_EFFECT\.UPDATE_COMMITTED_CARD_PRESENTATION[\s\S]*progressFloor\.activatePage\(payload\.page\)/);
assert.equal((vr.match(/progressFloor\.activatePage\(/g) ?? []).length, 1,
  'single-card floor projection has only the Runtime effect production path');
assert.match(vr, /VR_SCENARIO_EFFECT\.PLAY_CARD_COMMIT_FEEDBACK[\s\S]*playVrWorld\(VR_AUDIO\.reliquaryConsume\)/);
assert.doesNotMatch(scenario, /CUE_MONKEY_AFTER_CARD_COMMIT/,
  'CARD_COMMITTED has no symbolic Monkey attention cue');
assert.doesNotMatch(vr, /CUE_MONKEY_AFTER_CARD_COMMIT/,
  'Runtime has no card-commit Monkey attention handler');
assert.match(vr, /VR_SCENARIO_EFFECT\.SHOW_RELIQUARY_CONTEXT_HINT[\s\S]*reliquaryHints\.showHint\(\)/,
  'the contextual reliquary hint retains its Runtime guidance path');
assert.match(reliquaryHints, /showHint\(\)[\s\S]*monkeyGuide\.notifyAttention\(\)/,
  'the contextual reliquary hint still requests Monkey attention');
assert.match(monkeyGuide, /if \(hit\.kind === 'monkey'\) \{\s*clearAttention\(\);\s*if \(dialogueOverride\?\.onMonkeyPress\)/,
  'a recognized Monkey press clears attention before dialogue override delegation');
assert.match(vr, /VR_SCENARIO_EFFECT\.COMPLETE_FIRST_RING_PRESENTATION[\s\S]*firstRingFlow\.beginPresentation\(\)/,
  'Runtime starts the first-ring presentation owner');
assert.equal((firstRingFlowSource.match(/progressFloor\.completeTier\(1\)/g) ?? []).length, 1,
  'first-ring presentation has one visual floor-completion consequence');
assert.equal((`${vr}\n${firstRingFlowSource}`.match(/dispatch\(VR_SCENARIO_EVENT\.FIRST_RING_PRESENTATION_COMPLETED\)/g) ?? []).length, 1,
  'first-ring presentation owner has exactly one semantic completion producer');
assert.match(firstRingFlowSource, /presentationCompleted = true;\s*dispatch\(VR_SCENARIO_EVENT\.FIRST_RING_PRESENTATION_COMPLETED\)/,
  'the owner latches completion before dispatching it');
assert.match(vr, /progressFloor\.update\(delta\);\s*firstRingFlow\.update\(delta\);/,
  'the production render loop advances the first-ring presentation owner');
assert.match(vr, /VR_SCENARIO_EFFECT\.PLAY_FIRST_RING_COMPLETE_FEEDBACK[\s\S]*playVrWorld\(VR_AUDIO\.tierComplete\)/,
  'Runtime owns first-ring completion audio feedback');
assert.equal((vr.match(/playVrWorld\(VR_AUDIO\.tierComplete\)/g) ?? []).length, 1,
  'first-ring completion audio has only the Runtime effect production path');
const tierCompletionBlock = firstRingFlowSource.match(/if \(!tierCompleted\) return;[\s\S]*?syncAmbientSequence\(\);/)?.[0] ?? '';
assert.match(tierCompletionBlock, /if \(page\.order === 1\) dispatch\(VR_SCENARIO_EVENT\.FIRST_RING_COMPLETED, \{ page \}\);/,
  'the domain-owner-reported first-tier completion emits the durable first-ring Scenario fact');
assert.doesNotMatch(tierCompletionBlock, /progressFloor\.completeTier|playVrWorld\(VR_AUDIO\.tierComplete\)/,
  'the direct post-dispatch block no longer executes authored first-ring consequences');
assert.doesNotMatch(tierCompletionBlock, /syncTierOneWorldState|syncQaPostP1WorldState|shellSystem\.setActive/,
  'live tier completion does not activate the post-P1 QA world state or shell field');
assert.match(tierCompletionBlock, /syncAmbientSequence\(\);/,
  'ambient domain-state projection remains in the live tier-completion flow');
assert.doesNotMatch(scenario, /SYNC_TIER_ONE_WORLD_STATE|SYNC_AMBIENT_SEQUENCE/,
  'world-state and ambient synchronization were not migrated into Scenario effects');
assert.doesNotMatch(vr, /isUnlocked: \(\) => progressionController\.isTierComplete\(1\)/,
  'Tier 1 completion is not the production Astro permission');
assert.match(vr, /isUnlocked: \(\) => introQaBypass \|\| runtimeExperience\.can\(VR_SCENARIO_CAPABILITY\.CAN_EQUIP_ASTRO\)/,
  'Astro permission is Scenario-owned while preserving the explicit QA bypass');
assert.match(vr, /function syncQaPostP1WorldState\(\) \{\s*if \(postP1Qa\) shellSystem\.setActive\(true\);\s*\}/,
  'shell activation is isolated behind the explicit post-P1 QA route');
assert.doesNotMatch(vr, /shellSystem\.setActive\(progressionController\.isTierComplete\(1\)\)/,
  'session reset and re-entry cannot project Tier 1 completion into shell visibility');
assert.match(vr, /loadMonkeyModel\(\{ actorParent: progressFloor\.object, fixtureParent: progressFloor\.object/,
  'Monkey stone is a stationary platform child, not a hidden fixtures child');
assert.match(vr, /roots: \[monkeyVisualRoot, glyphRing, monkeyStoneRoot\]/);
assert.doesNotMatch(vr, /roots: \[worldStableRoot\]/);
assert.match(vr, /monkeyMotionRoot\.position\.set\(settings\.spatial\.monkeyFinal[\s\S]*monkeyActor\.dockCharacterToStone\(\)/);
assert.doesNotMatch(vr, /sceneLayout|uklad_sceny|ANCHOR_PLAYER_SPAWN/);
assert.doesNotMatch(vr, /progressFloor\.object\.attach|platformFixturesRoot\.attach|floorPassengerRoot\.attach/);
assert.match(vr, /createVrPortalDisplay\(\{[\s\S]*parent: platformFixturesRoot/);
assert.doesNotMatch(vr, /createVrPortalDisplay\([\s\S]*anchorObject: monkeyMotionRoot/);

assert.equal(XR_STANDARD_BUTTONS.togglePlayerGuidePanel, 5, 'LEFT Y uses the standard Y button slot');
assert.equal(XR_STANDARD_BUTTONS.toggleLeftTool, 4, 'LEFT X mapping is preserved');
assert.equal(XR_STANDARD_BUTTONS.toggleRightTool, 4, 'RIGHT A mapping is preserved');
const leftButtons = Array.from({ length: 6 }, () => ({ pressed: false, value: 0 }));
const rightButtons = Array.from({ length: 5 }, () => ({ pressed: false, value: 0 }));
const semanticInputRuntime = createVrSemanticInput({ renderer: { xr: { getSession: () => ({ inputSources: [
  { handedness: 'left', gamepad: { buttons: leftButtons, axes: [0, 0, 0, -0.8] } },
  { handedness: 'right', gamepad: { buttons: rightButtons, axes: [0, 0, 0, 0] } }
] }) } } });
leftButtons[5].pressed = true;
leftButtons[0].value = 0.72;
rightButtons[4].pressed = true;
rightButtons[0].value = 0.33;
rightButtons[1].value = 0.44;
let semanticState = semanticInputRuntime.update();
assert.equal(semanticState.togglePlayerGuidePanel, true, 'LEFT Y is edge-triggered');
assert.equal(semanticState.toggleRightTool, true, 'RIGHT A edge remains available');
assert.equal(semanticState.toggleLeftTool, false, 'LEFT X does not share the Y edge');
assert.equal(semanticState.leftPrimaryAction, 0.72, 'left trigger is exposed separately');
assert.equal(semanticState.primaryAction, 0.33, 'right trigger is preserved');
assert.equal(semanticState.grabAction, 0.44, 'right grab is preserved');
assert.equal(semanticState.leftStickY, -0.8, 'left joystick vertical axis is exposed');
semanticState = semanticInputRuntime.update();
assert.equal(semanticState.togglePlayerGuidePanel, false, 'held LEFT Y does not retrigger');
leftButtons[5].pressed = false;
semanticInputRuntime.update();
leftButtons[4].pressed = true;
semanticState = semanticInputRuntime.update();
assert.equal(semanticState.toggleLeftTool, true, 'LEFT X edge still works after Y release');
semanticInputRuntime.reset();
assert.equal(semanticInputRuntime.getState().leftPrimaryAction, 0);
assert.match(playerGuidePanelSource, /new THREE\.CanvasTexture\(canvas\)/);
assert.match(playerGuidePanelSource, /leftGrip\?\.add\?\.\(object\)/);
assert.match(playerGuidePanelSource, /togglePlayerGuidePanel/);
assert.doesNotMatch(playerGuidePanelSource, /leftPrimaryAction/, 'panel confirm must not use the left trigger/primary action');
assert.match(playerGuidePanelSource, /leftStickY/);
assert.match(playerGuideContentSource, /pl:[\s\S]*id: 'controls'[\s\S]*id: 'current-task'/, 'PL guide orders controls before current task');
assert.match(playerGuideContentSource, /en:[\s\S]*id: 'controls'[\s\S]*id: 'current-task'/, 'EN guide orders controls before current task');
assert.doesNotMatch(vr, /isPlayerGuidePanelOpen\(\) && record\.handedness === 'left'/, 'open panel alone must not block ordinary left interactions');
assert.match(vr, /playerGuidePanel\.reset\(\)/);
assert.match(vr, /playerGuidePanel\.dispose\(\)/);

assert.match(playerGuidePanelSource, /VIEW_STATE = Object\.freeze\(\{ MENU: 'MENU', DETAIL: 'DETAIL' \}\)/, 'panel uses explicit menu/detail state');
assert.match(playerGuidePanelSource, /viewState = VIEW_STATE\.MENU/);
assert.match(playerGuidePanelSource, /activeSectionId = null/, 'panel does not automatically open the first card');
assert.match(playerGuidePanelSource, /content\.menuHint/);
assert.match(playerGuidePanelSource, /content\.detailHint/);
assert.match(playerGuidePanelSource, /locale === 'pl' \? 'svg\/controllers_pl\.svg' : 'svg\/controllers_en\.svg'/, 'localized controller SVGs are loaded through base-safe publicPath');
assert.doesNotMatch(playerGuideContentSource, /Prawy drążek — ruch|Right stick — move/, 'duplicated controls list copy is removed');
assert.match(playerGuideContentSource, /Lewy drążek — wybór · X — otwórz · Y — zamknij/);
assert.match(playerGuideContentSource, /Left stick — select · X — open · Y — close/);
assert.match(playerGuideContentSource, /Lewy drążek — wybór · X — otwórz · Y — wróć/);
assert.match(playerGuideContentSource, /Left stick — select · X — open · Y — back/);
assert.match(playerGuidePanelSource, /controllersImage\.onload = null;\s*controllersImage\.onerror = null;/, 'panel dispose clears SVG image callbacks');
assert.match(playerGuidePanelSource, /function reset\(\)[\s\S]*setOpen\(false\)/, 'panel reset closes without recreating resources');
assert.match(vr, /isLeftToolToggleBlocked: \(\) => playerGuidePanel\.isOpen\(\)/, 'LEFT X is context-arbitrated by panel openness');
assert.doesNotMatch(vr, /isPlayerGuidePanelOpen\(\)[\s\S]{0,160}activateButton|isPlayerGuidePanelOpen\(\)[\s\S]{0,160}crystalCollection|isPlayerGuidePanelOpen\(\)[\s\S]{0,160}glyphInteraction/, 'panel openness is not used as a trigger/grip interaction blocker');

const leftToggleCalls = [];
const mockSemantic = {
  input: { toggleLeftTool: false, toggleRightTool: false, primaryAction: 0 },
  update() { return this.input; },
  reset() { this.input.toggleLeftTool = false; }
};
const handController = createVrHandModeController({
  controllers: [{ handedness: 'left', isConnected: true, ray: { visible: true } }, { handedness: 'right', isConnected: true, ray: { visible: true } }],
  semanticInput: mockSemantic,
  attractorTool: {
    setUnlocked() {}, attachToTargetRay() {}, setEquipped() {}, setTrigger() {}, update() {}, reset() {}, dispose() {}
  },
  asterionSphere: { equipTo: () => leftToggleCalls.push('equip'), unequip: () => leftToggleCalls.push('unequip') },
  isUnlocked: () => true,
  isAsterionAvailable: () => true,
  isLeftToolToggleBlocked: () => true
});
mockSemantic.input.toggleLeftTool = true;
handController.update(0.016);
assert.equal(handController.getLeftMode(), VR_LEFT_HAND_MODES.NORMAL_HAND, 'open panel X does not toggle Asterion');
assert.deepEqual(leftToggleCalls, ['unequip'], 'blocked X only keeps current left equipment synced');
const handControllerClosed = createVrHandModeController({
  controllers: [{ handedness: 'left', isConnected: true, ray: { visible: true } }, { handedness: 'right', isConnected: true, ray: { visible: true } }],
  semanticInput: mockSemantic,
  attractorTool: {
    setUnlocked() {}, attachToTargetRay() {}, setEquipped() {}, setTrigger() {}, update() {}, reset() {}, dispose() {}
  },
  asterionSphere: { equipTo: () => {}, unequip: () => {} },
  isUnlocked: () => true,
  isAsterionAvailable: () => true,
  isLeftToolToggleBlocked: () => false
});
handControllerClosed.update(0.016);
assert.equal(handControllerClosed.getLeftMode(), VR_LEFT_HAND_MODES.ASTERION_SPHERE, 'closed panel X toggles Asterion again');


assert.match(vr, /const experienceRoot = new THREE\.Group\(\);[\s\S]*experienceRoot\.name = 'ExperienceVrRoot'/);
assert.match(vr, /worldStableRoot\.name = 'WorldStableRoot';[\s\S]*experienceRoot\.add\(worldStableRoot\)/);
assert.match(vr, /progressFloor = createVrProgressFloor\(\{[\s\S]*parent: experienceRoot/);
assert.match(vr, /progressFloor\.object\.add\(platformFixturesRoot\)/);
assert.match(vr, /progressFloor\.object\.add\(floorPassengerRoot\);\s*floorPassengerRoot\.add\(playerRig\)/);
assert.match(vr, /parent: platformFixturesRoot,[\s\S]*portalModel/);
assert.match(vr, /createVrAstroFurnace\(\{[\s\S]*parent: platformFixturesRoot/);
assert.match(vr, /createVrCrystalReliquary\(\{[\s\S]*parent: platformFixturesRoot/);
assert.match(vr, /createVrAstroFurnacePanel\(\{[\s\S]*parent: platformFixturesRoot/);
assert.match(vr, /walkRadius: floorWalkRadius/);
assert.match(vr, /parent: portalDisplay\.object,[\s\S]*surface: portalDisplay\.canvasSurface/);
assert.match(vr, /crystalReliquary\.attachCompanion\(\{ id: 'activate'/);
assert.match(vr, /crystalReliquary\.attachCompanion\(\{ id: 'release'/);
assert.match(portalDisplay, /object\.position\.set\(settings\.position\.x, settings\.position\.y, settings\.position\.z\)/);
assert.match(crystalReliquary, /reliquaryWorldPosition\.copy\(portalWorldPosition\)[\s\S]*\.addScaledVector\(portalForward, settings\.distanceFromPortal \?\? 1\.5\);[\s\S]*object\.position\.copy\(parent\.worldToLocal\(reliquaryWorldPosition\)\)/);
assert.match(astroFurnace, /object\.position\.set\(settings\.position\.x, settings\.position\.y, settings\.position\.z\)/);
assert.match(crystalReliquary, /applyWorldTransform\(insertFeedback, sphere\.center/);
assert.match(furnacePanel, /applyWorldTransform\(root, desiredWorldPosition/);

const canonicalRoot = new THREE.Group();
const worldStable = new THREE.Group();
const floorRoot = new THREE.Group();
const fixturesRoot = new THREE.Group();
const passengerRoot = new THREE.Group();
const rig = new THREE.Group();
canonicalRoot.add(worldStable, floorRoot); floorRoot.add(fixturesRoot, passengerRoot); passengerRoot.add(rig);
assert.deepEqual(floorRoot.position.toArray(), [0, 0, 0]);
assert.equal(rig.parent, passengerRoot);
const fixture = new THREE.Group(); fixture.position.set(2, 0, -1); fixturesRoot.add(fixture);
const localFixturePosition = fixture.position.clone();
floorRoot.quaternion.setFromEuler(new THREE.Euler(.2, .3, -.1)); canonicalRoot.updateMatrixWorld(true);
assert.deepEqual(fixture.position.toArray(), localFixturePosition.toArray(), 'tilt changes inheritance, not canonical local placement');

assert.doesNotMatch(crystalCollection, /CANNON|Ammo|Rapier|gravity|throwVelocity|linearVelocity|angularVelocity/i);
assert.doesNotMatch(vrControllers, /controller\.(position|rotation|quaternion)\.(set|copy)/);

const controllerObjects = [new THREE.Group(), new THREE.Group()];
const controllerGrips = [new THREE.Group(), new THREE.Group()];
const playerRig = new THREE.Group();
const controllerSystem = createVrControllers({
  renderer: { xr: { getController: (index) => controllerObjects[index], getControllerGrip: (index) => controllerGrips[index] } },
  playerRig,
  settings: { enabled: true, rayLength: 2.3, rayOpacity: 0.7, rayDiameter: 0.01, rayTipFraction: 0.08, rayRadialSegments: 6 }
});
assert.equal(controllerSystem.controllers.length, 2);
assert.equal(playerRig.children.length, 4);
const [left, right] = controllerSystem.controllers;
assert.equal(left.ray.visible, false);
assert.equal(left.grip, controllerGrips[0]);
assert.equal(left.holdSocket.parent, left.grip);
left.controller.dispatchEvent({ type: 'connected', data: { handedness: 'left', targetRayMode: 'tracked-pointer', profiles: ['meta-quest-touch-plus'] } });
right.controller.dispatchEvent({ type: 'connected', data: { targetRayMode: 'tracked-pointer' } });
assert.equal(left.handedness, 'left');
assert.deepEqual(left.controller.userData.xrInput.profiles, ['meta-quest-touch-plus']);
assert.equal(right.handedness, '');
assert.equal(left.ray.visible, false, 'connected ray remains hidden behind the global gate');
controllerSystem.setRaysEnabled(true);
assert.equal(left.ray.visible, true); assert.equal(right.ray.visible, true);
assert.equal(left.currentRayLength, 2.3);
assert.equal(left.ray.children.length, 2, 'ray uses a shaft and tapered mesh tip');
assert.equal(left.ray.children[0].geometry.parameters.radiusTop * 2, 0.01, 'ray shaft uses configured diameter');
controllerSystem.beginRayHitFrame();
left.reportRayHit(1.5);
left.reportRayHit(0.9);
right.reportRayHit(1.2);
controllerSystem.resolveVisualRayLength();
assert.equal(left.visualRayLength, 0.9, 'the nearest valid hit controls visual length');
assert.equal(right.visualRayLength, 1.2);
assert.equal(left.ray.children[0].scale.x, 1, 'shaft diameter scale remains constant');
assert.equal(left.ray.children[0].scale.z, 1, 'shaft diameter scale remains constant');
assert.ok(Math.abs(left.ray.children[1].position.z
  - left.ray.children[1].geometry.parameters.height * left.ray.children[1].scale.y / 2 + 0.9) < 1e-12,
  'tip ends at the resolved visual distance');
controllerSystem.beginRayHitFrame();
controllerSystem.resolveVisualRayLength();
assert.equal(left.visualRayLength, 2.3, 'a frame without hits restores maximum length');
left.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(left.isSelecting, true);
assert.equal(left.ray.scale.z, 1);
assert.equal(left.currentRayLength, 2.3, 'select does not extend interaction range');
assert.equal(right.isSelecting, false);
left.controller.dispatchEvent({ type: 'selectend' });
assert.equal(left.isSelecting, false);
assert.equal(left.ray.scale.z, 1);
left.controller.dispatchEvent({ type: 'disconnected' });
assert.equal(left.ray.visible, false);
controllerSystem.setRaysEnabled(true); assert.equal(left.ray.visible, false, 'disconnected ray ignores the enabled gate');
assert.equal(left.isConnected, false);
assert.equal(left.nearestRayHitDistance, null);
assert.equal(left.visualRayLength, 2.3, 'disconnect clears shortened visual state');
assert.equal('xrInput' in left.controller.userData, false);
controllerSystem.dispose();
controllerSystem.dispose();
assert.equal(playerRig.children.length, 0);
left.controller.dispatchEvent({ type: 'connected', data: { handedness: 'left' } });
assert.equal(left.isConnected, false);

console.log('Experience VR static contract assertions passed');
