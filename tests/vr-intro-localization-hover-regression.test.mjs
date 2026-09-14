import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS } from '../src/config/experienceVrSettings.js';
import { createVrIntroSequence, VR_INTRO_COPY, VR_INTRO_STATE } from '../src/xr/guidance/createVrIntroSequence.js';
import { createVrMonkeyGuide } from '../src/xr/guidance/createVrMonkeyGuide.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { VR_EXPERIENCE_POINT, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT,
  vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

globalThis.Image = class { set src(value) { this.url = value; } };
globalThis.document = {
  createElement() {
    return { width: 0, height: 0, getContext: () => ({ clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {},
      arcTo() {}, closePath() {}, fill() {}, stroke() {}, fillRect() {}, drawImage() {},
      measureText: (text) => ({ width: String(text).length * 12 }), fillText() {} }) };
  }
};

function advanceMessages(intro) {
  for (let index = 0; index < 32 && intro.getState() === VR_INTRO_STATE.CONTROLLER_ONBOARDING; index += 1) {
    intro.update(0.01);
  }
}

for (const locale of ['pl', 'en']) {
  assert.equal(Object.isFrozen(VR_INTRO_COPY[locale].panelDone), false,
    `${locale}: localized presentation is adapted to the pre-localization actor-facing shape`);
  const floor = new THREE.Group();
  const monkeyMotionRoot = new THREE.Group(); floor.add(monkeyMotionRoot);
  const monkeyVisualRoot = new THREE.Group(); monkeyMotionRoot.add(monkeyVisualRoot);
  const monkeyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  monkeyVisualRoot.add(monkeyMesh);
  const controller = new THREE.Group(); floor.add(controller);
  const controllerRecord = { controller, currentRayLength: 3, reportRayHit() {} };
  const monkeyGuideSettings = structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide);
  const monkeyGuide = createVrMonkeyGuide({ actorRoot: monkeyMotionRoot, visualRoot: monkeyVisualRoot,
    floorRoot: floor, controllers: [controllerRecord], progressionController: { getActivatedPageIds: () => [] },
    locale, settings: monkeyGuideSettings });
  const panel = { open: false, section: null, view: 'MENU', isOpen() { return this.open; },
    getActiveSectionId() { return this.section; }, getViewState() { return this.view; } };
  const introSettings = { ...structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.intro), locale,
    messageDisplayDuration: 0, messageGapDuration: 0, questionGapDuration: 0 };
  let runtime;
  const intro = createVrIntroSequence({ monkeyGuide, monkeyMotionRoot, monkeyVisualRoot, playerRig: new THREE.Group(),
    playerGuidePanel: panel, largeGlyphActor: { setPresentationVisible() {} }, progressFloor: { object: floor },
    platformFixturesRoot: new THREE.Group(), locomotion: { setWalkRadius() {} },
    spatial: { entryDirection: { x: 0, y: 0, z: 1 }, monkeyStartRadius: 18,
      monkeyFinal: { x: 0, y: 0, z: 0 }, worldBaseRadius: 7.6 }, settings: introSettings,
    onMonkeyHovered: () => runtime.dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED) });

  intro.beginControllerOnboarding(); advanceMessages(intro);
  panel.open = true; intro.update(0);
  intro.continueControllerOnboarding(); panel.section = 'controls'; panel.view = 'SECTION_DETAIL'; intro.update(0);
  intro.continueControllerOnboarding(); panel.open = false; intro.update(0);
  assert.equal(intro.getState(), VR_INTRO_STATE.WAIT_RUNTIME_AFTER_PLAYER_GUIDE_CLOSED, `${locale}: panel close fact`);

  runtime = new RuntimeExperience({
    director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: VR_EXPERIENCE_POINT['1.70'] }),
    effectHandlers: {
      [VR_SCENARIO_EFFECT.SET_INTRO_AMBIENT_03]: () => {},
      [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => {
        assert.equal(intro.continueControllerOnboarding(), true, `${locale}: destination entry effect accepted by Intro`);
      }
    }
  });
  runtime.activateCurrentPoint(); advanceMessages(intro);
  assert.equal(intro.getState(), VR_INTRO_STATE.WAIT_HOVER, `${locale}: localized afterPlayerGuide arms hover`);

  const monkeyPosition = monkeyMotionRoot.getWorldPosition(new THREE.Vector3());
  controller.position.copy(monkeyPosition).add(new THREE.Vector3(0, 0, 2));
  floor.updateMatrixWorld(true);
  monkeyGuide.update(0);

  assert.equal(runtime.getCurrentPointId(), VR_EXPERIENCE_POINT['1.80'], `${locale}: real Scenario accepts MONKEY_HOVERED`);
  assert.equal(intro.getState(), VR_INTRO_STATE.WAIT_TRIGGER, `${locale}: Intro reaches WAIT_TRIGGER`);
  assert.equal(monkeyGuide.messagePanel.group.visible, true, `${locale}: Trigger instruction is visible`);
  assert.equal(locale === 'pl' ? VR_INTRO_COPY.pl.trigger : VR_INTRO_COPY.en.trigger,
    locale === 'pl' ? 'Teraz spust.' : 'Now the Trigger.');

  runtime.dispose(); monkeyGuide.dispose(); monkeyMesh.geometry.dispose(); monkeyMesh.material.dispose();
}

console.log('VR Intro localized Monkey-hover production chain regression test passed.');
