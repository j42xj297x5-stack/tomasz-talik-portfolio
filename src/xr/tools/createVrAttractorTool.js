import * as THREE from '../../vendor/three.js';
import { createVrAttractorPanelSystem, VR_ATTRACTOR_PANEL_NAMES } from './createVrAttractorPanelSystem.js';
import { resolveAttractorShellGlyph } from './vrAttractorShellGlyphs.js';

export const VR_ATTRACTOR_STATES = Object.freeze({
  UNEQUIPPED: 'UNEQUIPPED', IDLE: 'IDLE', TARGETING: 'TARGETING', PULLING: 'PULLING', CAPTURED: 'CAPTURED'
});

export const VR_ATTRACTOR_VISUAL_CONFIG = Object.freeze({
  modelScale: 1 / 3,
  fuelPointSize: 0.0035,
  fuelBrightnessMultiplier: 1.2,
  aimOffset: [0, 0, 0],
  ringLocalPositionOffsets: {
    PIVOT_RING_CALIBRATION: [0, -0.03, 0],
    PIVOT_RING_INNER: [0, -0.06, 0],
    PIVOT_RING_MASTER: [0, -0.06, 0]
  },
  baseMolecular: { idleRPM: 3, direction: -1 },
  calibration: { idleRPM: 4, targetingRPM: 8, direction: 1 },
  master: { idleRPM: 1, maxRPM: 10, direction: -1 },
  inner: { idleRPM: 0, maxRPM: 90, direction: 1, accelerationSeconds: 0.30, decelerationSeconds: 0.55 },
  shell: { blenderRPM: { x: 17, y: -31, z: 43 } },
  energyCell: { color: 0x8feaff, idlePulseHz: 0.7, activePulseHz: 2, baseIntensity: 1.15, pulseIntensity: 0.55 },
  fuel: {
    earth: { path: 'VR_FUEL_EARTH_PATH', color: 0xd59a36, speed: 0.075, particleCount: 6, phase: 0.05, brightness: 0.72, pulseAmount: 0.12 },
    fire: { path: 'VR_FUEL_FIRE_PATH', color: 0xff9b3d, speed: 0.18, particleCount: 8, phase: 0.21, brightness: 1, pulseAmount: 0.25 },
    tree: { path: 'VR_FUEL_TREE_PATH', color: 0x69c979, speed: 0.095, particleCount: 6, phase: 0.43, brightness: 0.7, pulseAmount: 0.16 },
    metal: { path: 'VR_FUEL_METAL_PATH', color: 0xdcecff, speed: 0.12, particleCount: 7, phase: 0.62, brightness: 0.82, pulseAmount: 0.08 },
    water: { path: 'VR_FUEL_WATER_PATH', color: 0x79d8ff, speed: 0.11, particleCount: 7, phase: 0.81, brightness: 0.78, pulseAmount: 0.1 }
  }
});

export const MODEL_AIM_AXIS = new THREE.Vector3(0, 1, 0);
export const XR_AIM_AXIS = new THREE.Vector3(0, 0, -1);

// Asset contract: Blender X -> Three +X, Blender Y -> Three -Z, Blender Z -> Three +Y.
export function blenderRpmToThree({ x, y, z }) {
  return { x, y: z, z: -y };
}

const REQUIRED_NODES = Object.freeze([
  'VR_ATTRACTOR_ROOT', 'grab', 'PIVOT_BASE_GRAB', 'base_grab', 'PIVOT_FISKERS', 'Fiskers',
  'fuel_line_earth', 'fuel_line_fire', 'fuel_line_tree', 'fuel_line_metal', 'fuel_line_water',
  'PIVOT_BASE_MOLEKULAR', 'base_molekular', 'PIVOT_RING_CALIBRATION', 'Ring_calibration',
  'PIVOT_RING_MASTER', 'Ring_Master', 'PIVOT_RING_INNER', 'Ring_inner',
  'PIVOT_ENERGY_SHELL', 'energy_shell', 'energy_cell',
  ...VR_ATTRACTOR_PANEL_NAMES,
  ...Object.values(VR_ATTRACTOR_VISUAL_CONFIG.fuel).map(({ path }) => path)
]);

const rpmToRadians = (rpm, delta) => rpm * Math.PI * 2 * delta / 60;
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const pointIndex = (point) => Number.isFinite(point.userData?.vr_path_index)
  ? point.userData.vr_path_index : Number(point.name.match(/P(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);

const FUEL_PATH_EPSILON = 1e-5;

export function isDegenerateFuelPath(points, tolerance = FUEL_PATH_EPSILON) {
  if (points.length < 2) return true;
  let length = 0;
  for (let index = 1; index < points.length; index += 1) length += points[index].distanceTo(points[index - 1]);
  return length <= tolerance || points.every((point) => point.distanceTo(points[0]) <= tolerance);
}

// Blender's debug curves arrive as tube meshes. Projecting their vertices on the
// longest extent, then averaging slices, removes the tube radius while retaining
// an ordered, open centre line suitable for the small fuel particles.
function debugFuelControlPoints(debugMesh, root, targetCount = 12) {
  const attribute = debugMesh?.geometry?.getAttribute?.('position');
  if (!attribute || attribute.count < 2) return [];
  root.updateWorldMatrix(true, false);
  debugMesh.updateWorldMatrix(true, false);
  const vertices = [];
  const point = new THREE.Vector3();
  for (let index = 0; index < attribute.count; index += 1) {
    point.fromBufferAttribute(attribute, index).applyMatrix4(debugMesh.matrixWorld);
    vertices.push(root.worldToLocal(point.clone()));
  }
  const bounds = new THREE.Box3().setFromPoints(vertices);
  const extent = bounds.getSize(new THREE.Vector3());
  const axis = extent.x >= extent.y && extent.x >= extent.z ? 'x' : extent.y >= extent.z ? 'y' : 'z';
  vertices.sort((a, b) => a[axis] - b[axis]);
  const count = Math.min(targetCount, vertices.length);
  const controls = Array.from({ length: count }, (_, slice) => {
    const start = Math.floor(slice * vertices.length / count);
    const end = Math.max(start + 1, Math.floor((slice + 1) * vertices.length / count));
    const center = new THREE.Vector3();
    for (let index = start; index < end; index += 1) center.add(vertices[index]);
    return center.multiplyScalar(1 / (end - start));
  });
  if (controls[0].y > controls.at(-1).y) controls.reverse();
  return controls;
}

export function createVrAttractorTool({ model, config = VR_ATTRACTOR_VISUAL_CONFIG, logger = console, canvasFactory, imageFactory }) {
  if (!model) throw new Error('[VrAttractor] Cached astro_grabber GLB instance is required.');
  const missing = REQUIRED_NODES.filter((name) => !model.getObjectByName(name));
  if (missing.length) throw new Error(`[VrAttractor] Invalid astro_grabber.glb; missing required nodes: ${missing.join(', ')}`);

  const nodes = Object.fromEntries(REQUIRED_NODES.map((name) => [name, model.getObjectByName(name)]));
  const energyCellAnchor = model.getObjectByName('VR_ENERGY_CELL_ANCHOR') ?? null;
  const glyphPanels = VR_ATTRACTOR_PANEL_NAMES.map((name) => nodes[name]);
  const aimRoot = new THREE.Group();
  aimRoot.name = 'VrAttractorAimRoot';
  aimRoot.position.fromArray(config.aimOffset);
  const aimCorrection = new THREE.Quaternion().setFromUnitVectors(MODEL_AIM_AXIS, XR_AIM_AXIS);
  aimRoot.quaternion.copy(aimCorrection);
  const modelScale = new THREE.Group();
  modelScale.name = 'VrAttractorModelScale';
  modelScale.scale.setScalar(config.modelScale);

  // Resolve optional fuel visuals while the imported GLB hierarchy is intact.
  // DEBUG_FUEL_* meshes are siblings of VR_ATTRACTOR_ROOT in the shipped asset,
  // so their world transforms only share a coordinate space before root is moved.
  model.updateWorldMatrix(true, true);
  const fuelPathData = Object.entries(config.fuel).map(([element, settings]) => {
    const path = nodes[settings.path];
    const pathPoints = path.children.filter((child) => /P\d+$/.test(child.name)).sort((a, b) => pointIndex(a) - pointIndex(b));
    if (pathPoints.length !== 12) throw new Error(`[VrAttractor] ${settings.path} requires 12 P00..P11 points; found ${pathPoints.length}.`);
    let controlPoints = pathPoints.map((pathPoint) => nodes.VR_ATTRACTOR_ROOT.worldToLocal(
      pathPoint.getWorldPosition(new THREE.Vector3())));
    let source = 'vr_points';
    const markersDegenerate = isDegenerateFuelPath(controlPoints);
    const debugName = `DEBUG_FUEL_${element.toUpperCase()}_PATH`;
    const debugMesh = model.getObjectByName(debugName);
    if (debugMesh) debugMesh.visible = false;
    if (markersDegenerate) {
      controlPoints = debugFuelControlPoints(debugMesh, nodes.VR_ATTRACTOR_ROOT);
      source = 'debug_geometry';
      if (isDegenerateFuelPath(controlPoints)) {
        logger.warn(`[VrAttractor] ${settings.path} is degenerate and ${debugName} has no usable BufferGeometry fallback; disabling ${element} fuel stream.`);
        return { element, settings, source: 'disabled', markersDegenerate, controlPoints: [] };
      }
    }
    return { element, settings, source, markersDegenerate, controlPoints };
  });

  modelScale.add(nodes.VR_ATTRACTOR_ROOT);
  aimRoot.add(modelScale);

  const controlledPivots = [nodes.PIVOT_BASE_GRAB, nodes.PIVOT_FISKERS, nodes.PIVOT_BASE_MOLEKULAR,
    nodes.PIVOT_RING_CALIBRATION, nodes.PIVOT_RING_MASTER, nodes.PIVOT_RING_INNER, nodes.PIVOT_ENERGY_SHELL];
  const initialPivotTransforms = new Map(controlledPivots.map((pivot) => [pivot, {
    position: pivot.position.clone(), quaternion: pivot.quaternion.clone(), scale: pivot.scale.clone()
  }]));
  Object.entries(config.ringLocalPositionOffsets).forEach(([name, offset]) => {
    nodes[name].position.add(new THREE.Vector3().fromArray(offset));
  });
  const shellRPM = blenderRpmToThree(config.shell.blenderRPM);

  const ownedMaterials = new Set();
  const cloneMaterials = (object) => object.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => { const clone = material.clone(); ownedMaterials.add(clone); return clone; })
      : child.material.clone();
    if (!Array.isArray(child.material)) ownedMaterials.add(child.material);
  });
  cloneMaterials(nodes.energy_cell);

  const panelSystem = createVrAttractorPanelSystem({ panels: glyphPanels, canvasFactory, imageFactory });

  const energyMaterials = [];
  nodes.energy_cell.traverse((child) => {
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => energyMaterials.push(material));
  });
  const fuelStreams = fuelPathData.filter(({ source }) => source !== 'disabled').map(({
    element, settings, source, markersDegenerate, controlPoints
  }) => {
    const curve = new THREE.CatmullRomCurve3(controlPoints, false);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(settings.particleCount * 3), 3));
    const material = new THREE.PointsMaterial({ color: settings.color, size: config.fuelPointSize, transparent: true,
      opacity: settings.brightness * config.fuelBrightnessMultiplier, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: false, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    points.name = `VrAttractorFuelParticles_${element}`;
    nodes.VR_ATTRACTOR_ROOT.add(points);
    return { element, settings, curve, source, markersDegenerate, geometry, material, points, elapsed: 0,
      sample: new THREE.Vector3() };
  });

  let state = VR_ATTRACTOR_STATES.UNEQUIPPED;
  let unlocked = false;
  let trigger = 0;
  let pullStrength = 0;
  let target = null;
  let targetProximity = 0;
  let level = 0;
  let elapsed = 0;
  let innerRPM = 0;
  let disposed = false;
  aimRoot.visible = false;

  function setEquipped(equipped) {
    const shouldEquip = Boolean(equipped) && unlocked;
    state = shouldEquip ? VR_ATTRACTOR_STATES.IDLE : VR_ATTRACTOR_STATES.UNEQUIPPED;
    aimRoot.visible = shouldEquip;
    if (!shouldEquip) setTarget(null);
  }
  function setUnlocked(value) { unlocked = Boolean(value); if (!unlocked) setEquipped(false); }
  function setTrigger(value) { trigger = clamp01(value); }
  function setTarget(value) {
    target = value ?? null; targetProximity = clamp01(value?.proximity);
    const glyph = resolveAttractorShellGlyph(value?.target ?? value);
    panelSystem.setPrimaryGlyph(glyph?.url ?? null).catch((error) => logger.warn(error.message));
  }
  function setPullStrength(value) { pullStrength = clamp01(value); }
  function setLevel(value) { level = Math.max(0, Number.isFinite(value) ? value : 0); }
  function setState(value) {
    if (!Object.values(VR_ATTRACTOR_STATES).includes(value)) throw new Error(`[VrAttractor] Unknown state: ${value}`);
    state = value;
    aimRoot.visible = value !== VR_ATTRACTOR_STATES.UNEQUIPPED;
    if (value === VR_ATTRACTOR_STATES.UNEQUIPPED) setTarget(null);
  }
  // Astro never generates an independent ray: the target-ray controller and its local -Z are authoritative.
  function attachToTargetRay(controller) { if (controller && aimRoot.parent !== controller) controller.add(aimRoot); }
  function getMasterRingWorldPosition(target = new THREE.Vector3()) {
    return nodes.PIVOT_RING_MASTER.getWorldPosition(target);
  }

  function setGlyphPanelState(panelState = 'idle') {
    panelSystem.setVisualState(panelState);
  }

  function update(deltaSeconds) {
    if (disposed || state === VR_ATTRACTOR_STATES.UNEQUIPPED || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    elapsed += deltaSeconds;
    const activity = 1 + trigger * 0.35 + pullStrength * 0.45 + (state === VR_ATTRACTOR_STATES.PULLING ? 0.35 : 0);
    nodes.PIVOT_BASE_MOLEKULAR.rotateY(rpmToRadians(config.baseMolecular.idleRPM * config.baseMolecular.direction, deltaSeconds));
    const calibrationRPM = state === VR_ATTRACTOR_STATES.TARGETING ? config.calibration.targetingRPM : config.calibration.idleRPM;
    nodes.PIVOT_RING_CALIBRATION.rotateY(rpmToRadians(calibrationRPM * config.calibration.direction, deltaSeconds));
    const masterRPM = config.master.idleRPM + (config.master.maxRPM - config.master.idleRPM) * targetProximity;
    nodes.PIVOT_RING_MASTER.rotateY(rpmToRadians(masterRPM * config.master.direction, deltaSeconds));
    const targetInnerRPM = config.inner.maxRPM * trigger;
    const rampSeconds = targetInnerRPM > innerRPM ? config.inner.accelerationSeconds : config.inner.decelerationSeconds;
    innerRPM += (targetInnerRPM - innerRPM) * Math.min(1, deltaSeconds / rampSeconds);
    nodes.PIVOT_RING_INNER.rotateY(rpmToRadians(innerRPM * config.inner.direction, deltaSeconds));
    nodes.PIVOT_ENERGY_SHELL.rotateX(rpmToRadians(shellRPM.x * activity, deltaSeconds));
    nodes.PIVOT_ENERGY_SHELL.rotateY(rpmToRadians(shellRPM.y * activity, deltaSeconds));
    nodes.PIVOT_ENERGY_SHELL.rotateZ(rpmToRadians(shellRPM.z * activity, deltaSeconds));
    const pulseHz = activity > 1.1 ? config.energyCell.activePulseHz : config.energyCell.idlePulseHz;
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * 2 * pulseHz);
    energyMaterials.forEach((material) => {
      material.emissive?.setHex(config.energyCell.color);
      if ('emissiveIntensity' in material) material.emissiveIntensity = config.energyCell.baseIntensity
        + config.energyCell.pulseIntensity * pulse + level * 0.12 + trigger * 0.5 + pullStrength * 0.7;
    });
    fuelStreams.forEach((stream) => {
      stream.elapsed += deltaSeconds * stream.settings.speed * activity;
      const positions = stream.geometry.attributes.position;
      for (let index = 0; index < stream.settings.particleCount; index += 1) {
        const irregularity = Math.sin(elapsed * 3.1 + index * 2.17 + stream.settings.phase * 9) * stream.settings.pulseAmount * 0.02;
        const t = (stream.elapsed + stream.settings.phase + index / stream.settings.particleCount + irregularity + 1) % 1;
        stream.curve.getPointAt(t, stream.sample);
        positions.setXYZ(index, stream.sample.x, stream.sample.y, stream.sample.z);
      }
      positions.needsUpdate = true;
      stream.material.opacity = stream.settings.brightness * config.fuelBrightnessMultiplier
        * (0.88 + 0.12 * Math.sin(elapsed * 2 + stream.settings.phase * 7));
    });
  }

  function reset() {
    state = VR_ATTRACTOR_STATES.UNEQUIPPED; trigger = 0; target = null; targetProximity = 0; pullStrength = 0;
    elapsed = 0; innerRPM = 0; aimRoot.visible = false;
    initialPivotTransforms.forEach((transform, pivot) => {
      pivot.position.copy(transform.position); pivot.quaternion.copy(transform.quaternion); pivot.scale.copy(transform.scale);
      const offset = config.ringLocalPositionOffsets[pivot.name];
      if (offset) pivot.position.add(new THREE.Vector3().fromArray(offset));
    });
    fuelStreams.forEach((stream) => { stream.elapsed = 0; });
    panelSystem.reset();
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    modelScale.remove(nodes.VR_ATTRACTOR_ROOT); aimRoot.parent?.remove(aimRoot);
    fuelStreams.forEach(({ points, geometry, material }) => { points.parent?.remove(points); geometry.dispose(); material.dispose(); });
    panelSystem.dispose();
    ownedMaterials.forEach((material) => material.dispose());
  }

  return { object: aimRoot, modelScale, aimCorrection, energyCellAnchor, panelSystem,
    setEquipped, setUnlocked, setTrigger, setTarget, setPullStrength, setLevel, setState, setGlyphPanelState,
    attachToTargetRay, getMasterRingWorldPosition, update, reset, dispose, getState: () => state, getInnerRPM: () => innerRPM,
    diagnostics: { missingRequiredNodes: missing, glyphPanelCount: glyphPanels.length,
      fuelPointCounts: Object.fromEntries(fuelPathData.map((data) => [data.element, data.controlPoints.length])),
      fuelPathSources: Object.fromEntries(fuelPathData.map((data) => [data.element, data.source])),
      fuelMarkersDegenerate: Object.fromEntries(fuelPathData.map((data) => [data.element, data.markersDegenerate])),
      fuelCurveClosed: Object.fromEntries(fuelPathData.map((data) => [data.element,
        data.source === 'disabled' ? null : false])) } };
}
