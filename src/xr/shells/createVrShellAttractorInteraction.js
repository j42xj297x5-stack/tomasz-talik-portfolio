import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { createVrAttractorScanCone } from '../tools/createVrAttractorScanCone.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';

const LOCAL_DIRECTION = new THREE.Vector3(0, 0, -1);
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function selectConeTarget({ candidates, origin, direction, maxDistance, halfAngleRadians }) {
  const tanHalfAngle = Math.tan(halfAngleRadians), toTarget = new THREE.Vector3(), radial = new THREE.Vector3();
  const hits = [];
  for (const candidate of candidates) {
    const center = candidate.getWorldCenter(new THREE.Vector3()); toTarget.subVectors(center, origin);
    const depth = toTarget.dot(direction); if (depth <= 0 || depth > maxDistance + candidate.radius) continue;
    radial.copy(toTarget).addScaledVector(direction, -depth);
    const radialDistance = radial.length(), coneRadius = tanHalfAngle * Math.min(depth, maxDistance);
    if (radialDistance > coneRadius + candidate.radius) continue;
    hits.push({ shell: candidate.shell, distance: depth, angularScore: Math.max(0, radialDistance - candidate.radius) / Math.max(depth, 1e-6) });
  }
  hits.sort((a, b) => Math.abs(a.angularScore - b.angularScore) > 1e-6
    ? a.angularScore - b.angularScore : a.distance - b.distance);
  return hits[0] ?? null;
}

export function createVrShellAttractorInteraction({ controllers, shellSystem, handModeController, semanticInput,
  attractorTool, settings, haloSettings, settledParent = shellSystem.object.parent,
  crystalHeldByController = new Map(), isHigherPriorityInteractionActive = () => false }) {
  const maxTargetDistance = shellSystem.innerRadius * settings.targetDistanceRadiusMultiplier;
  const halfAngleRadians = THREE.MathUtils.degToRad(settings.scanCone.halfAngleDegrees);
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(), anchorWorldPosition = new THREE.Vector3();
  const shellWorldPosition = new THREE.Vector3(), movement = new THREE.Vector3(), localPosition = new THREE.Vector3();
  const handWorldPosition = new THREE.Vector3(), worldQuaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
  const captureAnchor = new THREE.Object3D(); captureAnchor.name = 'VrAttractorCaptureAnchor'; captureAnchor.position.set(0, 0, -settings.captureDistance);
  const rightRecord = controllers.find((record) => record.handedness === 'right') ?? null;
  const leftRecord = controllers.find((record) => record.handedness === 'left') ?? null;
  const scanCone = createVrAttractorScanCone({ parent: rightRecord.controller, length: maxTargetDistance, settings: settings.scanCone });
  const halos = new Map(shellSystem.instances.map((shell) => [shell, createVrTargetHalo({ root: shell, settings: haloSettings })]));
  const candidates = shellSystem.records.map((record) => ({ shell: record.object, radius: record.boundingRadius,
    getWorldCenter(result) { result.copy(record.boundingCenter); record.object.localToWorld(result); record.object.getWorldScale(scale);
      this.radius = record.boundingRadius * Math.max(scale.x, scale.y, scale.z); return result; } }));
  let target = null, activePull = null, captureReady = null, heldShell = null, pullSpeed = 0, pullStartDistance = 1;
  let disposed = false;
  const isEquipped = () => handModeController.getMode() === 'ASTRO_ATTRACTOR';
  const isValidCandidate = ({ shell }) => shell.visible !== false && shell.userData.attractorTarget === true
    && shell.userData.attractorType === 'shell' && ['orbiting', 'targeted'].includes(shell.userData.shellState);
  function clearTarget() { if (target?.userData.shellState === 'targeted') target.userData.shellState = 'orbiting';
    target = null; halos.forEach((halo) => halo.setVisible(false)); }
  function setTarget(shell) { if (target === shell) return; clearTarget(); target = shell;
    if (target) { target.userData.shellState = 'targeted'; halos.get(target)?.setVisible(true); } }
  function setWorldPosition(object, position) { localPosition.copy(position); object.parent.worldToLocal(localPosition); object.position.copy(localPosition); }
  function finishTool() { attractorTool.setTarget(null); attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); }
  function beginReturn(shell) { halos.get(shell)?.setVisible(false); shellSystem.returnToOrbit(shell, settings.returnDuration);
    if (captureReady === shell) captureReady = null; activePull = null; pullSpeed = 0; target = null; finishTool(); }
  function currentInput() { return semanticInput.getState?.() ?? { primaryAction: 0, grabAction: 0 }; }
  function handIsFree() { return leftRecord && !heldShell && !crystalHeldByController.has(leftRecord); }
  function findTarget() { rightRecord.controller.getWorldPosition(origin); rightRecord.controller.getWorldQuaternion(worldQuaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(worldQuaternion).normalize();
    return selectConeTarget({ candidates: candidates.filter(isValidCandidate), origin, direction,
      maxDistance: maxTargetDistance, halfAngleRadians }); }
  function isCaptureReadyInHandRange() { if (!captureReady || !leftRecord?.holdSocket || !handIsFree()) return false;
    leftRecord.holdSocket.getWorldPosition(handWorldPosition); captureReady.getWorldPosition(shellWorldPosition);
    return handWorldPosition.distanceTo(shellWorldPosition) <= settings.handCaptureRadius; }
  function captureForHandoff(shell) { captureAnchor.attach(shell); shell.userData.shellState = 'capture_ready'; shell.userData.attractorTarget = false;
    shellSystem.setEmission(shell, 1); captureReady = shell; activePull = shell; halos.get(shell)?.setVisible(false);
    attractorTool.setPullStrength(1); attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); }
  function takeWithLeftHand() { if (!isCaptureReadyInHandRange()) return false; const shell = captureReady;
    leftRecord.holdSocket.attach(shell); shell.userData.shellState = 'held'; shell.userData.attractorTarget = false;
    captureReady = null; activePull = null; target = null; heldShell = shell; finishTool(); return true; }
  function placeHeldShell() { if (!heldShell) return false; const shell = heldShell; settledParent.attach(shell);
    shell.userData.shellState = 'placed'; shell.userData.attractorTarget = false; heldShell = null; return true; }
  const onLeftSqueezeStart = () => takeWithLeftHand();
  const onLeftSqueezeEnd = () => placeHeldShell();
  leftRecord?.controller.addEventListener('squeezestart', onLeftSqueezeStart);
  leftRecord?.controller.addEventListener('squeezeend', onLeftSqueezeEnd);

  function update(deltaSeconds = 0) {
    if (disposed) return; const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    if (captureAnchor.parent !== rightRecord.controller) rightRecord.controller.add(captureAnchor);
    const { primaryAction = 0, grabAction = 0 } = currentInput();
    const scanning = shellSystem.active && rightRecord.isConnected && isEquipped() && grabAction > settings.scanThreshold;
    scanCone.update(delta, scanning);
    if (activePull) {
      if (!scanning || primaryAction <= settings.triggerThreshold) { beginReturn(activePull); return; }
      if (activePull.userData.shellState === 'capture_ready') { attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); return; }
      captureAnchor.getWorldPosition(anchorWorldPosition); activePull.getWorldPosition(shellWorldPosition);
      const distance = shellWorldPosition.distanceTo(anchorWorldPosition);
      if (distance <= settings.captureRadius) { captureForHandoff(activePull); return; }
      pullSpeed = Math.min(settings.maxPullSpeed, pullSpeed + settings.pullAcceleration * delta);
      movement.subVectors(anchorWorldPosition, shellWorldPosition).normalize().multiplyScalar(Math.min(distance, pullSpeed * delta));
      setWorldPosition(activePull, shellWorldPosition.add(movement));
      const progress = clamp01(1 - shellWorldPosition.distanceTo(anchorWorldPosition) / Math.max(pullStartDistance, 1e-6));
      shellSystem.setEmission(activePull, progress);
      halos.get(activePull)?.update(delta); attractorTool.setPullStrength(progress); attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); return;
    }
    if (!scanning || isHigherPriorityInteractionActive(rightRecord)) { clearTarget(); finishTool(); return; }
    const hit = findTarget(); setTarget(hit?.shell ?? null);
    if (!hit) { finishTool(); return; }
    halos.get(target)?.update(delta); attractorTool.setTarget({ target, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) }); attractorTool.setPullStrength(0);
    attractorTool.setState(VR_ATTRACTOR_STATES.TARGETING);
    if (primaryAction > settings.triggerThreshold && handIsFree()) { activePull = target; activePull.userData.shellState = 'pulling';
      activePull.getWorldPosition(shellWorldPosition); captureAnchor.getWorldPosition(anchorWorldPosition);
      pullStartDistance = Math.max(shellWorldPosition.distanceTo(anchorWorldPosition), 1e-6); shellSystem.setEmission(activePull, 0);
      pullSpeed = 0; attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); }
  }
  function reset() { scanCone.update(0, false); if (activePull) shellSystem.returnToOrbit(activePull, settings.returnDuration);
    if (heldShell) shellSystem.returnToOrbit(heldShell, settings.returnDuration); clearTarget(); activePull = null; captureReady = null;
    heldShell = null; pullSpeed = 0; finishTool(); }
  function dispose() { if (disposed) return; reset(); disposed = true; leftRecord?.controller.removeEventListener('squeezestart', onLeftSqueezeStart);
    leftRecord?.controller.removeEventListener('squeezeend', onLeftSqueezeEnd); captureAnchor.removeFromParent(); scanCone.dispose();
    halos.forEach((halo) => halo.dispose()); halos.clear(); }
  return { captureAnchor, scanCone, maxTargetDistance, halfAngleRadians, update, reset, dispose, isCaptureReadyInHandRange,
    get target() { return target; }, get activePull() { return activePull; }, get captureReady() { return captureReady; },
    get heldShell() { return heldShell; } };
}
