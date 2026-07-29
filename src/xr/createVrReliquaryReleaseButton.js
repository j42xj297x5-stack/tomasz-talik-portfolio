import * as THREE from '../vendor/three.js';

const TRIGGER_NAME = 'RELIQUARY_RELEASE_TRIGGER_SURFACE';
const ROOT_NAME = 'RELIQUARY_RELEASE_BUTTON_ROOT';
const FRONT_NAME = 'RELIQUARY_RELEASE_BUTTON_FRONT';
const PRESS_CLIP = 'Relic_Reliquary_ReleaseButton_Press';

function findNamed(model, name) {
  let found = null;
  model?.traverse((object) => { if (!found && object.name === name) found = object; });
  return found;
}
const validProperty = (object, key, expected) => object?.userData?.[key] === undefined || object.userData[key] === expected;
function numericProperty(objects, key, fallback) {
  for (const object of objects) {
    const value = Number(object?.userData?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function createVrReliquaryReleaseButton({
  buttonModel, animations = [], reliquary, controllers = [], settings = {}, canRelease = () => false,
  onRelease = () => false, onReleaseComplete = () => {}
}) {
  const trigger = findNamed(buttonModel, TRIGGER_NAME);
  const buttonRoot = findNamed(buttonModel, ROOT_NAME);
  const buttonFront = findNamed(buttonModel, FRONT_NAME);
  const triggerValid = Boolean(trigger?.isMesh && trigger.geometry
    && validProperty(trigger, 'reliquary_role', 'crystal_release_trigger')
    && validProperty(trigger, 'reliquary_button_id', 'release')
    && validProperty(trigger, 'reliquary_action', 'release_active_crystal'));
  if (triggerValid) {
    trigger.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    trigger.visible = true;
  } else console.warn('[Experience VR] Reliquary release-button trigger is missing or invalid; release is disabled.');

  const visualNames = new Set([FRONT_NAME]);
  const configured = trigger?.userData?.reliquary_visual_objects ?? buttonRoot?.userData?.reliquary_visual_objects;
  if (Array.isArray(configured)) configured.forEach((name) => visualNames.add(name));
  else if (typeof configured === 'string') configured.split(',').map((name) => name.trim()).filter(Boolean).forEach((name) => visualNames.add(name));
  const visualMeshes = [];
  buttonModel?.traverse((object) => {
    if (!object.isMesh || object === trigger) return;
    const byRole = object.userData?.reliquary_role === 'crystal_release_button_visual'
      && object.userData?.reliquary_button_id === 'release';
    if (byRole || visualNames.has(object.name) || object === buttonFront) visualMeshes.push(object);
  });
  const emissiveMaterials = [];
  visualMeshes.forEach((mesh) => {
    const clones = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((material) => material?.clone?.() ?? material);
    mesh.material = Array.isArray(mesh.material) ? clones : clones[0];
    clones.forEach((material) => { if (material && 'emissiveIntensity' in material) emissiveMaterials.push(material); });
  });
  const properties = [trigger, buttonRoot];
  const emission = {
    inactive: numericProperty(properties, 'reliquary_emission_inactive', 0),
    hover: numericProperty(properties, 'reliquary_emission_hover', 1),
    pressed: numericProperty(properties, 'reliquary_emission_pressed', 5)
  };
  const mixer = buttonModel ? new THREE.AnimationMixer(buttonModel) : null;
  const clip = THREE.AnimationClip.findByName(animations, PRESS_CLIP);
  const action = mixer && clip ? mixer.clipAction(clip) : null;
  if (!clip) console.warn(`[Experience VR] Reliquary release-button animation clip "${PRESS_CLIP}" is missing; release remains available.`);
  if (action) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.enabled = true; }

  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const hits = new Map();
  const listeners = [];
  let state = 'idle';
  let hovered = false;
  let elapsed = 0;
  let disposed = false;
  const setEmission = (value) => emissiveMaterials.forEach((material) => { material.emissiveIntensity = value; });

  function updateHits() {
    let anyHit = false;
    for (const record of controllers) {
      let hit = false;
      if (triggerValid && settings.enabled !== false && reliquary?.object?.visible !== false) {
        record.controller.updateWorldMatrix(true, false);
        record.controller.getWorldPosition(origin);
        record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize();
        raycaster.near = 0;
        raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance, settings.rayMaxDistance ?? 3);
        raycaster.set(origin, direction);
        hit = raycaster.intersectObject(trigger, true).length > 0;
      }
      hits.set(record, hit);
      anyHit ||= hit;
    }
    hovered = state === 'idle' && Boolean(canRelease()) && anyHit;
    if (state === 'idle') setEmission(hovered ? emission.hover : emission.inactive);
  }
  function press(record) {
    if (disposed || state !== 'idle' || !hits.get(record) || !canRelease()) return false;
    state = 'releasing'; elapsed = 0; hovered = false;
    setEmission(emission.pressed);
    action?.reset().play();
    return true;
  }
  controllers.forEach((record) => {
    const selectStart = () => press(record);
    record.controller.addEventListener('selectstart', selectStart);
    listeners.push({ record, selectStart }); hits.set(record, false);
  });
  function finish() {
    if (onRelease() !== true) { reset(); return; }
    action?.stop(); mixer?.setTime(0); setEmission(emission.inactive);
    state = 'idle'; onReleaseComplete();
  }
  function update(delta = 0) {
    if (disposed) return;
    updateHits(); mixer?.update(Math.max(0, delta));
    if (state === 'releasing') {
      elapsed += Math.max(0, delta);
      if (elapsed >= (settings.releaseDelaySeconds ?? 1)) finish();
    }
  }
  function reset() {
    action?.stop(); mixer?.setTime(0); elapsed = 0; state = 'idle'; hovered = false;
    hits.forEach((_, record) => hits.set(record, false)); setEmission(emission.inactive);
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    listeners.forEach(({ record, selectStart }) => record.controller.removeEventListener('selectstart', selectStart));
    trigger?.material?.dispose?.(); emissiveMaterials.forEach((material) => material.dispose?.());
  }
  reset();
  return { buttonModel, trigger, buttonRoot, visualMeshes, mixer, action, hits, update, press, reset, dispose,
    get state() { return state; }, get hovered() { return hovered; } };
}
