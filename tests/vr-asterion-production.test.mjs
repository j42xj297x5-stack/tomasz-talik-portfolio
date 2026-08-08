import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrAstroFurnaceProgressionController, REQUIRED_ASTERION_SHELLS } from '../src/xr/furnace/createVrAstroFurnaceProgressionController.js';
import { createVrAsterionProductionController, VR_ASTERION_PRODUCTION_STATES as STATES } from '../src/xr/asterion/createVrAsterionProductionController.js';

function harness({ complete = false } = {}) {
  const progression = createVrAstroFurnaceProgressionController();
  REQUIRED_ASTERION_SHELLS.slice(0, complete ? 6 : 5).forEach((id) => progression.commitAbsorbedShell(id));
  const anchor = new THREE.Group(), socket = new THREE.Group();
  const object = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial()); object.visible = false; socket.add(object);
  let presented = false, mode = 'NORMAL_HAND', equips = 0, starts = 0, stops = 0;
  const sphere = { object, socket, presentAt(parent, scale) { parent.add(socket); socket.scale.setScalar(scale); object.visible = true; presented = true; return true; },
    setPresentationScale(scale) { socket.scale.setScalar(scale); return true; }, clearPresentation() { socket.removeFromParent(); object.visible = false; presented = false; }, isPresented: () => presented };
  const leftController = new THREE.Group(); leftController.position.z = 1;
  const rightController = new THREE.Group(); rightController.position.z = 1;
  const left = { handedness: 'left', controller: leftController, ray: { visible: true }, currentRayLength: 2.3, reportRayHit() {} };
  const right = { handedness: 'right', controller: rightController, ray: { visible: true }, currentRayLength: 2.3, reportRayHit() {} };
  const handModes = { getLeftMode: () => mode, equipLeftAsterion() { mode = 'ASTERION_SPHERE'; equips += 1; return true; } };
  const production = createVrAsterionProductionController({ progressionController: progression, sphere, essenceAnchor: anchor,
    controllers: [left, right], handModeController: handModes, settings: { buildDurationSeconds: 5, rayMaxDistance: 2.3 },
    onBuildStart() { starts += 1; }, onBuildStop() { stops += 1; } });
  return { progression, production, sphere, left, right, handModes, counts: () => ({ equips, starts, stops }) };
}

{
  const h = harness(); assert.equal(h.production.getState(), STATES.LOCKED, '5/6 remains LOCKED'); assert.equal(h.production.requestCreate(), false);
  h.progression.commitAbsorbedShell(REQUIRED_ASTERION_SHELLS[5]); assert.equal(h.production.getState(), STATES.READY, '6/6 opens READY');
  assert.equal(h.production.requestCreate(), true); assert.equal(h.production.requestCreate(), false, 'duplicate create cannot restart'); assert.equal(h.counts().starts, 1);
  h.production.resetSession(); assert.equal(h.production.getState(), STATES.READY); assert.equal(h.sphere.isPresented(), false); h.production.dispose();
}
{
  const h = harness({ complete: true }); h.production.requestCreate(); h.production.update(5);
  assert.equal(h.production.getState(), STATES.AVAILABLE); assert.equal(h.production.getDiagnostics().committedBuilds, 1); h.production.update(1);
  assert.equal(h.production.getDiagnostics().committedBuilds, 1); assert.equal(h.handModes.getLeftMode(), 'NORMAL_HAND', 'AVAILABLE does not equip');
  assert.equal(h.production.claim(h.right), false, 'right hand cannot claim'); assert.equal(h.production.claim(h.left), true, 'left hit claims');
  assert.equal(h.production.getState(), STATES.EARNED); assert.equal(h.counts().equips, 1); assert.equal(h.production.claim(h.left), false); assert.equal(h.production.getDiagnostics().earnedCommits, 1);
  h.production.resetSession(); assert.equal(h.production.getState(), STATES.EARNED); h.production.dispose();
}
{
  const h = harness({ complete: true }); h.production.requestCreate(); h.production.update(5); h.production.resetSession();
  assert.equal(h.production.getState(), STATES.AVAILABLE); assert.equal(h.sphere.isPresented(), true); h.production.dispose(); h.production.dispose(); assert.equal(h.sphere.isPresented(), false);
}
console.log('VR production Asterion tests passed.');
