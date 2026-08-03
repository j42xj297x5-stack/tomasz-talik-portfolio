import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { ASTRO_FURNACE_CONTENT_STATES as S, constrainHeldShellToDeviceSurfaces, createVrAstroFurnaceContentInteraction, processRotationPulse, setObjectWorldScale } from '../src/xr/furnace/createVrAstroFurnaceContentInteraction.js';
import { createVrAstroFurnaceProgressionController } from '../src/xr/furnace/createVrAstroFurnaceProgressionController.js';

assert.equal(processRotationPulse(0), 0);
assert.equal(processRotationPulse(Math.PI), 3);
assert.ok(processRotationPulse(Math.PI * 2) < 1e-12, 'shell pulse follows the same 0 -> 3 -> 0 process-angle phase');

function fixture({ emptyVolume = false } = {}) {
  const object = new THREE.Group(), volume = emptyVolume ? new THREE.Group() : new THREE.Mesh(new THREE.SphereGeometry(.5)), anchor = new THREE.Group();
  const chamberGeometry = new THREE.CylinderGeometry(.4, .4, 1.2);
  const chamber = new THREE.Mesh(chamberGeometry, new THREE.MeshBasicMaterial()); object.add(volume, anchor, chamber); const records = []; let open = 'OPEN', process = 'IDLE', progress = 0, commits = 0, removed;
  const progression = createVrAstroFurnaceProgressionController(), commit = progression.commitAbsorbedShell;
  progression.commitAbsorbedShell = (id) => { commits++; return commit(id); };
  const interaction = createVrAstroFurnaceContentInteraction({ furnace: { object, nodes: { VR_FURNACE_INSERT_VOLUME: volume,
    VR_FURNACE_CONTENT_ANCHOR: anchor, komora: chamber } }, shellSystem: { records, getRecord(shell) { return records.find((record) => record.object === shell); }, removeInstance(shell) { removed = shell; shell.removeFromParent(); return true; } },
  openInteraction: { getState: () => open }, activateInteraction: { getState: () => process, getProgress: () => progress }, progressionController: progression,
  settings: emptyVolume ? { volumeRadius: .5, rejectDuration: .1 } : { rejectDuration: .1 } });
  const makeShell = (id = 'shell-relic-1', radius = .1) => { const shell = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshStandardMaterial());
    shell.userData.shellAssetId = id; object.add(shell); records.push({ object: shell, boundingCenter: new THREE.Vector3(), boundingRadius: radius }); return shell; };
  return { interaction, progression, anchor, makeShell, setOpen: (v) => { open = v; }, setProcess: (v) => { process = v; },
    setProgress: (v) => { progress = v; }, get commits() { return commits; }, get removed() { return removed; } };
}
{
  const t = fixture(), shell = t.makeShell();
  assert.equal(t.interaction.feedback.geometry.type, 'CylinderGeometry');
  shell.position.set(.35, .55, 0); t.interaction.reportHeldShell(shell); t.interaction.update(.01);
  assert.equal(t.interaction.getState(), S.INSERTED, 'a valid center is automatically inserted without release');
  shell.position.set(.41, 0, 0); t.interaction.reportHeldShell(shell); t.interaction.update(.01);
  assert.equal(t.interaction.getState(), S.EMPTY, 'center outside the cylinder radius is not a candidate');
  shell.position.set(0, .61, 0); t.interaction.reportHeldShell(shell); t.interaction.update(.01);
  assert.equal(t.interaction.getState(), S.EMPTY, 'center outside the cylinder height is not a candidate');
  t.interaction.dispose();
}
{
  const t = fixture(), hand = new THREE.Group(), shell = t.makeShell(); shell.removeFromParent(); hand.add(shell); t.anchor.parent.add(hand);
  t.setOpen('CLOSED'); shell.position.set(0, 0, 0); t.interaction.reportHeldShell(shell); t.interaction.update(.01);
  assert.ok(shell.position.z > .39, 'closed authored chamber cylinder backs the held shell out along the lance axis'); t.interaction.dispose();
}
{
  const t = fixture(), small = t.makeShell('shell-relic-1', .1); small.scale.setScalar(.63); insert(t, small); t.interaction.update(1);
  assert.ok(Math.abs(small.scale.x - .63) < 1e-6, 'a shell that already fits is not upscaled');
  t.interaction.reportHeldShell(small); t.interaction.update(.01); assert.ok(Math.abs(small.scale.x - .63) < 1e-6);
  insert(t, small); t.interaction.update(1); assert.ok(Math.abs(small.scale.x - .63) < 1e-6, 'insert/retrieve does not accumulate scale');
  t.interaction.dispose();
}
{
  const t = fixture(), large = t.makeShell('shell-relic-1', .8); large.scale.setScalar(1.25); insert(t, large); t.interaction.update(1);
  assert.ok(large.scale.x < 1.25, 'an oversized shell is downscaled');
  t.interaction.reportHeldShell(large); t.interaction.update(.01);
  assert.ok(Math.abs(large.scale.x - 1.25) < 1e-6, 'retrieval restores the per-shell baseline'); t.interaction.dispose();
}
{
  const empty = fixture({ emptyVolume: true }), geometry = fixture();
  assert.equal(empty.interaction.isInsertionReady(), true); assert.equal(geometry.interaction.isInsertionReady(), true);
  const shell = empty.makeShell(); empty.interaction.reportHeldShell(shell); empty.interaction.update(.01);
  assert.equal(empty.interaction.getState(), S.INSERTED); assert.equal(empty.interaction.feedback.visible, false);
  empty.interaction.update(1);
  assert.ok(empty.interaction.getInsertedShell().scale.x > 0, 'an empty Object3D insertion marker cannot produce scale zero');
  empty.interaction.dispose(); geometry.interaction.dispose();
}
function insert(test, shell) { test.interaction.reportHeldShell(shell); test.interaction.update(.01);
  assert.equal(test.interaction.getState(), S.INSERTED); }

{
  const t = fixture(), shell = t.makeShell(); assert.equal(t.interaction.canAcceptShell(shell), true);
  t.setOpen('CLOSED'); assert.equal(t.interaction.canAcceptShell(shell), false); t.setOpen('OPEN'); t.setProcess('SPINUP');
  assert.equal(t.interaction.canAcceptShell(shell), false); t.setProcess('IDLE');
  const unknown = t.makeShell('unknown'); t.interaction.reportHeldShell(unknown); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CANDIDATE_INVALID);
  assert.equal(t.interaction.feedback.material.color.getHex(), 0xe05252);
  assert.equal(t.interaction.getInsertedShell(), null, 'invalid candidate is never taken over');
  t.interaction.reportHeldShell(null); t.interaction.update(.01);
  assert.notEqual(unknown.userData.shellState, 'inserted', 'release during red feedback cannot leave invalid content inserted');
  t.interaction.reset(); t.progression.commitAbsorbedShell('shell-relic-2'); const duplicate = t.makeShell('shell-relic-2');
  t.interaction.reportHeldShell(duplicate); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CANDIDATE_INVALID); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell(); insert(t, shell); t.interaction.update(1);
  const settledScale = shell.scale.clone();
  assert.equal(shell.visible, true); assert.equal(t.interaction.getState(), S.INSERTED);
  t.setOpen('CLOSED'); t.interaction.update(.2);
  assert.ok(shell.scale.equals(settledScale) && shell.visible, 'inserted shell remains visible and stable before Activate');
  t.interaction.dispose();
}
{
  const t = fixture(), first = t.makeShell('shell-relic-1'), second = t.makeShell('shell-relic-2'); insert(t, first);
  t.interaction.reportHeldShell(second); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CANDIDATE_INVALID);
  assert.equal(t.interaction.feedback.material.color.getHex(), 0xe05252); t.interaction.reportHeldShell(null); t.interaction.update(.01);
  assert.equal(t.interaction.getInsertedShell(), first); assert.equal(second.userData.shellState, 'rejecting');
  t.interaction.update(.2); assert.equal(second.userData.shellState, 'placed'); assert.equal(t.interaction.getInsertedShell(), first);
  assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 0); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell(); insert(t, shell); assert.equal(t.interaction.getInsertedShell(), shell);
  assert.equal(shell.parent, t.anchor); assert.equal(t.interaction.hasValidInsertedContent(), true); t.interaction.update(1);
  t.interaction.reportHeldShell(shell); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.EMPTY);
  assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 0); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell('shell-relic-3'); insert(t, shell); t.interaction.update(1); const scale = shell.scale.x;
  const settledPosition = shell.position.clone(), settledQuaternion = shell.quaternion.clone();
  t.setOpen('CLOSED'); t.setProcess('SPINUP'); t.setProgress(.5); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CONSUMING);
  assert.equal(shell.scale.x, scale); assert.ok(shell.position.equals(settledPosition)); assert.ok(shell.quaternion.equals(settledQuaternion));
  assert.ok(shell.material.emissiveIntensity > 0); assert.ok(shell.material.opacity < 1); assert.equal(t.commits, 0);
  t.setProgress(.78); t.interaction.update(.01); assert.equal(t.interaction.getState(), S.CONSUMED); assert.equal(t.commits, 0);
  t.setProcess('COMPLETE'); t.interaction.update(.01); assert.equal(t.commits, 1); assert.equal(t.removed, shell);
  assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 1); t.interaction.update(1); assert.equal(t.commits, 1); t.interaction.dispose();
}
{
  const t = fixture(), shell = t.makeShell('shell-relic-4'); insert(t, shell); t.interaction.reset();
  assert.equal(t.interaction.getState(), S.EMPTY); assert.equal(t.progression.getSnapshot().asterionSphere.absorbed, 0); t.interaction.dispose();
}

// Candidate volume uses the cached geometry center and release has a small boundary grace.
{
  const object = new THREE.Group(), chamber = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 1.2)), volume = new THREE.Group(), anchor = new THREE.Group();
  object.add(chamber, volume, anchor); const shell = new THREE.Mesh(new THREE.SphereGeometry(.05)); shell.position.x = -.5; object.add(shell);
  shell.userData.shellAssetId = 'shell-relic-1'; const record = { object: shell, boundingCenter: new THREE.Vector3(.5, 0, 0), boundingRadius: .05 };
  let held = shell; const interaction = createVrAstroFurnaceContentInteraction({ furnace: { object, nodes: { komora: chamber, VR_FURNACE_INSERT_VOLUME: volume, VR_FURNACE_CONTENT_ANCHOR: anchor } },
    shellSystem: { records: [record], getRecord: () => record }, openInteraction: { getState: () => 'OPEN' }, activateInteraction: { getState: () => 'IDLE' },
    progressionController: { canAbsorbShell: () => true }, settings: { releaseGrace: .04 } });
  interaction.reportHeldShell(held); interaction.update(.01); assert.equal(interaction.getState(), S.INSERTED, 'cached geometry center triggers automatic insertion instead of the shell origin');
  assert.equal(interaction.getInsertedShell(), shell); interaction.update(1); object.updateMatrixWorld(true);
  const snappedCenter = record.boundingCenter.clone().applyMatrix4(shell.matrixWorld);
  const anchorCenter = anchor.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(snappedCenter.x - anchorCenter.x) < 1e-10 && Math.abs(snappedCenter.z - anchorCenter.z) < 1e-10,
    'cached geometry boundingCenter, not the authored origin, lands exactly on the content axis'); interaction.dispose();
}

// Hardware-QA regressions: stable feedback root and state visibility.
{
  const t = fixture();
  t.interaction.update(.01);
  assert.equal(t.interaction.feedback.visible, true, 'OPEN + EMPTY keeps the green guide visible before a shell approaches');
  assert.equal(t.interaction.feedback.material.color.getHex(), 0x49d17d);
  assert.ok(t.interaction.feedback.material.opacity <= .08, 'empty guide is deliberately subtle');
  const chamber = t.interaction.feedback.parent.children.find((child) => child.geometry?.type === 'CylinderGeometry' && child !== t.interaction.feedback);
  chamber.visible = false; t.interaction.update(.01);
  assert.equal(t.interaction.feedback.visible, true, 'feedback remains renderable when the authored chamber is hidden');
  assert.notEqual(t.interaction.feedback.parent, chamber);
  t.setOpen('CLOSED'); t.interaction.update(.01); assert.equal(t.interaction.feedback.visible, false);
  t.interaction.dispose();
}

{
  const root = new THREE.Group(), hold = new THREE.Group(), shell = new THREE.Mesh(new THREE.SphereGeometry(.1));
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .02)); wall.position.z = -.5; root.add(wall, hold); hold.add(shell); shell.position.z = -1; root.updateMatrixWorld(true);
  const center = shell.getWorldPosition(new THREE.Vector3());
  assert.equal(constrainHeldShellToDeviceSurfaces({ shell, shellCenter: center, origin: new THREE.Vector3(), radius: .1, deviceRoots: [wall], clearance: .01 }), true);
  assert.ok(Math.abs(shell.position.x) < 1e-12 && Math.abs(shell.position.y) < 1e-12, 'surface clamp only moves along the lance axis');
  assert.ok(shell.position.z > -.5, 'shell is clamped before the test surface');
  shell.position.z = -1; root.updateMatrixWorld(true);
  assert.equal(constrainHeldShellToDeviceSurfaces({ shell, shellCenter: shell.getWorldPosition(new THREE.Vector3()), origin: new THREE.Vector3(), radius: .1, deviceRoots: [wall], excludedRoots: [wall] }), false, 'an excluded open chamber does not block insertion');
}
{
  const root = new THREE.Group(), parentA = new THREE.Group(), parentB = new THREE.Group(), shell = new THREE.Group();
  parentA.scale.set(2, 3, 4); parentB.scale.set(.5, .25, 2); root.add(parentA, parentB); parentA.add(shell); shell.scale.set(.3, .4, .5); root.updateMatrixWorld(true);
  const original = shell.getWorldScale(new THREE.Vector3());
  for (let index = 0; index < 4; index++) { parentB.attach(shell); setObjectWorldScale(shell, original); root.updateMatrixWorld(true);
    assert.ok(shell.getWorldScale(new THREE.Vector3()).distanceTo(original) < 1e-12); parentA.attach(shell); setObjectWorldScale(shell, original); root.updateMatrixWorld(true);
    assert.ok(shell.getWorldScale(new THREE.Vector3()).distanceTo(original) < 1e-12, 'four reparent cycles preserve exact world scale'); }
}

console.log('VR Astro furnace content assertions passed');
