import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS } from '../src/config/experienceVrSettings.js';

const drawnText = [];
globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return {
      width: 0, height: 0,
      getContext(type) {
        assert.equal(type, '2d');
        return {
          clearRect() {}, beginPath() {}, moveTo() {}, arcTo() {}, closePath() {}, fill() {},
          measureText(text) { return { width: String(text).length * 24 }; },
          fillText(text) { drawnText.push(String(text)); },
          set fillStyle(value) {}, set font(value) {}, set textAlign(value) {},
          set textBaseline(value) {}, set globalAlpha(value) {}
        };
      }
    };
  }
};

const { createVrMonkeyGuide } = await import('../src/xr/guidance/createVrMonkeyGuide.js');

const monkeyAnchor = new THREE.Group();
const monkeyGeometry = new THREE.BoxGeometry(1, 1, 1);
const monkeyMaterial = new THREE.MeshBasicMaterial();
monkeyAnchor.add(new THREE.Mesh(monkeyGeometry, monkeyMaterial));
const controller = new THREE.Group();
controller.position.set(0, 0, 2);
let rayDistance = null;
const record = {
  controller,
  currentRayLength: 2.3,
  reportRayHit(distance) { rayDistance = distance; }
};
const pageIds = [];
const guide = createVrMonkeyGuide({
  monkeyAnchor,
  controllers: [record],
  progressionController: { getActivatedPageIds: () => [...pageIds] },
  locale: 'en',
  settings: structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide)
});

assert.equal(guide.object.parent, monkeyAnchor, 'guide inherits the monkey anchor transform');
assert.equal(guide.messagePanel.planes.length, 2);
assert.equal(guide.dialoguePanel.planes.length, 2);
assert.ok(guide.messagePanel.planes.every(({ material }) => material.side === THREE.FrontSide));
assert.equal(guide.messagePanel.planes[1].rotation.y, Math.PI, 'back uses its own rotated FrontSide plane');
assert.equal(guide.arcs.length, 3);
assert.equal(guide.attentionRoot.visible, false);

guide.update(0.016);
assert.ok(rayDistance > 0 && rayDistance <= 2.3, 'monkey hit reports the ordinary ray distance');
assert.equal(guide.halo.visible, true, 'hovering the monkey shows its halo');
record.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(guide.isOpen(), true, 'trigger on the monkey opens dialogue');
assert.ok(drawnText.includes('CLOSE'));
assert.equal(drawnText.includes('HOW AM I DOING?'), false, 'progress option is hidden at zero cards');

guide.close();
pageIds.push('first-page');
guide.open();
assert.ok(drawnText.includes('HOW AM I DOING?'), 'progress option appears after a commit');
guide.hits.set(record, { kind: 'panel', region: { id: 'progress' } });
assert.equal(guide.press(record), true);
assert.ok(drawnText.includes('Discovered cards: 1.'), 'message reads the controller-owned count');

guide.notifyAttention();
assert.equal(guide.isAttentionPending(), true);
guide.update(0.2);
assert.equal(guide.attentionRoot.visible, true);
assert.ok(new Set(guide.arcs.map(({ material }) => material.opacity)).size > 1, 'attention arcs pulse sequentially');
guide.open();
assert.equal(guide.isAttentionPending(), false, 'opening dialogue clears pending attention');

guide.reset();
assert.equal(guide.isOpen(), false);
assert.equal(guide.messagePanel.group.visible, false);
guide.dispose();
assert.equal(guide.object.parent, null);
assert.equal(controller._listeners?.selectstart?.length ?? 0, 0, 'dispose removes trigger listener');

monkeyGeometry.dispose();
monkeyMaterial.dispose();
console.log('VR monkey guide assertions passed');
