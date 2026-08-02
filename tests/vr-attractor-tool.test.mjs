import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrSemanticInput, XR_STANDARD_BUTTONS } from '../src/xr/input/createVrSemanticInput.js';
import { createVrAttractorTool, VR_ATTRACTOR_STATES, VR_ATTRACTOR_VISUAL_CONFIG, MODEL_AIM_AXIS,
  XR_AIM_AXIS, blenderRpmToThree } from '../src/xr/tools/createVrAttractorTool.js';
import { createVrHandModeController } from '../src/xr/input/createVrHandModeController.js';

function makeButton(value = 0) { return { value, pressed: value > 0.5 }; }

{
  const buttons = Array.from({ length: 5 }, () => makeButton());
  const renderer = { xr: { getSession: () => ({ inputSources: [{ handedness: 'right', gamepad: { buttons } }] }) } };
  const input = createVrSemanticInput({ renderer });
  buttons[XR_STANDARD_BUTTONS.toggleRightTool] = makeButton(1);
  assert.equal(input.update().toggleRightTool, true, 'A emits an action on its rising edge');
  assert.equal(input.update().toggleRightTool, false, 'held A does not repeat the toggle action');
  buttons[XR_STANDARD_BUTTONS.primaryAction] = makeButton(0.63);
  assert.equal(input.update().primaryAction, 0.63, 'trigger remains an analog semantic action');
  input.reset();
  assert.equal(input.getState().primaryAction, 0);
}

function createContractModel({ degenerateFuelPoints = false } = {}) {
  const model = new THREE.Group();
  const root = new THREE.Group();
  root.name = 'VR_ATTRACTOR_ROOT';
  model.add(root);
  const plainNames = ['grab', 'PIVOT_BASE_GRAB', 'base_grab', 'PIVOT_FISKERS', 'Fiskers',
    'fuel_line_earth', 'fuel_line_fire', 'fuel_line_tree',
    'fuel_line_metal', 'fuel_line_water', 'PIVOT_BASE_MOLEKULAR', 'base_molekular', 'PIVOT_RING_CALIBRATION',
    'Ring_calibration', 'PIVOT_RING_MASTER', 'Ring_Master', 'PIVOT_RING_INNER', 'Ring_inner',
    'PIVOT_ENERGY_SHELL', 'energy_shell', 'VR_ENERGY_CELL_ANCHOR'];
  plainNames.forEach((name) => { const node = new THREE.Group(); node.name = name; root.add(node); });
  for (const element of ['EARTH', 'FIRE', 'TREE', 'METAL', 'WATER']) {
    const geometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 36 }, (_, index) =>
      new THREE.Vector3(Math.sin(index * 0.3) * 0.01, index * 0.01, Math.cos(index * 0.3) * 0.01)));
    const debugPath = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    debugPath.name = `DEBUG_FUEL_${element}_PATH`;
    root.add(debugPath);
  }
  const energyCell = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  energyCell.name = 'energy_cell';
  root.add(energyCell);
  for (const element of ['EARTH', 'FIRE', 'TREE', 'METAL', 'WATER']) {
    const path = new THREE.Group();
    path.name = `VR_FUEL_${element}_PATH`;
    for (let index = 0; index < 12; index += 1) {
      const point = new THREE.Object3D();
      point.name = `VR_FUEL_${element}_P${String(index).padStart(2, '0')}`;
      if (!degenerateFuelPoints) point.position.set(index * 0.01, index * 0.02, 0);
      point.userData.vr_path_index = index;
      path.add(point);
    }
    root.add(path);
  }
  return model;
}

{
  const fallbackTool = createVrAttractorTool({ model: createContractModel({ degenerateFuelPoints: true }),
    logger: { warn() {} } });
  assert.deepEqual(fallbackTool.diagnostics.fuelPathSources,
    { earth: 'debug_geometry', fire: 'debug_geometry', tree: 'debug_geometry', metal: 'debug_geometry', water: 'debug_geometry' },
    'twelve coincident marker points select the DEBUG_FUEL geometry fallback');
  assert.ok(Object.values(fallbackTool.diagnostics.fuelMarkersDegenerate).every(Boolean));
  assert.ok(Object.values(fallbackTool.diagnostics.fuelPointCounts).every((count) => count === 12));
  assert.ok(Object.values(fallbackTool.diagnostics.fuelCurveClosed).every((closed) => closed === false),
    'fallback fuel curves remain open');
  fallbackTool.setUnlocked(true); fallbackTool.setEquipped(true); fallbackTool.update(0.1);
  const positions = fallbackTool.object.getObjectByName('VrAttractorFuelParticles_earth').geometry.attributes.position;
  assert.ok(new THREE.Vector3().fromBufferAttribute(positions, 0)
    .distanceTo(new THREE.Vector3().fromBufferAttribute(positions, 1)) > 1e-5,
  'fallback curve has non-zero length');
  fallbackTool.dispose();
}

{
  for (const requiredPivot of ['PIVOT_BASE_GRAB', 'PIVOT_FISKERS']) {
    const invalidModel = createContractModel();
    invalidModel.getObjectByName(requiredPivot).removeFromParent();
    assert.throws(() => createVrAttractorTool({ model: invalidModel, logger: { warn() {} } }),
      new RegExp(`missing required nodes:.*${requiredPivot}`), `${requiredPivot} is required by the GLB contract`);
  }

  assert.deepEqual(blenderRpmToThree({ x: 17, y: -31, z: 43 }), { x: 17, y: 43, z: 31 });
  const source = createContractModel();
  const pivotNames = ['PIVOT_BASE_GRAB', 'PIVOT_FISKERS', 'PIVOT_BASE_MOLEKULAR', 'PIVOT_RING_CALIBRATION',
    'PIVOT_RING_MASTER', 'PIVOT_RING_INNER', 'PIVOT_ENERGY_SHELL'];
  const pivots = pivotNames.map((name) => source.getObjectByName(name));
  pivots.forEach((pivot, index) => pivot.rotation.set(0.03 * index, 0.05 * index, -0.02 * index));
  pivots.forEach((pivot, index) => {
    pivot.position.set(index * 0.1, index * -0.04, index * 0.02);
    pivot.scale.setScalar(1 + index * 0.1);
  });
  const energyCell = source.getObjectByName('energy_cell');
  const sourceMaterial = energyCell.material;
  const tool = createVrAttractorTool({ model: source, logger: { warn() {} } });
  const initialTransforms = pivots.map((pivot) => ({
    position: pivot.position.clone(), quaternion: pivot.quaternion.clone(), scale: pivot.scale.clone()
  }));
  assert.notEqual(energyCell.material, sourceMaterial, 'runtime clones the controlled material');
  assert.ok(Math.abs(tool.modelScale.scale.x - 1 / 3) < 1e-12, 'model wrapper applies central 1/3 scale');
  assert.ok(MODEL_AIM_AXIS.clone().applyQuaternion(tool.aimCorrection).distanceTo(XR_AIM_AXIS) < 1e-12,
    'aim correction maps model +Y onto target-ray -Z');
  const fuelPoints = tool.object.getObjectByName('VrAttractorFuelParticles_earth');
  assert.equal(fuelPoints.material.size, VR_ATTRACTOR_VISUAL_CONFIG.fuelPointSize);
  assert.equal(VR_ATTRACTOR_VISUAL_CONFIG.fuelPointSize, 0.0035);
  assert.equal(fuelPoints.material.depthWrite, false);
  assert.equal(fuelPoints.material.depthTest, false);
  assert.equal(fuelPoints.material.blending, THREE.AdditiveBlending);
  assert.equal(fuelPoints.material.transparent, true);
  assert.ok(fuelPoints.material.opacity > VR_ATTRACTOR_VISUAL_CONFIG.fuel.earth.brightness);
  assert.equal(tool.diagnostics.missingRequiredNodes.some((name) => name.startsWith('DEBUG_FUEL_')), false,
    'DEBUG_FUEL paths are optional and ignored by the runtime contract');
  assert.ok(Object.values(tool.diagnostics.fuelPathSources).every((sourceName) => sourceName === 'vr_points'),
    'valid P00..P11 markers do not use debug geometry');
  assert.ok(Object.values(tool.diagnostics.fuelMarkersDegenerate).every((degenerate) => degenerate === false));
  assert.ok(Object.values(tool.diagnostics.fuelCurveClosed).every((closed) => closed === false));
  tool.setUnlocked(true);
  tool.setEquipped(true);
  assert.equal(tool.getState(), VR_ATTRACTOR_STATES.IDLE);
  assert.equal(tool.object.visible, true);
  tool.setTrigger(1);
  tool.update(0.1);
  const expectedBase = initialTransforms[2].quaternion.clone().multiply(new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), -3 * Math.PI * 2 * 0.1 / 60));
  assert.ok(pivots[2].quaternion.angleTo(expectedBase) < 1e-7, 'axial pivot update rotates around local Y');
  const acceleratingRPM = tool.getInnerRPM();
  assert.ok(acceleratingRPM > 0 && acceleratingRPM < 90, 'Ring_inner accelerates rather than jumping to max RPM');
  tool.setTrigger(0);
  tool.update(0.1);
  assert.ok(tool.getInnerRPM() < acceleratingRPM && tool.getInnerRPM() > 0, 'Ring_inner decelerates smoothly');
  assert.deepEqual(tool.diagnostics.fuelPointCounts, { earth: 12, fire: 12, tree: 12, metal: 12, water: 12 });
  tool.reset();
  assert.equal(tool.getState(), VR_ATTRACTOR_STATES.UNEQUIPPED);
  assert.equal(tool.object.visible, false);
  assert.equal(tool.getInnerRPM(), 0);
  pivots.forEach((pivot) => { pivot.position.set(9, 8, 7); pivot.quaternion.identity(); pivot.scale.set(3, 4, 5); });
  tool.reset();
  pivots.forEach((pivot, index) => {
    assert.ok(pivot.position.distanceTo(initialTransforms[index].position) < 1e-7,
      `${pivot.name} reset restores its configured local position`);
    assert.ok(pivot.quaternion.angleTo(initialTransforms[index].quaternion) < 1e-7,
      `${pivot.name} reset restores its imported quaternion`);
    assert.ok(pivot.scale.distanceTo(initialTransforms[index].scale) < 1e-7,
      `${pivot.name} reset restores its imported local scale`);
  });
  tool.dispose();
}

{
  const controller = new THREE.Group();
  const grip = new THREE.Group();
  const calls = [];
  const attractorTool = {
    setUnlocked() {}, setTrigger() {}, update() {}, setEquipped() {}, reset() {}, dispose() {},
    attachToTargetRay(parent) { calls.push(parent); }
  };
  const handModes = createVrHandModeController({
    controllers: [{ handedness: 'right', controller, grip }],
    semanticInput: { update: () => ({ toggleRightTool: false, primaryAction: 0 }), reset() {} },
    attractorTool,
    isUnlocked: () => true
  });
  handModes.update(0.016);
  assert.equal(calls[0], controller, 'Astro mount uses right target-ray controller');
  assert.notEqual(calls[0], grip, 'Astro mount does not use right grip');
}

console.log('vr-attractor-tool tests passed');
