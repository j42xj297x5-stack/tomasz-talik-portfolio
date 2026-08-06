import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';

const textLog = [];
const imageLog = [];
const createdImages = [];

globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return {
      width: 0,
      height: 0,
      getContext(type) {
        assert.equal(type, '2d');
        return {
          clearRect() {}, fillRect() {}, strokeRect() {}, drawImage(...args) { imageLog.push(args); },
          measureText(text) { return { width: String(text).length * 12 }; },
          fillText(text, x, y) { textLog.push({ text, x, y }); },
          set fillStyle(value) {}, set strokeStyle(value) {}, set lineWidth(value) {}, set font(value) {},
          set textAlign(value) {}, set textBaseline(value) {}
        };
      }
    };
  }
};

globalThis.Image = class MockImage {
  constructor() {
    this.naturalWidth = 960;
    this.naturalHeight = 540;
    createdImages.push(this);
  }
  set src(value) { this._src = value; }
  get src() { return this._src; }
};

const { createVrPlayerGuidePanel } = await import('../src/xr/guidance/createVrPlayerGuidePanel.js');

function createFixture(locale = 'en') {
  const grip = new THREE.Group();
  const input = { togglePlayerGuidePanel: false, toggleLeftTool: false, leftStickY: 0 };
  const panel = createVrPlayerGuidePanel({ leftGrip: grip, locale, semanticInput: { getState: () => input } });
  return { panel, input, grip };
}

function pulse(fixture, key) {
  fixture.input[key] = true;
  fixture.panel.update(0.016);
  fixture.input[key] = false;
  fixture.panel.update(0.016);
}

function stick(fixture, y) {
  fixture.input.leftStickY = y;
  fixture.panel.update(0.016);
  fixture.input.leftStickY = 0;
  fixture.panel.update(0.016);
}

const english = createFixture('en');
assert.equal(createdImages.at(-1).src, '/svg/controllers_en.svg');
assert.equal(english.panel.getViewState(), 'MENU');
assert.equal(english.panel.getSelectedIndex(), 0);
assert.equal(english.panel.getActiveSectionId(), null, 'first tab is not opened automatically');
assert.equal(english.panel.object.position.x, 0.49);
assert.ok(Math.abs(english.panel.object.rotation.x - (-52 * Math.PI / 180)) < 1e-12);
pulse(english, 'togglePlayerGuidePanel');
assert.equal(english.panel.isOpen(), true);
stick(english, 0.8);
assert.equal(english.panel.getSelectedIndex(), 1, 'leftStickY navigates the vertical menu');
pulse(english, 'toggleLeftTool');
assert.equal(english.panel.getViewState(), 'DETAIL', 'X opens selected card');
assert.equal(english.panel.getActiveSectionId(), 'current-task');
stick(english, -0.8);
assert.equal(english.panel.getActiveSectionId(), 'current-task', 'leftStickY does not change selection in detail view');
pulse(english, 'togglePlayerGuidePanel');
assert.equal(english.panel.isOpen(), true, 'Y from a card returns to menu');
assert.equal(english.panel.getViewState(), 'MENU');
pulse(english, 'togglePlayerGuidePanel');
assert.equal(english.panel.isOpen(), false, 'Y from menu closes panel');
stick(english, 0.8);
pulse(english, 'toggleLeftTool');
english.panel.reset();
assert.equal(english.panel.isOpen(), false);
assert.equal(english.panel.getViewState(), 'MENU');
assert.equal(english.panel.getSelectedIndex(), 0, 'reset returns to controls selected');
assert.equal(english.panel.getActiveSectionId(), null);

const polish = createFixture('pl');
assert.equal(createdImages.at(-1).src, '/svg/controllers_pl.svg');
pulse(polish, 'togglePlayerGuidePanel');
pulse(polish, 'toggleLeftTool');
createdImages.at(-1).onload();
assert.equal(imageLog.length > 0, true, 'loaded SVG is drawn');
assert.equal(textLog.some(({ text }) => text === 'Prawy drążek — ruch' || text === 'Right stick — move'), false, 'extra controls list is not drawn');

const fallback = createFixture('en');
pulse(fallback, 'togglePlayerGuidePanel');
pulse(fallback, 'toggleLeftTool');
createdImages.at(-1).onerror();
assert.equal(textLog.some(({ text }) => text === 'Controller diagram unavailable.'), true, 'fallback text is drawn when SVG loading fails');

console.log('VR player guide panel assertions passed');
