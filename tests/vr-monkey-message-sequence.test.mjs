import assert from 'node:assert/strict';
import { createVrMonkeyProgressionMessage } from '../src/xr/guidance/createVrMonkeyProgressionMessage.js';
import { createVrMonkeyKnowledgeResolver, VR_MONKEY_KNOWLEDGE_LIFECYCLE as L } from '../src/xr/guidance/createVrMonkeyKnowledgeResolver.js';

const shown = []; let completed = 0;
const sequence = createVrMonkeyProgressionMessage({ monkeyGuide: { showMessage(text) { shown.push(text); return { lineCount: text ? text.split('\n').length : 0 }; } },
  blocks: ['one', 'two\nlines'], secondsPerLine: 2, gapSeconds: .5, onCompleted: () => completed++ });
assert.equal(sequence.begin(), true); assert.equal(shown.at(-1), 'one');
sequence.update(1.999); assert.equal(shown.at(-1), 'one');
sequence.update(.001); assert.equal(shown.at(-1), '');
sequence.update(.499); assert.equal(shown.at(-1), '');
sequence.update(.001); assert.equal(shown.at(-1), 'two\nlines');
sequence.update(3.999); assert.equal(shown.at(-1), 'two\nlines');
sequence.update(.001); assert.equal(shown.at(-1), ''); assert.equal(completed, 0);
sequence.update(.5); assert.equal(completed, 1); assert.equal(sequence.getState(), 'COMPLETED');

let objective = null; let postRing = false; let astrolabium = false; let asterion = false;
const knowledge = createVrMonkeyKnowledgeResolver({ locale: 'pl', getCurrentObjective: () => objective,
  isPostRingStoneGuidance: () => postRing, isAstrolabiumOwned: () => astrolabium,
  isAsterionOwned: () => asterion });
assert.deepEqual(knowledge.getRootItems(), []);
knowledge.unlockBinders(); astrolabium = true;
assert.equal(knowledge.hasDiscoveredBinders(), true, 'binder discovery state remains available to runtime guidance');
assert.equal(knowledge.hasReadBinders(), true, 'binder discovery continues to unlock its Player Guide projection');
assert.equal(knowledge.getCategory('category.whatIsIt'), null);
assert.deepEqual(knowledge.getGroupTopics('discoveredWorld'), []);
for (const topicId of ['knowledge.p3.binders', 'knowledge.asterion.sphere']) {
  assert.equal(knowledge.getTopic(topicId), null);
  assert.equal(knowledge.getLifecycle(topicId), L.LOCKED);
}
assert.equal(knowledge.getRootItems().some(({ id }) => id === 'category.whatIsIt'), false);

objective = { id: 'collect-shells', body: 'Collect six Shells.' };
assert.deepEqual(knowledge.getRootItems().map(({ id }) => id), ['category.whatNow']);
assert.equal(knowledge.getCategory('category.whatNow').label, 'CO TERAZ?');
assert.equal(knowledge.getTopic('objective:collect-shells').blocks[0], objective.body);
objective = null;
assert.equal(knowledge.getTopic('knowledge.asterion.build').question, 'ZBUDUJ KULĘ ASTERIONOWĄ');
asterion = true;
knowledge.publishTransientHintFallback('rune', 'hint.rune.noBinder.soft');
assert.ok(knowledge.getTopic('fallback:hint.rune.noBinder.soft'), 'transient fallback remains in CO TERAZ?');
knowledge.withdrawTransientHintFallback('rune');
postRing = true;
assert.equal(knowledge.getTopic('knowledge.p3.stonesLead').lifecycle, L.READ);
knowledge.markFinalWaterBalanceHintTaught();
assert.ok(knowledge.getTopic('knowledge.finalWater.balance'), 'final Water balance guidance remains available');
knowledge.makeFinalWaterSolutionOfferAvailable();
assert.equal(knowledge.getLifecycle('knowledge.finalWater.solution'), L.NEW);
knowledge.completeTopic('knowledge.finalWater.solution');
assert.equal(knowledge.getFinalWaterGuidanceLevel(), 'SOLUTION');
knowledge.reset();
assert.equal(knowledge.hasDiscoveredBinders(), false);
console.log('VR Monkey message sequence and knowledge lifecycle assertions passed.');
