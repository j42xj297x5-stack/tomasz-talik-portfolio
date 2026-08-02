import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';

const LOCAL_RAY_DIRECTION = new THREE.Vector3(0, 0, -1);
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createVrShellAttractorInteraction({ controllers, shellSystem, handModeController, semanticInput,
  attractorTool, settings, haloSettings, isHigherPriorityInteractionActive = () => false }) {
  const maxTargetDistance = shellSystem.innerRadius * settings.targetDistanceRadiusMultiplier;
  const raycaster = new THREE.Raycaster(); raycaster.near = 0; raycaster.far = maxTargetDistance;
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(), anchorWorldPosition = new THREE.Vector3();
  const shellWorldPosition = new THREE.Vector3(), movement = new THREE.Vector3(), localPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const captureAnchor = new THREE.Object3D(); captureAnchor.name = 'VrAttractorCaptureAnchor';
  captureAnchor.position.set(0, 0, -settings.captureDistance);
  const halos = new Map(shellSystem.instances.map((shell) => [shell, createVrTargetHalo({ root: shell, settings: haloSettings })]));
  const meshOwners = new Map();
  shellSystem.instances.forEach((shell) => shell.traverse((child) => {
    if (child.isMesh && child.geometry && child.visible && !child.userData.vrTargetHalo) meshOwners.set(child, shell);
  }));
  const targetMeshes = [...meshOwners.keys()];
  let target = null, activePull = null, pullSpeed = 0, disposed = false;
  const rightRecord = () => controllers.find((record) => record.handedness === 'right') ?? null;
  const isEquipped = () => handModeController.getMode() === 'ASTRO_ATTRACTOR';
  function clearTarget() {
    if (target?.userData.shellState === 'targeted') target.userData.shellState = 'orbiting';
    target = null; halos.forEach((halo) => halo.setVisible(false));
  }
  function setTarget(shell) {
    if (target === shell) return; clearTarget(); target = shell;
    if (target) { target.userData.shellState = 'targeted'; halos.get(target)?.setVisible(true); }
  }
  function setWorldPosition(object, position) {
    localPosition.copy(position); object.parent.worldToLocal(localPosition); object.position.copy(localPosition);
  }
  function beginReturn(shell) {
    halos.get(shell)?.setVisible(false); shellSystem.returnToOrbit(shell, settings.returnDuration);
    activePull = null; pullSpeed = 0; target = null;
    attractorTool.setTarget(null); attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.IDLE);
  }
  function findTarget(record) {
    record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(worldQuaternion);
    direction.copy(LOCAL_RAY_DIRECTION).applyQuaternion(worldQuaternion).normalize(); raycaster.set(origin, direction);
    for (const intersection of raycaster.intersectObjects(targetMeshes, false)) {
      const shell = meshOwners.get(intersection.object);
      if (shell?.visible !== false && shell.userData.attractorTarget === true && shell.userData.attractorType === 'shell'
        && ['orbiting', 'targeted'].includes(shell.userData.shellState)) return { shell, distance: intersection.distance };
    }
    return null;
  }
  function capture(shell) {
    captureAnchor.attach(shell); shell.position.set(0, 0, 0); shell.userData.shellState = 'held';
    halos.get(shell)?.setVisible(false); attractorTool.setPullStrength(1); attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED);
  }
  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0), record = rightRecord();
    if (record?.controller && captureAnchor.parent !== record.controller) record.controller.add(captureAnchor);
    const primaryAction = semanticInput.getState().primaryAction;
    if (activePull) {
      halos.get(activePull)?.update(delta);
      if (primaryAction <= settings.triggerThreshold) { beginReturn(activePull); return; }
      if (activePull.userData.shellState === 'held') { attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); return; }
      captureAnchor.getWorldPosition(anchorWorldPosition); activePull.getWorldPosition(shellWorldPosition);
      const distance = shellWorldPosition.distanceTo(anchorWorldPosition);
      if (distance <= settings.captureRadius) { capture(activePull); return; }
      pullSpeed = Math.min(settings.maxPullSpeed, pullSpeed + settings.pullAcceleration * delta);
      const step = Math.min(distance, pullSpeed * delta);
      movement.subVectors(anchorWorldPosition, shellWorldPosition).normalize().multiplyScalar(step);
      setWorldPosition(activePull, shellWorldPosition.add(movement));
      attractorTool.setPullStrength(Math.max(primaryAction, clamp01(pullSpeed / settings.maxPullSpeed)));
      attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); return;
    }
    if (!shellSystem.active || !record?.isConnected || !isEquipped() || isHigherPriorityInteractionActive(record)) {
      clearTarget(); attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      if (isEquipped()) attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); return;
    }
    const hit = findTarget(record); setTarget(hit?.shell ?? null);
    if (!hit) { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); return; }
    halos.get(target)?.update(delta);
    attractorTool.setTarget({ target, distance: hit.distance, proximity: clamp01(1 - hit.distance / maxTargetDistance) });
    attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.TARGETING);
    if (primaryAction > settings.triggerThreshold) { activePull = target; activePull.userData.shellState = 'pulling';
      pullSpeed = 0; attractorTool.setPullStrength(primaryAction); attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); }
  }
  function reset() { if (activePull) shellSystem.returnToOrbit(activePull, settings.returnDuration);
    clearTarget(); activePull = null; pullSpeed = 0; attractorTool.setTarget(null); attractorTool.setPullStrength(0); }
  function dispose() { if (disposed) return; reset(); disposed = true; captureAnchor.removeFromParent();
    halos.forEach((halo) => halo.dispose()); halos.clear(); meshOwners.clear(); }
  return { captureAnchor, maxTargetDistance, update, reset, dispose,
    get target() { return target; }, get activePull() { return activePull; } };
}
