import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrSemanticInput, XR_STANDARD_BUTTONS } from '../src/xr/input/createVrSemanticInput.js';
import { createVrAttractorTool, VR_ATTRACTOR_STATES } from '../src/xr/tools/createVrAttractorTool.js';

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

function createContractModel() {
  const model = new THREE.Group();
  const root = new THREE.Group();
  root.name = 'VR_ATTRACTOR_ROOT';
  model.add(root);
  const plainNames = ['grab', 'base_grab', 'Fiskers', 'fuel_line_earth', 'fuel_line_fire', 'fuel_line_tree',
    'fuel_line_metal', 'fuel_line_water', 'PIVOT_BASE_MOLEKULAR', 'base_molekular', 'PIVOT_RING_CALIBRATION',
    'Ring_calibration', 'PIVOT_RING_MASTER', 'Ring_Master', 'PIVOT_RING_INNER', 'Ring_inner',
    'PIVOT_ENERGY_SHELL', 'energy_shell', 'VR_ENERGY_CELL_ANCHOR'];
  plainNames.forEach((name) => { const node = new THREE.Group(); node.name = name; root.add(node); });
  const energyCell = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  energyCell.name = 'energy_cell';
  root.add(energyCell);
  for (const element of ['EARTH', 'FIRE', 'TREE', 'METAL', 'WATER']) {
    const path = new THREE.Group();
    path.name = `VR_FUEL_${element}_PATH`;
    for (let index = 0; index < 12; index += 1) {
      const point = new THREE.Object3D();
      point.name = `VR_FUEL_${element}_P${String(index).padStart(2, '0')}`;
      point.position.set(index * 0.01, index * 0.02, 0);
      point.userData.vr_path_index = index;
      path.add(point);
    }
    root.add(path);
  }
  return model;
}

{
  const source = createContractModel();
  const energyCell = source.getObjectByName('energy_cell');
  const sourceMaterial = energyCell.material;
  const tool = createVrAttractorTool({ model: source, logger: { warn() {} } });
  assert.notEqual(energyCell.material, sourceMaterial, 'runtime clones the controlled material');
  tool.setUnlocked(true);
  tool.setEquipped(true);
  assert.equal(tool.getState(), VR_ATTRACTOR_STATES.IDLE);
  assert.equal(tool.object.visible, true);
  tool.setTrigger(1);
  tool.update(0.1);
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
  tool.dispose();
}

console.log('vr-attractor-tool tests passed');
