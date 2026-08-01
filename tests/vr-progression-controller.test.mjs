import assert from 'node:assert/strict';
import { experienceVrPages, getExperienceVrPages } from '../src/content/experienceVrPages.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';

const progression = createVrProgressionController({ pages: experienceVrPages });
const branches = Object.keys({ 'ethics-life-protection': 1, 'creative-ai': 1, 'ai-guide': 1, 'spotify-digger': 1, 'haiku-cosmos': 1 });
assert.equal(progression.getCurrentTier(), 1);
assert.equal(progression.canInsertCrystal('creative-ai', 2), false);
assert.equal(progression.getNextPage('creative-ai', 2), null);
assert.equal(progression.commitPage(getExperienceVrPages('creative-ai')[1]), false, 'card 2 cannot skip global tier 1');
for (const branch of branches.slice(0, -1)) {
  const page = progression.getNextPage(branch, 1);
  assert.equal(page.order, 1);
  assert.equal(progression.commitPage(page), true);
  assert.equal(progression.isTierComplete(1), false);
}
assert.equal(progression.getCurrentTier(), 1);
const lastTierOne = progression.getNextPage(branches.at(-1), 1);
assert.equal(progression.commitPage(lastTierOne), true);
assert.equal(progression.isTierComplete(1), true);
assert.equal(progression.getCurrentTier(), 2);
assert.equal(progression.commitPage(lastTierOne), false, 'commit is idempotently rejected');

for (let tier = 2; tier <= 5; tier += 1) {
  const required = tier <= 3 ? branches : tier === 4 ? ['spotify-digger', 'haiku-cosmos'] : ['haiku-cosmos'];
  for (const branch of required) {
    const page = progression.getNextPage(branch, tier);
    assert.equal(page.order, tier, `${branch} resolves sequential tier ${tier}`);
    assert.equal(progression.commitPage(page), true);
  }
}
assert.equal(progression.getCurrentTier(), 5);
assert.equal(progression.getActivatedPageIds().length, 18);
assert.ok(experienceVrPages.every((page) => progression.hasActivatedPage(page.id)));
console.log('VR progression controller assertions passed');
