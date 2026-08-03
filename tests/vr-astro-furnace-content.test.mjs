import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { ASTRO_FURNACE_CONTENT_STATES as S, createVrAstroFurnaceContentInteraction } from '../src/xr/furnace/createVrAstroFurnaceContentInteraction.js';
import { createVrAstroFurnaceProgressionController } from '../src/xr/furnace/createVrAstroFurnaceProgressionController.js';

function fixture() {
  const object = new THREE.Group(), volume = new THREE.Mesh(new THREE.SphereGeometry(.5)), anchor = new THREE.Group();
  object.add(volume, anchor); let open = 'OPEN', process = 'IDLE', progress = 0, commits = 0, removed;
  const progression = createVrAstroFurnaceProgressionController(), commit = progression.commitAbsorbedShell;
  progression.commitAbsorbedShell = (id) => { commits++; return commit(id); };
  const interaction = createVrAstroFurnaceContentInteraction({ furnace: { object, nodes: { VR_FURNACE_INSERT_VOLUME: volume,
    VR_FURNACE_CONTENT_ANCHOR: anchor } }, shellSystem: { removeInstance(shell) { removed = shell; shell.removeFromParent(); return true; } },
  openInteraction: { getState: () => open }, activateInteraction: { getState: () => process, getProgress: () => progress }, progressionController: progression });
  const makeShell = (id = 'shell-relic-1') => { const shell = new THREE.Mesh(new THREE.SphereGeometry(.1), new THREE.MeshStandardMaterial());
    shell.userData.shellAssetId = id; object.add(shell); return shell; };
  return { interaction, progression, anchor, makeShell, setOpen: (v) => { open = v; }, setProcess: (v) => { process = v; },
    setProgress: (v) => { progress = v; }, get commits() { return commits; }, get removed() { return removed; } };
}
function insert(test, shell) { test.interaction.reportHeldShell(shell); test.interaction.update(.01);
  assert.equal(test.interaction.getState(), S.CANDIDATE_VALID); test.interaction.reportHeldShell(null); test.interaction.update(.01); }

{
  const t = fixture(), shell = t.makeShell(); assert.equal(t.interaction.canAcceptShell(shell), true);
  t.setOpen('CLOSED'); assert.equal(t.interaction.canAcceptShell(shell), false); t.setOpen('OPEN'); t.setProcess('SPINUP');
  assert.equal(t.interaction.canAcceptShell(shell), false); t.setProcess('IDLE');
  const unknown = t.makeShell('unknown'); t.interaction.reportHeldShell(unknown); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CANDIDATE_INVALID);
  t.interaction.reset(); t.progression.commitAbsorbedShell('shell-relic-2'); const duplicate = t.makeShell('shell-relic-2');
  t.interaction.reportHeldShell(duplicate); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CANDIDATE_INVALID); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell(); insert(t, shell); assert.equal(t.interaction.getInsertedShell(), shell);
  assert.equal(shell.parent, t.anchor); assert.equal(t.interaction.hasValidInsertedContent(), true); t.interaction.update(1);
  t.interaction.reportHeldShell(shell); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.EMPTY);
  assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 0); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell('shell-relic-3'); insert(t, shell); t.interaction.update(1); const scale = shell.scale.x;
  t.setOpen('CLOSED'); t.setProcess('SPINUP'); t.setProgress(.5); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CONSUMING);
  assert.ok(shell.scale.x < scale); assert.ok(shell.material.emissiveIntensity > 0); assert.ok(shell.material.opacity < 1); assert.equal(t.commits, 0);
  t.setProgress(.78); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CONSUMED); assert.equal(t.commits, 0);
  t.setProcess('COMPLETE'); t.interaction.update(.01); assert.equal(t.commits, 1); assert.equal(t.removed, shell);
  assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 1); t.interaction.update(1); assert.equal(t.commits, 1); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell('shell-relic-4'); insert(t, shell); t.interaction.reset();
  assert.equal(t.interaction.getState(), S.EMPTY); assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 0); t.interaction.dispose();
}
console.log('VR Astro furnace content assertions passed');
