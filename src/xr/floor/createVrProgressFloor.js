import * as THREE from '../../vendor/three.js';

const SECTOR_COUNT = 5;
const SECTOR_BASE_NAME = 'VR_PROGRESS_SECTOR_FIRE_BASE';
const PANEL_NAMES = Object.freeze([
  'VR_PROGRESS_CARD_FIRE_01',
  'VR_PROGRESS_CARD_FIRE_02',
  'VR_PROGRESS_CARD_FIRE_03'
]);

export const VR_PROGRESS_FLOOR_EMISSION = Object.freeze({
  stableIntensity: 1.35,
  pulseIntensity: 2.8,
  pulseDuration: 0.22,
  responseSpeed: 14,
  fallbackColor: 0xff4b2b
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

function makeSectorBaseTransparent(sector) {
  const base = sector.getObjectByName(SECTOR_BASE_NAME);
  if (!base) return;
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

export function createVrProgressFloor({ parent, sectorModel, emission = {}, worldYOffset = FLOOR_WORLD_Y_OFFSET }) {
  if (!parent?.add) throw new Error('[VrProgressFloor] A valid parent is required.');
  if (!sectorModel?.clone) throw new Error('[VrProgressFloor] A valid sector model is required.');

  const config = { ...VR_PROGRESS_FLOOR_EMISSION, ...emission };
  const object = new THREE.Group();
  object.name = 'VrTiltableFloorRoot';
  object.position.y = worldYOffset;
  const ownedMaterials = new Set();
  const panelsByOrder = new Map(PANEL_NAMES.map((_, index) => [index + 1, []]));
  const activatedOrders = new Set();
  const pulseRemaining = new Map();
  let disposed = false;

  try {
    for (let index = 0; index < SECTOR_COUNT; index += 1) {
      const sectorNumber = index + 1;
      const sector = sectorModel.clone(true);
      sector.name = `VrProgressFloorSector:${String(sectorNumber).padStart(2, '0')}`;
      sector.rotation.y = index * (Math.PI * 2 / SECTOR_COUNT);
      cloneMaterials(sector, ownedMaterials);
      makeSectorBaseTransparent(sector);
      PANEL_NAMES.forEach((panelName, panelIndex) => {
        const panel = sector.getObjectByName(panelName);
        if (!panel) throw new Error(`[VrProgressFloor] Missing required object "${panelName}" in sector ${sectorNumber}.`);
        panelsByOrder.get(panelIndex + 1).push({
          object: panel,
          materials: getPanelMaterials(panel, config.fallbackColor)
        });
      });
      object.add(sector);
    }
  } catch (error) {
    ownedMaterials.forEach((material) => material.dispose());
    throw error;
  }

  parent.add(object);

  function activateOrder(order) {
    if (disposed || !Number.isInteger(order) || order < 1 || order > 3 || activatedOrders.has(order)) return false;
    activatedOrders.add(order);
    pulseRemaining.set(order, config.pulseDuration);
    return true;
  }

  function update(delta = 0) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const blend = 1 - Math.exp(-config.responseSpeed * safeDelta);
    activatedOrders.forEach((order) => {
      const remaining = Math.max(0, (pulseRemaining.get(order) ?? 0) - safeDelta);
      pulseRemaining.set(order, remaining);
      const target = remaining > 0 ? config.pulseIntensity : config.stableIntensity;
      panelsByOrder.get(order).forEach(({ materials }) => materials.forEach((material) => {
        material.emissiveIntensity += (target - material.emissiveIntensity) * blend;
      }));
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.removeFromParent();
    ownedMaterials.forEach((material) => material.dispose());
    ownedMaterials.clear();
  }

  return { object, activateOrder, update, getActivatedOrders: () => [...activatedOrders], dispose };
}
