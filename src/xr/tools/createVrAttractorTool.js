import * as THREE from '../../vendor/three.js';

export const VR_ATTRACTOR_STATES = Object.freeze({
  UNEQUIPPED: 'UNEQUIPPED', IDLE: 'IDLE', TARGETING: 'TARGETING', PULLING: 'PULLING', CAPTURED: 'CAPTURED'
});

export const VR_ATTRACTOR_VISUAL_CONFIG = Object.freeze({
  modelScale: 1 / 3,
  fuelPointSize: 0.002,
  aimOffset: [0, 0, 0],
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
  'VR_ATTRACTOR_ROOT', 'grab', 'base_grab', 'Fiskers',
  'fuel_line_earth', 'fuel_line_fire', 'fuel_line_tree', 'fuel_line_metal', 'fuel_line_water',
  'PIVOT_BASE_MOLEKULAR', 'base_molekular', 'PIVOT_RING_CALIBRATION', 'Ring_calibration',
  'PIVOT_RING_MASTER', 'Ring_Master', 'PIVOT_RING_INNER', 'Ring_inner',
  'PIVOT_ENERGY_SHELL', 'energy_shell', 'energy_cell',
  ...Object.values(VR_ATTRACTOR_VISUAL_CONFIG.fuel).map(({ path }) => path)
]);

const rpmToRadians = (rpm, delta) => rpm * Math.PI * 2 * delta / 60;
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const pointIndex = (point) => Number.isFinite(point.userData?.vr_path_index)
  ? point.userData.vr_path_index : Number(point.name.match(/P(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);

export function createVrAttractorTool({ model, config = VR_ATTRACTOR_VISUAL_CONFIG, logger = console }) {
  if (!model) throw new Error('[VrAttractor] Cached astro_grabber GLB instance is required.');
  const missing = REQUIRED_NODES.filter((name) => !model.getObjectByName(name));
  if (missing.length) throw new Error(`[VrAttractor] Invalid astro_grabber.glb; missing required nodes: ${missing.join(', ')}`);

  const nodes = Object.fromEntries(REQUIRED_NODES.map((name) => [name, model.getObjectByName(name)]));
  const energyCellAnchor = model.getObjectByName('VR_ENERGY_CELL_ANCHOR') ?? null;
  const glyphPanels = [1, 2, 3, 4].map((index) => model.getObjectByName(`glyph_panel_0${index}`)).filter(Boolean);
  const aimRoot = new THREE.Group();
  aimRoot.name = 'VrAttractorAimRoot';
  aimRoot.position.fromArray(config.aimOffset);
  const aimCorrection = new THREE.Quaternion().setFromUnitVectors(MODEL_AIM_AXIS, XR_AIM_AXIS);
  aimRoot.quaternion.copy(aimCorrection);
  const modelScale = new THREE.Group();
  modelScale.name = 'VrAttractorModelScale';
  modelScale.scale.setScalar(config.modelScale);
  modelScale.add(nodes.VR_ATTRACTOR_ROOT);
  aimRoot.add(modelScale);

  const animatedPivots = [nodes.PIVOT_BASE_MOLEKULAR, nodes.PIVOT_RING_CALIBRATION,
    nodes.PIVOT_RING_MASTER, nodes.PIVOT_RING_INNER, nodes.PIVOT_ENERGY_SHELL];
  const initialPivotQuaternions = new Map(animatedPivots.map((pivot) => [pivot, pivot.quaternion.clone()]));
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

  if (glyphPanels.length !== 4) logger.warn('[VrAttractor] Optional glyph_panel_01..04 are absent; glyph visuals are disabled.');
  else glyphPanels.forEach(cloneMaterials);

  const energyMaterials = [];
  nodes.energy_cell.traverse((child) => {
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => energyMaterials.push(material));
  });
  const fuelStreams = Object.entries(config.fuel).map(([element, settings]) => {
    const path = nodes[settings.path];
    const pathPoints = path.children.filter((child) => /P\d+$/.test(child.name)).sort((a, b) => pointIndex(a) - pointIndex(b));
    if (pathPoints.length !== 12) throw new Error(`[VrAttractor] ${settings.path} requires 12 P00..P11 points; found ${pathPoints.length}.`);
    const curve = new THREE.CatmullRomCurve3(pathPoints.map((point) => point.position.clone()), true);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(settings.particleCount * 3), 3));
    const material = new THREE.PointsMaterial({ color: settings.color, size: config.fuelPointSize, transparent: true,
      opacity: settings.brightness, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    points.name = `VrAttractorFuelParticles_${element}`;
    path.add(points);
    return { settings, curve, geometry, material, points, elapsed: 0, sample: new THREE.Vector3() };
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
  }
  function setUnlocked(value) { unlocked = Boolean(value); if (!unlocked) setEquipped(false); }
  function setTrigger(value) { trigger = clamp01(value); }
  function setTarget(value) { target = value ?? null; targetProximity = clamp01(value?.proximity); }
  function setPullStrength(value) { pullStrength = clamp01(value); }
  function setLevel(value) { level = Math.max(0, Number.isFinite(value) ? value : 0); }
  function setState(value) {
    if (!Object.values(VR_ATTRACTOR_STATES).includes(value)) throw new Error(`[VrAttractor] Unknown state: ${value}`);
    state = value;
    aimRoot.visible = value !== VR_ATTRACTOR_STATES.UNEQUIPPED;
  }
  // Astro never generates an independent ray: the target-ray controller and its local -Z are authoritative.
  function attachToTargetRay(controller) { if (controller && aimRoot.parent !== controller) controller.add(aimRoot); }

  function setGlyphPanelState(panelState = 'idle') {
    const styles = {
      idle: [0x6cbcff, 0.5], 'target-valid': [0x76ffac, 1.2], 'target-invalid': [0xff6b6b, 1],
      pulling: [0xffd36b, 1.5], captured: [0xffffff, 1.8], upgrade: [0xc881ff, 1.6], 'low-energy': [0x805050, 0.25]
    };
    const [color, intensity] = styles[panelState] ?? styles.idle;
    glyphPanels.forEach((panel) => panel.traverse((child) => {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach((material) => {
        material.transparent = true; material.opacity = panelState === 'low-energy' ? 0.45 : 1;
        material.emissive?.setHex(color); if ('emissiveIntensity' in material) material.emissiveIntensity = intensity;
      });
    }));
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
      stream.material.opacity = stream.settings.brightness * (0.88 + 0.12 * Math.sin(elapsed * 2 + stream.settings.phase * 7));
    });
  }

  function reset() {
    state = VR_ATTRACTOR_STATES.UNEQUIPPED; trigger = 0; target = null; targetProximity = 0; pullStrength = 0;
    elapsed = 0; innerRPM = 0; aimRoot.visible = false;
    initialPivotQuaternions.forEach((quaternion, pivot) => pivot.quaternion.copy(quaternion));
    fuelStreams.forEach((stream) => { stream.elapsed = 0; });
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    modelScale.remove(nodes.VR_ATTRACTOR_ROOT); aimRoot.parent?.remove(aimRoot);
    fuelStreams.forEach(({ points, geometry, material }) => { points.parent?.remove(points); geometry.dispose(); material.dispose(); });
    ownedMaterials.forEach((material) => material.dispose());
  }

  return { object: aimRoot, modelScale, aimCorrection, energyCellAnchor,
    setEquipped, setUnlocked, setTrigger, setTarget, setPullStrength, setLevel, setState, setGlyphPanelState,
    attachToTargetRay, update, reset, dispose, getState: () => state, getInnerRPM: () => innerRPM,
    diagnostics: { missingRequiredNodes: missing, glyphPanelCount: glyphPanels.length,
      fuelPointCounts: Object.fromEntries(fuelStreams.map((stream, index) => [Object.keys(config.fuel)[index], stream.curve.points.length])) } };
}
