import * as THREE from '../../vendor/three.js';
import { createVrProgressFloorSectorActor } from './createVrProgressFloorSectorActor.js';

export const VR_PROGRESS_FLOOR_SOURCE_CONTRACTS = Object.freeze({
  creative: Object.freeze({
    referenceBaseName: 'VR_PROGRESS_SECTOR_FIRE_BASE',
    presentationBodyNames: Object.freeze(['path4']),
    panelNames: Object.freeze(['VR_PROGRESS_CARD_FIRE_01', 'VR_PROGRESS_CARD_FIRE_02', 'VR_PROGRESS_CARD_FIRE_03'])
  }),
  ethics: Object.freeze({
    referenceBaseName: 'VR_PROGRESS_SECTOR_EARTH_BASE',
    presentationBodyNames: Object.freeze(['path1']),
    panelNames: Object.freeze(['VR_PROGRESS_CARD_EARTH_01', 'VR_PROGRESS_CARD_EARTH_02', 'VR_PROGRESS_CARD_EARTH_03'])
  }),
  water: Object.freeze({
    referenceBaseName: 'VR_PROGRESS_SECTOR_WATER_BASE',
    presentationBodyNames: Object.freeze(['path1']),
    panelNames: Object.freeze([
      'VR_PROGRESS_CARD_WATER_01',
      'VR_PROGRESS_CARD_WATER_02',
      'VR_PROGRESS_CARD_WATER_03',
      'VR_PROGRESS_CARD_WATER_04',
      'VR_PROGRESS_CARD_WATER_05'
    ])
  }),
  metal: Object.freeze({
    referenceBaseName: 'VR_PROGRESS_SECTOR_METAL_BASE',
    presentationBodyNames: Object.freeze(['path1']),
    panelNames: Object.freeze([
      'VR_PROGRESS_CARD_METAL_01',
      'VR_PROGRESS_CARD_METAL_02',
      'VR_PROGRESS_CARD_METAL_03',
      'VR_PROGRESS_CARD_METAL_04'
    ])
  }),
  wood: Object.freeze({
    referenceBaseName: 'VR_PROGRESS_SECTOR_WOOD_BASE',
    presentationBodyNames: Object.freeze(['path1']),
    panelNames: Object.freeze([
      'VR_PROGRESS_CARD_WOOD_01',
      'VR_PROGRESS_CARD_WOOD_02',
      'VR_PROGRESS_CARD_WOOD_03'
    ])
  })
});

const SECTOR_LAYOUT = Object.freeze([
  Object.freeze({ glyphId: 'spotify-digger', branchId: 'metal', placeholder: false, sourceType: 'metal' }),
  Object.freeze({ glyphId: 'haiku-cosmos', branchId: 'water', placeholder: false, sourceType: 'water' }),
  Object.freeze({ glyphId: 'ai-guide', branchId: 'wood', placeholder: false, sourceType: 'wood' }),
  Object.freeze({ glyphId: 'creative-ai', branchId: 'fire', placeholder: false, sourceType: 'creative' }),
  Object.freeze({ glyphId: 'ethics-life-protection', branchId: 'earth', placeholder: false, sourceType: 'ethics' })
]);
export const VR_PROGRESS_FLOOR_EMISSION = Object.freeze({
  stableIntensity: 1.35,
  pulseIntensity: 2.8,
  pulseDuration: 0.22,
  responseSpeed: 14,
  fallbackColors: Object.freeze({ creative: 0xff4b2b, ethics: 0xc8752a, water: 0x35a9ff, metal: 0x8cd1ff, wood: 0x29e86f })
});

export const VR_PROGRESS_FLOOR_RINGS = Object.freeze({
  ringThickness: 0.035,
  minimumRingGap: 0.07,
  ringSegments: 80,
  ringYOffset: 0.018,
  ringStableOpacity: 0.24,
  ringPulseOpacity: 0.9,
  ringPulseDuration: 0.24,
  ringResponseSpeed: 16,
  ringColor: 0xeaf4ff
});

export function createVrProgressFloor({
  parent,
  creativeSectorModel,
  ethicsSectorModel,
  haikuSectorModel,
  digSectorModel,
  aiGuideSectorModel,
  emission = {},
  rings = {}
}) {
  if (!parent?.add) throw new Error('[VrProgressFloor] A valid parent is required.');
  if (!creativeSectorModel?.clone) throw new Error('[VrProgressFloor] A valid Creative sector model is required.');
  if (!ethicsSectorModel?.clone) throw new Error('[VrProgressFloor] A valid Ethics sector model is required.');
  if (!haikuSectorModel?.clone) throw new Error('[VrProgressFloor] A valid Haiku Cosmos sector model is required.');
  if (!digSectorModel?.clone) throw new Error('[VrProgressFloor] A valid DIG Engine sector model is required.');
  if (!aiGuideSectorModel?.clone) {
    throw new Error('[VrProgressFloor] A valid AI Guide sector model is required.');
  }

  const config = {
    ...VR_PROGRESS_FLOOR_EMISSION,
    ...emission,
    fallbackColors: { ...VR_PROGRESS_FLOOR_EMISSION.fallbackColors, ...emission.fallbackColors }
  };
  const ringConfig = { ...VR_PROGRESS_FLOOR_RINGS, ...rings };
  const object = new THREE.Group();
  object.name = 'VrTiltableFloorRoot';
  object.position.set(0, 0, 0);
  const geometryRoot = new THREE.Group();
  geometryRoot.name = 'PlatformGeometryRoot';
  object.add(geometryRoot);
  const ownedMaterials = new Set();
  const ownedGeometries = new Set();
  const sourceModels = {
    creative: creativeSectorModel,
    ethics: ethicsSectorModel,
    water: haikuSectorModel,
    metal: digSectorModel,
    wood: aiGuideSectorModel
  };
  const sectorsByGlyphId = new Map();
  const sectorActorsByBranchId = new Map();
  const revealedSectorIds = new Set();
  const activatedEntries = new Map();
  const completedTiers = new Set();
  const tierRings = new Map();
  const sectorActors = new Set();
  let disposed = false;

  try {
    SECTOR_LAYOUT.forEach((sectorConfig, index) => {
      const sourceModel = sourceModels[sectorConfig.sourceType];
      const contract = VR_PROGRESS_FLOOR_SOURCE_CONTRACTS[sectorConfig.sourceType];
      const descriptor = { ...sectorConfig, rotationIndex: index };
      const actor = createVrProgressFloorSectorActor({
        descriptor,
        sourceModel,
        contract,
        emission: { ...config, fallbackColor: config.fallbackColors[sectorConfig.sourceType] }
      });
      sectorsByGlyphId.set(sectorConfig.glyphId, actor);
      sectorActorsByBranchId.set(sectorConfig.branchId, actor);
      sectorActors.add(actor);
      geometryRoot.add(actor.object);
    });

    object.updateMatrixWorld(true);
    const candidateRadii = [];
    for (let tier = 1; tier <= 5; tier += 1) {
      const samples = [];
      sectorsByGlyphId.forEach((actor) => {
        const panel = actor.getPanelObject(tier);
        if (!panel) return;
        const center = new THREE.Box3().setFromObject(panel).getCenter(new THREE.Vector3());
        object.worldToLocal(center);
        const radius = Math.hypot(center.x, center.z);
        if (Number.isFinite(radius) && radius > 0) samples.push(radius);
      });
      samples.sort((a, b) => a - b);
      if (samples.length === 0) throw new Error(`[VrProgressFloor] Cannot derive a valid radius for tier ${tier} from panel centers.`);
      const middle = Math.floor(samples.length / 2);
      const radius = samples.length % 2 ? samples[middle] : (samples[middle - 1] + samples[middle]) / 2;
      if (!Number.isFinite(radius) || radius <= 0) {
        throw new Error(`[VrProgressFloor] Cannot derive a valid radius for tier ${tier} from panel centers.`);
      }
      candidateRadii.push(radius);
    }

    const minimumRingGap = Math.max(
      ringConfig.ringThickness * 2,
      Number.isFinite(ringConfig.minimumRingGap) ? ringConfig.minimumRingGap : 0
    );
    const radii = candidateRadii.slice().sort((a, b) => a - b);
    for (let index = 1; index < radii.length; index += 1) {
      radii[index] = Math.max(radii[index], radii[index - 1] + minimumRingGap);
    }
    const radiiWereNormalized = radii.some((radius, index) => Math.abs(radius - candidateRadii[index]) > Number.EPSILON);
    if (radiiWereNormalized) {
      console.warn('[VrProgressFloor] Normalized tier ring radii.', {
        candidateRadii: candidateRadii.slice(),
        finalRadii: radii.slice()
      });
    }

    const ringMaterials = new Set();
    const ringGeometries = new Set();
    try {
      radii.forEach((radius, index) => {
        const tier = index + 1;
        const geometry = new THREE.RingGeometry(
          Math.max(0.001, radius - ringConfig.ringThickness / 2),
          radius + ringConfig.ringThickness / 2,
          ringConfig.ringSegments
        );
        const material = new THREE.MeshBasicMaterial({
          color: ringConfig.ringColor,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.name = `VrProgressTierRing:${tier}`;
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = ringConfig.ringYOffset;
        ring.userData = { ...ring.userData, tier, radius };
        ownedGeometries.add(geometry);
        ringGeometries.add(geometry);
        ownedMaterials.add(material);
        ringMaterials.add(material);
        tierRings.set(tier, { object: ring, material, pulseRemaining: 0 });
        geometryRoot.add(ring);
      });
    } catch (error) {
      tierRings.forEach(({ object: ring }) => {
        ring.removeFromParent();
      });
      ringMaterials.forEach((material) => {
        material.dispose();
        ownedMaterials.delete(material);
      });
      ringGeometries.forEach((geometry) => {
        geometry.dispose();
        ownedGeometries.delete(geometry);
      });
      tierRings.clear();
      console.warn('[VrProgressFloor] Tier rings are unavailable; continuing without the optional visual layer.', error);
    }
  } catch (error) {
    sectorActors.forEach((actor) => actor.dispose());
    ownedMaterials.forEach((material) => material.dispose());
    ownedGeometries.forEach((geometry) => geometry.dispose());
    throw error;
  }

  parent.add(object);

  function activatePage(page) {
    const glyphId = page?.glyphId;
    const order = page?.order;
    const sector = sectorsByGlyphId.get(glyphId);
    const panel = sector?.getPanelObject(order);
    const key = `${glyphId}:${order}`;
    if (disposed || !panel || activatedEntries.has(key)) return false;
    const firstReveal = !revealedSectorIds.has(glyphId);
    if (firstReveal) {
      revealedSectorIds.add(glyphId);
    }
    if (!sector.activatePanel(order)) return false;
    activatedEntries.set(key, { glyphId, order });
    return true;
  }

  function update(delta = 0) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    sectorsByGlyphId.forEach((actor) => actor.update(safeDelta));
    completedTiers.forEach((tier) => {
      const ring = tierRings.get(tier);
      ring.pulseRemaining = Math.max(0, ring.pulseRemaining - safeDelta);
      const target = ring.pulseRemaining > 0 ? ringConfig.ringPulseOpacity : ringConfig.ringStableOpacity;
      const ringBlend = 1 - Math.exp(-ringConfig.ringResponseSpeed * safeDelta);
      ring.material.opacity += (target - ring.material.opacity) * ringBlend;
    });
  }

  function completeTier(tier) {
    if (disposed || !Number.isInteger(tier) || !tierRings.has(tier) || completedTiers.has(tier)) return false;
    completedTiers.add(tier);
    tierRings.get(tier).pulseRemaining = ringConfig.ringPulseDuration;
    return true;
  }

  function hydrateScenarioState(state) {
    if (!Array.isArray(state?.activatedPages) || !Number.isInteger(state.completedTier)
      || state.completedTier < 1 || state.completedTier > 5) {
      throw new Error('Progress floor requires a canonical completed tier from 1 through 5');
    }
    const hydratedEntries = new Set();
    state.activatedPages.forEach((page) => {
      const glyphId = page?.glyphId;
      const order = page?.order;
      const key = `${glyphId}:${order}`;
      if (!sectorsByGlyphId.has(glyphId) || !Number.isInteger(order)
        || order < 1 || order > 5 || order > state.completedTier || hydratedEntries.has(key)) {
        throw new Error(`Progress floor received invalid activated page ${key}`);
      }
      hydratedEntries.add(key);
      if (!activatePage(page)) throw new Error(`Progress floor could not hydrate activated page ${key}`);
    });
    for (let tier = 1; tier <= state.completedTier; tier += 1) {
      if (!completeTier(tier)) throw new Error(`Progress floor could not hydrate completed Tier ${tier}`);
    }
    update(10);
  }
  function reset() {
    revealedSectorIds.clear(); activatedEntries.clear(); completedTiers.clear();
    sectorsByGlyphId.forEach((actor) => actor.reset());
    tierRings.forEach((ring) => { ring.pulseRemaining = 0; ring.material.opacity = 0; });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.removeFromParent();
    sectorActors.forEach((actor) => actor.dispose());
    sectorActors.clear();
    ownedMaterials.forEach((material) => material.dispose());
    ownedMaterials.clear();
    ownedGeometries.forEach((geometry) => geometry.dispose());
    ownedGeometries.clear();
    revealedSectorIds.clear();
    sectorActorsByBranchId.clear();
  }

  function getRuneInstallationFrame(branchId) {
    return sectorActorsByBranchId.get(String(branchId).toLowerCase())?.getRuneInstallationFrame() ?? null;
  }

  return {
    object,
    geometryRoot,
    activatePage,
    completeTier,
    hydrateScenarioState,
    reset,
    update,
    getActivatedEntries: () => [...activatedEntries.values()].map(({ glyphId, order }) => ({ glyphId, order })),
    getRevealedSectorIds: () => [...revealedSectorIds],
    getCompletedTiers: () => [...completedTiers],
    getRuneInstallationFrame,
    dispose
  };
}
