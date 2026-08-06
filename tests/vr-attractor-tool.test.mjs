import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrSemanticInput, XR_STANDARD_BUTTONS } from '../src/xr/input/createVrSemanticInput.js';
import { createVrAttractorTool, VR_ATTRACTOR_STATES, VR_ATTRACTOR_VISUAL_CONFIG, MODEL_AIM_AXIS,
  XR_AIM_AXIS, blenderRpmToThree } from '../src/xr/tools/createVrAttractorTool.js';
import { createVrHandModeController } from '../src/xr/input/createVrHandModeController.js';
import { resolveAttractorShellGlyph, VR_ATTRACTOR_SHELL_GLYPHS } from '../src/xr/tools/vrAttractorShellGlyphs.js';
import { resolveAttractorGlyphFamilyColors } from '../src/xr/tools/createVrAttractorPanelSystem.js';

function createTestCanvas() {
  const calls = [];
  const context = {
    calls, clearRect(...args) { calls.push(['clear', ...args]); },
    fillRect(...args) { calls.push(['fill', this.fillStyle, this.globalCompositeOperation, ...args]); },
    drawImage(...args) { calls.push(['image', ...args]); },
    fillText(...args) { calls.push(['text', ...args]); }, save() {}, restore() {},
    fillStyle: '', globalAlpha: 1, globalCompositeOperation: 'source-over', shadowColor: '', shadowBlur: 0,
    textAlign: '', textBaseline: '', font: ''
  };
  return { width: 0, height: 0, context, getContext: (type) => type === '2d' ? context : null };
}

{
  assert.deepEqual(resolveAttractorGlyphFamilyColors(VR_ATTRACTOR_VISUAL_CONFIG), {
    RO: '#ff9b3d', KO: '#d59a36', LO: '#69c979', SO: '#79d8ff', TO: '#dcecff', VO: '#8feaff'
  }, 'glyph colors resolve from the existing fuel and Astro energy-cell palette');
}

globalThis.document = { createElement: (tag) => tag === 'canvas' ? createTestCanvas() : null };

{
  const expected = [['shell_01', 'RO'], ['shell_02', 'KO'], ['shell_03', 'LO'], ['shell_04', 'SO'],
    ['shell_05', 'TO'], ['shell_06', 'VO']];
  assert.deepEqual(Object.entries(VR_ATTRACTOR_SHELL_GLYPHS).map(([shell, glyph]) => [shell, glyph.syllable]), expected);
  expected.forEach(([identity, syllable], index) => {
    const glyph = resolveAttractorShellGlyph({ userData: { shellAssetId: `shell-relic-${index + 1}` } });
    assert.equal(glyph.identity, identity); assert.equal(glyph.syllable, syllable);
    assert.match(glyph.url, new RegExp(`/svg/${syllable}\\.svg$`));
  });
}

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

function createContractModel({ degenerateFuelPoints = false, unusableDebugElement = null } = {}) {
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
      element === unusableDebugElement ? new THREE.Vector3() :
        new THREE.Vector3(Math.sin(index * 0.3) * 0.01, index * 0.01, Math.cos(index * 0.3) * 0.01)));
    const debugPath = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    debugPath.name = `DEBUG_FUEL_${element}_PATH`;
    model.add(debugPath);
  }
  const energyCell = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  energyCell.name = 'energy_cell';
  root.add(energyCell);
  for (let index = 1; index <= 4; index += 1) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.12 * index, 0.06), new THREE.MeshStandardMaterial());
    panel.name = `glyph_panel_0${index}`;
    if (index === 1) panel.userData = { vr_panel_width_m: 0.2, vr_panel_height_m: 0.1, vr_panel_aspect: 2 };
    panel.position.set(index * 0.01, index * 0.02, index * -0.01);
    root.add(panel);
  }
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
  const warnings = [];
  const tool = createVrAttractorTool({
    model: createContractModel({ degenerateFuelPoints: true, unusableDebugElement: 'EARTH' }),
    logger: { warn(message) { warnings.push(message); } }
  });
  assert.equal(tool.diagnostics.fuelPathSources.earth, 'disabled');
  assert.equal(tool.diagnostics.fuelPointCounts.earth, 0);
  assert.equal(tool.object.getObjectByName('VrAttractorFuelParticles_earth'), undefined);
  assert.ok(warnings.some((message) => message.includes('VR_FUEL_EARTH_PATH') && message.includes('disabling earth')),
    'an unusable optional earth path emits an element-specific warning');
  for (const element of ['fire', 'tree', 'metal', 'water']) {
    assert.equal(tool.diagnostics.fuelPathSources[element], 'debug_geometry');
    assert.ok(tool.object.getObjectByName(`VrAttractorFuelParticles_${element}`), `${element} stream remains active`);
  }
  tool.dispose();
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
  const missingPanelModel = createContractModel();
  missingPanelModel.getObjectByName('glyph_panel_03').removeFromParent();
  assert.throws(() => createVrAttractorTool({ model: missingPanelModel, logger: { warn() {} } }),
    /missing required nodes:.*glyph_panel_03/, 'all four glyph panels are required by the new GLB contract');

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
  const panelTransforms = Array.from({ length: 4 }, (_, index) => {
    const panel = source.getObjectByName(`glyph_panel_0${index + 1}`);
    return { panel, geometry: panel.geometry, position: panel.position.clone(), quaternion: panel.quaternion.clone(), scale: panel.scale.clone() };
  });
  let imageLoadCount = 0;
  const tool = createVrAttractorTool({ model: source, logger: { warn() {} }, imageFactory: () => {
    imageLoadCount += 1;
    return { naturalWidth: 120, naturalHeight: 240, set src(value) { this.currentSrc = value; this.onload(); } };
  } });
  const panelRecords = tool.panelSystem.panels;
  assert.equal(panelRecords.length, 4);
  assert.equal(new Set(panelRecords.map(({ canvas }) => canvas)).size, 4, 'each panel owns a canvas');
  assert.equal(new Set(panelRecords.map(({ texture }) => texture)).size, 4, 'each panel owns a CanvasTexture');
  assert.equal(new Set(panelRecords.map(({ material }) => material)).size, 4, 'each panel owns a screen material');
  assert.deepEqual(panelRecords.map(({ content }) => content), ['', '02', '03', '04']);
  assert.deepEqual([panelRecords[0].canvas.width, panelRecords[0].canvas.height], [512, 256],
    'Blender panel aspect extras determine canvas proportions');
  panelTransforms.forEach(({ panel, geometry, position, quaternion, scale }) => {
    assert.equal(panel.geometry, geometry, 'the authored panel geometry is reused');
    assert.ok(panel.position.equals(position) && panel.quaternion.equals(quaternion) && panel.scale.equals(scale),
      'the authored panel transform is unchanged');
  });
  panelRecords.forEach(({ panel, material, texture }) => {
    assert.equal(panel.material, material);
    assert.equal(material.map, texture);
    assert.equal(material.depthTest, true); assert.equal(material.depthWrite, false);
    assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
    assert.equal(texture.flipY, false, 'CanvasTexture follows the authored glTF UV convention');
  });
  const untouchedDrawCounts = panelRecords.slice(1).map(({ context }) => context.calls.length);
  tool.panelSystem.setPanelContent(0, 'A');
  assert.equal(panelRecords[0].content, 'A');
  assert.deepEqual(panelRecords.slice(1).map(({ context }) => context.calls.length), untouchedDrawCounts,
    'updating panel 1 does not redraw panels 2-4');
  const secondaryDrawCounts = panelRecords.slice(1).map(({ context }) => context.calls.length);
  tool.setTarget({ target: { userData: { shellAssetId: 'shell-relic-1' } }, proximity: 0.4 });
  await Promise.resolve();
  assert.equal(imageLoadCount, 1); assert.match(panelRecords[0].glyph.currentSrc, /\/svg\/RO\.svg$/);
  const imageCall = panelRecords[0].maskContext.calls.findLast((call) => call[0] === 'image');
  assert.equal(imageCall[0], 'image');
  assert.ok(Math.abs(imageCall[2] - 202.24) < 1e-9 && Math.abs(imageCall[3] - 20.48) < 1e-9
    && Math.abs(imageCall[4] - 107.52) < 1e-9 && Math.abs(imageCall[5] - 215.04) < 1e-9,
  'the RO SVG is aspect-fitted, centered, and rendered with a safe margin');
  assert.ok(panelRecords[0].maskContext.calls.some((call) => call[0] === 'fill'
    && call[1] === 'rgb(255,155,61)' && call[2] === 'source-in'),
  'the black SVG is used as an alpha mask and recolored with the fire family color');
  const targetingDrawCount = panelRecords[0].drawCount;
  tool.setState(VR_ATTRACTOR_STATES.TARGETING); tool.setGlyphPanelState('target-valid');
  tool.setState(VR_ATTRACTOR_STATES.PULLING); tool.setGlyphPanelState('pulling');
  assert.ok(panelRecords[0].glyph, 'visual state changes preserve the current target glyph');
  const pullingDrawCount = panelRecords[0].drawCount;
  tool.setTarget({ target: { userData: { shellAssetId: 'shell-relic-1' } }, proximity: 0.8 });
  await Promise.resolve(); assert.equal(imageLoadCount, 1, 'repeated target updates reuse the cached SVG');
  assert.ok(panelRecords[0].drawCount > pullingDrawCount && pullingDrawCount > targetingDrawCount,
    'entering PULLING and increasing targetProximity both increase the presentation');
  const sameBucketDrawCount = panelRecords[0].drawCount;
  tool.setTarget({ target: { userData: { shellAssetId: 'shell-relic-1' } }, proximity: 0.801 });
  await Promise.resolve();
  assert.equal(panelRecords[0].drawCount, sameBucketDrawCount,
    'proximity changes inside the same quantized bucket do not redraw the canvas');
  assert.ok(panelRecords[0].maskContext.calls.filter((call) => call[0] === 'fill').every((call) =>
    !call[1] || call[1].startsWith('rgb') || call[1] === '#ff9b3d'),
  'distance intensity never changes the selected glyph family');
  tool.setTarget({ target: { userData: { shellAssetId: 'shell-relic-2' } } });
  await Promise.resolve(); assert.equal(imageLoadCount, 2); assert.match(panelRecords[0].glyph.currentSrc, /\/svg\/KO\.svg$/);
  assert.deepEqual(panelRecords.slice(1).map(({ context }) => context.calls.length), secondaryDrawCounts.map((count) => count + 6),
    'only visual-state broadcasts, not target changes, redraw panels 2-4');
  tool.setTarget(null); assert.equal(panelRecords[0].glyph, null); assert.equal(panelRecords[0].content, '');
  tool.setTarget({ target: { userData: { shellAssetId: 'shell-relic-1' } } }); await Promise.resolve();
  tool.setEquipped(false); assert.equal(panelRecords[0].glyph, null, 'unequip clears the previous target glyph');
  tool.setEquipped(true);
  const canvasMaterials = panelRecords.map(({ material }) => material);
  tool.setGlyphPanelState('pulling');
  assert.deepEqual(panelRecords.map(({ panel }) => panel.material), canvasMaterials,
    'state feedback preserves all CanvasTexture materials');
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
  assert.deepEqual(panelRecords.map(({ content }) => content), ['', '02', '03', '04'],
    'reset clears panel 1 while restoring the remaining technical labels');
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
  const disposedTextures = [];
  const disposedPanelMaterials = [];
  panelRecords.forEach(({ texture, material }) => {
    texture.dispose = () => disposedTextures.push(texture);
    material.dispose = () => disposedPanelMaterials.push(material);
  });
  tool.dispose();
  assert.equal(disposedTextures.length, 4);
  assert.equal(disposedPanelMaterials.length, 4);
  assert.ok(panelRecords.every(({ canvas }) => canvas.width === 0 && canvas.height === 0));
  assert.equal(tool.panelSystem.glyphImages.size, 0, 'dispose releases the glyph image cache');
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
