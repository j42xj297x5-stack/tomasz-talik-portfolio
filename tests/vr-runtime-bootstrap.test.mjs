import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.js';
import { createVrAstroFurnacePanel } from '../src/xr/furnace/createVrAstroFurnacePanel.js';

const experienceSource = await readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8');
assert.match(experienceSource, /let runtimeExperience = null;/,
  'Runtime must have a safe nullable binding before construction-time callbacks can run');
assert.match(experienceSource, /canUseAstroProduction: \(\) => runtimeExperience\?\.getCurrentPointId\(\) === '3\.50'/,
  'the furnace gate must be safe before binding and remain live after Runtime is bound');
assert.match(experienceSource, /runtimeExperience = new RuntimeExperience\(/,
  'Runtime construction must bind the earlier nullable reference');

const context = new Proxy({}, {
  get(target, property) {
    if (property in target) return target[property];
    if (property === 'measureText') return () => ({ width: 0 });
    if (property === 'createLinearGradient' || property === 'createRadialGradient') {
      return () => ({ addColorStop() {} });
    }
    return () => {};
  },
  set(target, property, value) { target[property] = value; return true; }
});
globalThis.document = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    return { width: 0, height: 0, getContext: (type) => type === '2d' ? context : null };
  }
};
globalThis.Image = class MockImage { set src(value) { this._src = value; } };

let runtimeExperience = null;
const canUseAstroProduction = () => runtimeExperience?.getCurrentPointId() === '3.50';
const parent = new THREE.Group();
const furnaceObject = new THREE.Group();
parent.add(furnaceObject);
const furnace = {
  object: furnaceObject,
  diagnostics: { visibleBounds: { min: [-.5, 0, -.5], max: [.5, 1, .5] } }
};
const progressionController = {
  getAsterionSphereProgress: () => ({ absorbed: 0, complete: false, shells: [] }),
  subscribe: () => () => {}
};
const astroProductionController = {
  getState: () => 'AVAILABLE',
  canCreate: () => true,
  subscribe: () => () => {}
};

let panel;
assert.doesNotThrow(() => {
  panel = createVrAstroFurnacePanel({
    parent, furnace, progressionController, astroProductionController, canUseAstroProduction
  });
}, 'normal panel reset/draw must not throw while Runtime is not bound');
assert.equal(canUseAstroProduction(), false);
assert.equal(panel.getInteractiveRegions().find(({ id }) => id === 'module-astro-attractor').enabled, false);

runtimeExperience = { getCurrentPointId: () => '3.50' };
panel.redraw();
assert.equal(canUseAstroProduction(), true);
assert.equal(panel.getInteractiveRegions().find(({ id }) => id === 'module-astro-attractor').enabled, true);
panel.dispose();

console.log('VR runtime bootstrap ordering regression test passed.');
