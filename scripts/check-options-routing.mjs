import assert from 'node:assert/strict';
import { routeOptionsEvent } from '../src/utils/optionsEventRouter.js';

const calls = [];
const handlers = {
  atmosphere: ({ action }) => {
    if (!['stone-rebuild', 'shell-rebuild', 'small-glyph-rebuild'].includes(action)) return false;
    calls.push(`atmosphere:${action}`);
    return true;
  },
  sun: ({ action }) => action === 'apply' ? (calls.push('sun:apply'), true) : false,
  moon: ({ action }) => action === 'apply' ? (calls.push('moon:apply'), true) : false,
  galaxies: ({ action }) => ['runtime', 'rebuild'].includes(action) ? (calls.push(`galaxies:${action}`), true) : false,
  progression: ({ action }) => ['state-change', 'tuning-mode'].includes(action) ? (calls.push(`progression:${action}`), true) : false
};

assert.equal(routeOptionsEvent({ owner: 'sun', action: 'apply' }, handlers), true);
assert.deepEqual(calls.splice(0), ['sun:apply']);

assert.equal(routeOptionsEvent({ owner: 'moon', action: 'apply' }, handlers), true);
assert.deepEqual(calls.splice(0), ['moon:apply']);

assert.equal(routeOptionsEvent({ owner: 'progression', action: 'state-change' }, handlers), true);
assert.deepEqual(calls.splice(0), ['progression:state-change']);

assert.equal(routeOptionsEvent({ owner: 'atmosphere', action: 'stone-rebuild' }, handlers), true);
assert.deepEqual(calls.splice(0), ['atmosphere:stone-rebuild']);

assert.equal(routeOptionsEvent({ owner: 'sun', action: 'unknown' }, handlers), false);
assert.equal(routeOptionsEvent({ owner: 'unknown', action: 'rebuild' }, handlers), false);
assert.deepEqual(calls, []);

console.info('Options event routing checks passed.');
