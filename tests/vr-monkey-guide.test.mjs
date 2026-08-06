import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS } from '../src/config/experienceVrSettings.js';
import { experienceVrPages, resolveExperienceVrPage } from '../src/content/experienceVrPages.js';
import { resolveVrPageProtoAstro } from '../src/xr/protoAstro/resolveVrPageProtoAstro.js';

const drawnText = [];
globalThis.Image = class {
  complete = false; naturalWidth = 0;
  set src(value) { this.url = value; }
};
globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return {
      width: 0, height: 0,
      getContext(type) {
        assert.equal(type, '2d');
        return {
          clearRect() {}, beginPath() {}, moveTo() {}, arcTo() {}, closePath() {}, fill() {}, drawImage() {},
          measureText(text) { return { width: String(text).length * 24 }; },
          fillText(text) { drawnText.push(String(text)); },
          set fillStyle(value) {}, set font(value) {}, set textAlign(value) {},
          set textBaseline(value) {}, set globalAlpha(value) {}
        };
      }
    };
  }
};

const { createVrMonkeyGuide, VR_MONKEY_GUIDE_SCREEN } = await import('../src/xr/guidance/createVrMonkeyGuide.js');

const expectedFamilies = {
  'ethics-life-protection': 'KA', 'spotify-digger': 'TA', 'haiku-cosmos': 'SA',
  'ai-guide': 'LA', 'creative-ai': 'RA'
};
for (const [glyphId, syllable] of Object.entries(expectedFamilies)) {
  const page = experienceVrPages.find((candidate) => candidate.glyphId === glyphId);
  const resolved = resolveVrPageProtoAstro(page);
  assert.equal(resolved.descriptor.syllable, syllable);
  assert.match(resolved.assetUrl, new RegExp(`/svg/${syllable}\\.svg$`));
}
assert.equal(resolveVrPageProtoAstro({ glyphId: 'unknown' }), null);

function createFixture(locale = 'en', configure = () => {}) {
  const monkeyAnchor = new THREE.Group();
  const monkeyGeometry = new THREE.BoxGeometry(1, 1, 1);
  const monkeyMaterial = new THREE.MeshBasicMaterial();
  monkeyAnchor.add(new THREE.Mesh(monkeyGeometry, monkeyMaterial));
  const controller = new THREE.Group(); controller.position.set(0, 0, 2);
  let rayDistance = null;
  const record = { controller, currentRayLength: 2.3, reportRayHit(distance) { rayDistance = distance; } };
  const pageIds = [];
  const settings = structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide);
  configure(settings);
  const guide = createVrMonkeyGuide({ monkeyAnchor, controllers: [record],
    progressionController: { getActivatedPageIds: () => [...pageIds] }, locale,
    settings });
  return { monkeyAnchor, monkeyGeometry, monkeyMaterial, controller, record, pageIds, guide,
    getRayDistance: () => rayDistance };
}

const fixture = createFixture('en', (settings) => {
  settings.dialogue.historyPageSize = 2;
  settings.card.maxLinesPerPage = 1;
});
const { monkeyAnchor, monkeyGeometry, monkeyMaterial, controller, record, pageIds, guide } = fixture;
assert.equal(guide.object.parent, monkeyAnchor, 'guide inherits the monkey anchor transform');
assert.equal(guide.messagePanel.planes.length, 2);
assert.equal(guide.dialoguePanel.planes.length, 2);
assert.ok(guide.messagePanel.planes.every(({ material }) => material.side === THREE.FrontSide));
assert.equal(guide.messagePanel.planes[1].rotation.y, Math.PI, 'back uses its own rotated FrontSide plane');
assert.equal(guide.arcs.length, 3);
assert.equal(guide.attentionRoot.visible, false);

guide.update(0.016);
assert.ok(fixture.getRayDistance() > 0 && fixture.getRayDistance() <= 2.3, 'monkey hit reports ordinary ray distance');
assert.equal(guide.halo.visible, true);
record.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(guide.isOpen(), true);
assert.ok(drawnText.includes('CLOSE'));
assert.equal(drawnText.includes('HOW AM I DOING?'), false, 'progress hidden at zero cards');

guide.close();
const creative1 = experienceVrPages.find((page) => page.glyphId === 'creative-ai' && page.order === 1);
const creative2 = experienceVrPages.find((page) => page.glyphId === 'creative-ai' && page.order === 2);
const haiku1 = experienceVrPages.find((page) => page.glyphId === 'haiku-cosmos' && page.order === 1);
pageIds.push(creative2.id, creative1.id, haiku1.id);
guide.open();
assert.ok(drawnText.includes('HOW AM I DOING?'));
guide.hits.set(record, { kind: 'panel', region: { id: 'progress' } });
assert.equal(guide.press(record), true);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.HISTORY, 'MENU -> HISTORY');
assert.ok(drawnText.includes('Discovered cards: 3. Select a sign.'));
assert.deepEqual(guide.getHistoryEntries().map(({ pageId }) => pageId), pageIds, 'only activated pages retain activation order');
assert.deepEqual(guide.getHistoryEntries().map(({ descriptor }) => descriptor.syllable), ['RA', 'RA', 'SA']);
assert.equal(guide.getHistoryPage(), 0);
guide.hits.set(record, { kind: 'panel', region: { id: 'history-next' } }); guide.press(record);
assert.equal(guide.getHistoryPage(), 1, 'history overflow uses configured pagination');
guide.hits.set(record, { kind: 'panel', region: { id: 'history-previous' } }); guide.press(record);

guide.hits.set(record, { kind: 'panel', region: { id: `page:${creative1.id}` } });
guide.press(record);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.CARD, 'HISTORY -> CARD');
assert.equal(guide.getSelectedPageId(), creative1.id, 'duplicate rune opens its concrete pageId');
const content = resolveExperienceVrPage(creative1, 'en');
assert.ok(drawnText.includes(content.title));
const cardPageCount = guide.getCardPageCount();
assert.ok(cardPageCount > 1, 'long content is split instead of shrinking or truncating');
for (let index = 1; index < cardPageCount; index += 1) {
  guide.hits.set(record, { kind: 'panel', region: { id: 'card-next' } }); guide.press(record);
}
assert.equal(guide.getCardPage(), cardPageCount - 1);
assert.ok(content.body.split(/\s+/).every((word) => drawnText.join(' ').includes(word)), 'all paginated body words are rendered');

guide.hits.set(record, { kind: 'panel', region: { id: 'back-history' } }); guide.press(record);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.HISTORY, 'CARD -> HISTORY');
guide.hits.set(record, { kind: 'panel', region: { id: 'back-menu' } }); guide.press(record);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.MENU, 'HISTORY -> MENU');

guide.notifyAttention(); assert.equal(guide.isAttentionPending(), true); guide.update(0.2);
assert.equal(guide.attentionRoot.visible, true);
assert.ok(new Set(guide.arcs.map(({ material }) => material.opacity)).size > 1);
guide.open(); assert.equal(guide.isAttentionPending(), false);
guide.reset(); assert.equal(guide.isOpen(), false); assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.MENU);
assert.equal(guide.messagePanel.group.visible, false);
guide.dispose(); assert.equal(guide.object.parent, null);
assert.equal(controller._listeners?.selectstart?.length ?? 0, 0, 'dispose removes trigger listener');
monkeyGeometry.dispose(); monkeyMaterial.dispose();

const polish = createFixture('pl');
polish.pageIds.push(creative1.id); polish.guide.open();
polish.guide.hits.set(polish.record, { kind: 'panel', region: { id: 'progress' } }); polish.guide.press(polish.record);
polish.guide.hits.set(polish.record, { kind: 'panel', region: { id: `page:${creative1.id}` } }); polish.guide.press(polish.record);
assert.ok(drawnText.includes(resolveExperienceVrPage(creative1, 'pl').title), 'selected card uses Polish localization');
polish.guide.dispose(); polish.monkeyGeometry.dispose(); polish.monkeyMaterial.dispose();

const source = await readFile(new URL('../src/xr/guidance/createVrMonkeyGuide.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /['"`]svg\/(?:KA|TA|SA|LA|RA)\.svg/, 'guide owns no Proto-Astro asset paths');
console.log('VR monkey guide assertions passed');
