import * as THREE from '../../vendor/three.js';
import { createVrProgressFloorSectorActor } from './createVrProgressFloorSectorActor.js';

export const VR_PROGRESS_FLOOR_SOURCE_CONTRACTS = Object.freeze({
  creative: Object.freeze({ referenceBaseName: 'VR_PROGRESS_SECTOR_FIRE_BASE', presentationBodyNames: Object.freeze(['path4']), panelNames: Object.freeze(['VR_PROGRESS_CARD_FIRE_01', 'VR_PROGRESS_CARD_FIRE_02', 'VR_PROGRESS_CARD_FIRE_03']) }),
  ethics: Object.freeze({ referenceBaseName: 'VR_PROGRESS_SECTOR_EARTH_BASE', presentationBodyNames: Object.freeze(['path1']), panelNames: Object.freeze(['VR_PROGRESS_CARD_EARTH_01', 'VR_PROGRESS_CARD_EARTH_02', 'VR_PROGRESS_CARD_EARTH_03']) }),
  water: Object.freeze({ referenceBaseName: 'VR_PROGRESS_SECTOR_WATER_BASE', presentationBodyNames: Object.freeze(['path1']), panelNames: Object.freeze(['VR_PROGRESS_CARD_WATER_01', 'VR_PROGRESS_CARD_WATER_02', 'VR_PROGRESS_CARD_WATER_03', 'VR_PROGRESS_CARD_WATER_04', 'VR_PROGRESS_CARD_WATER_05']) }),
  metal: Object.freeze({ referenceBaseName: 'VR_PROGRESS_SECTOR_METAL_BASE', presentationBodyNames: Object.freeze(['path1']), panelNames: Object.freeze(['VR_PROGRESS_CARD_METAL_01', 'VR_PROGRESS_CARD_METAL_02', 'VR_PROGRESS_CARD_METAL_03', 'VR_PROGRESS_CARD_METAL_04']) }),
  wood: Object.freeze({ referenceBaseName: 'VR_PROGRESS_SECTOR_WOOD_BASE', presentationBodyNames: Object.freeze(['path1']), panelNames: Object.freeze(['VR_PROGRESS_CARD_WOOD_01', 'VR_PROGRESS_CARD_WOOD_02', 'VR_PROGRESS_CARD_WOOD_03']) })
});

const SECTOR_LAYOUT = Object.freeze([
  { glyphId: 'spotify-digger', branchId: 'metal', sourceType: 'metal' },
  { glyphId: 'haiku-cosmos', branchId: 'water', sourceType: 'water' },
  { glyphId: 'ai-guide', branchId: 'wood', sourceType: 'wood' },
  { glyphId: 'creative-ai', branchId: 'fire', sourceType: 'creative' },
  { glyphId: 'ethics-life-protection', branchId: 'earth', sourceType: 'ethics' }
].map((descriptor) => Object.freeze({ ...descriptor, placeholder: false })));

export const VR_PROGRESS_FLOOR_EMISSION = Object.freeze({
  stableIntensity: 1.35, pulseIntensity: 2.8, pulseDuration: 0.22, responseSpeed: 14,
  fallbackColors: Object.freeze({ creative: 0xff4b2b, ethics: 0xc8752a, water: 0x35a9ff, metal: 0x8cd1ff, wood: 0x29e86f })
});
export const VR_PROGRESS_FLOOR_RINGS = Object.freeze({
  ringThickness: 0.035, minimumRingGap: 0.07, ringSegments: 80, ringYOffset: 0.018,
  ringStableOpacity: 0.24, ringPulseOpacity: 0.9, ringPulseDuration: 0.24, ringResponseSpeed: 16, ringColor: 0xeaf4ff
});

export function createVrProgressFloorActor({ parent, sourceModels, emission = {}, rings = {} }) {
  if (!parent?.add) throw new Error('[VrProgressFloorActor] A valid parent is required.');
  SECTOR_LAYOUT.forEach(({ sourceType }) => {
    if (!sourceModels?.[sourceType]?.clone) throw new Error(`[VrProgressFloorActor] A valid ${sourceType} sector model is required.`);
  });
  const config = { ...VR_PROGRESS_FLOOR_EMISSION, ...emission, fallbackColors: { ...VR_PROGRESS_FLOOR_EMISSION.fallbackColors, ...emission.fallbackColors } };
  const ringConfig = { ...VR_PROGRESS_FLOOR_RINGS, ...rings };
  const object = new THREE.Group();
  object.name = 'VrTiltableFloorRoot';
  const geometryRoot = new THREE.Group();
  geometryRoot.name = 'PlatformGeometryRoot';
  object.add(geometryRoot);
  const sectorsByGlyphId = new Map();
  const sectorsByBranchId = new Map();
  const tierRings = new Map();
  const ownedMaterials = new Set();
  const ownedGeometries = new Set();
  let disposed = false;

  try {
    SECTOR_LAYOUT.forEach((sectorConfig, rotationIndex) => {
      const actor = createVrProgressFloorSectorActor({
        descriptor: { ...sectorConfig, rotationIndex }, sourceModel: sourceModels[sectorConfig.sourceType],
        contract: VR_PROGRESS_FLOOR_SOURCE_CONTRACTS[sectorConfig.sourceType],
        emission: { ...config, fallbackColor: config.fallbackColors[sectorConfig.sourceType] }
      });
      sectorsByGlyphId.set(sectorConfig.glyphId, actor);
      sectorsByBranchId.set(sectorConfig.branchId, actor);
      geometryRoot.add(actor.object);
    });
    object.updateMatrixWorld(true);
    const candidateRadii = [];
    for (let tier = 1; tier <= 5; tier += 1) {
      const samples = [];
      sectorsByGlyphId.forEach((sector) => {
        const panel = sector.getPanelObject(tier);
        if (!panel) return;
        const center = new THREE.Box3().setFromObject(panel).getCenter(new THREE.Vector3());
        object.worldToLocal(center);
        const radius = Math.hypot(center.x, center.z);
        if (Number.isFinite(radius) && radius > 0) samples.push(radius);
      });
      samples.sort((a, b) => a - b);
      if (!samples.length) throw new Error(`[VrProgressFloorActor] Cannot derive a valid radius for tier ${tier} from panel centers.`);
      const middle = Math.floor(samples.length / 2);
      candidateRadii.push(samples.length % 2 ? samples[middle] : (samples[middle - 1] + samples[middle]) / 2);
    }
    const minimumGap = Math.max(ringConfig.ringThickness * 2, Number.isFinite(ringConfig.minimumRingGap) ? ringConfig.minimumRingGap : 0);
    const radii = candidateRadii.slice().sort((a, b) => a - b);
    for (let index = 1; index < radii.length; index += 1) radii[index] = Math.max(radii[index], radii[index - 1] + minimumGap);
    if (radii.some((radius, index) => Math.abs(radius - candidateRadii[index]) > Number.EPSILON)) {
      console.warn('[VrProgressFloorActor] Normalized tier ring radii.', { candidateRadii: candidateRadii.slice(), finalRadii: radii.slice() });
    }
    try {
      radii.forEach((radius, index) => {
        const tier = index + 1;
        const geometry = new THREE.RingGeometry(Math.max(0.001, radius - ringConfig.ringThickness / 2), radius + ringConfig.ringThickness / 2, ringConfig.ringSegments);
        const material = new THREE.MeshBasicMaterial({ color: ringConfig.ringColor, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(geometry, material);
        ring.name = `VrProgressTierRing:${tier}`; ring.rotation.x = -Math.PI / 2; ring.position.y = ringConfig.ringYOffset;
        ring.userData = { ...ring.userData, tier, radius };
        ownedGeometries.add(geometry); ownedMaterials.add(material); tierRings.set(tier, { object: ring, material, pulseRemaining: 0 }); geometryRoot.add(ring);
      });
    } catch (error) {
      tierRings.forEach(({ object: ring, material }) => { ring.removeFromParent(); material.dispose(); ownedMaterials.delete(material); });
      ownedGeometries.forEach((geometry) => geometry.dispose()); ownedGeometries.clear(); tierRings.clear();
      console.warn('[VrProgressFloorActor] Tier rings are unavailable; continuing without the optional visual layer.', error);
    }
  } catch (error) {
    sectorsByGlyphId.forEach((sector) => sector.dispose()); ownedMaterials.forEach((material) => material.dispose()); ownedGeometries.forEach((geometry) => geometry.dispose()); throw error;
  }
  parent.add(object);

  return {
    object, geometryRoot,
    revealSector(glyphId) { return !disposed && (sectorsByGlyphId.get(glyphId)?.reveal() ?? false); },
    activatePanel(glyphId, order) { return !disposed && (sectorsByGlyphId.get(glyphId)?.activatePanel(order) ?? false); },
    setSectorMotion(glyphId, transform) { return !disposed && (sectorsByGlyphId.get(glyphId)?.setMotionTransform(transform) ?? false); },
    getSectorMotionTransform(glyphId) { return !disposed ? sectorsByGlyphId.get(glyphId)?.getMotionTransform() ?? null : null; },
    getSectorControlFrame(glyphId) { return !disposed ? sectorsByGlyphId.get(glyphId)?.getControlFrame() ?? null : null; },
    resetSectorMotion(glyphId) {
      const sector = sectorsByGlyphId.get(glyphId);
      if (disposed || !sector) return false;
      sector.resetMotion();
      return true;
    },
    getSectorPresentationState(glyphId) { return sectorsByGlyphId.get(glyphId)?.getPresentationState() ?? null; },
    completeTier(tier) {
      const ring = tierRings.get(tier);
      if (disposed || !Number.isInteger(tier) || !ring || ring.pulseRemaining > 0 || ring.material.opacity > 0) return false;
      ring.pulseRemaining = ringConfig.ringPulseDuration; return true;
    },
    update(delta = 0) {
      if (disposed) return;
      const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
      sectorsByGlyphId.forEach((sector) => sector.update(safeDelta));
      tierRings.forEach((ring) => {
        if (ring.pulseRemaining <= 0 && ring.material.opacity <= 0) return;
        ring.pulseRemaining = Math.max(0, ring.pulseRemaining - safeDelta);
        const target = ring.pulseRemaining > 0 ? ringConfig.ringPulseOpacity : ringConfig.ringStableOpacity;
        ring.material.opacity += (target - ring.material.opacity) * (1 - Math.exp(-ringConfig.ringResponseSpeed * safeDelta));
      });
    },
    reset() { if (disposed) return; sectorsByGlyphId.forEach((sector) => sector.reset()); tierRings.forEach((ring) => { ring.pulseRemaining = 0; ring.material.opacity = 0; }); },
    getRuneInstallationFrame(branchId) { return sectorsByBranchId.get(String(branchId).toLowerCase())?.getRuneInstallationFrame() ?? null; },
    getSectorEnergyVfxMount(branchId) { return sectorsByBranchId.get(String(branchId).toLowerCase())?.getEnergyVfxMount() ?? null; },
    getSectorEnergyVfxBounds(branchId) { return sectorsByBranchId.get(String(branchId).toLowerCase())?.getEnergyVfxBounds() ?? null; },
    dispose() {
      if (disposed) return; disposed = true; object.removeFromParent(); sectorsByGlyphId.forEach((sector) => sector.dispose());
      sectorsByGlyphId.clear(); sectorsByBranchId.clear(); ownedMaterials.forEach((material) => material.dispose()); ownedGeometries.forEach((geometry) => geometry.dispose());
      ownedMaterials.clear(); ownedGeometries.clear(); tierRings.clear();
    }
  };
}
