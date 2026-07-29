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
function findTrigger(model, buttonRoot) {
  const objects = [];
  model?.traverse((object) => { if (object.isMesh && object.geometry) objects.push(object); });
  return objects.find(({ name }) => name === TRIGGER_NAME)
    ?? objects.find(({ userData }) => userData?.reliquary_role === 'crystal_release_trigger')
    ?? objects.find(({ userData }) => userData?.reliquary_button_id === 'release' && userData?.reliquary_runtime_raycast === true)
    ?? objects.find(({ name }) => name === buttonRoot?.userData?.reliquary_trigger_object)
    ?? null;
}
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
  const buttonRoot = findNamed(buttonModel, ROOT_NAME);
  const trigger = findTrigger(buttonModel, buttonRoot);
  const buttonFront = findNamed(buttonModel, FRONT_NAME);
  const triggerValid = Boolean(trigger?.isMesh && trigger.geometry);
  if (triggerValid) {
    trigger.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    trigger.visible = true;
  } else console.warn('[Experience VR] Reliquary release-button authored trigger is missing; using visual bounds for the runtime hit area.');

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
  buttonModel?.updateWorldMatrix(true, true);
  const placementRoot = buttonModel?.parent?.parent ?? buttonModel;
  const boundsSource = triggerValid ? trigger : visualMeshes.length ? visualMeshes : buttonModel;
  const authoredBounds = Array.isArray(boundsSource)
    ? boundsSource.reduce((box, mesh) => box.union(new THREE.Box3().setFromObject(mesh)), new THREE.Box3())
    : new THREE.Box3().setFromObject(boundsSource);
  const hitAreaScale = THREE.MathUtils.clamp(settings.hitAreaScale ?? 2, 1, 4);
  const worldCenter = authoredBounds.isEmpty() ? buttonModel.getWorldPosition(new THREE.Vector3()) : authoredBounds.getCenter(new THREE.Vector3());
  const worldSize = authoredBounds.isEmpty() ? new THREE.Vector3(0.16, 0.08, 0.16) : authoredBounds.getSize(new THREE.Vector3());
  worldSize.multiplyScalar(hitAreaScale);
  worldSize.x = Math.max(0.16, worldSize.x); worldSize.z = Math.max(0.16, worldSize.z);
  worldSize.y = Math.max(0.04, worldSize.y);
  placementRoot.updateWorldMatrix(true, false);
  const placementScale = placementRoot.getWorldScale(new THREE.Vector3());
  const localSize = worldSize.clone().divide(new THREE.Vector3(
    Math.abs(placementScale.x) || 1, Math.abs(placementScale.y) || 1, Math.abs(placementScale.z) || 1
  ));
  const raycastTarget = new THREE.Mesh(new THREE.BoxGeometry(localSize.x, localSize.y, localSize.z), new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false, colorWrite: false
  }));
  raycastTarget.name = 'VrReliquaryReleaseButtonHitArea';
  raycastTarget.position.copy(placementRoot.worldToLocal(worldCenter.clone()));
  raycastTarget.visible = true; raycastTarget.frustumCulled = false;
  raycastTarget.castShadow = false; raycastTarget.receiveShadow = false;
  placementRoot.add(raycastTarget);
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
  let debugLogged = false;
  const setEmission = (value) => emissiveMaterials.forEach((material) => { material.emissiveIntensity = value; });

  function updateHits() {
    let anyHit = false;
    buttonModel?.updateWorldMatrix(true, true);
    raycastTarget.updateWorldMatrix(true, false);
    const releaseAvailable = Boolean(canRelease());
    if (settings.debug && !debugLogged) {
      debugLogged = true;
      console.debug('[Experience VR][ReleaseButton]', {
        resolvedTriggerName: trigger?.name ?? null, resolvedTriggerRole: trigger?.userData?.reliquary_role ?? null,
        buttonModelChildrenNames: buttonModel?.children.map(({ name }) => name),
        raycastProxyWorldPosition: raycastTarget.getWorldPosition(new THREE.Vector3()).toArray(),
        raycastProxyWorldBox3: new THREE.Box3().setFromObject(raycastTarget), rayMaxDistance: settings.rayMaxDistance ?? 3,
        canReleaseResult: releaseAvailable, insertedCrystalState: settings.getInsertedCrystalState?.() ?? null
      });
    }
    controllers.forEach((record, index) => {
      let hit = false;
      let distance = null;
      if (settings.enabled !== false && reliquary?.object?.visible !== false) {
        record.controller.updateWorldMatrix(true, false);
        record.controller.getWorldPosition(origin);
        record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize();
        raycaster.near = 0;
        raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance, settings.rayMaxDistance ?? 3);
        raycaster.set(origin, direction);
        const intersection = raycaster.intersectObject(raycastTarget, false)[0];
        hit = Boolean(intersection); distance = intersection?.distance ?? null;
      }
      if (settings.debug && hits.get(record) !== hit) console.debug('[Experience VR][ReleaseButton] hit changed', { controllerIndex: index, hit, intersectionDistance: distance });
      hits.set(record, hit);
      anyHit ||= hit;
    });
    hovered = state === 'idle' && releaseAvailable && anyHit;
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
    raycastTarget.removeFromParent(); raycastTarget.geometry.dispose(); raycastTarget.material.dispose();
    trigger?.material?.dispose?.(); emissiveMaterials.forEach((material) => material.dispose?.());
  }
  reset();
  return { buttonModel, trigger, buttonRoot, visualMeshes, raycastTarget, mixer, action, hits, update, press, reset, dispose,
    get state() { return state; }, get hovered() { return hovered; } };
}
