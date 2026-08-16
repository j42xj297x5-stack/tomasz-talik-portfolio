import assert from 'node:assert/strict';
import { experienceVrPageIdsByTier, experienceVrPages } from '../src/content/experienceVrPages.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';
import { hydrateVrScenarioState } from '../src/xr/progression/hydrateVrScenarioState.js';
import { stateAtVrScenarioPoint } from '../src/xr/progression/reconstructVrScenarioState.js';
import { vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const TIER_ONE_IDS = experienceVrPageIdsByTier[1];
const makeOwner = () => createVrProgressionController({ pages: experienceVrPages });

const owner = makeOwner();
let liveCommits = 0;
const liveCommit = owner.commitPage;
owner.commitPage = (...args) => { liveCommits += 1; return liveCommit(...args); };
owner.hydrateScenarioState({ activatedPageIds: TIER_ONE_IDS });
assert.deepEqual(owner.getActivatedPageIds(), TIER_ONE_IDS);
assert.equal(owner.getCurrentTier(), 2);
assert.equal(owner.isTierComplete(1), true);
assert.equal(liveCommits, 0, 'hydration does not replay the live achievement API');

const firstSnapshot = [owner.getActivatedPageIds(), owner.getCurrentTier()];
owner.hydrateScenarioState({ activatedPageIds: TIER_ONE_IDS });
assert.deepEqual([owner.getActivatedPageIds(), owner.getCurrentTier()], firstSnapshot,
  'repeated hydration has an identical owner snapshot');
assert.equal(liveCommits, 0);

for (const invalidState of [
  { activatedPageIds: [...TIER_ONE_IDS, 'missing-page'] },
  { activatedPageIds: [experienceVrPages.find((page) => page.order === 2).id] }
]) {
  assert.throws(() => owner.hydrateScenarioState(invalidState));
  assert.deepEqual([owner.getActivatedPageIds(), owner.getCurrentTier()], firstSnapshot,
    'invalid hydration performs zero partial writes');
}

const reconstructed = stateAtVrScenarioPoint(vrExperienceScenario, '3.10');
const reconstructedOwner = makeOwner();
hydrateVrScenarioState({ progression: reconstructed.progression }, { progression: reconstructedOwner });
assert.deepEqual(reconstructedOwner.getActivatedPageIds(), TIER_ONE_IDS);
assert.equal(reconstructedOwner.isTierComplete(1), true);
assert.equal(reconstructedOwner.getCurrentTier(), 2);
assert.equal(stateAtVrScenarioPoint(vrExperienceScenario, '2.10').progression, undefined,
  'the nondeterministic first crystal has no invented page identity');

const liveOwner = makeOwner();
const firstLivePage = liveOwner.getNextPage('creative-ai', 1);
assert.equal(liveOwner.commitPage(firstLivePage), true);
assert.deepEqual(liveOwner.getActivatedPageIds(), [firstLivePage.id]);
assert.equal(liveOwner.getCurrentTier(), 1);

console.log('VR M5 progression owner hydration regression test passed.');
