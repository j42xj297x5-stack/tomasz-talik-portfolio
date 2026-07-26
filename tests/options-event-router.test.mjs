import assert from 'node:assert/strict';
import { routeOptionsEvent } from '../src/utils/optionsEventRouter.js';

let calls = 0;
assert.equal(routeOptionsEvent({ owner: 'scene', action: 'fog' }, { scene: () => { calls += 1; return true; } }), true);
assert.equal(calls, 1);
assert.equal(routeOptionsEvent({ owner: 'missing', action: 'noop' }, {}), false);
console.log('options event routing assertions passed');
