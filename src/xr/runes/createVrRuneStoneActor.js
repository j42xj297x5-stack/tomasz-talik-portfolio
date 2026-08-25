import * as THREE from '../../vendor/three.js';
import { createVrSphericalLayerActor } from '../world/createVrSphericalLayerActor.js';
import { VR_NATURAL_RUNE_STONE_ASSETS } from './vrRuneStoneRegistry.js';

export const VR_RUNE_STONE_STATE = Object.freeze({
  FREE: 'FREE',
  LOCKED_BY_ASTRO: 'LOCKED_BY_ASTRO',
  CARRIED_ORBIT: 'CARRIED_ORBIT'
});

export function createVrRuneStoneActor({ parent, assetManager, layer }) {
  if (!parent?.add || !assetManager?.getGltf || !assetManager?.cloneGltfScene) {
    throw new Error('[VrRuneStoneActor] Parent and preloaded AssetManager are required.');
  }
  const layerActor = createVrSphericalLayerActor({
    parent,
    layer,
    slotCount: VR_NATURAL_RUNE_STONE_ASSETS.length
  });
  layerActor.object.name = 'VrRuneStoneField';
  const records = new Map();
  let disposed = false;

  try {
    VR_NATURAL_RUNE_STONE_ASSETS.forEach((descriptor, slotIndex) => {
      const gltf = assetManager.getGltf(descriptor.assetId);
      const visualModel = assetManager.cloneGltfScene(descriptor.assetId);
      if (!gltf?.scene || !visualModel) {
        throw new Error(`[VrRuneStoneActor] Missing preloaded asset: ${descriptor.assetId}.`);
      }

      const root = new THREE.Group();
      root.name = `RuneStoneActorRoot_${descriptor.branchId.toUpperCase()}`;
      const visualRoot = new THREE.Group();
      visualRoot.name = `RuneStoneVisualRoot_${descriptor.branchId.toUpperCase()}`;
      visualRoot.add(visualModel);
      root.add(visualRoot);
      layerActor.object.add(root);

      root.updateMatrixWorld(true);
      const placementClearanceRadius = new THREE.Box3()
        .setFromObject(visualRoot)
        .getBoundingSphere(new THREE.Sphere()).radius;
      if (!Number.isFinite(placementClearanceRadius) || placementClearanceRadius <= 0) {
        throw new Error(`[VrRuneStoneActor] Invalid geometry bounds: ${descriptor.assetIdentity}.`);
      }

      const transform = layerActor.getSlotTransform(slotIndex, placementClearanceRadius);
      root.position.copy(transform.position);
      root.quaternion.copy(transform.quaternion);
      const animationMixer = gltf.animations?.length ? new THREE.AnimationMixer(visualModel) : null;
      const actions = animationMixer
        ? gltf.animations.map((clip) => animationMixer.clipAction(clip).play())
        : [];
      const initialTransform = Object.freeze({
        position: root.position.clone(),
        quaternion: root.quaternion.clone(),
        scale: root.scale.clone()
      });
      records.set(descriptor.branchId, {
        branchId: descriptor.branchId,
        familyCode: descriptor.familyCode,
        familyId: descriptor.familyId,
        assetIdentity: descriptor.assetIdentity,
        assetId: descriptor.assetId,
        descriptor,
        root,
        visualRoot,
        animationMixer,
        actions,
        placementClearanceRadius,
        initialTransform,
        state: VR_RUNE_STONE_STATE.FREE
      });
    });
  } catch (error) {
    layerActor.dispose();
    throw error;
  }

  const getRecord = (branchId) => records.get(String(branchId ?? '').toLowerCase()) ?? null;
  const lockByAstro = (branchId) => {
    const record = getRecord(branchId);
    if (!record) return false;
    if (record.state === VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO) return true;
    if (record.state !== VR_RUNE_STONE_STATE.FREE) return false;
    record.state = VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO;
    return true;
  };
  const beginCarriedOrbit = (branchId) => {
    const record = getRecord(branchId);
    if (!record) return false;
    if (record.state !== VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO) return false;
    record.state = VR_RUNE_STONE_STATE.CARRIED_ORBIT;
    return true;
  };
  const releaseFromAstro = (branchId) => {
    const record = getRecord(branchId);
    if (!record) return false;
    if (record.state === VR_RUNE_STONE_STATE.FREE) return true;
    if (record.state !== VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO
      && record.state !== VR_RUNE_STONE_STATE.CARRIED_ORBIT) return false;
    record.state = VR_RUNE_STONE_STATE.FREE;
    return true;
  };
  const getBoundingBox = (branchId) => {
    const record = getRecord(branchId);
    if (!record) return null;
    record.root.updateWorldMatrix(true, true);
    return new THREE.Box3().setFromObject(record.visualRoot);
  };
  const getBoundingSphere = (branchId) => {
    const boundingBox = getBoundingBox(branchId);
    return boundingBox?.getBoundingSphere(new THREE.Sphere()) ?? null;
  };
  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    records.forEach(({ animationMixer }) => animationMixer?.update(delta));
  }
  function reset() {
    if (disposed) return;
    layerActor.reset();
    records.forEach((record) => {
      record.state = VR_RUNE_STONE_STATE.FREE;
      record.root.position.copy(record.initialTransform.position);
      record.root.quaternion.copy(record.initialTransform.quaternion);
      record.root.scale.copy(record.initialTransform.scale);
      record.actions.forEach((action) => { action.reset(); action.play(); });
      record.animationMixer?.setTime(0);
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    records.forEach((record) => {
      record.actions.forEach((action) => action.stop());
      record.animationMixer?.stopAllAction();
      record.root.removeFromParent();
    });
    records.clear();
    layerActor.dispose();
  }

  return {
    object: layerActor.object,
    getStone: getRecord,
    getStones: () => Array.from(records.values()),
    getRoot: (branchId) => getRecord(branchId)?.root ?? null,
    getState: (branchId) => getRecord(branchId)?.state ?? null,
    getDescriptor: (branchId) => getRecord(branchId)?.descriptor ?? null,
    getBoundingBox,
    getBoundingSphere,
    getInteractionRadius: (branchId) => getBoundingSphere(branchId)?.radius ?? null,
    getFamilyCode: (branchId) => getRecord(branchId)?.familyCode ?? null,
    lockByAstro,
    beginCarriedOrbit,
    releaseFromAstro,
    update,
    reset,
    dispose
  };
}
