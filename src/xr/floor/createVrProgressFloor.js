import * as THREE from '../../vendor/three.js';

const SOURCE_CONTRACTS = Object.freeze({
  creative: Object.freeze({
    baseName: 'VR_PROGRESS_SECTOR_FIRE_BASE',
    panelNames: Object.freeze(['VR_PROGRESS_CARD_FIRE_01', 'VR_PROGRESS_CARD_FIRE_02', 'VR_PROGRESS_CARD_FIRE_03'])
  }),
  ethics: Object.freeze({
    baseName: 'VR_PROGRESS_SECTOR_EARTH_BASE',
    panelNames: Object.freeze(['VR_PROGRESS_CARD_EARTH_01', 'VR_PROGRESS_CARD_EARTH_02', 'VR_PROGRESS_CARD_EARTH_03'])
  }),
  water: Object.freeze({
    baseName: 'VR_PROGRESS_SECTOR_WATER_BASE',
    panelNames: Object.freeze([
      'VR_PROGRESS_CARD_WATER_01',
      'VR_PROGRESS_CARD_WATER_02',
      'VR_PROGRESS_CARD_WATER_03',
      'VR_PROGRESS_CARD_WATER_04',
      'VR_PROGRESS_CARD_WATER_05'
    ])
  }),
  metal: Object.freeze({
    baseName: 'VR_PROGRESS_SECTOR_METAL_BASE',
    panelNames: Object.freeze([
      'VR_PROGRESS_CARD_METAL_01',
      'VR_PROGRESS_CARD_METAL_02',
      'VR_PROGRESS_CARD_METAL_03',
      'VR_PROGRESS_CARD_METAL_04'
    ])
  })
});

const SECTOR_LAYOUT = Object.freeze([
  Object.freeze({ glyphId: 'spotify-digger', branchId: 'metal', placeholder: false, sourceType: 'metal' }),
  Object.freeze({ glyphId: 'haiku-cosmos', branchId: 'water', placeholder: false, sourceType: 'water' }),
  Object.freeze({ glyphId: 'ai-guide', branchId: 'wood', placeholder: true, sourceType: 'creative' }),
  Object.freeze({ glyphId: 'creative-ai', branchId: 'fire', placeholder: false, sourceType: 'creative' }),
  Object.freeze({ glyphId: 'ethics-life-protection', branchId: 'earth', placeholder: false, sourceType: 'ethics' })
]);
const SECTOR_COUNT = SECTOR_LAYOUT.length;

export const VR_PROGRESS_FLOOR_EMISSION = Object.freeze({
  stableIntensity: 1.35,
  pulseIntensity: 2.8,
  pulseDuration: 0.22,
  responseSpeed: 14,
  fallbackColors: Object.freeze({ creative: 0xff4b2b, ethics: 0xc8752a, water: 0x35a9ff, metal: 0x8cd1ff })
});

export const FLOOR_WORLD_Y_OFFSET = -1.05;

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

function makeSectorBaseTransparent(sector, baseName, sectorConfig) {
  const base = requireSectorObject(sector, baseName, sectorConfig);
  base.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  });
}

export function createVrProgressFloor({
  parent,
  creativeSectorModel,
  ethicsSectorModel,
  haikuSectorModel,
  digSectorModel,
  emission = {},
  worldYOffset = FLOOR_WORLD_Y_OFFSET
}) {
  if (!parent?.add) throw new Error('[VrProgressFloor] A valid parent is required.');
  if (!creativeSectorModel?.clone) throw new Error('[VrProgressFloor] A valid Creative sector model is required.');
  if (!ethicsSectorModel?.clone) throw new Error('[VrProgressFloor] A valid Ethics sector model is required.');
  if (!haikuSectorModel?.clone) throw new Error('[VrProgressFloor] A valid Haiku Cosmos sector model is required.');
  if (!digSectorModel?.clone) throw new Error('[VrProgressFloor] A valid DIG Engine sector model is required.');

  const config = {
    ...VR_PROGRESS_FLOOR_EMISSION,
    ...emission,
    fallbackColors: { ...VR_PROGRESS_FLOOR_EMISSION.fallbackColors, ...emission.fallbackColors }
  };
  const object = new THREE.Group();
  object.name = 'VrTiltableFloorRoot';
  object.position.y = worldYOffset;
  const ownedMaterials = new Set();
  const sourceModels = { creative: creativeSectorModel, ethics: ethicsSectorModel, water: haikuSectorModel, metal: digSectorModel };
  const sectorsByGlyphId = new Map();
  const activatedEntries = new Map();
  const pulseRemaining = new Map();
  let disposed = false;

  try {
    SECTOR_LAYOUT.forEach((sectorConfig, index) => {
      const sourceModel = sourceModels[sectorConfig.sourceType];
      const contract = SOURCE_CONTRACTS[sectorConfig.sourceType];
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
      cloneMaterials(sector, ownedMaterials);
      makeSectorBaseTransparent(sector, contract.baseName, sectorConfig);
      const panelsByOrder = new Map();
      contract.panelNames.forEach((panelName, panelIndex) => {
        const panel = requireSectorObject(sector, panelName, sectorConfig);
        panelsByOrder.set(panelIndex + 1, {
          object: panel,
          materials: getPanelMaterials(panel, config.fallbackColors[sectorConfig.sourceType])
        });
      });
      sectorsByGlyphId.set(sectorConfig.glyphId, { object: sector, panelsByOrder });
      object.add(sector);
    });
  } catch (error) {
    ownedMaterials.forEach((material) => material.dispose());
    throw error;
  }

  parent.add(object);

  function activatePage(page) {
    const glyphId = page?.glyphId;
    const order = page?.order;
    const panel = sectorsByGlyphId.get(glyphId)?.panelsByOrder.get(order);
    const key = `${glyphId}:${order}`;
    if (disposed || !panel || activatedEntries.has(key)) return false;
    activatedEntries.set(key, { glyphId, order, panel });
    pulseRemaining.set(key, config.pulseDuration);
    return true;
  }

  function update(delta = 0) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const blend = 1 - Math.exp(-config.responseSpeed * safeDelta);
    activatedEntries.forEach(({ panel }, key) => {
      const remaining = Math.max(0, (pulseRemaining.get(key) ?? 0) - safeDelta);
      pulseRemaining.set(key, remaining);
      const target = remaining > 0 ? config.pulseIntensity : config.stableIntensity;
      panel.materials.forEach((material) => {
        material.emissiveIntensity += (target - material.emissiveIntensity) * blend;
      });
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.removeFromParent();
    ownedMaterials.forEach((material) => material.dispose());
    ownedMaterials.clear();
  }

  return {
    object,
    activatePage,
    update,
    getActivatedEntries: () => [...activatedEntries.values()].map(({ glyphId, order }) => ({ glyphId, order })),
    dispose
  };
}
