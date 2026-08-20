import * as THREE from '../../vendor/three.js';

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
const SECTOR_COUNT = SECTOR_LAYOUT.length;

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

function cloneMaterials(root, ownedMaterials) {
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => {
        const clone = material.clone();
        ownedMaterials.add(clone);
        return clone;
      });
      return;
    }
    object.material = object.material.clone();
    ownedMaterials.add(object.material);
  });
}

function getPanelMaterials(panel, fallbackColor) {
  const materials = new Set();
  panel.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => {
      if (!material.emissive?.isColor) material.emissive = new THREE.Color(fallbackColor);
      else if (material.emissive.getHex() === 0) material.emissive.setHex(fallbackColor);
      material.emissiveIntensity = 0;
      material.needsUpdate = true;
      materials.add(material);
    });
  });
  return [...materials];
}

function requireSectorObject(sector, objectName, sectorConfig) {
  const object = sector.getObjectByName(objectName);
  if (!object) {
    throw new Error(`[VrProgressFloor] Missing required object "${objectName}" for sector "${sectorConfig.glyphId}" (source: ${sectorConfig.sourceType}).`);
  }
  return object;
}

function getBoundsRelativeTo(root, relativeTo) {
  const bounds = new THREE.Box3().makeEmpty();
  const inverseRelativeMatrix = new THREE.Matrix4().copy(relativeTo.matrixWorld).invert();
  const relativeMatrix = new THREE.Matrix4();
  const corner = new THREE.Vector3();
  root.traverse((object) => {
    if (!object.geometry) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const objectBounds = object.geometry.boundingBox;
    if (!objectBounds || objectBounds.isEmpty()) return;
    relativeMatrix.multiplyMatrices(inverseRelativeMatrix, object.matrixWorld);
    for (const x of [objectBounds.min.x, objectBounds.max.x]) {
      for (const y of [objectBounds.min.y, objectBounds.max.y]) {
        for (const z of [objectBounds.min.z, objectBounds.max.z]) {
          bounds.expandByPoint(corner.set(x, y, z).applyMatrix4(relativeMatrix));
        }
      }
    }
  });
  return bounds;
}

function makePresentationBodyTransparent(sector, bodyNames, sectorConfig) {
  const materials = new Map();
  bodyNames.forEach((bodyName) => {
    const bodyPart = requireSectorObject(sector, bodyName, sectorConfig);
    bodyPart.traverse((object) => {
      if (!object.isMesh || !object.material) return;
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => {
        if (!materials.has(material)) {
          materials.set(material, {
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite
          });
        }
        material.transparent = true;
        material.opacity = 0;
        material.depthWrite = false;
        material.needsUpdate = true;
      });
    });
  });
  return [...materials].map(([material, authoredState]) => ({ material, authoredState }));
}

function preparePresentationMaterialForFade({ material }) {
  const transparentChanged = material.transparent !== true;
  material.opacity = 0;
  material.transparent = true;
  material.depthWrite = false;
  if (transparentChanged) material.needsUpdate = true;
}

function restorePresentationMaterial({ material, authoredState }) {
  const transparentChanged = material.transparent !== authoredState.transparent;
  material.opacity = authoredState.opacity;
  material.transparent = authoredState.transparent;
  material.depthWrite = authoredState.depthWrite;
  if (transparentChanged) material.needsUpdate = true;
}

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
  const runeBridgeMountsByBranchId = new Map();
  const revealedSectorIds = new Set();
  const activatedEntries = new Map();
  const pulseRemaining = new Map();
  const completedTiers = new Set();
  const tierRings = new Map();
  let disposed = false;

  try {
    SECTOR_LAYOUT.forEach((sectorConfig, index) => {
      const sourceModel = sourceModels[sectorConfig.sourceType];
      const contract = VR_PROGRESS_FLOOR_SOURCE_CONTRACTS[sectorConfig.sourceType];
      const sector = sourceModel.clone(true);
      sector.name = `VrProgressFloorSector:${sectorConfig.glyphId}`;
      sector.rotation.y = index * (Math.PI * 2 / SECTOR_COUNT);
      sector.userData = {
        ...sector.userData,
        glyphId: sectorConfig.glyphId,
        branchId: sectorConfig.branchId,
        rotationIndex: index,
        placeholder: sectorConfig.placeholder,
        sourceType: sectorConfig.sourceType
      };
      sector.visible = false;
      cloneMaterials(sector, ownedMaterials);
      const referenceBase = requireSectorObject(sector, contract.referenceBaseName, sectorConfig);
      referenceBase.visible = false;
      sector.updateMatrixWorld(true);
      referenceBase.updateMatrixWorld(true);
      const referenceBounds = getBoundsRelativeTo(referenceBase, sector);
      if (referenceBounds.isEmpty()) {
        throw new Error(`[VrProgressFloor] Cannot derive rune bridge mount from "${contract.referenceBaseName}".`);
      }
      const outerArc = new THREE.Vector3(
        referenceBounds.max.x,
        referenceBounds.max.y,
        (referenceBounds.min.z + referenceBounds.max.z) / 2
      );
      const bridgeMount = new THREE.Object3D();
      bridgeMount.name = `VrRuneBridgeMount_${sectorConfig.branchId.toUpperCase()}`;
      bridgeMount.position.copy(outerArc);
      bridgeMount.userData = { ...bridgeMount.userData, branchId: sectorConfig.branchId };
      sector.add(bridgeMount);
      runeBridgeMountsByBranchId.set(sectorConfig.branchId, bridgeMount);
      const presentationMaterials = makePresentationBodyTransparent(sector, contract.presentationBodyNames, sectorConfig);
      const panelsByOrder = new Map();
      contract.panelNames.forEach((panelName, panelIndex) => {
        const panel = requireSectorObject(sector, panelName, sectorConfig);
        panelsByOrder.set(panelIndex + 1, {
          object: panel,
          materials: getPanelMaterials(panel, config.fallbackColors[sectorConfig.sourceType])
        });
      });
      sectorsByGlyphId.set(sectorConfig.glyphId, { object: sector, panelsByOrder, presentationMaterials });
      geometryRoot.add(sector);
    });

    object.updateMatrixWorld(true);
    const candidateRadii = [];
    for (let tier = 1; tier <= 5; tier += 1) {
      const samples = [];
      sectorsByGlyphId.forEach(({ panelsByOrder }) => {
        const panel = panelsByOrder.get(tier)?.object;
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
    ownedMaterials.forEach((material) => material.dispose());
    ownedGeometries.forEach((geometry) => geometry.dispose());
    throw error;
  }

  parent.add(object);

  function activatePage(page) {
    const glyphId = page?.glyphId;
    const order = page?.order;
    const sector = sectorsByGlyphId.get(glyphId);
    const panel = sector?.panelsByOrder.get(order);
    const key = `${glyphId}:${order}`;
    if (disposed || !panel || activatedEntries.has(key)) return false;
    const firstReveal = !revealedSectorIds.has(glyphId);
    if (firstReveal) {
      sector.object.visible = true;
      revealedSectorIds.add(glyphId);
    }
    activatedEntries.set(key, { glyphId, order, panel });
    pulseRemaining.set(key, config.pulseDuration);
    return true;
  }

  function update(delta = 0) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const blend = 1 - Math.exp(-config.responseSpeed * safeDelta);
    revealedSectorIds.forEach((glyphId) => {
      sectorsByGlyphId.get(glyphId)?.presentationMaterials.forEach((presentationMaterial) => {
        const { material, authoredState } = presentationMaterial;
        material.opacity += (authoredState.opacity - material.opacity) * blend;
        if (Math.abs(authoredState.opacity - material.opacity) <= 1e-4) {
          restorePresentationMaterial(presentationMaterial);
        }
      });
    });
    activatedEntries.forEach(({ panel }, key) => {
      const remaining = Math.max(0, (pulseRemaining.get(key) ?? 0) - safeDelta);
      pulseRemaining.set(key, remaining);
      const target = remaining > 0 ? config.pulseIntensity : config.stableIntensity;
      panel.materials.forEach((material) => {
        material.emissiveIntensity += (target - material.emissiveIntensity) * blend;
      });
    });
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
    if (!Array.isArray(state?.activatedPages) || state.completedTier !== 1) {
      throw new Error('Progress floor only supports the settled Tier 1 completion state');
    }
    state.activatedPages.forEach((page) => activatePage(page));
    completeTier(1);
    update(10);
  }
  function reset() {
    revealedSectorIds.clear(); activatedEntries.clear(); pulseRemaining.clear(); completedTiers.clear();
    sectorsByGlyphId.forEach(({ object: sector, panelsByOrder, presentationMaterials }) => {
      sector.visible = false;
      presentationMaterials.forEach(preparePresentationMaterialForFade);
      panelsByOrder.forEach(({ materials }) => materials.forEach((material) => { material.emissiveIntensity = 0; }));
    });
    tierRings.forEach((ring) => { ring.pulseRemaining = 0; ring.material.opacity = 0; });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.removeFromParent();
    ownedMaterials.forEach((material) => material.dispose());
    ownedMaterials.clear();
    ownedGeometries.forEach((geometry) => geometry.dispose());
    ownedGeometries.clear();
    revealedSectorIds.clear();
    runeBridgeMountsByBranchId.clear();
  }

  function getRuneBridgeMount(branchId) {
    return runeBridgeMountsByBranchId.get(String(branchId).toLowerCase()) ?? null;
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
    getRuneBridgeMount,
    dispose
  };
}
