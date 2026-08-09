import * as THREE from '../../vendor/three.js';
import { computeNodeLocalQuaternionForWorldOrientation } from './asterionGyroMath.js';

const REQUIRED_NODES = Object.freeze(['ASTERION_ROOT', 'GIMBAL_CURRENT', 'GIMBAL_TARGET', 'CORE', 'VERTICAL_SYSTEM', 'PIV_TARGET_AXIS', 'srodek']);
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
  const innerRing1Pivot = object.getObjectByName('PIV_inner_ring1_precession') ?? null;
  const innerRing2Pivot = object.getObjectByName('PIV_inner_ring2_precession') ?? null;
  const innerRing3Pivot = object.getObjectByName('PIV_inner_ring3_precession') ?? null;
  if (innerRing1Pivot && requiredNodes.GIMBAL_CURRENT && innerRing1Pivot.parent !== requiredNodes.GIMBAL_CURRENT) {
    object.updateMatrixWorld(true);
    requiredNodes.GIMBAL_CURRENT.attach(innerRing1Pivot);
  }
  const missingNodes = REQUIRED_NODES.filter((name) => !requiredNodes[name]);
  if (missingNodes.length > 0) console.warn('[AsterionSphere] Missing required runtime node(s).', missingNodes);
  const idleClips = animations.filter((clip) => clip?.name?.startsWith?.(IDLE_PREFIX));
  const mixerProtectedNodeNames = ['GIMBAL_CURRENT', 'GIMBAL_TARGET', 'CORE', 'VERTICAL_SYSTEM', 'PIV_TARGET_AXIS'];
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
  const actionByClipName = new Map(actions.map((action) => [action.getClip().name, action]));
  const innerRing1Action = actionByClipName.get('ASTERION_IDLE__inner_ring1') ?? null;
  const targetRingActions = ['ASTERION_IDLE__inner_ring2', 'ASTERION_IDLE__inner_ring3']
    .map((clipName) => actionByClipName.get(clipName))
    .filter(Boolean);
  const targetRingBlendResponse = Math.max(0, Number.isFinite(settings?.targetRingBlendResponse) ? settings.targetRingBlendResponse : 12);
  let targetRingWeight = 1;
  let targetRingTargetWeight = 1;
  if (innerRing1Action) innerRing1Action.setEffectiveWeight(0);
  targetRingActions.forEach((action) => action.setEffectiveWeight(targetRingWeight));

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
  let presentationAnchor = null;
  const presentationMaterials = [];
  object.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const source = Array.isArray(node.material) ? node.material : [node.material];
    const runtime = source.map((material) => material?.clone?.() ?? material);
    node.material = Array.isArray(node.material) ? runtime : runtime[0];
    runtime.forEach((material) => presentationMaterials.push({ material, color: material.color?.clone?.(),
      emissive: material.emissive?.clone?.(), emissiveIntensity: material.emissiveIntensity ?? 0,
      opacity: material.opacity ?? 1, transparent: material.transparent, depthWrite: material.depthWrite }));
  });
  const white = new THREE.Color(1, 1, 1);
  function restorePresentationMaterials() {
    presentationMaterials.forEach((base) => { const { material } = base;
      if (base.color && material.color) material.color.copy(base.color);
      if (base.emissive && material.emissive) material.emissive.copy(base.emissive);
      material.emissiveIntensity = base.emissiveIntensity; material.opacity = base.opacity;
      material.transparent = base.transparent; material.depthWrite = base.depthWrite; material.needsUpdate = true;
    });
  }
  function setMaterializationProgress(formationProgress) {
    const progress = THREE.MathUtils.clamp(formationProgress, 0, 1);
    presentationMaterials.forEach((base) => { const { material } = base;
      if (base.color && material.color) material.color.copy(white).lerp(base.color, progress);
      if (base.emissive && material.emissive) material.emissive.copy(white).lerp(base.emissive, progress);
      material.emissiveIntensity = THREE.MathUtils.lerp(10, base.emissiveIntensity, progress);
      material.opacity = base.opacity * progress; material.transparent = progress < 1 || base.transparent;
      material.depthWrite = progress >= 1 ? base.depthWrite : false; material.needsUpdate = true;
    });
  }

  function equipTo(record) {
    if (!enabled || disposed || !record?.grip || record.handedness !== 'left') return false;
    if (equippedRecord === record && socket.parent === record.grip) return true;
    restorePresentationMaterials(); socket.removeFromParent();
    record.grip.add(socket);
    socket.position.set(holdOffset.x ?? 0, holdOffset.y ?? 0, holdOffset.z ?? 0);
    socket.rotation.set((holdRotation.x ?? 0) * DEG_TO_RAD, (holdRotation.y ?? 0) * DEG_TO_RAD, (holdRotation.z ?? 0) * DEG_TO_RAD);
    socket.scale.setScalar(1); presentationAnchor = null;
    equippedRecord = record;
    object.visible = true;
    if (debug && !diagnosticsLogged) {
      diagnosticsLogged = true;
      console.info('[AsterionSphere]', { clipNames: animations.map((clip) => clip.name), idleClipCount: idleClips.length,
        runtimeNodes: Object.fromEntries(REQUIRED_NODES.map((name) => [name, Boolean(requiredNodes[name])])),
        targetFrame: {
          innerRing2: innerRing2Pivot ? { status: 'found', parent: innerRing2Pivot.parent?.name ?? null } : { status: 'missing', parent: null },
          innerRing3: innerRing3Pivot ? { status: 'found', parent: innerRing3Pivot.parent?.name ?? null } : { status: 'missing', parent: null },
          targetAxis: requiredNodes.PIV_TARGET_AXIS ? { status: 'found', parent: requiredNodes.PIV_TARGET_AXIS.parent?.name ?? null } : { status: 'missing', parent: null },
          targetAxisMesh: requiredNodes.srodek ? { status: 'found', parent: requiredNodes.srodek.parent?.name ?? null } : { status: 'missing', parent: null }
        },
        animationTrackConflicts: conflictingClips.map((clip) => clip.name),
        visibleBounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() }, computedScale, targetDiameter,
        equippedHandedness: record.handedness });
    }
    return true;
  }

  function presentAt(anchor, scale = 1, localPosition = null) {
    if (!enabled || disposed || !anchor) return false;
    socket.removeFromParent();
    anchor.add(socket);
    socket.position.copy(localPosition ?? new THREE.Vector3()); socket.quaternion.identity(); socket.scale.setScalar(Math.max(0, scale));
    presentationAnchor = anchor; equippedRecord = null; object.visible = true;
    return true;
  }
  function setPresentationScale(scale) {
    if (!presentationAnchor || equippedRecord) return false;
    socket.scale.setScalar(Math.max(0, scale)); return true;
  }
  function clearPresentation() {
    if (!presentationAnchor) return;
    restorePresentationMaterials(); object.visible = false; socket.removeFromParent(); socket.position.set(0, 0, 0);
    socket.quaternion.identity(); socket.scale.setScalar(1); presentationAnchor = null;
  }

  function unequipFromHand() {
    if (!equippedRecord) return false;
    object.visible = false; socket.removeFromParent(); socket.scale.setScalar(1); equippedRecord = null;
    return true;
  }
  const unequip = unequipFromHand;
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
  function update(delta) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const blendAlpha = 1 - Math.exp(-targetRingBlendResponse * safeDelta);
    targetRingWeight += (targetRingTargetWeight - targetRingWeight) * blendAlpha;
    if (innerRing1Action) innerRing1Action.setEffectiveWeight(0);
    targetRingActions.forEach((action) => action.setEffectiveWeight(targetRingWeight));
    mixer.update(safeDelta);
  }
  function setTargetRingsStabilized(stabilized) { targetRingTargetWeight = stabilized ? 0 : 1; }
  function reset() { actions.forEach((a) => { a.reset(); a.play(); }); mixer.setTime(0); targetRingWeight = 1; targetRingTargetWeight = 1; if (innerRing1Action) innerRing1Action.setEffectiveWeight(0); targetRingActions.forEach((a) => a.setEffectiveWeight(1)); unequipFromHand(); }
  function dispose() { if (disposed) return; actions.forEach((a) => a.stop()); mixer.stopAllAction(); unequipFromHand(); clearPresentation(); disposed = true; }
  function isEquipped() { return Boolean(equippedRecord && object.visible && socket.parent); }
  return { object, socket, equipTo, unequip, unequipFromHand, presentAt, setPresentationScale, setMaterializationProgress, restorePresentationMaterials, clearPresentation, update, reset, dispose, syncGimbals, setTargetRingsStabilized, isEquipped, isPresented: () => Boolean(presentationAnchor && object.visible), getEquippedRecord: () => equippedRecord,
    getIdleActionByClipName: (clipName) => actionByClipName.get(clipName) ?? null, getTargetRingWeight: () => targetRingWeight, getIdleClipCount: () => idleClips.length, getStartedIdleClipCount: () => playableIdleClips.length, getRequiredNodes: () => ({ ...requiredNodes }), getDiagnostics: () => {
      object.updateWorldMatrix(true, true); const worldBounds = new THREE.Box3().setFromObject(object);
      const worldSize = worldBounds.getSize(new THREE.Vector3()), worldCenter = worldBounds.getCenter(new THREE.Vector3());
      return { computedScale, targetDiameter, sourceDiameter, missingNodes: [...missingNodes], conflictingClipNames: conflictingClips.map((clip) => clip.name),
        isPresented: Boolean(presentationAnchor && object.visible), objectVisible: object.visible, socketParentName: socket.parent?.name ?? null,
        presentationAnchorName: presentationAnchor?.name ?? null, socketLocalPosition: socket.position.toArray(), socketLocalScale: socket.scale.toArray(),
        sphereWorldCenter: worldCenter.toArray(), sphereWorldSize: worldSize.toArray(), sphereWorldDiameter: Math.max(...worldSize.toArray()) };
    } };
}
