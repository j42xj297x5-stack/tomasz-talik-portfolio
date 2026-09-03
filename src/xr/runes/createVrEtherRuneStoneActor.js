import * as THREE from '../../vendor/three.js';
import { createVrSphericalLayerActor } from '../world/createVrSphericalLayerActor.js';
import { VR_RUNE_STONE_STATE } from './createVrRuneStoneActor.js';
import { resolveRuneStoneByFamilyCode } from './vrRuneStoneRegistry.js';

const ETHER_FAMILY_CODE = 'V';
const ETHER_SLOT_COUNT = 6;
const ETHER_SLOT_INDEX = 5;

export function createVrEtherRuneStoneActor({ parent, assetManager, layer }) {
  if (!parent?.add || !assetManager?.getGltf || !assetManager?.cloneGltfScene) {
    throw new Error('[VrEtherRuneStoneActor] Parent and preloaded AssetManager are required.');
  }
  const descriptor = resolveRuneStoneByFamilyCode(ETHER_FAMILY_CODE);
  if (!descriptor?.special || descriptor.natural || descriptor.branchId !== null) {
    throw new Error('[VrEtherRuneStoneActor] Canonical SPECIAL Ether descriptor is required.');
  }
  const gltf = assetManager.getGltf(descriptor.assetId);
  const visualModel = assetManager.cloneGltfScene(descriptor.assetId);
  if (!gltf?.scene || !visualModel) {
    throw new Error(`[VrEtherRuneStoneActor] Missing preloaded asset: ${descriptor.assetId}.`);
  }

  const layerActor = createVrSphericalLayerActor({ parent, layer, slotCount: ETHER_SLOT_COUNT });
  layerActor.object.name = 'VrEtherRuneStoneField';
  const root = new THREE.Group();
  root.name = 'EtherRuneStoneActorRoot_V';
  const visualRoot = new THREE.Group();
  visualRoot.name = 'EtherRuneStoneVisualRoot_V';
  visualRoot.add(visualModel);
  root.add(visualRoot);
  layerActor.object.add(root);
  root.updateMatrixWorld(true);
  const placementClearanceRadius = new THREE.Box3().setFromObject(visualRoot)
    .getBoundingSphere(new THREE.Sphere()).radius;
  if (!Number.isFinite(placementClearanceRadius) || placementClearanceRadius <= 0) {
    layerActor.dispose();
    throw new Error(`[VrEtherRuneStoneActor] Invalid geometry bounds: ${descriptor.assetIdentity}.`);
  }
  const transform = layerActor.getSlotTransform(ETHER_SLOT_INDEX, placementClearanceRadius);
  root.position.copy(transform.position);
  root.quaternion.copy(transform.quaternion);
  const initialTransform = Object.freeze({
    position: root.position.clone(), quaternion: root.quaternion.clone(), scale: root.scale.clone()
  });
  const animationMixer = gltf.animations?.length ? new THREE.AnimationMixer(visualModel) : null;
  const actions = animationMixer ? gltf.animations.map((clip) => animationMixer.clipAction(clip).play()) : [];
  const record = { branchId: null, familyCode: descriptor.familyCode, familyId: descriptor.familyId,
    assetIdentity: descriptor.assetIdentity, assetId: descriptor.assetId, descriptor, root, visualRoot,
    animationMixer, actions, placementClearanceRadius, initialTransform, state: VR_RUNE_STONE_STATE.FREE };
  let disposed = false;

  const getStone = (familyCode) => String(familyCode ?? '').toUpperCase() === ETHER_FAMILY_CODE ? record : null;
  const setPresentationVisible = (value) => {
    if (disposed) return false;
    layerActor.object.visible = value === true;
    return true;
  };
  const commandState = (from, to) => {
    if (disposed || record.state !== from) return false;
    record.state = to;
    return true;
  };
  const getBoundingBox = () => {
    if (disposed) return null;
    root.updateWorldMatrix(true, true);
    return new THREE.Box3().setFromObject(visualRoot);
  };
  function reset() {
    if (disposed) return;
    layerActor.reset();
    setPresentationVisible(false);
    if (root.parent !== layerActor.object) layerActor.object.add(root);
    root.position.copy(initialTransform.position);
    root.quaternion.copy(initialTransform.quaternion);
    root.scale.copy(initialTransform.scale);
    record.state = VR_RUNE_STONE_STATE.FREE;
    actions.forEach((action) => { action.reset(); action.play(); });
    animationMixer?.setTime(0);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    actions.forEach((action) => action.stop());
    animationMixer?.stopAllAction();
    root.removeFromParent();
    layerActor.dispose();
  }
  setPresentationVisible(false);
  return {
    object: layerActor.object,
    getStone,
    getStones: () => disposed ? [] : [record],
    getRoot: (familyCode) => getStone(familyCode)?.root ?? null,
    getState: (familyCode) => getStone(familyCode)?.state ?? null,
    getDescriptor: (familyCode) => getStone(familyCode)?.descriptor ?? null,
    getBoundingBox,
    getBoundingSphere: () => getBoundingBox()?.getBoundingSphere(new THREE.Sphere()) ?? null,
    getInteractionRadius: () => getBoundingBox()?.getBoundingSphere(new THREE.Sphere()).radius ?? null,
    getFamilyCode: () => ETHER_FAMILY_CODE,
    setPresentationVisible,
    isPresentationVisible: () => !disposed && layerActor.object.visible === true,
    lockByAstro: () => record.state === VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO
      || commandState(VR_RUNE_STONE_STATE.FREE, VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO),
    beginCarriedOrbit: () => commandState(VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO, VR_RUNE_STONE_STATE.CARRIED_ORBIT),
    releaseFromAstro: () => record.state === VR_RUNE_STONE_STATE.FREE
      || commandState(VR_RUNE_STONE_STATE.LOCKED_BY_ASTRO, VR_RUNE_STONE_STATE.FREE)
      || commandState(VR_RUNE_STONE_STATE.CARRIED_ORBIT, VR_RUNE_STONE_STATE.FREE),
    update: (deltaSeconds = 0) => {
      if (!disposed) animationMixer?.update(Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0));
    },
    reset,
    dispose
  };
}
