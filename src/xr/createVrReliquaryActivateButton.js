import * as THREE from '../vendor/three.js';

const TRIGGER_NAME = 'RELIQUARY_ACTIVATE_TRIGGER_SURFACE';
const ROOT_NAME = 'RELIQUARY_ACTIVATE_BUTTON_ROOT';
const FRONT_NAME = 'RELIQUARY_ACTIVATE_BUTTON_FRONT';
const PRESS_CLIP = 'Relic_Reliquary_ActivateButton_Press';

function findNamed(model, name) {
  let found = null;
  model?.traverse((object) => { if (!found && object.name === name) found = object; });
  return found;
}

function propertyIsValid(object, property, expected) {
  return object?.userData?.[property] === undefined || object.userData[property] === expected;
}

function numberProperty(objects, property, fallback) {
  for (const object of objects) {
    const value = Number(object?.userData?.[property]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function createVrReliquaryActivateButton({
  buttonModel, animations = [], reliquary, controllers = [], settings = {}, canActivate = () => false,
  onActivate = () => false
}) {
  const trigger = findNamed(buttonModel, TRIGGER_NAME);
  const buttonRoot = findNamed(buttonModel, ROOT_NAME);
  const buttonFront = findNamed(buttonModel, FRONT_NAME);
  const triggerValid = Boolean(trigger?.isMesh && trigger.geometry
    && propertyIsValid(trigger, 'reliquary_role', 'crystal_activate_trigger')
    && propertyIsValid(trigger, 'reliquary_button_id', 'activate')
    && propertyIsValid(trigger, 'reliquary_action', 'activate_inserted_crystal'));

  if (triggerValid) {
    trigger.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    trigger.visible = true;
  } else {
    console.warn('[Experience VR] Reliquary activate-button trigger is missing or invalid; button interaction is disabled.');
  }

  const namedVisuals = new Set([FRONT_NAME]);
  const configuredNames = trigger?.userData?.reliquary_visual_objects ?? buttonRoot?.userData?.reliquary_visual_objects;
  if (Array.isArray(configuredNames)) configuredNames.forEach((name) => namedVisuals.add(name));
  else if (typeof configuredNames === 'string') configuredNames.split(',').map((name) => name.trim()).filter(Boolean).forEach((name) => namedVisuals.add(name));
  const visualMeshes = [];
  buttonModel?.traverse((object) => {
    if (!object.isMesh || object === trigger) return;
    const byRole = object.userData?.reliquary_role === 'crystal_activate_button_visual'
      && object.userData?.reliquary_button_id === 'activate';
    if (byRole || namedVisuals.has(object.name) || object === buttonFront) visualMeshes.push(object);
  });
  const emissiveMaterials = [];
  visualMeshes.forEach((mesh) => {
    const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((material) => material?.clone?.() ?? material);
    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
    materials.forEach((material) => { if (material && 'emissiveIntensity' in material) emissiveMaterials.push(material); });
  });
  if (!visualMeshes.length) console.warn('[Experience VR] Reliquary activate-button visual meshes are missing; interaction remains available.');
  else if (!emissiveMaterials.length) console.warn('[Experience VR] Reliquary activate-button materials do not support emissiveIntensity; interaction remains available.');

  const properties = [trigger, buttonRoot];
  const emission = {
    inactive: numberProperty(properties, 'reliquary_emission_inactive', 0),
    hover: numberProperty(properties, 'reliquary_emission_hover', 1),
    pressed: numberProperty(properties, 'reliquary_emission_pressed', 5)
  };
  const mixer = buttonModel ? new THREE.AnimationMixer(buttonModel) : null;
  const exactClip = THREE.AnimationClip.findByName(animations, PRESS_CLIP);
  const declaredPressClip = [trigger, buttonRoot].some((object) => object?.userData?.reliquary_press_animation === PRESS_CLIP)
    && animations.length === 1 ? animations[0] : null;
  const clip = exactClip ?? declaredPressClip;
  const action = mixer && clip ? mixer.clipAction(clip) : null;
  if (!clip) console.warn(`[Experience VR] Reliquary activate-button animation clip "${PRESS_CLIP}" is missing; activation remains available.`);
  else if (!exactClip) console.warn(`[Experience VR] Reliquary activate-button GLB declares "${PRESS_CLIP}" but exports the clip as "${clip.name}"; playing the sole declared press clip.`);
  if (action) { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.enabled = true; }

  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const hits = new Map();
  const listeners = [];
  let state = 'idle';
  let hovered = false;
  let disposed = false;

  function setEmission(value) {
    emissiveMaterials.forEach((material) => { if (material.emissiveIntensity !== value) material.emissiveIntensity = value; });
  }

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
        raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance, settings.rayMaxDistance);
        raycaster.set(origin, direction);
        hit = raycaster.intersectObject(trigger, true).length > 0;
      }
      hits.set(record, hit);
      anyHit ||= hit;
    }
    hovered = state !== 'active' && Boolean(canActivate()) && anyHit;
    if (state !== 'active') setEmission(hovered ? emission.hover : emission.inactive);
  }

  function press(record) {
    if (disposed || state === 'active' || !hits.get(record) || !canActivate() || onActivate() !== true) return false;
    state = 'active';
    hovered = false;
    setEmission(emission.pressed);
    action?.reset().play();
    return true;
  }

  controllers.forEach((record) => {
    const selectStart = () => press(record);
    record.controller.addEventListener('selectstart', selectStart);
    listeners.push({ record, selectStart });
    hits.set(record, false);
  });

  function update(delta = 0) { if (!disposed) { updateHits(); mixer?.update(Math.max(0, delta)); } }
  function reset() {
    action?.stop();
    mixer?.setTime(0);
    hits.forEach((_, record) => hits.set(record, false));
    hovered = false;
    state = 'idle';
    setEmission(emission.inactive);
  }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true;
    listeners.forEach(({ record, selectStart }) => record.controller.removeEventListener('selectstart', selectStart));
    trigger?.material?.dispose?.();
    emissiveMaterials.forEach((material) => material.dispose?.());
  }
  reset();
  return { buttonModel, trigger, buttonRoot, visualMeshes, mixer, action, hits, update, press, reset, dispose,
    get state() { return state; }, get hovered() { return hovered; } };
}
