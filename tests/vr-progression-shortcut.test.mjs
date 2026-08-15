import assert from 'node:assert/strict';
import { experienceVrPages } from '../src/content/experienceVrPages.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';
import { createVrProgressionShortcut } from '../src/xr/progression/applyVrProgressionShortcut.js';

function setup(search) {
  const progressionController = createVrProgressionController({ pages: experienceVrPages });
  const activated = []; const completed = []; let synced = 0;
  const apply = createVrProgressionShortcut({ search, pages: experienceVrPages, progressionController,
    progressFloor: { activatePage: (page) => activated.push(page), completeTier: (tier) => completed.push(tier) },
    syncQaPostP1WorldState: () => { synced += 1; }, log: () => {} });
  return { progressionController, activated, completed, get synced() { return synced; }, apply };
}
const clean = setup('?debug');
assert.equal(clean.apply(), false);
assert.equal(clean.progressionController.isTierComplete(1), false);
assert.equal(clean.progressionController.getActivatedPageIds().length, 0);
const shortcut = setup('?debug&p1');
assert.equal(shortcut.apply(), true);
assert.equal(shortcut.activated.length, 5);
assert.ok(shortcut.activated.every((page) => page.order === 1));
assert.equal(shortcut.progressionController.isTierComplete(1), true);
assert.equal(shortcut.progressionController.getCurrentTier(), 2);
assert.deepEqual(shortcut.completed, [1]);
assert.equal(shortcut.synced, 1);
assert.equal(shortcut.apply(), false);
assert.equal(shortcut.activated.length, 5);
assert.equal(setup('?p1=1').apply(), true);
console.log('VR progression shortcut assertions passed');
