import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrPostRingPresentation } from '../src/xr/progression/createVrPostRingPresentation.js';

const glyphRing = new THREE.Group(); glyphRing.position.y = 3;
const calls = [];
const shellSystem = {
  visible: false, interactionEnabled: false,
  setPresentationVisible(value) { this.visible = value; calls.push(['visible', value]); },
  setInteractionEnabled(value) { this.interactionEnabled = value; calls.push(['interaction', value]); }
};
let completions = 0;
const presentation = createVrPostRingPresentation({ glyphRing, shellSystem,
  settings: { glyphVerticalOffset: 2.4, glyphElevationDuration: 2, shellRevealDuration: 1 },
  onCompleted: () => { completions += 1; }
});
assert.equal(presentation.revealShellField(), true);
assert.equal(shellSystem.visible, true);
assert.equal(shellSystem.interactionEnabled, false);
assert.equal(presentation.elevateMainGlyphs(), true);
assert.equal(presentation.revealShellField(), false);
assert.equal(presentation.elevateMainGlyphs(), false);
presentation.update(1);
assert.ok(presentation.glyphOffset > 0 && presentation.glyphOffset < 2.4);
assert.equal(completions, 0, 'semantic completion waits for every presentation');
presentation.update(1);
assert.ok(Math.abs(presentation.glyphOffset - 2.4) < 1e-12);
assert.equal(completions, 1);
presentation.update(20);
assert.ok(Math.abs(presentation.glyphOffset - 2.4) < 1e-12, 'elevation is never accumulated');
assert.equal(completions, 1, 'semantic completion is one-shot');
presentation.reset();
assert.equal(glyphRing.position.y, 3);
assert.equal(presentation.glyphOffset, 0);
assert.equal(shellSystem.visible, false);
assert.equal(shellSystem.interactionEnabled, false);
assert.equal(presentation.completed, false);
assert.deepEqual(calls.slice(-2), [['interaction', false], ['visible', false]]);
console.log('VR post-ring presentation assertions passed');
