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

let astro = false; let band = false; let asterion = false;
const knowledge = createVrMonkeyKnowledgeResolver({ locale: 'pl', hasAstroKnowledge: () => astro,
  hasAstroBandSwitchKnowledge: () => band, hasAsterionKnowledge: () => asterion });
assert.equal(knowledge.getLifecycle('knowledge.astro.whatIsIt'), L.LOCKED);
astro = true; assert.equal(knowledge.getLifecycle('knowledge.astro.whatIsIt'), L.NEW);
knowledge.completeTopic('knowledge.astro.whatIsIt'); assert.equal(knowledge.getLifecycle('knowledge.astro.whatIsIt'), L.READ);
assert.ok(knowledge.getTopic('knowledge.astro.whatIsIt'));
assert.equal(knowledge.getLifecycle('knowledge.astro.why'), L.NEW);
knowledge.completeTopic('knowledge.astro.why'); assert.equal(knowledge.getLifecycle('knowledge.astro.why'), L.ARCHIVED);
assert.equal(knowledge.getTopic('knowledge.astro.why'), null);
assert.equal(knowledge.getLifecycle('knowledge.astro.next'), L.NEW); asterion = true;
assert.equal(knowledge.getLifecycle('knowledge.astro.next'), L.ARCHIVED);
assert.equal(knowledge.getLifecycle('knowledge.astro.bandSwitch'), L.LOCKED); band = true;
assert.equal(knowledge.getLifecycle('knowledge.astro.bandSwitch'), L.NEW);
knowledge.completeTopic('knowledge.astro.bandSwitch'); assert.equal(knowledge.getLifecycle('knowledge.astro.bandSwitch'), L.ARCHIVED);
knowledge.reset(); assert.equal(knowledge.getLifecycle('knowledge.astro.whatIsIt'), L.NEW);
console.log('VR Monkey message sequence and knowledge lifecycle assertions passed.');
