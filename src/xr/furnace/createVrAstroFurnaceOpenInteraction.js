import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';

export const ASTRO_FURNACE_STATES = Object.freeze({
  CLOSED: 'CLOSED', OPENING: 'OPENING', OPEN: 'OPEN', CLOSING: 'CLOSING'
});

const CLIPS = Object.freeze({
  buttonOpenAction: 'AstroFurnace_ButtonOpen_Press',
  latchLeftAction: 'AstroFurnace_Chamber_Open_LatchLeft',
  latchRightAction: 'AstroFurnace_Chamber_Open_LatchRight',
  latchTopAction: 'AstroFurnace_Chamber_Open_LatchTop',
  lidAction: 'AstroFurnace_Chamber_Open_Lid',
  chamberAction: 'AstroFurnace_Chamber_Open_Chamber'
});
const MECHANICAL_KEYS = Object.freeze(Object.keys(CLIPS).filter((key) => key !== 'buttonOpenAction'));
const PIVOTS = Object.freeze([
  'PIVOT_BUTTON_OPEN', 'PIVOT_FURNACE_LATCH_LEFT', 'PIVOT_FURNACE_LATCH_RIGHT',
  'PIVOT_FURNACE_LATCH_TOP', 'PIVOT_FURNACE_LID_Z', 'PIVOT_FURNACE_CHAMBER_Z'
]);

function cloneBranchMaterials(root, ownedMaterials) {
  const records = [];
  root?.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const source = Array.isArray(node.material) ? node.material : [node.material];
    const clones = source.map((material) => {
      const clone = material?.clone?.() ?? material;
      if (clone !== material) ownedMaterials.add(clone);
      return clone;
    });
    node.material = Array.isArray(node.material) ? clones : clones[0];
    records.push(...clones.filter(Boolean));
  });
  return records;
}

export function createVrAstroFurnaceOpenInteraction({
  furnace, controllers = [], settings = {}, haloSettings = {}, isOrdinaryRayAvailable = () => true,
  canToggle = () => true, isModeActive = () => true, onOpeningStart = () => {}, onClosingStart = () => {}
}) {
  const stateNames = ASTRO_FURNACE_STATES;
  const buttonNode = furnace?.nodes?.button_open;
  const buttonMeshes = [];
  buttonNode?.traverse((node) => { if (node.isMesh && node.geometry) buttonMeshes.push(node); });
  const ownedMaterials = new Set();
  const buttonMaterials = cloneBranchMaterials(buttonNode, ownedMaterials);
  const halo = buttonNode ? createVrTargetHalo({ root: buttonNode, settings: haloSettings }) : null;
  const chamberNode = furnace?.nodes?.komora;
  const chamberBaseVisible = chamberNode?.visible ?? true;
  const chamberMaterials = cloneBranchMaterials(chamberNode, ownedMaterials).map((material) => ({
    material,
    baseOpacity: material.opacity,
    baseTransparent: material.transparent,
    baseDepthWrite: material.depthWrite
  }));
  const baseTransforms = new Map(PIVOTS.map((name) => {
    const node = furnace?.nodes?.[name];
    return [node, node ? { position: node.position.clone(), quaternion: node.quaternion.clone(), scale: node.scale.clone() } : null];
  }).filter(([node]) => node));
  const mixer = furnace?.model ? new THREE.AnimationMixer(furnace.model) : null;
  const actions = Object.fromEntries(Object.entries(CLIPS).map(([key, name]) => {
    const clip = furnace?.clips?.[name];
    const action = mixer && clip ? mixer.clipAction(clip) : null;
    if (action) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = key !== 'buttonOpenAction';
      action.enabled = true;
    }
    return [key, action];
  }));
  const requiredNodesReady = PIVOTS.every((name) => furnace?.nodes?.[name]);
  const clipsReady = Object.values(CLIPS).every((name) => furnace?.clips?.[name]);
  const capabilityReady = settings.enabled !== false && buttonMeshes.length > 0 && requiredNodesReady && clipsReady;
  if (settings.enabled !== false && !capabilityReady) {
    console.warn('[Experience VR] Astro furnace open/close interaction is disabled: button geometry, pivots, or exact animation clips are missing.');
  }

  const emissiveMaterials = buttonMaterials.filter((material) => 'emissiveIntensity' in material);
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false]));
  const listeners = [];
  const pendingMechanical = new Set();
  const maxDuration = Math.max(0, ...MECHANICAL_KEYS.map((key) => actions[key]?.getClip().duration ?? 0));
  let state = stateNames.CLOSED;
  let transitionElapsed = 0;
  let disposed = false;

  const setEmission = (value) => emissiveMaterials.forEach((material) => { material.emissiveIntensity = value; });
  const canToggleCurrentState = () => canToggle() && (state === stateNames.OPEN || isModeActive());
  function restoreTransforms() {
    baseTransforms.forEach((base, node) => {
      node.position.copy(base.position); node.quaternion.copy(base.quaternion); node.scale.copy(base.scale);
      node.updateMatrix();
    });
  }
  function restoreGlass() {
    if (chamberNode) chamberNode.visible = chamberBaseVisible;
    chamberMaterials.forEach(({ material, baseOpacity, baseTransparent, baseDepthWrite }) => {
      material.opacity = baseOpacity; material.transparent = baseTransparent; material.depthWrite = baseDepthWrite;
      material.needsUpdate = true;
    });
  }
  function setGlassFactor(factor) {
    chamberMaterials.forEach(({ material, baseOpacity, baseTransparent, baseDepthWrite }) => {
      material.opacity = baseOpacity * THREE.MathUtils.clamp(factor, 0, 1);
      material.transparent = factor < 1 || baseTransparent;
      material.depthWrite = factor >= 1 ? baseDepthWrite : false;
    });
  }
  function updateGlass() {
    if (state !== stateNames.OPENING && state !== stateNames.CLOSING) return;
    const raw = maxDuration > 0 ? THREE.MathUtils.clamp(transitionElapsed / maxDuration, 0, 1) : 1;
    const start = Math.min(settings.chamber?.glassFadeStart ?? 0.2, settings.chamber?.glassFadeEnd ?? 1);
    const end = Math.max(start + Number.EPSILON, settings.chamber?.glassFadeEnd ?? 1);
    const fade = THREE.MathUtils.clamp((raw - start) / (end - start), 0, 1);
    setGlassFactor(state === stateNames.OPENING ? 1 - fade : fade);
  }
  function playButton() {
    const action = actions.buttonOpenAction;
    if (!action) return;
    action.stop(); action.reset(); action.timeScale = 1; action.clampWhenFinished = false; action.play();
  }
  function beginTransition(nextState) {
    if (!capabilityReady || (nextState === stateNames.OPENING && state !== stateNames.CLOSED)
      || (nextState === stateNames.CLOSING && state !== stateNames.OPEN) || !canToggleCurrentState()) return false;
    halo?.setVisible(false);
    state = nextState; transitionElapsed = 0; pendingMechanical.clear(); playButton();
    if (nextState === stateNames.OPENING) onOpeningStart();
    else onClosingStart();
    if (nextState === stateNames.CLOSING) { if (chamberNode) chamberNode.visible = chamberBaseVisible; setGlassFactor(0); }
    MECHANICAL_KEYS.forEach((key) => {
      const action = actions[key];
      action.stop(); action.enabled = true; action.paused = false; action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      if (nextState === stateNames.OPENING) { action.time = 0; action.timeScale = 1; }
      else { action.time = action.getClip().duration; action.timeScale = -1; }
      pendingMechanical.add(action); action.play();
    });
    setEmission(settings.emissionPressed ?? 4);
    return true;
  }
  function onFinished({ action }) {
    if (!pendingMechanical.delete(action) || pendingMechanical.size) return;
    if (state === stateNames.OPENING) {
      state = stateNames.OPEN; setGlassFactor(0); if (chamberNode) chamberNode.visible = false;
    } else if (state === stateNames.CLOSING) {
      MECHANICAL_KEYS.forEach((key) => actions[key].stop());
      restoreTransforms(); restoreGlass(); state = stateNames.CLOSED;
    }
    transitionElapsed = 0; setEmission(settings.emissionInactive ?? 0);
  }
  mixer?.addEventListener('finished', onFinished);

  function updateHits() {
    let anyHit = false;
    controllers.forEach((record) => {
      let hit = false;
      if (capabilityReady && canToggleCurrentState() && (state === stateNames.CLOSED || state === stateNames.OPEN)
        && furnace?.object?.visible !== false && isOrdinaryRayAvailable(record)) {
        record.controller.updateWorldMatrix(true, false);
        record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize();
        raycaster.near = 0;
        raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance ?? 3, settings.rayMaxDistance ?? 3);
        raycaster.set(origin, direction);
        const intersection = raycaster.intersectObjects(buttonMeshes, false)[0];
        hit = Boolean(intersection);
        if (hit) record.reportRayHit?.(intersection.distance);
      }
      hits.set(record, hit); anyHit ||= hit;
    });
    if (state === stateNames.CLOSED || state === stateNames.OPEN) {
      setEmission(anyHit ? settings.emissionHover ?? 1 : settings.emissionInactive ?? 0);
    }
    halo?.setVisible(anyHit && canToggleCurrentState() && (state === stateNames.CLOSED || state === stateNames.OPEN));
  }
  function press(record) {
    if (disposed || !hits.get(record) || !isOrdinaryRayAvailable(record)) return false;
    if (state === stateNames.CLOSED) return beginTransition(stateNames.OPENING);
    if (state === stateNames.OPEN) return beginTransition(stateNames.CLOSING);
    return false;
  }
  controllers.forEach((record) => {
    const selectStart = () => press(record);
    record.controller.addEventListener('selectstart', selectStart); listeners.push({ record, selectStart });
  });
  function update(delta = 0) {
    if (disposed) return;
    updateHits();
    const step = Math.max(0, delta);
    if (state === stateNames.OPENING || state === stateNames.CLOSING) transitionElapsed += step;
    mixer?.update(step); updateGlass();
    halo?.update(step);
  }
  function reset() {
    Object.values(actions).forEach((action) => action?.stop()); pendingMechanical.clear(); mixer?.stopAllAction(); mixer?.setTime(0);
    restoreTransforms(); restoreGlass(); state = stateNames.CLOSED; transitionElapsed = 0;
    hits.forEach((_, record) => hits.set(record, false)); setEmission(settings.emissionInactive ?? 0);
    halo?.setVisible(false);
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    listeners.forEach(({ record, selectStart }) => record.controller.removeEventListener('selectstart', selectStart));
    mixer?.removeEventListener('finished', onFinished); mixer?.stopAllAction();
    Object.values(CLIPS).forEach((name) => { if (furnace?.clips?.[name]) mixer?.uncacheClip(furnace.clips[name]); });
    ownedMaterials.forEach((material) => material.dispose?.()); ownedMaterials.clear(); hits.clear();
    halo?.dispose();
  }
  reset();
  return {
    mixer, actions, hits, halo, capabilityReady, update, press, reset, dispose,
    getState: () => state,
    isOpen: () => state === stateNames.OPEN,
    isTransitioning: () => state === stateNames.OPENING || state === stateNames.CLOSING,
    canInsert: () => state === stateNames.OPEN,
    hasCurrentHit: (record) => hits.get(record) === true
  };
}
