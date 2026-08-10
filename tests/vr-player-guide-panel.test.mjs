import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { readFile } from 'node:fs/promises';
import { CONTROLLER_SEMANTIC_IDS, filterControllerSvg, INITIAL_VISIBLE_CONTROL_IDS } from '../src/xr/guidance/filterControllerSvg.js';

const textLog = [];
const imageLog = [];
const createdImages = [];
const revokedUrls = [];
const blobs = new Map();
let blobIndex = 0;

globalThis.fetch = async (url) => ({ ok: true, text: () => readFile(new URL(`../public${url}`, import.meta.url), 'utf8') });
globalThis.URL.createObjectURL = (blob) => { const url = `blob:test-${++blobIndex}`; blobs.set(url, blob); return url; };
globalThis.URL.revokeObjectURL = (url) => { revokedUrls.push(url); blobs.delete(url); };

class MockSvgDocument {
  constructor(source) { this.source = source; this.documentElement = { localName: source.includes('<svg') ? 'svg' : 'parsererror' }; }
  querySelector(selector) { return selector === 'parsererror' && this.documentElement.localName !== 'svg' ? {} : null; }
  getElementById(id) {
    const pattern = new RegExp(`(<[^>]+\\bid=["']${id}["'][^>]*)(>)`);
    if (!pattern.test(this.source)) return null;
    return { setAttribute: (name, value) => {
      this.source = this.source.replace(pattern, (match, start, end) => {
        const clean = start.replace(new RegExp(`\\s${name}=["'][^"']*["']`), '');
        return `${clean} ${name}="${value}"${end}`;
      });
    } };
  }
}
globalThis.DOMParser = class { parseFromString(source) { return new MockSvgDocument(source); } };
globalThis.XMLSerializer = class { serializeToString(document) { return document.source; } };

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

async function settleLoads() {
  await new Promise((resolve) => setTimeout(resolve, 10));
  for (let attempt = 0; attempt < 20 && !createdImages.at(-1)?.src; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

assert.deepEqual(CONTROLLER_SEMANTIC_IDS, ['trigger', 'grab', 'rotate', 'move', 'X', 'Y']);
assert.deepEqual(INITIAL_VISIBLE_CONTROL_IDS, ['trigger', 'grab', 'rotate', 'move', 'Y']);
const sourceSvg = await readFile(new URL('../public/svg/controllers_en.svg', import.meta.url), 'utf8');
const filteredSvg = filterControllerSvg(sourceSvg, INITIAL_VISIBLE_CONTROL_IDS);
for (const id of INITIAL_VISIBLE_CONTROL_IDS) assert.match(filteredSvg, new RegExp(`id="${id}"[^>]*display="inline"`));
assert.match(filteredSvg, /id="X"[^>]*display="none"/, 'X starts hidden in the diagram');

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
await settleLoads();
assert.match(createdImages.at(-1).src, /^blob:test-/);
assert.equal(english.panel.getViewState(), 'MENU');
assert.equal(english.panel.getSelectedIndex(), 0);
assert.equal(english.panel.getActiveSectionId(), null, 'first tab is not opened automatically');
assert.equal(english.panel.object.position.x, 0.29);
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
await settleLoads();
assert.match(createdImages.at(-1).src, /^blob:test-/);
pulse(polish, 'togglePlayerGuidePanel');
pulse(polish, 'toggleLeftTool');
createdImages.at(-1).onload();
assert.equal(imageLog.length > 0, true, 'loaded SVG is drawn');
assert.equal(textLog.some(({ text }) => text === 'Prawy drążek — ruch' || text === 'Right stick — move'), false, 'extra controls list is not drawn');

const previousUrl = createdImages.at(-1).src;
const previousBlobIndex = blobIndex;
polish.panel.setVisibleControlIds([...INITIAL_VISIBLE_CONTROL_IDS]);
await settleLoads();
assert.equal(blobIndex, previousBlobIndex, 'equivalent visible IDs do not reload the SVG');
polish.panel.setVisibleControlIds(CONTROLLER_SEMANTIC_IDS);
await settleLoads();
assert.ok(revokedUrls.includes(previousUrl), 'replaced filtered SVG URL is revoked');
assert.deepEqual(polish.panel.getVisibleControlIds(), CONTROLLER_SEMANTIC_IDS);

const fallback = createFixture('en');
await settleLoads();
pulse(fallback, 'togglePlayerGuidePanel');
pulse(fallback, 'toggleLeftTool');
createdImages.at(-1).onerror();
assert.equal(textLog.some(({ text }) => text === 'Controller diagram unavailable.'), true, 'fallback text is drawn when SVG loading fails');
const fallbackUrl = createdImages.at(-1).src;
fallback.panel.dispose();
assert.ok(revokedUrls.includes(fallbackUrl), 'dispose revokes the filtered SVG URL');

console.log('VR player guide panel assertions passed');
