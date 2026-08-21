import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS } from '../src/config/experienceVrSettings.js';
import { experienceVrPages, resolveExperienceVrPage } from '../src/content/experienceVrPages.js';
import { resolveVrPageProtoAstro } from '../src/xr/protoAstro/resolveVrPageProtoAstro.js';

const drawnText = [];
const roundedRectStarts = [];
const fillStyles = [];
const strokeStyles = [];
const textAlignments = [];
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
          clearRect() {}, beginPath() {}, moveTo(x, y) { roundedRectStarts.push({ x, y }); }, lineTo() {},
          arcTo() {}, closePath() {}, fill() {}, stroke() {}, fillRect() {}, drawImage() {},
          measureText(text) { return { width: String(text).length * 24 }; },
          fillText(text) { drawnText.push(String(text)); },
          set fillStyle(value) { fillStyles.push(value); }, set strokeStyle(value) { strokeStyles.push(value); },
          set lineWidth(value) {}, set globalCompositeOperation(value) {}, set font(value) {},
          set textAlign(value) { textAlignments.push(value); },
          set textBaseline(value) {}, set globalAlpha(value) {}
        };
      }
    };
  }
};

const { createVrMonkeyGuide, VR_MONKEY_GUIDE_SCREEN, unreadPulseAlpha } = await import('../src/xr/guidance/createVrMonkeyGuide.js');
assert.equal(unreadPulseAlpha(0), 0);
assert.equal(unreadPulseAlpha(1), 1);
assert.ok(unreadPulseAlpha(2) < 1e-12);

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
  const floorRoot = new THREE.Group();
  const actorRoot = new THREE.Group();
  floorRoot.add(actorRoot);
  const visualRoot = new THREE.Group();
  actorRoot.add(visualRoot);
  const monkeyGeometry = new THREE.BoxGeometry(1, 1, 1);
  const monkeyMaterial = new THREE.MeshBasicMaterial();
  visualRoot.add(new THREE.Mesh(monkeyGeometry, monkeyMaterial));
  const controller = new THREE.Group(); controller.position.set(0, 0, 2);
  let rayDistance = null;
  const record = { controller, currentRayLength: 2.3, reportRayHit(distance) { rayDistance = distance; } };
  const pageIds = [];
  let attentionStarts = 0;
  const settings = structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide);
  configure(settings);
  const guide = createVrMonkeyGuide({ actorRoot, visualRoot, floorRoot, controllers: [record],
    progressionController: { getActivatedPageIds: () => [...pageIds] }, locale,
    settings, onAttentionStart: () => { attentionStarts += 1; } });
  return { floorRoot, actorRoot, visualRoot, monkeyGeometry, monkeyMaterial, controller, record, pageIds, guide,
    getRayDistance: () => rayDistance, getAttentionStarts: () => attentionStarts };
}

{
  const actorRoot = new THREE.Group(); const visualRoot = new THREE.Group(); const interactionRoot = new THREE.Group();
  actorRoot.add(visualRoot); visualRoot.add(interactionRoot);
  interactionRoot.position.x = 5;
  const character = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); interactionRoot.add(character);
  const stone = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); visualRoot.add(stone);
  const controller = new THREE.Group(); controller.position.z = 2; actorRoot.add(controller);
  const record = { controller, currentRayLength: 2.3, reportRayHit() {} };
  const stoneExclusionGuide = createVrMonkeyGuide({ actorRoot, visualRoot, interactionRoot, controllers: [record],
    progressionController: { getActivatedPageIds: () => [] }, settings: structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide) });
  actorRoot.updateMatrixWorld(true); stoneExclusionGuide.update(0);
  assert.equal(stoneExclusionGuide.hasCurrentHit(record), false, 'stone mesh is excluded from Monkey ray targets');
  stoneExclusionGuide.dispose(); character.geometry.dispose(); character.material.dispose(); stone.geometry.dispose(); stone.material.dispose();
}

const fixture = createFixture('en', (settings) => {
  settings.dialogue.historyPageSize = 2;
  settings.card.maxLinesPerPage = 1;
});
const { actorRoot, monkeyGeometry, monkeyMaterial, controller, record, pageIds, guide } = fixture;
assert.equal(guide.object.parent, actorRoot, 'guide inherits the monkey anchor transform');
actorRoot.position.x += 10;
actorRoot.updateMatrixWorld(true);
const guideWorldX = guide.object.getWorldPosition(new THREE.Vector3()).x;
fixture.visualRoot.scale.setScalar(3);
fixture.visualRoot.position.x = 4;
actorRoot.updateMatrixWorld(true);
assert.equal(guide.object.getWorldPosition(new THREE.Vector3()).x, guideWorldX,
  'visual correction does not scale or offset the guide');
assert.deepEqual(guide.object.getWorldScale(new THREE.Vector3()).toArray(), [1, 1, 1],
  'guide inherits only the logical actor scale');
fixture.visualRoot.position.set(0, 0, 0);
fixture.visualRoot.scale.set(1, 1, 1);
actorRoot.position.set(0, 0, 0);
actorRoot.updateMatrixWorld(true);
assert.equal(guide.messagePanel.planes.length, 2);
assert.equal(guide.dialoguePanel.planes.length, 2);
assert.ok(guide.messagePanel.planes.every(({ material }) => material.side === THREE.FrontSide));
assert.equal(guide.messagePanel.planes[1].rotation.y, Math.PI, 'back uses its own rotated FrontSide plane');
assert.equal(guide.arcs.length, 3);
assert.deepEqual(guide.arcs.map(({ geometry }) => geometry.parameters.radius), [0.08, 0.125, 0.17]);
assert.ok(guide.arcs.every(({ geometry }) => geometry.parameters.tube === 0.009));
assert.deepEqual(guide.arcs.map(({ position }) => position.y), [0, 0, 0], 'attention arcs share one local center');
assert.ok(guide.arcs.every(({ rotation }) => rotation.z === Math.PI), 'attention arcs open upward');
assert.equal(guide.attentionRoot.position.z, -0.05);
assert.equal(guide.attentionRoot.position.y, 1.5);
assert.equal(guide.messagePanel.group.position.z, guide.attentionRoot.position.z);
assert.equal(guide.messagePanel.group.position.y, 1.5 + 0.17 + 0.03 + 0.72 / 2,
  'technical envelope bottom is derived from the largest attention arc');
assert.deepEqual(guide.dialoguePanel.group.position.toArray(), [1.20, 0.80, 0.50]);
assert.ok(Math.abs(guide.dialoguePanel.group.rotation.x - (-7.5 * Math.PI / 180)) < 1e-12);
assert.ok(fillStyles.includes('#090909'), 'dialogue controls use an almost-black background');
assert.ok(strokeStyles.includes('#ffaa63'), 'dialogue controls use an orange border');
assert.ok(textAlignments.includes('left'), 'MENU labels are left aligned');
assert.equal(guide.attentionRoot.visible, false);

{
  const guarded = createFixture('en', (settings) => { settings.dialogue.position.y = -0.2; });
  guarded.floorRoot.position.set(3, -2, 4);
  guarded.floorRoot.rotation.set(0.3, -0.4, 0.2);
  guarded.actorRoot.position.set(0.5, 0, -0.7);
  guarded.floorRoot.updateWorldMatrix(true, true);
  // Recreate after applying transforms so the construction-time guard sees the transformed local floor.
  guarded.guide.dispose(); guarded.monkeyGeometry.dispose(); guarded.monkeyMaterial.dispose();
  const settings = structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide);
  settings.dialogue.position.y = -0.2;
  const replacement = createVrMonkeyGuide({ actorRoot: guarded.actorRoot, visualRoot: guarded.visualRoot,
    floorRoot: guarded.floorRoot, controllers: [], progressionController: { getActivatedPageIds: () => [] }, settings });
  guarded.floorRoot.updateWorldMatrix(true, true);
  const halfWidth = settings.dialogue.width / 2; const halfHeight = settings.dialogue.height / 2;
  const floorYs = [[-halfWidth, -halfHeight], [halfWidth, -halfHeight], [-halfWidth, halfHeight], [halfWidth, halfHeight]]
    .map(([x, y]) => guarded.floorRoot.worldToLocal(
      replacement.dialoguePanel.group.localToWorld(new THREE.Vector3(x, y, 0))).y);
  assert.ok(floorYs.every((y) => y >= settings.dialogue.floorClearance - 1e-10),
    'all dialogue corners retain floor-local clearance under a transformed floor root');
  replacement.dispose();
}

roundedRectStarts.length = 0;
const oneLineMetrics = guide.showMessage('Short message');
assert.equal(oneLineMetrics.lineCount, 1, 'showMessage reports the lines produced by the renderer wrap');
const oneLineBoxY = roundedRectStarts.at(-1).y;
assert.equal(oneLineBoxY, 540 - (78 + 31 * 2), 'one-line message box is anchored to canvas bottom');
roundedRectStarts.length = 0;
const wrappedMetrics = guide.showMessage('This message contains enough words to wrap onto a second line in the panel');
assert.ok(wrappedMetrics.lineCount > 1, 'metrics use actual measured wrapping');
drawnText.length = 0;
const authoredMetrics = guide.showMessage('Pierwsza linia\nDruga linia');
assert.equal(authoredMetrics.lineCount, 2, 'explicit authored newlines produce separate rendered lines');
const longWords = Array.from({ length: 30 }, (_, index) => `word${index}`);
drawnText.length = 0; const longMetrics = guide.showMessage(longWords.join(' '));
assert.ok(longMetrics.lineCount > DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.message.maxLines,
  'maxLines is not destructive truncation');
assert.deepEqual(drawnText.join(' ').split(/\s+/), longWords, 'a long message renders every word without loss');
assert.equal(drawnText.some((line) => line.endsWith('…')), false, 'renderer never adds a truncation ellipsis');
const multiLineBoxY = roundedRectStarts.at(-1).y;
assert.ok(multiLineBoxY < oneLineBoxY, 'additional lines grow the message box upward');
assert.ok(fillStyles.includes('#e99a55'), 'message uses its darker saturated panel color');
assert.equal(guide.showMessage('').lineCount, 0, 'an empty bubble has no rendered lines');

guide.update(0.016);
assert.ok(fixture.getRayDistance() > 0 && fixture.getRayDistance() <= 2.3, 'monkey hit reports ordinary ray distance');
assert.equal(guide.halo.visible, true);
guide.notifyAttention();
guide.update(0.2);
assert.equal(guide.isAttentionPending(), true, 'hover does not acknowledge pending attention');
assert.equal(guide.attentionRoot.visible, true, 'notifyAttention shows the attention arcs');
assert.equal(guide.press(record), true);
assert.equal(guide.isAttentionPending(), false, 'a normal Monkey press acknowledges attention');
assert.equal(guide.attentionRoot.visible, false, 'a normal Monkey press hides the attention arcs');
guide.close();
guide.setInteractionEnabled(false); guide.update(0.016);
assert.equal(guide.halo.visible, false); assert.equal(guide.hasCurrentHit(record), false);
record.controller.dispatchEvent({ type: 'selectstart' }); assert.equal(guide.isOpen(), false);
assert.equal(guide.isInteractionEnabled(), false);
guide.setInteractionEnabled(true); guide.update(0.016); assert.equal(guide.isInteractionEnabled(), true);
let overridePresses = 0; let overrideChoice = null; let overrideHovers = 0;
guide.setDialogueOverride({ options: [{ id: 'intro-go', label: 'GO' }],
  onMonkeyHover: () => { overrideHovers += 1; }, onMonkeyPress: () => { overridePresses += 1; },
  onSelect: (id) => { overrideChoice = id; } });
guide.update(0.016);
guide.notifyAttention();
record.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(overridePresses, 1, 'narrative override captures the real monkey trigger');
assert.equal(guide.isAttentionPending(), false, 'the first override Monkey press acknowledges attention');
assert.equal(guide.attentionRoot.visible, false, 'override delegation cannot leave attention arcs visible');
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.MENU, 'override does not enter history');
guide.notifyAttention();
guide.hits.set(record, { kind: 'panel', region: { id: 'intro-go' } }); guide.press(record);
assert.equal(overrideChoice, 'intro-go', 'custom dialogue choice is delegated');
assert.equal(guide.isAttentionPending(), true, 'a panel option press does not acknowledge Monkey attention');
guide.setDialogueOverride({ onMonkeyPress: () => false });
guide.hits.set(record, { kind: 'monkey' });
assert.equal(guide.press(record), false, 'override return semantics remain unchanged');
assert.equal(guide.isAttentionPending(), false, 'even an override returning false cannot retain attention');
assert.ok(overrideHovers <= 1, 'hover callback is edge-triggered');
guide.setDialogueOverride(null);
guide.update(0.016);
record.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(guide.isOpen(), true);
assert.ok(drawnText.includes('CLOSE'));
assert.equal(drawnText.includes('HOW AM I DOING?'), false, 'progress hidden at zero cards');

guide.close();
const creative1 = experienceVrPages.find((page) => page.glyphId === 'creative-ai' && page.order === 1);
const creative2 = experienceVrPages.find((page) => page.glyphId === 'creative-ai' && page.order === 2);
const haiku1 = experienceVrPages.find((page) => page.glyphId === 'haiku-cosmos' && page.order === 1);
pageIds.push(creative2.id, creative1.id, haiku1.id);
guide.update(0);
assert.deepEqual(guide.getUnreadPageIds(), pageIds, 'newly activated cards become unread');
guide.open();
assert.ok(drawnText.includes('HOW AM I DOING?'));
guide.hits.set(record, { kind: 'panel', region: { id: 'progress' } });
assert.equal(guide.press(record), true);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.HISTORY, 'MENU -> HISTORY');
assert.deepEqual(guide.getUnreadPageIds(), pageIds, 'opening history does not mark cards read');
assert.ok(drawnText.includes('★') && drawnText.includes('★★'), 'history uses order stars instead of numeric markers');
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
assert.deepEqual(guide.getUnreadPageIds().sort(), [creative2.id, haiku1.id].sort(), 'CARD marks only its page read');
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

const attentionStartsBeforeSignal = fixture.getAttentionStarts();
guide.notifyAttention(); guide.notifyAttention();
assert.equal(fixture.getAttentionStarts(), attentionStartsBeforeSignal + 1, 'one active communication signal starts audio only once');
assert.equal(guide.isAttentionPending(), true); guide.update(0.2);
assert.equal(guide.attentionRoot.visible, true);
assert.ok(new Set(guide.arcs.map(({ material }) => material.opacity)).size > 1);
guide.open(); assert.equal(guide.isAttentionPending(), false);
guide.notifyAttention(); assert.equal(fixture.getAttentionStarts(), attentionStartsBeforeSignal + 2, 'a new signal after clearing starts once');
guide.reset(); assert.equal(guide.isOpen(), false); assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.MENU);
assert.equal(guide.messagePanel.group.visible, false);
guide.dispose(); assert.equal(guide.object.parent, null);
assert.equal(controller._listeners?.selectstart?.length ?? 0, 0, 'dispose removes trigger listener');
monkeyGeometry.dispose(); monkeyMaterial.dispose();

{
  const historyLayout = createFixture('en');
  const validPageIds = experienceVrPages.filter((page) => resolveVrPageProtoAstro(page)).map((page) => page.id);
  assert.ok(validPageIds.length >= 9, 'fixture has enough cards to exercise 8-item pagination');
  historyLayout.pageIds.push(...validPageIds.slice(0, 9));
  historyLayout.guide.open();
  historyLayout.guide.hits.set(historyLayout.record, { kind: 'panel', region: { id: 'progress' } });
  historyLayout.guide.press(historyLayout.record);
  const regions = historyLayout.guide.getInteractiveRegions();
  const contentRegions = regions.filter(({ id }) => id.startsWith('page:'));
  const navigationRegions = regions.filter(({ id }) => !id.startsWith('page:'));
  assert.equal(contentRegions.length, 8, 'HISTORY renders at most eight cards per page');
  assert.equal(new Set(contentRegions.map(({ x }) => x)).size, 4, 'HISTORY uses four columns');
  assert.equal(new Set(contentRegions.map(({ y }) => y)).size, 2, 'HISTORY uses at most two rows');
  assert.equal(contentRegions[1].x - contentRegions[0].x - contentRegions[0].width, 112);
  assert.equal(contentRegions[4].y - contentRegions[0].y - contentRegions[0].height, 12);
  const navTop = 590 - 42 - 100;
  assert.ok(contentRegions.every((region) => region.y + region.height <= navTop - 12),
    'history content ends above the reserved navigation band');
  assert.ok(contentRegions.every((content) => navigationRegions.every((nav) =>
    content.y + content.height <= nav.y || nav.y + nav.height <= content.y)),
  'content interactive regions do not intersect navigation controls');
  const back = regions.find(({ id }) => id === 'back-menu');
  const next = regions.find(({ id }) => id === 'history-next');
  assert.ok(back.x < 1280 / 2 && next.x > 1280 / 2, 'Back is left-aligned and Next is right-aligned');
  historyLayout.guide.hits.set(historyLayout.record, { kind: 'panel', region: next });
  historyLayout.guide.press(historyLayout.record);
  assert.equal(historyLayout.guide.getHistoryPage(), 1, 'the ninth history item remains reachable by pagination');
  assert.equal(historyLayout.guide.getInteractiveRegions().filter(({ id }) => id.startsWith('page:')).length, 1);
  historyLayout.guide.dispose(); historyLayout.monkeyGeometry.dispose(); historyLayout.monkeyMaterial.dispose();
}

const polish = createFixture('pl');
polish.pageIds.push(creative1.id); polish.guide.open();
polish.guide.hits.set(polish.record, { kind: 'panel', region: { id: 'progress' } }); polish.guide.press(polish.record);
polish.guide.hits.set(polish.record, { kind: 'panel', region: { id: `page:${creative1.id}` } }); polish.guide.press(polish.record);
assert.ok(drawnText.includes(resolveExperienceVrPage(creative1, 'pl').title), 'selected card uses Polish localization');
polish.guide.dispose(); polish.monkeyGeometry.dispose(); polish.monkeyMaterial.dispose();

const source = await readFile(new URL('../src/xr/guidance/createVrMonkeyGuide.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /['"`]svg\/(?:KA|TA|SA|LA|RA)\.svg/, 'guide owns no Proto-Astro asset paths');
assert.doesNotMatch(source, /fillStyle = settings\.colors\.dialoguePanel/, 'dialogue canvas has no full-panel background');
assert.match(source, /globalCompositeOperation = 'source-in'/, 'history glyphs are recolored through one mask canvas');
assert.match(source, /'★'\.repeat\(entry\.page\.order\)/, 'history marker is generated from order stars');
console.log('VR monkey guide assertions passed');
