import * as THREE from '../../vendor/three.js';
import { computeNodeLocalQuaternionForWorldOrientation } from './asterionGyroMath.js';

const REQUIRED_NODES = Object.freeze(['ASTERION_ROOT', 'GIMBAL_CURRENT', 'GIMBAL_TARGET', 'CORE', 'VERTICAL_SYSTEM']);
const IDLE_PREFIX = 'ASTERION_IDLE__';
const DEG_TO_RAD = Math.PI / 180;

function getVisibleBounds(root) {
  const box = new THREE.Box3();
  let hasVisibleMesh = false;
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (!object.isMesh || object.visible === false) return;
    const objectBox = new THREE.Box3().setFromObject(object);
    if (objectBox.isEmpty()) return;
    box.union(objectBox);
    hasVisibleMesh = true;
  });
  return hasVisibleMesh ? box : new THREE.Box3().setFromObject(root);
}

function animationTargetsRuntimeNode(clip, runtimeNodeNames) {
  return clip.tracks.some((track) => runtimeNodeNames.some((nodeName) => track.name === nodeName
    || track.name.startsWith(`${nodeName}.`) || track.name.startsWith(`${nodeName}/`)));
}

function setRuntimeNodeWorldOrientation(node, desiredWorldQuaternion) {
  if (!node) return;
  const parentWorldQuaternion = node.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion();
  node.quaternion.copy(computeNodeLocalQuaternionForWorldOrientation({ desiredWorldQuaternion, nodeParentWorldQuaternion: parentWorldQuaternion }));
}

export function createVrAsterionSphere({ model, animations = [], settings, enabled = false, debug = false }) {
  const object = model ?? new THREE.Group();
  object.name = 'VrAsterionSphereEquipment';
  object.visible = false;
  const socket = new THREE.Object3D();
  socket.name = 'VrAsterionSphereSocket';
  const requiredNodes = Object.fromEntries(REQUIRED_NODES.map((name) => [name, object.getObjectByName(name) ?? null]));
  const missingNodes = REQUIRED_NODES.filter((name) => !requiredNodes[name]);
  if (missingNodes.length > 0) console.warn('[AsterionSphere] Missing required runtime node(s).', missingNodes);
  const idleClips = animations.filter((clip) => clip?.name?.startsWith?.(IDLE_PREFIX));
  const mixerProtectedNodeNames = ['GIMBAL_CURRENT', 'GIMBAL_TARGET', 'CORE', 'VERTICAL_SYSTEM'];
  const conflictingClips = animations.filter((clip) => animationTargetsRuntimeNode(clip, mixerProtectedNodeNames));
  if (conflictingClips.length > 0) console.warn('[AsterionSphere] Runtime node animation conflict; these clips were not started.', conflictingClips.map((clip) => clip.name));
  const playableIdleClips = idleClips.filter((clip) => !animationTargetsRuntimeNode(clip, mixerProtectedNodeNames));
  const mixer = new THREE.AnimationMixer(object);
  const actions = playableIdleClips.map((clip) => {
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.play();
    return action;
  });

  const bounds = getVisibleBounds(object);
  const size = bounds.getSize(new THREE.Vector3());
  const sourceDiameter = Math.max(size.x, size.y, size.z);
  const targetDiameter = Math.max(0.001, Number.isFinite(settings?.targetDiameter) ? settings.targetDiameter : 0.18);
  const computedScale = sourceDiameter > 0 ? targetDiameter / sourceDiameter : 1;
  object.scale.multiplyScalar(computedScale);
  object.position.sub(bounds.getCenter(new THREE.Vector3()).multiplyScalar(computedScale));
  socket.add(object);
  const holdOffset = settings?.holdOffset ?? { x: 0, y: 0.07, z: -0.11 };
  const holdRotation = settings?.holdRotationDegrees ?? { x: 0, y: 0, z: 0 };
  socket.position.set(holdOffset.x ?? 0, holdOffset.y ?? 0, holdOffset.z ?? 0);
  socket.rotation.set((holdRotation.x ?? 0) * DEG_TO_RAD, (holdRotation.y ?? 0) * DEG_TO_RAD, (holdRotation.z ?? 0) * DEG_TO_RAD);

  let equippedRecord = null;
  let disposed = false;
  let diagnosticsLogged = false;

  function equipTo(record) {
    if (!enabled || disposed || !record?.grip || record.handedness !== 'left') return false;
    if (equippedRecord === record && socket.parent === record.grip) return true;
    socket.removeFromParent();
    record.grip.add(socket);
    equippedRecord = record;
    object.visible = true;
    if (debug && !diagnosticsLogged) {
      diagnosticsLogged = true;
      console.info('[AsterionSphere]', { clipNames: animations.map((clip) => clip.name), idleClipCount: idleClips.length,
        runtimeNodes: Object.fromEntries(REQUIRED_NODES.map((name) => [name, Boolean(requiredNodes[name])])),
        animationTrackConflicts: conflictingClips.map((clip) => clip.name),
        visibleBounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() }, computedScale, targetDiameter,
        equippedHandedness: record.handedness });
    }
    return true;
  }

  function unequip() { object.visible = false; socket.removeFromParent(); equippedRecord = null; }
  function syncGimbals({ currentQuaternion, targetQuaternion, worldRoot }) {
    if (!isEquipped()) return;
    socket.updateWorldMatrix(true, true);
    worldRoot?.updateWorldMatrix?.(true, false);
    const rootWorldQuaternion = worldRoot?.getWorldQuaternion?.(new THREE.Quaternion()) ?? new THREE.Quaternion();
    const syncGimbal = (node, floorLocalQuaternion) => {
      setRuntimeNodeWorldOrientation(node, rootWorldQuaternion.clone().multiply(floorLocalQuaternion));
    };
    syncGimbal(requiredNodes.GIMBAL_CURRENT, currentQuaternion);
    syncGimbal(requiredNodes.GIMBAL_TARGET, targetQuaternion);
    setRuntimeNodeWorldOrientation(requiredNodes.CORE, rootWorldQuaternion);
    setRuntimeNodeWorldOrientation(requiredNodes.VERTICAL_SYSTEM, rootWorldQuaternion);
  }
  function update(delta) { if (!disposed) mixer.update(Math.max(0, Number.isFinite(delta) ? delta : 0)); }
  function reset() { actions.forEach((a) => { a.reset(); a.play(); }); mixer.setTime(0); if (enabled && equippedRecord?.handedness === 'left') equipTo(equippedRecord); else unequip(); }
  function dispose() { if (disposed) return; disposed = true; actions.forEach((a) => a.stop()); mixer.stopAllAction(); unequip(); }
  function isEquipped() { return Boolean(equippedRecord && object.visible && socket.parent); }
  return { object, socket, equipTo, unequip, update, reset, dispose, syncGimbals, isEquipped, getEquippedRecord: () => equippedRecord,
    getIdleClipCount: () => idleClips.length, getStartedIdleClipCount: () => playableIdleClips.length, getRequiredNodes: () => ({ ...requiredNodes }), getDiagnostics: () => ({ computedScale, targetDiameter, sourceDiameter, missingNodes: [...missingNodes], conflictingClipNames: conflictingClips.map((clip) => clip.name) }) };
}
