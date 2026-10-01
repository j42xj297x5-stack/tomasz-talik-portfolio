import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS } from '../src/config/experienceVrSettings.js';
import { experienceVrPages, resolveExperienceVrPage } from '../src/content/experienceVrPages.js';
import { resolveVrPageProtoAstro } from '../src/xr/protoAstro/resolveVrPageProtoAstro.js';
import { createVrMonkeyKnowledgeResolver } from '../src/xr/guidance/createVrMonkeyKnowledgeResolver.js';
import { VR_WORLD_KNOWLEDGE_PRESENTATION, projectVrWorldKnowledge } from '../src/xr/knowledge/vrWorldKnowledgePresentation.js';
import { VR_WORLD_KNOWLEDGE_CATEGORIES, VR_WORLD_KNOWLEDGE_STAGE_STATE } from '../src/xr/knowledge/createVrWorldKnowledgeModel.js';
import { VR_WORLD_KNOWLEDGE_CONTENT, resolveVrWorldKnowledgeStage } from '../src/xr/knowledge/vrWorldKnowledgeContent.js';

const drawnText = [];
const drawnTextPositions = [];
const drawnImagePositions = [];
const roundedRectStarts = [];
const fillStyles = [];
const strokeStyles = [];
const textAlignments = [];
const fills = [];
let createdCanvasCount = 0;
globalThis.Image = class {
  complete = true; naturalWidth = 256;
  set src(value) { this.url = value; }
};
globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    const canvasIndex = createdCanvasCount++;
    return {
      _testCanvasIndex: canvasIndex,
      width: 0, height: 0,
      getContext(type) {
        assert.equal(type, '2d');
        let activeRoundedRect = null;
        let activeFillStyle = null;
        let activeGlobalAlpha = 1;
        let activeFont = '';
        return {
          clearRect() {}, save() {}, restore() {}, beginPath() { activeRoundedRect = null; },
          moveTo(x, y) { activeRoundedRect = { canvasIndex, moveX: x, y, arcCount: 0 }; roundedRectStarts.push(activeRoundedRect); }, lineTo() {},
          arcTo(x, y, _x2, _y2, radius) {
            if (!activeRoundedRect) return;
            activeRoundedRect.arcCount += 1;
            if (activeRoundedRect.arcCount === 1) {
              activeRoundedRect.x = activeRoundedRect.moveX - radius;
              activeRoundedRect.width = x - activeRoundedRect.x;
            } else if (activeRoundedRect.arcCount === 2) activeRoundedRect.height = y - activeRoundedRect.y;
          }, closePath() {}, fill() { fills.push({ canvasIndex, fillStyle: activeFillStyle,
            globalAlpha: activeGlobalAlpha, rect: activeRoundedRect && { ...activeRoundedRect } }); }, stroke() {}, fillRect() {},
          drawImage(image, x, y, width, height) {
            drawnImagePositions.push({ canvasIndex, image, x, y, width, height });
          },
          measureText(text) { return { width: String(text).length * 24 }; },
          fillText(text, x, y) { drawnText.push(String(text));
            drawnTextPositions.push({ canvasIndex, text: String(text), x, y, font: activeFont }); },
          set fillStyle(value) { activeFillStyle = value; fillStyles.push(value); }, set strokeStyle(value) { strokeStyles.push(value); },
          set lineWidth(value) {}, set globalCompositeOperation(value) {}, set font(value) { activeFont = value; },
          set textAlign(value) { textAlignments.push(value); },
          set textBaseline(value) {}, set globalAlpha(value) { activeGlobalAlpha = value; }
        };
      }
    };
  }
};

const { createVrMonkeyGuide, VR_MONKEY_GUIDE_SCREEN, unreadPulseAlpha } = await import('../src/xr/guidance/createVrMonkeyGuide.js');
const latestMessageRect = (canvas) => roundedRectStarts.findLast(({ canvasIndex }) => canvasIndex === canvas._testCanvasIndex);
function latestMessageTextBlock(canvas, title) {
  const titleIndex = drawnTextPositions.findLastIndex(({ canvasIndex, text }) =>
    canvasIndex === canvas._testCanvasIndex && text === title);
  return { title: drawnTextPositions[titleIndex], firstBodyLine: drawnTextPositions[titleIndex + 1] };
}
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
assert.equal(VR_WORLD_KNOWLEDGE_CONTENT.length, 45, 'runtime catalog contains all 45 World Knowledge stages');
assert.deepEqual(VR_WORLD_KNOWLEDGE_CONTENT.map(({ id }) => id),
  VR_WORLD_KNOWLEDGE_CATEGORIES.flatMap(({ stageIds }) => stageIds), 'content IDs exactly match the model catalog');
VR_WORLD_KNOWLEDGE_CONTENT.forEach((entry) => {
  assert.ok(entry.title.pl && entry.body.pl && entry.title.en && entry.body.en, `${entry.id} has complete PL/EN copy`);
  assert.doesNotMatch(`${entry.body.pl}\n${entry.body.en}`, /KIEDY:/, `${entry.id} exposes no progression annotation`);
  assert.ok(Object.isFrozen(entry) && Object.isFrozen(entry.title) && Object.isFrozen(entry.body));
});
assert.equal(resolveVrWorldKnowledgeStage('08.2', 'pl').title, 'Dziedzictwo badaczy');
assert.equal(resolveVrWorldKnowledgeStage('08.2', 'en').title, 'Legacy of the Researchers');
assert.equal(resolveVrWorldKnowledgeStage('99.9', 'en'), null);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.maxLinesPerPage, 6,
  'portfolio retains six body lines per technical page');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.worldKnowledge.maxLinesPerPage, 6,
  'World Knowledge matches the six-line reader capacity');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.categoryFrameWidthScale, 0.80);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.categoryIconVerticalOffsetFraction, 0.05);

function createFixture(locale = 'en', configure = () => {}, worldKnowledgeModel = null, knowledgeResolver = null) {
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
    progressionController: { getActivatedPageIds: () => [...pageIds] }, locale, worldKnowledgeModel, knowledgeResolver,
    settings, onAttentionStart: () => { attentionStarts += 1; } });
  return { floorRoot, actorRoot, visualRoot, monkeyGeometry, monkeyMaterial, controller, record, pageIds, guide,
    getRayDistance: () => rayDistance, getAttentionStarts: () => attentionStarts };
}

for (const [locale, rootLabel, familyLabels] of [
  ['pl', 'JAK MI IDZIE?', { KA: 'ZIEMIA · KA', TA: 'METAL · TA', SA: 'WODA · SA', LA: 'DRZEWO · LA', RA: 'OGIEŃ · RA' }],
  ['en', 'HOW AM I DOING?', { KA: 'EARTH · KA', TA: 'METAL · TA', SA: 'WATER · SA', LA: 'WOOD · LA', RA: 'FIRE · RA' }]
]) {
  for (const [glyphId, syllable] of Object.entries(expectedFamilies)) {
    const localized = createFixture(locale);
    const selectedPage = experienceVrPages.find((page) => page.glyphId === glyphId && page.order === 1);
    localized.pageIds.push(selectedPage.id);
    const textBeforeOpen = drawnText.length;
    localized.guide.open();
    assert.ok(drawnText.slice(textBeforeOpen).includes(rootLabel), `${locale} root menu keeps its progress label`);
    localized.guide.hits.set(localized.record, { kind: 'panel', region: { id: 'progress' } });
    localized.guide.press(localized.record);
    localized.guide.hits.set(localized.record, { kind: 'panel', region: { id: `portfolio-category:${glyphId}` } });
    localized.guide.press(localized.record);
    const resolved = resolveExperienceVrPage(selectedPage, locale);
    const readerText = drawnTextPositions.filter(({ canvasIndex }) =>
      canvasIndex === localized.guide.messagePanel.canvas._testCanvasIndex).map(({ text }) => text);
    assert.ok(readerText.includes(familyLabels[syllable]), `${locale} ${glyphId} reader uses its localized family and canonical syllable`);
    assert.ok(readerText.includes(resolved.title), `${locale} ${glyphId} reader preserves the selected card title`);
    assert.equal(readerText.includes(rootLabel), false, `${locale} ${glyphId} reader no longer uses the root progress label`);
    localized.guide.dispose(); localized.monkeyGeometry.dispose(); localized.monkeyMaterial.dispose();
  }
}

for (const [locale, whatNowLabel, removedLabel, worldKnowledgeLabel] of [
  ['pl', 'CO TERAZ?', 'CO TO JEST?', 'WIEDZA'],
  ['en', 'WHAT COMES NEXT?', "WHAT'S THAT?", 'KNOWLEDGE']
]) {
  const resolver = createVrMonkeyKnowledgeResolver({ locale,
    getCurrentObjective: () => ({ id: 'current', body: 'Current objective' }),
    isAstrolabiumOwned: () => true });
  resolver.unlockBinders();
  const rootIds = resolver.getRootItems().map(({ id }) => id);
  assert.deepEqual(rootIds, ['category.whatNow'], `${locale} root exposes only contextual Monkey guidance`);
  const localized = createFixture(locale, () => {}, null, resolver);
  const drawnBeforeOpen = drawnText.length;
  localized.guide.open();
  const rootLabels = drawnText.slice(drawnBeforeOpen);
  assert.ok(rootLabels.includes(whatNowLabel), `${locale} UI keeps the contextual guidance category`);
  assert.ok(rootLabels.includes(worldKnowledgeLabel), `${locale} UI keeps World Knowledge`);
  assert.equal(rootLabels.includes(removedLabel), false, `${locale} UI omits the obsolete category`);
  localized.guide.hits.set(localized.record,
    { kind: 'panel', region: { id: 'category:category.whatIsIt' } });
  assert.equal(localized.guide.press(localized.record), false, 'stale navigation cannot enter the removed category');
  localized.guide.dispose(); localized.monkeyGeometry.dispose(); localized.monkeyMaterial.dispose();
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
assert.equal(guide.messagePanel.planes[0].geometry.parameters.width, 1.9,
  'message panel is exactly 20 cm wider than its former 1.7 m width');
assert.equal(guide.messagePanel.canvas.width, 1431, 'message canvas width preserves the wider panel text capacity');
assert.equal(guide.dialoguePanel.planes.length, 2);
assert.equal(guide.readerControlsPanel.planes.length, 2, 'reader controls use a separate two-sided plane');
assert.equal(guide.readerControlsPanel.canvas.width, 1280);
assert.equal(guide.readerControlsPanel.canvas.height, 150);
assert.equal(guide.dialoguePanel.planes[0].geometry.parameters.width, 1.65);
assert.equal(guide.dialoguePanel.planes[0].geometry.parameters.height, 0.96);
assert.equal(guide.dialoguePanel.canvas.width, 1280);
assert.equal(guide.dialoguePanel.canvas.height, 745);
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
assert.ok(Math.abs(guide.readerControlsPanel.group.position.y - (1.5 + 0.17 + 0.03 + 0.20 / 2)) < 1e-12,
  'reader strip preserves the former lower envelope above the attention arcs');
assert.equal(guide.messagePanel.group.position.y,
  guide.readerControlsPanel.group.position.y + 0.20 / 2 + 0.025 + 0.72 / 2,
  'message panel shifts upward and retains the configured gap above reader controls');
assert.deepEqual(guide.dialoguePanel.group.position.toArray(), [1.20, 0.80, 0.50]);
assert.ok(Math.abs(guide.dialoguePanel.group.rotation.x - (-7.5 * Math.PI / 180)) < 1e-12);
assert.ok(fillStyles.includes('#090909'), 'dialogue controls use an almost-black background');
const dialogueBackdrop = fills.find(({ canvasIndex, fillStyle, globalAlpha, rect }) =>
  canvasIndex === guide.dialoguePanel.canvas._testCanvasIndex && fillStyle === '#000000'
    && globalAlpha === 0.23 && rect?.x === 0 && rect?.y === 0
    && rect.width === guide.dialoguePanel.canvas.width && rect.height === guide.dialoguePanel.canvas.height);
assert.ok(dialogueBackdrop, 'dialogue panel draws one unified black backdrop at 23% opacity');
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
guide.setDialogueOverride({ onMonkeyPress: () => true });
guide.showMessage('Legacy question');
guide.setDialogueOverride({ options: [{ id: 'intro-go', label: 'GO' }],
  onMonkeyHover: () => { overrideHovers += 1; }, onMonkeyPress: () => { overridePresses += 1; },
  onSelect: (id) => { overrideChoice = id; } });
assert.equal(guide.messagePanel.group.visible, true, 'same legacy owner update preserves its question');
assert.equal(drawnTextPositions.at(-1).text, 'Legacy question',
  'changing the legacy override to options does not clear its speech');
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
assert.equal(guide.messagePanel.group.visible, false, 'releasing the legacy owner still clears its message');
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
assert.equal(guide.messagePanel.group.visible, false, 'entering HISTORY does not show stale card text');
assert.equal(guide.readerControlsPanel.group.visible, false, 'reader controls stay hidden until category selection');
assert.deepEqual(guide.getHistoryEntries().map(({ glyphId }) => glyphId), ['haiku-cosmos', 'creative-ai'],
  'categories follow the canonical Proto-Astro family order and omit undiscovered glyphs');
assert.deepEqual(guide.getHistoryEntries().map(({ descriptor }) => descriptor.syllable), ['SA', 'RA'],
  'one existing A-form icon resolves for each discovered category');
assert.deepEqual(guide.getHistoryEntries().find(({ glyphId }) => glyphId === 'creative-ai').pages.map(({ id }) => id),
  [creative1.id, creative2.id], 'activated category stages are sorted by page.order');
assert.equal(guide.getInteractiveRegions().filter(({ id }) => id.startsWith('portfolio-category:')).length, 2,
  'multiple activated pages do not duplicate their category icon');
const historyRegion = guide.getInteractiveRegions().find(({ id }) => id === 'portfolio-category:creative-ai');
const historyFrame = roundedRectStarts.findLast(({ canvasIndex, y, width }) =>
  canvasIndex === guide.dialoguePanel.canvas._testCanvasIndex && y === historyRegion.y
    && Math.abs(width - historyRegion.width * 0.80) < 1e-12);
assert.ok(historyFrame, 'HISTORY visual frame is 80% of the unchanged category interaction width');
assert.ok(Math.abs(historyFrame.x + historyFrame.width / 2 - (historyRegion.x + historyRegion.width / 2)) < 1e-12,
  'HISTORY visual frame remains horizontally centered in its interaction region');
const historyGlyph = drawnImagePositions.findLast(({ canvasIndex, width }) =>
  canvasIndex === guide.dialoguePanel.canvas._testCanvasIndex
    && width === DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyGlyphSize);
assert.equal(historyGlyph.y, historyRegion.y + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyItemPadding
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyGlyphSize * 0.05,
'HISTORY artwork receives the shared 5% vertical offset');
const historyStars = drawnTextPositions.findLast(({ canvasIndex, text }) =>
  canvasIndex === guide.dialoguePanel.canvas._testCanvasIndex && text === '★★');
assert.equal(historyStars.y, historyRegion.y + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyItemPadding
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyGlyphSize
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyGlyphStarGap
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyStarFontSize / 2,
'HISTORY compact stars retain their original position');
assert.equal(guide.getHistoryPage(), 0);

guide.hits.set(record, { kind: 'panel', region: { id: 'portfolio-category:creative-ai' } });
guide.press(record);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.HISTORY, 'category selection preserves flat HISTORY state');
assert.equal(guide.getSelectedHistoryGlyphId(), 'creative-ai');
assert.equal(guide.getSelectedPageId(), creative1.id, 'category auto-selects its first unread activated page in page order');
assert.deepEqual(guide.getUnreadPageIds().sort(), [creative2.id, haiku1.id].sort(), 'selection consumes only its page unread state');
assert.equal(guide.getInteractiveRegions().filter(({ id }) => id.startsWith('portfolio-category:')).length, 2,
  'category grid remains interactive after selection');
assert.equal(guide.messagePanel.group.visible, true);
assert.equal(guide.readerControlsPanel.group.visible, true);
assert.deepEqual(guide.getReaderControlRegions().filter(({ id }) => id.startsWith('portfolio-page:')).map(({ id }) => id),
  [`portfolio-page:${creative1.id}`, `portfolio-page:${creative2.id}`],
  'reader controls expose exactly the activated category pages');
const content = resolveExperienceVrPage(creative1, 'en');
assert.ok(drawnText.includes(content.title));
const firstCardRect = { ...latestMessageRect(guide.messagePanel.canvas) };
const firstCardText = latestMessageTextBlock(guide.messagePanel.canvas, content.title);
const expectedReaderHeight = Math.min(guide.messagePanel.canvas.height,
  DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.message.paddingY * 2
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.eyebrowLineHeight
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.headingLevelGap
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.titleFontSize * 1.15
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.headingBodyGap
  + DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.lineHeight
    * DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.card.maxLinesPerPage);
assert.deepEqual({ x: firstCardRect.x, y: firstCardRect.y, width: firstCardRect.width, height: firstCardRect.height },
  { x: (guide.messagePanel.canvas.width - 1301) / 2, y: guide.messagePanel.canvas.height - expectedReaderHeight,
    width: 1301, height: expectedReaderHeight }, 'HISTORY reader uses the fixed six-line bounding rectangle');
const historyEyebrow = drawnTextPositions.findLast(({ canvasIndex, text }) =>
  canvasIndex === guide.messagePanel.canvas._testCanvasIndex && text === 'FIRE · RA');
assert.ok(historyEyebrow.y < firstCardText.title.y, 'HISTORY context is a separate uppercase eyebrow above its primary title');
assert.ok(Number.parseFloat(historyEyebrow.font.match(/[\d.]+px/)?.[0])
  < Number.parseFloat(firstCardText.title.font.match(/[\d.]+px/)?.[0]),
'HISTORY eyebrow is visually secondary to the primary title');
assert.ok(firstCardText.firstBodyLine.y > firstCardText.title.y, 'HISTORY body begins below both heading levels');
const cardPageCount = guide.getCardPageCount();
assert.ok(cardPageCount > 1, 'long content is split instead of shrinking or truncating');
assert.ok(guide.getReaderControlRegions().some(({ id }) => id === 'card-page-next'));
for (let index = 1; index < cardPageCount; index += 1) {
  guide.hits.set(record, { kind: 'reader-controls', region: { id: 'card-page-next' } }); guide.press(record);
}
const lastCardRect = latestMessageRect(guide.messagePanel.canvas);
const lastCardText = latestMessageTextBlock(guide.messagePanel.canvas, content.title);
assert.deepEqual({ x: lastCardRect.x, y: lastCardRect.y, width: lastCardRect.width, height: lastCardRect.height },
  { x: firstCardRect.x, y: firstCardRect.y, width: firstCardRect.width, height: firstCardRect.height },
  'short and long HISTORY technical pages keep identical reader geometry');
assert.equal(lastCardText.title.y, firstCardText.title.y, 'HISTORY title Y is stable across technical pages');
assert.equal(lastCardText.firstBodyLine.y, firstCardText.firstBodyLine.y,
  'HISTORY first body-line Y is stable across technical pages');
assert.equal(guide.getCardPage(), cardPageCount - 1);
assert.ok(content.body.split(/\s+/).every((word) => drawnText.join(' ').includes(word)), 'all paginated body words are rendered');

guide.hits.set(record, { kind: 'reader-controls', region: { id: `portfolio-page:${creative2.id}` } }); guide.press(record);
assert.equal(guide.getSelectedPageId(), creative2.id);
assert.equal(guide.getCardPage(), 0, 'star selection resets technical pagination');
assert.deepEqual(guide.getUnreadPageIds(), [haiku1.id], 'sibling selection leaves unrelated unread state intact');
guide.hits.set(record, { kind: 'panel', region: { id: 'portfolio-category:haiku-cosmos' } }); guide.press(record);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.HISTORY);
assert.equal(guide.getSelectedPageId(), haiku1.id, 'another category switches content directly');
const selectedBeforeActivation = guide.getSelectedPageId();
const haiku2 = experienceVrPages.find((page) => page.glyphId === 'haiku-cosmos' && page.order === 2);
pageIds.push(haiku2.id); guide.update(0.04);
assert.equal(guide.getSelectedPageId(), selectedBeforeActivation, 'live activation does not replace a valid selection');
assert.ok(guide.getUnreadPageIds().includes(haiku2.id));
assert.ok(guide.getReaderControlRegions().some(({ id }) => id === `portfolio-page:${haiku2.id}`),
  'live activation adds a reader star without rebuilding the browser');
const historyOwner = Symbol('history-interruption');
const historySelectionBeforeInterruption = {
  glyphId: guide.getSelectedHistoryGlyphId(), pageId: guide.getSelectedPageId(), cardPage: guide.getCardPage()
};
const historyUnreadBeforeInterruption = guide.getUnreadPageIds();
assert.equal(guide.tryAcquireDialogue(historyOwner, {}, { priority: 100 }), true);
assert.equal(guide.messagePanel.group.visible, false, 'HISTORY reader disappears as soon as dialogue is acquired');
assert.equal(guide.readerControlsPanel.group.visible, false, 'HISTORY controls are preempted by dialogue ownership');
assert.equal(guide.dialoguePanel.group.visible, false, 'owned dialogue without options hides the optional HISTORY grid');
guide.showDialogueMessage(historyOwner, 'Owned history interruption');
assert.equal(guide.messagePanel.group.visible, true);
assert.equal(drawnTextPositions.at(-1).text, 'Owned history interruption',
  'owned Monkey speech wins over the selected HISTORY card');
guide.showDialogueMessage(historyOwner, '');
assert.equal(guide.messagePanel.group.visible, false, 'an owned HISTORY communication gap stays blank');
assert.equal(guide.readerControlsPanel.group.visible, false);
guide.showDialogueMessage(historyOwner, 'Owned history follow-up');
assert.equal(drawnTextPositions.at(-1).text, 'Owned history follow-up');
assert.equal(guide.releaseDialogue(historyOwner), true);
assert.equal(guide.messagePanel.group.visible, false, 'HISTORY reader does not reappear when dialogue is released');
assert.equal(guide.readerControlsPanel.group.visible, false);
assert.deepEqual({ glyphId: guide.getSelectedHistoryGlyphId(), pageId: guide.getSelectedPageId(), cardPage: guide.getCardPage() },
  historySelectionBeforeInterruption, 'HISTORY selection and technical page survive presentation suspension');
assert.deepEqual(guide.getUnreadPageIds(), historyUnreadBeforeInterruption,
  'HISTORY interruption and release do not consume unread cards');
guide.open();
assert.equal(guide.messagePanel.group.visible, true, 'deliberate reopen restores the preserved HISTORY reader');
assert.equal(guide.readerControlsPanel.group.visible, true, 'deliberate reopen restores HISTORY controls');
assert.deepEqual(guide.getUnreadPageIds(), historyUnreadBeforeInterruption,
  'resuming HISTORY presentation does not consume unread cards');
guide.hits.set(record, { kind: 'panel', region: { id: 'back-menu' } }); guide.press(record);
assert.equal(guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.MENU, 'HISTORY -> MENU');
assert.equal(guide.getSelectedPageId(), null);
assert.equal(guide.messagePanel.group.visible, false);
assert.equal(guide.readerControlsPanel.group.visible, false);

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

const polish = createFixture('pl');
polish.pageIds.push(creative1.id); polish.guide.open();
polish.guide.hits.set(polish.record, { kind: 'panel', region: { id: 'progress' } }); polish.guide.press(polish.record);
polish.guide.hits.set(polish.record, { kind: 'panel', region: { id: 'portfolio-category:creative-ai' } }); polish.guide.press(polish.record);
assert.ok(drawnText.includes(resolveExperienceVrPage(creative1, 'pl').title), 'selected card uses Polish localization');
assert.ok(drawnText.includes('OGIEŃ · RA'), 'selected card uses the Polish family eyebrow and canonical syllable');
assert.equal(polish.guide.getReaderControlRegions().some(({ id }) => id.startsWith('card-page-')), false,
  'single-page cards omit the complete pagination group');
polish.guide.dispose(); polish.monkeyGeometry.dispose(); polish.monkeyMaterial.dispose();

const source = await readFile(new URL('../src/xr/guidance/createVrMonkeyGuide.js', import.meta.url), 'utf8');
assert.doesNotMatch(source, /['"`]svg\/(?:KA|TA|SA|LA|RA)\.svg/, 'guide owns no Proto-Astro asset paths');
assert.match(source, /globalAlpha = 0\.23[\s\S]*fillStyle = '#000000'/,
  'dialogue canvas owns a subtle unified black backdrop');
assert.match(source, /globalCompositeOperation = 'source-in'/, 'history glyphs are recolored through one mask canvas');
assert.match(source, /'★'\.repeat\(entry\.pages\.length\)/, 'history marker reflects activated pages only');
assert.doesNotMatch(source, /worldKnowledgeModel\.markStageRead\([^)]*selectedPageId/,
  'portfolio unread consumption does not call World Knowledge lifecycle APIs');

assert.equal(VR_WORLD_KNOWLEDGE_PRESENTATION.length, 15, 'all canonical categories have presentation metadata');
assert.deepEqual(VR_WORLD_KNOWLEDGE_PRESENTATION.map(({ categoryId }) => categoryId),
  VR_WORLD_KNOWLEDGE_CATEGORIES.map(({ id }) => id), 'presentation catalog preserves canonical category order');
const presentationByCategory = new Map(VR_WORLD_KNOWLEDGE_PRESENTATION.map((entry) => [entry.categoryId, entry]));
assert.equal(VR_WORLD_KNOWLEDGE_PRESENTATION.some(({ icon }) => icon.type === 'COMPOSITE'), false,
  'natural-family categories no longer use five-symbol composites');
assert.deepEqual([
  presentationByCategory.get('world.shells').icon.assetId,
  presentationByCategory.get('world.small_glyphs').icon.assetId,
  presentationByCategory.get('world.large_glyphs').icon.assetId,
  presentationByCategory.get('world.rune_stones').icon.assetId
], [
  'vr-attractor-band-1-image',
  'vr-attractor-band-2-image',
  'vr-attractor-band-3-image',
  'vr-attractor-band-4-image'
], 'the four natural categories reuse the canonical prepared Astrolabium bands');
const experienceVrSource = await readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8');
assert.match(experienceVrSource, /getPreparedKnowledgeImage: requirePreparedBandImage/,
  'Monkey Knowledge receives the same prepared band images as the Astrolabium');

{
  const states = new Map(VR_WORLD_KNOWLEDGE_CATEGORIES.flatMap((category) =>
    category.stageIds.map((id) => [id, VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED])));
  const listeners = new Set(); const markedStageIds = [];
  const model = {
    getCategories: () => VR_WORLD_KNOWLEDGE_CATEGORIES,
    isCategoryDiscovered: (id) => states.get(VR_WORLD_KNOWLEDGE_CATEGORIES.find((category) => category.id === id).stageIds[0])
      !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED,
    getStagesForCategory: (id) => VR_WORLD_KNOWLEDGE_CATEGORIES.find((category) => category.id === id)?.stageIds
      .map((stageId, index) => ({ id: stageId, categoryId: id, order: index + 1 })) ?? [],
    getStageState: (id) => states.get(id),
    markStageRead(id) {
      if (states.get(id) === VR_WORLD_KNOWLEDGE_STAGE_STATE.READ) return true;
      markedStageIds.push(id);
      states.set(id, VR_WORLD_KNOWLEDGE_STAGE_STATE.READ);
      [...listeners].forEach((listener) => listener());
      return true;
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  states.set('01.1', VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE);
  states.set('01.2', VR_WORLD_KNOWLEDGE_STAGE_STATE.READ);
  const initial = projectVrWorldKnowledge(model, 'en');
  assert.deepEqual(initial.map(({ categoryId }) => categoryId), ['world.five_transformations'],
    'overview exposes discovered categories without future placeholders');
  assert.deepEqual(initial[0].stages.map(({ id }) => id), ['01.1', '01.2'], 'locked stars are hidden in canonical order');
  assert.deepEqual(initial[0].stages.map(({ unread }) => unread), [true, false], 'unread and READ stars are distinguishable');

  const knowledgeFixture = createFixture('en', () => {}, model);
  knowledgeFixture.guide.open();
  knowledgeFixture.guide.hits.set(knowledgeFixture.record, { kind: 'panel', region: { id: 'world-knowledge' } });
  knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.WORLD_KNOWLEDGE);
  assert.equal(knowledgeFixture.guide.getInteractiveRegions().filter(({ id }) => id.startsWith('world-category:')).length, 1);
  knowledgeFixture.guide.hits.set(knowledgeFixture.record, { kind: 'panel', region: { id: 'world-category:world.five_transformations' } });
  knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.getScreen(), VR_MONKEY_GUIDE_SCREEN.WORLD_KNOWLEDGE,
    'category selection keeps the flat World Knowledge grid state');
  const worldRegion = knowledgeFixture.guide.getInteractiveRegions()
    .find(({ id }) => id === 'world-category:world.five_transformations');
  const worldFrame = roundedRectStarts.findLast(({ canvasIndex, y, width }) =>
    canvasIndex === knowledgeFixture.guide.dialoguePanel.canvas._testCanvasIndex && y === worldRegion.y + 4
      && Math.abs(width - worldRegion.width * 0.80) < 1e-12);
  assert.ok(worldFrame, 'World Knowledge visual frame is 80% of the unchanged category interaction width');
  assert.ok(Math.abs(worldFrame.x + worldFrame.width / 2 - (worldRegion.x + worldRegion.width / 2)) < 1e-12,
    'World Knowledge visual frame remains horizontally centered in its interaction region');
  const worldIconSize = Math.min(worldRegion.width * 0.58, worldRegion.height * 0.68);
  const worldIcon = drawnImagePositions.findLast(({ canvasIndex, width }) =>
    canvasIndex === knowledgeFixture.guide.dialoguePanel.canvas._testCanvasIndex && width === worldIconSize);
  assert.equal(worldIcon.y, worldRegion.y + worldIconSize * 0.05,
    'World Knowledge artwork receives the shared 5% vertical offset');
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, true, 'selection presents World Knowledge in messagePanel');
  assert.equal(knowledgeFixture.guide.readerControlsPanel.group.visible, true, 'selection reveals the separate reader controls');
  const knowledgeRect = latestMessageRect(knowledgeFixture.guide.messagePanel.canvas);
  const knowledgeEyebrow = drawnTextPositions.findLast(({ canvasIndex, text }) =>
    canvasIndex === knowledgeFixture.guide.messagePanel.canvas._testCanvasIndex
      && text === 'FIVE TRANSFORMATIONS');
  const knowledgeHeadingText = resolveVrWorldKnowledgeStage('01.1', 'en').title;
  const knowledgeText = latestMessageTextBlock(knowledgeFixture.guide.messagePanel.canvas, knowledgeHeadingText);
  assert.deepEqual({ x: knowledgeRect.x, y: knowledgeRect.y, width: knowledgeRect.width, height: knowledgeRect.height },
    { x: firstCardRect.x, y: firstCardRect.y, width: firstCardRect.width, height: firstCardRect.height },
    'WORLD_KNOWLEDGE uses the same fixed reader rectangle as HISTORY');
  assert.ok(knowledgeEyebrow.y < knowledgeText.title.y,
    'WORLD_KNOWLEDGE renders its uppercase category eyebrow above the mixed-case stage title');
  assert.ok(Number.parseFloat(knowledgeEyebrow.font.match(/[\d.]+px/)?.[0])
    < Number.parseFloat(knowledgeText.title.font.match(/[\d.]+px/)?.[0]),
  'WORLD_KNOWLEDGE eyebrow uses the smaller heading level');
  assert.equal(knowledgeText.title.y, firstCardText.title.y, 'reader title Y is shared across both information browsers');
  assert.equal(knowledgeText.firstBodyLine.y, firstCardText.firstBodyLine.y,
    'reader first body-line Y is shared across both information browsers');
  assert.ok(knowledgeFixture.guide.getWorldKnowledgeTextPageCount() > 1, 'long World Knowledge copy paginates');
  assert.equal(knowledgeFixture.guide.getInteractiveRegions().filter(({ id }) => id.startsWith('world-category:')).length, 1,
    'the same category grid remains interactive after category selection');
  assert.equal(knowledgeFixture.guide.getInteractiveRegions().some(({ id }) => id === 'back-world-overview'), false,
    'flat navigation has no detail back control');
  assert.deepEqual(knowledgeFixture.guide.getReaderControlRegions().filter(({ id }) => id.startsWith('world-stage:'))
    .map(({ id }) => id), ['world-stage:01.1', 'world-stage:01.2'],
  'reader controls expose one large button per discovered stage and no locked stage');
  assert.ok(knowledgeFixture.guide.getReaderControlRegions().some(({ id }) => id === 'world-knowledge-page-next'));
  assert.deepEqual(markedStageIds, [], 'opening a multi-page stage does not mark it READ');
  const selectedStage = knowledgeFixture.guide.getSelectedWorldKnowledgeStageId();
  const knowledgeOwner = Symbol('world-knowledge-interruption');
  const knowledgeSelectionBeforeInterruption = {
    categoryId: knowledgeFixture.guide.getSelectedWorldKnowledgeCategoryId(),
    stageId: selectedStage,
    textPage: knowledgeFixture.guide.getWorldKnowledgeTextPage()
  };
  assert.equal(knowledgeFixture.guide.tryAcquireDialogue(knowledgeOwner, {}, { priority: 100 }), true);
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, false,
    'World Knowledge reader disappears as soon as dialogue is acquired');
  assert.equal(knowledgeFixture.guide.readerControlsPanel.group.visible, false,
    'World Knowledge controls are preempted by dialogue ownership');
  assert.equal(knowledgeFixture.guide.dialoguePanel.group.visible, false,
    'owned dialogue without options hides the optional World Knowledge grid');
  knowledgeFixture.guide.showDialogueMessage(knowledgeOwner, 'Owned knowledge interruption');
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, true);
  assert.equal(drawnTextPositions.at(-1).text, 'Owned knowledge interruption',
    'owned Monkey speech wins over the selected World Knowledge stage');
  knowledgeFixture.guide.showDialogueMessage(knowledgeOwner, '');
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, false,
    'an owned World Knowledge communication gap stays blank instead of exposing the reader');
  assert.equal(knowledgeFixture.guide.readerControlsPanel.group.visible, false);
  knowledgeFixture.guide.showDialogueMessage(knowledgeOwner, 'Owned knowledge follow-up');
  assert.equal(drawnTextPositions.at(-1).text, 'Owned knowledge follow-up');
  assert.equal(knowledgeFixture.guide.releaseDialogue(knowledgeOwner), true);
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, false,
    'World Knowledge reader does not reappear when dialogue is released');
  assert.equal(knowledgeFixture.guide.readerControlsPanel.group.visible, false);
  assert.deepEqual({
    categoryId: knowledgeFixture.guide.getSelectedWorldKnowledgeCategoryId(),
    stageId: knowledgeFixture.guide.getSelectedWorldKnowledgeStageId(),
    textPage: knowledgeFixture.guide.getWorldKnowledgeTextPage()
  }, knowledgeSelectionBeforeInterruption, 'World Knowledge selection and technical page survive presentation suspension');
  assert.deepEqual(markedStageIds, [], 'World Knowledge interruption and release do not mutate READ state');
  knowledgeFixture.guide.open();
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, true,
    'deliberate reopen restores the preserved World Knowledge reader');
  assert.equal(knowledgeFixture.guide.readerControlsPanel.group.visible, true,
    'deliberate reopen restores World Knowledge controls');
  assert.deepEqual(markedStageIds, [], 'resuming World Knowledge presentation does not mutate READ state');
  knowledgeFixture.guide.hits.set(knowledgeFixture.record,
    { kind: 'reader-controls', region: { id: 'world-knowledge-page-next' } }); knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.getWorldKnowledgeTextPage(), 1);
  knowledgeFixture.guide.hits.set(knowledgeFixture.record,
    { kind: 'reader-controls', region: { id: 'world-knowledge-page-previous' } }); knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.getWorldKnowledgeTextPage(), 0,
    'previous and next change only the technical page');
  assert.deepEqual(markedStageIds, ['01.1'], 'previous never duplicates or reverses a final-page READ commit');
  while (knowledgeFixture.guide.getWorldKnowledgeTextPage() < knowledgeFixture.guide.getWorldKnowledgeTextPageCount() - 1) {
    knowledgeFixture.guide.hits.set(knowledgeFixture.record,
      { kind: 'reader-controls', region: { id: 'world-knowledge-page-next' } });
    knowledgeFixture.guide.press(knowledgeFixture.record);
  }
  assert.equal(knowledgeFixture.guide.getSelectedWorldKnowledgeStageId(), selectedStage,
    'technical page navigation does not change the semantic stage');
  assert.deepEqual(markedStageIds, ['01.1'], 'reaching the final technical page marks only the selected stage READ');
  knowledgeFixture.guide.hits.set(knowledgeFixture.record, { kind: 'reader-controls', region: { id: 'world-stage:01.2' } });
  knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.getSelectedWorldKnowledgeStageId(), '01.2');
  assert.equal(knowledgeFixture.guide.getWorldKnowledgeTextPage(), 0, 'selecting another star resets its technical page');
  assert.deepEqual(markedStageIds, ['01.1'], 'selecting a multi-page sibling does not mark it READ');
  states.set('02.1', VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE); [...listeners].forEach((listener) => listener());
  assert.equal(knowledgeFixture.guide.getSelectedWorldKnowledgeStageId(), '01.2',
    'unrelated model updates preserve a still-valid current selection');
  knowledgeFixture.guide.hits.set(knowledgeFixture.record, { kind: 'panel', region: { id: 'world-category:world.proto_astro' } });
  knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.getSelectedWorldKnowledgeCategoryId(), 'world.proto_astro',
    'another category can be selected directly from the persistent grid');
  assert.equal(knowledgeFixture.guide.getSelectedWorldKnowledgeStageId(), '02.1');
  assert.equal(knowledgeFixture.guide.getWorldKnowledgeOverview().length, 2,
    'a subscribed model update reveals a category without rebuilding gameplay state');
  knowledgeFixture.guide.hits.set(knowledgeFixture.record, { kind: 'panel', region: { id: 'back-world-menu' } });
  knowledgeFixture.guide.press(knowledgeFixture.record);
  assert.equal(knowledgeFixture.guide.messagePanel.group.visible, false, 'leaving WIEDZA clears World Knowledge content');
  assert.equal(knowledgeFixture.guide.readerControlsPanel.group.visible, false, 'leaving WIEDZA hides reader controls');
  knowledgeFixture.guide.dispose(); knowledgeFixture.monkeyGeometry.dispose(); knowledgeFixture.monkeyMaterial.dispose();
}

{
  const states = new Map(VR_WORLD_KNOWLEDGE_CATEGORIES.flatMap((category) =>
    category.stageIds.map((id) => [id, VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED])));
  states.set('11.1', VR_WORLD_KNOWLEDGE_STAGE_STATE.READ);
  states.set('11.2', VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE);
  const marked = [];
  const model = {
    getCategories: () => VR_WORLD_KNOWLEDGE_CATEGORIES,
    isCategoryDiscovered: (id) => states.get(VR_WORLD_KNOWLEDGE_CATEGORIES.find((category) => category.id === id).stageIds[0])
      !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED,
    getStagesForCategory: (id) => VR_WORLD_KNOWLEDGE_CATEGORIES.find((category) => category.id === id)?.stageIds
      .map((stageId, index) => ({ id: stageId, categoryId: id, order: index + 1 })) ?? [],
    getStageState: (id) => states.get(id),
    markStageRead(id) { marked.push(id); states.set(id, VR_WORLD_KNOWLEDGE_STAGE_STATE.READ); return true; },
    subscribe() { return () => {}; }
  };
  const single = createFixture('en', () => {}, model);
  single.guide.open();
  single.guide.hits.set(single.record, { kind: 'panel', region: { id: 'world-knowledge' } }); single.guide.press(single.record);
  single.guide.hits.set(single.record, { kind: 'panel', region: { id: 'world-category:platform.sectors' } });
  single.guide.press(single.record);
  assert.equal(single.guide.getWorldKnowledgeTextPageCount(), 1, 'short stage resolves to one technical page');
  assert.deepEqual(marked, ['11.2'], 'deliberately opening a newly single-page stage marks only that stage READ');
  assert.equal(single.guide.getReaderControlRegions().some(({ id }) => id.startsWith('world-knowledge-page-')), false,
    'one-page stages omit the complete pagination group');
  single.guide.close();
  assert.equal(single.guide.messagePanel.group.visible, false, 'closing Monkey clears World Knowledge presentation state');
  assert.equal(single.guide.readerControlsPanel.group.visible, false, 'closing Monkey hides reader controls');
  single.guide.reset();
  assert.equal(single.guide.getSelectedWorldKnowledgeCategoryId(), null, 'reset clears the World Knowledge category');
  assert.equal(single.guide.getSelectedWorldKnowledgeStageId(), null, 'reset clears the World Knowledge stage');
  const controlsCanvas = single.guide.readerControlsPanel.canvas;
  single.guide.dispose(); single.monkeyGeometry.dispose(); single.monkeyMaterial.dispose();
  assert.equal(controlsCanvas.width, 0, 'dispose releases the reader-controls canvas');
}
console.log('VR monkey guide assertions passed');
