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

export function calculateShellCapturePosition({ masterRingWorldPosition, controllerRayDirection,
  shellCaptureForwardDistance, target = new THREE.Vector3() }) {
  return target.copy(masterRingWorldPosition).addScaledVector(controllerRayDirection, shellCaptureForwardDistance);
}

export function createVrShellAttractorInteraction({ controllers, shellSystem, handModeController, semanticInput,
  attractorTool, settings, haloSettings, settledParent = shellSystem.object.parent,
  crystalHeldByController = new Map(), isHigherPriorityInteractionActive = () => false }) {
  const maxTargetDistance = shellSystem.innerRadius * settings.targetDistanceRadiusMultiplier;
  const halfAngleRadians = THREE.MathUtils.degToRad(settings.scanCone.halfAngleDegrees);
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(), anchorWorldPosition = new THREE.Vector3();
  const shellWorldPosition = new THREE.Vector3(), movement = new THREE.Vector3(), localPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
  const captureAnchor = new THREE.Object3D(); captureAnchor.name = 'VrAttractorCaptureAnchor';
  const raycaster = new THREE.Raycaster();
  function getRightRecord() { return controllers.find((record) => record.handedness === 'right') ?? null; }
  function getLeftRecord() { return controllers.find((record) => record.handedness === 'left') ?? null; }
  const scanCone = createVrAttractorScanCone({ parent: null, length: maxTargetDistance, settings: settings.scanCone });
  const halos = new Map(shellSystem.instances.map((shell) => [shell, createVrTargetHalo({ root: shell, settings: haloSettings })]));
  const candidates = shellSystem.records.map((record) => ({ shell: record.object, radius: record.boundingRadius,
    getWorldCenter(result) { result.copy(record.boundingCenter); record.object.localToWorld(result); record.object.getWorldScale(scale);
      this.radius = record.boundingRadius * Math.max(scale.x, scale.y, scale.z); return result; } }));
  let target = null, activePull = null, captureReady = null, heldShell = null, heldByRecord = null, leftRayTarget = null;
  const placedRayTargets = new Set();
  let pullSpeed = 0, pullStartDistance = 1;
  let disposed = false;
  const isEquipped = () => handModeController.getMode() === 'ASTRO_ATTRACTOR';
  const isValidCandidate = ({ shell }) => shell.visible !== false && shell.userData.attractorTarget === true
    && shell.userData.attractorType === 'shell' && ['orbiting', 'targeted'].includes(shell.userData.shellState);
  function syncHalo(shell) { halos.get(shell)?.setVisible(shell === target || shell === leftRayTarget || placedRayTargets.has(shell)); }
  function clearTarget() { const previous = target; if (target?.userData.shellState === 'targeted') target.userData.shellState = 'orbiting';
    target = null; if (previous) syncHalo(previous); }
  function setTarget(shell) { if (target === shell) return; clearTarget(); target = shell;
    if (target) { target.userData.shellState = 'targeted'; syncHalo(target); } }
  function setWorldPosition(object, position) { localPosition.copy(position); object.parent.worldToLocal(localPosition); object.position.copy(localPosition); }
  function finishTool() { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
    if (isEquipped()) attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); }
  function beginReturn(shell) { halos.get(shell)?.setVisible(false); shellSystem.returnToOrbit(shell, settings.returnDuration);
    if (captureReady === shell) captureReady = null; activePull = null; pullSpeed = 0; target = null; finishTool(); }
  function currentInput() { return semanticInput.getState?.() ?? { primaryAction: 0, grabAction: 0 }; }
  function handIsFree(leftRecord = getLeftRecord()) { return Boolean(leftRecord?.isConnected && !heldShell && !crystalHeldByController.has(leftRecord)); }
  function findTarget(rightRecord = getRightRecord()) { if (!rightRecord?.controller || !rightRecord.isConnected) return null;
    rightRecord.controller.getWorldPosition(origin); rightRecord.controller.getWorldQuaternion(worldQuaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(worldQuaternion).normalize();
    return selectConeTarget({ candidates: candidates.filter(isValidCandidate), origin, direction,
      maxDistance: maxTargetDistance, halfAngleRadians }); }
  function clearLeftShellHit(leftRecord = getLeftRecord()) { if (leftRecord) {
    leftRecord.currentShellHit = null; leftRecord.currentShellHitDistance = null; }
    const previous = leftRayTarget; leftRayTarget = null; if (previous) syncHalo(previous); }
  function clearPlacedShellHit(record) {
    const previous = record.currentPlacedShellHit;
    record.currentPlacedShellHit = null; record.currentPlacedShellHitDistance = null;
    if (previous) { placedRayTargets.delete(previous); syncHalo(previous); }
  }
  function isVisibleHit(object, shell) {
    for (let current = object; current; current = current.parent) {
      if (current.visible === false) return false;
      if (current === shell) return true;
    }
    return false;
  }
  function updatePlacedShellHit(record) {
    if (!record?.controller || !record.isConnected || !Number.isFinite(record.currentRayLength)
      || crystalHeldByController.has(record) || heldByRecord === record
      || (record.handedness === 'right' && isEquipped())) return;
    record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(worldQuaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(worldQuaternion).normalize(); raycaster.set(origin, direction);
    raycaster.near = 0; raycaster.far = record.currentRayLength;
    let nearest = null;
    for (const shell of shellSystem.instances) {
      if (shell.userData.shellState !== 'placed' || shell.visible === false) continue;
      const hit = raycaster.intersectObject(shell, true).find(({ object }) => isVisibleHit(object, shell));
      if (hit && (!nearest || hit.distance < nearest.distance)) nearest = { shell, distance: hit.distance };
    }
    if (!nearest) return;
    record.currentPlacedShellHit = nearest.shell; record.currentPlacedShellHitDistance = nearest.distance;
    record.reportRayHit?.(nearest.distance); placedRayTargets.add(nearest.shell);
  }
  function updatePlacedShellHits() {
    const previous = new Set(placedRayTargets); placedRayTargets.clear();
    controllers.forEach((record) => { record.currentPlacedShellHit = null; record.currentPlacedShellHitDistance = null; });
    controllers.forEach(updatePlacedShellHit);
    new Set([...previous, ...placedRayTargets]).forEach(syncHalo);
  }
  function updateCaptureAnchor(rightRecord) { rightRecord.controller.getWorldQuaternion(worldQuaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(worldQuaternion).normalize();
    attractorTool.getMasterRingWorldPosition(anchorWorldPosition);
    calculateShellCapturePosition({ masterRingWorldPosition: anchorWorldPosition, controllerRayDirection: direction,
      shellCaptureForwardDistance: settings.shellCaptureForwardDistance, target: anchorWorldPosition });
    setWorldPosition(captureAnchor, anchorWorldPosition); }
  function updateLeftRayHit(leftRecord = getLeftRecord()) { clearLeftShellHit(leftRecord);
    if (!captureReady || !leftRecord?.controller || !leftRecord.isConnected || !Number.isFinite(leftRecord.currentRayLength)) return;
    leftRecord.controller.getWorldPosition(origin); leftRecord.controller.getWorldQuaternion(worldQuaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(worldQuaternion).normalize(); raycaster.set(origin, direction);
    raycaster.near = 0; raycaster.far = leftRecord.currentRayLength;
    const hit = raycaster.intersectObject(captureReady, true).find(({ object }) => object.visible !== false);
    if (!hit) return; leftRecord.currentShellHit = captureReady; leftRecord.currentShellHitDistance = hit.distance;
    leftRecord.reportRayHit?.(hit.distance); leftRayTarget = captureReady; syncHalo(captureReady); }
  function captureForHandoff(shell) { captureAnchor.attach(shell); shell.userData.shellState = 'capture_ready'; shell.userData.attractorTarget = false;
    shellSystem.setEmission(shell, 1); captureReady = shell; activePull = shell; syncHalo(shell);
    attractorTool.setPullStrength(1); attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); }
  function hasCurrentShellHit(leftRecord = getLeftRecord()) { return Boolean(captureReady && leftRecord?.currentShellHit === captureReady
    && leftRecord.currentShellHitDistance <= leftRecord.currentRayLength); }
  function takeWithLeftHand(leftRecord = getLeftRecord()) { if (!handIsFree(leftRecord) || !hasCurrentShellHit(leftRecord)) return false; const shell = captureReady;
    leftRecord.holdSocket.attach(shell); shell.userData.shellState = 'held'; shell.userData.attractorTarget = false;
    captureReady = null; activePull = null; target = null; heldShell = shell; heldByRecord = leftRecord;
    clearLeftShellHit(leftRecord); finishTool(); return true; }
  function hasCurrentPlacedShellHit(record) { return Boolean(record?.currentPlacedShellHit
    && record.currentPlacedShellHit.userData.shellState === 'placed'
    && record.currentPlacedShellHitDistance <= record.currentRayLength); }
  function takePlacedShell(record) {
    if (!handIsFree(record) || !hasCurrentPlacedShellHit(record)
      || (record.handedness === 'right' && isEquipped())) return false;
    const shell = record.currentPlacedShellHit; record.holdSocket.attach(shell);
    shell.userData.shellState = 'held'; shell.userData.attractorTarget = false;
    heldShell = shell; heldByRecord = record; clearPlacedShellHit(record); return true;
  }
  function placeHeldShell(record) { if (!record?.isConnected || heldByRecord !== record || !heldShell) return false;
    const shell = heldShell; settledParent.attach(shell); shell.userData.shellState = 'placed'; shell.userData.attractorTarget = false;
    heldShell = null; heldByRecord = null; return true; }
  const squeezeListeners = controllers.map((record) => {
    const onSqueezeStart = () => { if (takePlacedShell(record)) return;
      if (record.handedness === 'left') takeWithLeftHand(record); };
    const onSqueezeEnd = () => { placeHeldShell(record); };
    record.controller.addEventListener('squeezestart', onSqueezeStart);
    record.controller.addEventListener('squeezeend', onSqueezeEnd);
    return { record, onSqueezeStart, onSqueezeEnd };
  });

  function update(deltaSeconds = 0) {
    if (disposed) return; const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    const rightRecord = getRightRecord();
    const leftRecord = getLeftRecord();
    updatePlacedShellHits();
    if (!rightRecord?.controller || !rightRecord.isConnected) {
      scanCone.update(delta, false); clearTarget();
      if (activePull) beginReturn(activePull); else finishTool();
      return;
    }
    if (scanCone.object.parent !== rightRecord.controller) rightRecord.controller.add(scanCone.object);
    if (captureAnchor.parent !== settledParent) settledParent.add(captureAnchor);
    updateCaptureAnchor(rightRecord); updateLeftRayHit(leftRecord);
    const { primaryAction = 0, grabAction = 0 } = currentInput();
    const scanning = shellSystem.active && rightRecord.isConnected && isEquipped() && grabAction > settings.scanThreshold;
    scanCone.update(delta, scanning);
    if (activePull) {
      if (!scanning || primaryAction <= settings.triggerThreshold) { beginReturn(activePull); return; }
      if (activePull.userData.shellState === 'capture_ready') { setWorldPosition(activePull, anchorWorldPosition);
        attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); return; }
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
    const hit = findTarget(rightRecord); setTarget(hit?.shell ?? null);
    if (!hit) { finishTool(); return; }
    halos.get(target)?.update(delta); attractorTool.setTarget({ target, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) }); attractorTool.setPullStrength(0);
    attractorTool.setState(VR_ATTRACTOR_STATES.TARGETING);
    if (primaryAction > settings.triggerThreshold && handIsFree(leftRecord)) { activePull = target; activePull.userData.shellState = 'pulling';
      activePull.getWorldPosition(shellWorldPosition); captureAnchor.getWorldPosition(anchorWorldPosition);
      pullStartDistance = Math.max(shellWorldPosition.distanceTo(anchorWorldPosition), 1e-6); shellSystem.setEmission(activePull, 0);
      pullSpeed = 0; attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); }
  }
  function reset() { scanCone.update(0, false); if (activePull) shellSystem.returnToOrbit(activePull, settings.returnDuration);
    if (heldShell) shellSystem.returnToOrbit(heldShell, settings.returnDuration); clearTarget(); activePull = null; captureReady = null;
    heldShell = null; heldByRecord = null; pullSpeed = 0; clearLeftShellHit(); controllers.forEach(clearPlacedShellHit); finishTool(); }
  function dispose() { if (disposed) return; reset(); disposed = true;
    squeezeListeners.forEach(({ record, onSqueezeStart, onSqueezeEnd }) => {
      record.controller.removeEventListener('squeezestart', onSqueezeStart);
      record.controller.removeEventListener('squeezeend', onSqueezeEnd);
    });
    captureAnchor.removeFromParent(); scanCone.dispose();
    halos.forEach((halo) => halo.dispose()); halos.clear(); }
  return { captureAnchor, scanCone, maxTargetDistance, halfAngleRadians, update, reset, dispose,
    hasCurrentShellHit: (record) => hasCurrentPlacedShellHit(record) || hasCurrentShellHit(record),
    get target() { return target; }, get activePull() { return activePull; }, get captureReady() { return captureReady; },
    get heldShell() { return heldShell; } };
}
