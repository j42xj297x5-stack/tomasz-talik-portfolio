import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';

export function createVrAstroFurnaceOptionInteraction({ furnace, panel, controllers = [], settings = {}, haloSettings = {},
  isOrdinaryRayAvailable = () => true, isHigherPriorityInteractionActive = () => false }) {
  const button = furnace?.nodes?.button_option;
  const meshes = []; button?.traverse((node) => { if (node.isMesh && node.geometry) meshes.push(node); });
  const ownedMaterials = new Set(), materials = [];
  button?.traverse((node) => { if (!node.isMesh || !node.material) return; const source = Array.isArray(node.material) ? node.material : [node.material];
    const clones = source.map((item) => { const clone = item.clone(); ownedMaterials.add(clone); materials.push(clone); return clone; }); node.material = Array.isArray(node.material) ? clones : clones[0]; });
  const emissive = materials.filter((item) => 'emissiveIntensity' in item);
  const halo = button ? createVrTargetHalo({ root: button, settings: haloSettings }) : null;
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false])); const listeners = []; let disposed = false;
  const pivot = furnace?.nodes?.PIVOT_BUTTON_OPTION;
  const baseRotationZ = pivot?.rotation.z ?? 0;
  const moduleAngles = { floor_gyroscope_sphere: 90, ...(settings.moduleAnglesDegrees ?? {}) };
  let activeMode = null, tweenElapsed = 0, tweenStart = baseRotationZ, tweenTarget = baseRotationZ;
  const capabilityReady = settings.enabled !== false && meshes.length > 0 && Boolean(furnace?.nodes?.PIVOT_BUTTON_OPTION);
  const setEmission = (value) => emissive.forEach((material) => { material.emissiveIntensity = value; });
  function updateHits() { let any = false; controllers.forEach((record) => { let hit = false;
    if (capabilityReady && furnace.object.visible !== false && isOrdinaryRayAvailable(record) && !isHigherPriorityInteractionActive(record)) {
      record.controller.updateWorldMatrix(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
      direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction); raycaster.near = 0;
      raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance ?? 3, settings.rayMaxDistance ?? 3);
      const intersection = raycaster.intersectObjects(meshes, false)[0]; hit = Boolean(intersection);
      if (intersection) record.reportRayHit?.(intersection.distance);
    } hits.set(record, hit); any ||= hit; });
    setEmission(any ? settings.emissionHover ?? 1 : panel.isVisible() ? settings.emissionActive ?? 3 : settings.emissionInactive ?? 0);
    halo?.setVisible(any);
  }
  function press(record) { if (disposed || !hits.get(record) || !isOrdinaryRayAvailable(record)) return false; panel.toggle(); return true; }
  function selectMode(mode) {
    const angle = moduleAngles[mode];
    if (!pivot || !Number.isFinite(angle)) return false;
    activeMode = mode; tweenStart = pivot.rotation.z; tweenTarget = baseRotationZ + THREE.MathUtils.degToRad(angle); tweenElapsed = 0;
    return true;
  }
  const unsubscribeModule = panel.subscribeModuleActivation?.(selectMode) ?? (() => {});
  controllers.forEach((record) => { const listener = () => press(record); record.controller.addEventListener('selectstart', listener); listeners.push({ record, listener }); });
  function update(delta = 0) { if (!disposed) { updateHits(); halo?.update(Math.max(0, delta));
    if (pivot && Math.abs(pivot.rotation.z - tweenTarget) > 1e-7) { tweenElapsed += Math.max(0, delta); const raw = Math.min(1, tweenElapsed / Math.max(settings.selectionDuration ?? .48, 1e-6));
      const t = raw < .5 ? 4 * raw ** 3 : 1 - ((-2 * raw + 2) ** 3) / 2; pivot.rotation.z = THREE.MathUtils.lerp(tweenStart, tweenTarget, t); }
  } }
  function reset() { hits.forEach((_, record) => hits.set(record, false)); halo?.setVisible(false); setEmission(settings.emissionInactive ?? 0); activeMode = null; tweenElapsed = 0; tweenStart = baseRotationZ; tweenTarget = baseRotationZ; if (pivot) pivot.rotation.z = baseRotationZ; }
  function dispose() { if (disposed) return; reset(); disposed = true; unsubscribeModule(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener)); ownedMaterials.forEach((material) => material.dispose()); ownedMaterials.clear(); hits.clear(); halo?.dispose(); }
  reset(); return { hits, halo, capabilityReady, update, press, selectMode, reset, dispose,
    getActiveMode: () => activeMode, getTargetAngle: () => tweenTarget, hasCurrentHit: (record) => hits.get(record) === true };
}
