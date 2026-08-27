import * as THREE from '../../vendor/three.js';

export const VR_RUNE_BRIDGE_BRANCH_IDS = Object.freeze(['earth', 'fire', 'wood', 'metal', 'water']);
export const VR_RUNE_BRIDGE_STATES = Object.freeze({
  HIDDEN: 'HIDDEN',
  DOCKED: 'DOCKED',
  EXTENDING: 'EXTENDING',
  EXTENDED: 'EXTENDED',
  BOUND: 'BOUND'
});

const REQUIRED_NODE_NAMES = Object.freeze([
  'BRIDGE_ROOT',
  'BRIDGE_PLATFORM_SOCKET',
  'BRIDGE_MOUNT_TOP',
  'BRIDGE_MOUNT_CENTER',
  'BRIDGE_MOUNT_BOTTOM',
  'BRIDGE_STONE_ANCHOR',
  'BRIDGE_STONE_CAPTURE',
  'nosnik'
]);
const smoothstep = (value) => value * value * (3 - 2 * value);

function requireNodes(root) {
  const nodes = Object.fromEntries(REQUIRED_NODE_NAMES.map((name) => [name, root.getObjectByName(name)]));
  const missing = REQUIRED_NODE_NAMES.filter((name) => !nodes[name]);
  if (missing.length) {
    throw new Error(`[VrRuneBridgeActor] Invalid bridge.glb; missing required nodes: ${missing.join(', ')}`);
  }
  return nodes;
}

function positionRelativeTo(object, relativeTo, target = new THREE.Vector3()) {
  object.getWorldPosition(target);
  return relativeTo.worldToLocal(target);
}

function alignBridge(alignmentRoot, instance, nodes) {
  instance.updateMatrixWorld(true);
  const socket = positionRelativeTo(nodes.BRIDGE_PLATFORM_SOCKET, instance);
  const forward = positionRelativeTo(nodes.BRIDGE_STONE_ANCHOR, instance)
    .sub(socket)
    .normalize();
  const across = positionRelativeTo(nodes.BRIDGE_MOUNT_TOP, instance)
    .sub(positionRelativeTo(nodes.BRIDGE_MOUNT_BOTTOM, instance, new THREE.Vector3()))
    .normalize();
  const normal = new THREE.Vector3().crossVectors(forward, across).normalize();
  across.crossVectors(normal, forward).normalize();
  if (![forward, across, normal].every((axis) => Number.isFinite(axis.lengthSq()) && axis.lengthSq() > 0.999)) {
    throw new Error('[VrRuneBridgeActor] Authored bridge basis is degenerate.');
  }

  // Canonical installation-frame basis is +X across, +Y normal and +Z radial outward.
  const authoredBasis = new THREE.Matrix4().makeBasis(across, normal, forward);
  alignmentRoot.quaternion.setFromRotationMatrix(authoredBasis).invert();
  alignmentRoot.position.copy(socket).applyQuaternion(alignmentRoot.quaternion).multiplyScalar(-1);
}

function copyTransformRelativeTo(source, relativeTo, target) {
  relativeTo.updateWorldMatrix(true, false);
  source.updateWorldMatrix(true, false);
  const relativeMatrix = new THREE.Matrix4().copy(relativeTo.matrixWorld).invert().multiply(source.matrixWorld);
  relativeMatrix.decompose(target.position, target.quaternion, target.scale);
}

export function createVrRuneBridgeActor({ assetManager, getSectorMount, extensionDurationSeconds,
  hoverHeightMeters, presentationScale, radialPresentationOffsetMeters }) {
  if (!assetManager?.getGltf) throw new Error('[VrRuneBridgeActor] A preloaded AssetManager is required.');
  if (typeof getSectorMount !== 'function') throw new Error('[VrRuneBridgeActor] Sector mount access is required.');
  if (!Number.isFinite(extensionDurationSeconds) || extensionDurationSeconds <= 0) {
    throw new TypeError('[VrRuneBridgeActor] extensionDurationSeconds must be finite and positive.');
  }
  if (!Number.isFinite(hoverHeightMeters) || hoverHeightMeters <= 0) {
    throw new TypeError('[VrRuneBridgeActor] hoverHeightMeters must be finite and positive.');
  }
  if (!Number.isFinite(presentationScale) || presentationScale <= 0) {
    throw new TypeError('[VrRuneBridgeActor] presentationScale must be finite and positive.');
  }
  if (!Number.isFinite(radialPresentationOffsetMeters) || radialPresentationOffsetMeters < 0) {
    throw new TypeError('[VrRuneBridgeActor] radialPresentationOffsetMeters must be finite and non-negative.');
  }
  const templateScene = assetManager.getGltf('vr-rune-bridge-model')?.scene;
  if (!templateScene) throw new Error('[VrRuneBridgeActor] Preloaded bridge.glb is required.');
  requireNodes(templateScene);

  const instances = new Map();
  let disposed = false;
  try {
    VR_RUNE_BRIDGE_BRANCH_IDS.forEach((branchId) => {
      const mount = getSectorMount(branchId);
      if (!mount?.add) throw new Error(`[VrRuneBridgeActor] Missing sector mount for "${branchId}".`);
      const suffix = branchId.toUpperCase();
      const bridgeRoot = templateScene.getObjectByName('BRIDGE_ROOT').clone(true);
      const nodes = requireNodes(bridgeRoot);
      const instance = new THREE.Group();
      instance.name = `VrRuneBridgeInstance_${suffix}`;
      instance.userData = { ...instance.userData, branchId };
      const stoneAnchor = new THREE.Group();
      stoneAnchor.name = `VrRuneStoneInstallationAnchor_${suffix}`;
      const hoverAnchor = new THREE.Group();
      hoverAnchor.name = `VrRuneStoneHoverAnchor_${suffix}`;
      const motionRoot = new THREE.Group();
      motionRoot.name = `VrRuneBridgeMotionRoot_${suffix}`;
      const presentationRoot = new THREE.Group();
      presentationRoot.name = `VrRuneBridgePresentationRoot_${suffix}`;
      const alignmentRoot = new THREE.Group();
      alignmentRoot.name = `VrRuneBridgeAlignmentRoot_${suffix}`;
      instance.add(stoneAnchor, hoverAnchor, motionRoot);
      motionRoot.add(presentationRoot);
      presentationRoot.add(alignmentRoot);
      alignmentRoot.add(bridgeRoot);
      mount.add(instance);
      alignBridge(alignmentRoot, instance, nodes);
      instance.updateMatrixWorld(true);
      copyTransformRelativeTo(nodes.BRIDGE_STONE_ANCHOR, instance, stoneAnchor);
      hoverAnchor.position.copy(stoneAnchor.position).add(new THREE.Vector3(0, hoverHeightMeters, 0));
      hoverAnchor.quaternion.copy(stoneAnchor.quaternion);
      hoverAnchor.scale.copy(stoneAnchor.scale);
      const socketPosition = positionRelativeTo(nodes.BRIDGE_PLATFORM_SOCKET, instance);
      const anchorPosition = positionRelativeTo(nodes.BRIDGE_STONE_ANCHOR, instance, new THREE.Vector3());
      const extensionDistance = anchorPosition.z - socketPosition.z;
      if (!Number.isFinite(extensionDistance) || extensionDistance <= 0) {
        throw new Error('[VrRuneBridgeActor] Authored socket-to-anchor radial extension must be finite and positive.');
      }
      presentationRoot.position.set(0, 0, radialPresentationOffsetMeters);
      presentationRoot.scale.setScalar(presentationScale);
      const revealMaterials = [];
      bridgeRoot.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const authoredMaterials = Array.isArray(object.material) ? object.material : [object.material];
        const clonedMaterials = authoredMaterials.map((material) => {
          const clone = material.clone();
          revealMaterials.push({ material: clone, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
          return clone;
        });
        object.material = Array.isArray(object.material) ? clonedMaterials : clonedMaterials[0];
      });

      instance.visible = false;
      instances.set(branchId, {
        instance,
        bridgeRoot,
        motionRoot,
        stoneAnchor,
        hoverAnchor,
        presentationRoot,
        revealMaterials,
        extensionDistance,
        extensionElapsed: 0,
        state: VR_RUNE_BRIDGE_STATES.HIDDEN
      });
    });
  } catch (error) {
    instances.forEach(({ instance }) => instance.removeFromParent());
    throw error;
  }

  const getInstance = (branchId) => instances.get(String(branchId).toLowerCase()) ?? null;
  function setMotionBaseline(entry, z = 0) {
    entry.extensionElapsed = 0;
    entry.motionRoot.position.set(0, 0, z);
  }
  function transition(branchId, command, allowedStates, nextState) {
    const entry = getInstance(branchId);
    if (!entry || disposed) return false;
    if (!allowedStates.includes(entry.state)) {
      throw new Error(`[VrRuneBridgeActor] Cannot ${command} for "${branchId}" from ${entry.state}.`);
    }
    entry.state = nextState;
    entry.instance.visible = nextState !== VR_RUNE_BRIDGE_STATES.HIDDEN;
    return true;
  }
  function setInstallationReady(branchId, ready) {
    const entry = getInstance(branchId);
    if (!entry || disposed) return false;
    const nextState = ready ? VR_RUNE_BRIDGE_STATES.DOCKED : VR_RUNE_BRIDGE_STATES.HIDDEN;
    const changed = transition(
      branchId,
      `set installation readiness to ${Boolean(ready)}`,
      [VR_RUNE_BRIDGE_STATES.HIDDEN, VR_RUNE_BRIDGE_STATES.DOCKED],
      nextState
    );
    if (changed) setMotionBaseline(entry);
    if (changed && !ready) setRevealPresentationProgress(branchId, 1);
    return changed;
  }
  function setRevealPresentationProgress(branchId, progress) {
    const entry = getInstance(branchId);
    if (!entry || disposed || !Number.isFinite(progress)) return false;
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    entry.presentationRoot.scale.setScalar(presentationScale * (0.94 + value * 0.06));
    entry.revealMaterials.forEach((baseline) => {
      baseline.material.opacity = baseline.opacity * value;
      baseline.material.transparent = value < 1 ? true : baseline.transparent;
      baseline.material.depthWrite = value < 1 ? false : baseline.depthWrite;
      baseline.material.needsUpdate = true;
    });
    return true;
  }
  function beginExtension(branchId) {
    const entry = getInstance(branchId);
    const changed = transition(
      branchId,
      'begin extension',
      [VR_RUNE_BRIDGE_STATES.DOCKED],
      VR_RUNE_BRIDGE_STATES.EXTENDING
    );
    if (changed) setMotionBaseline(entry);
    return changed;
  }
  function cancelExtension(branchId) {
    const entry = getInstance(branchId);
    const changed = transition(
      branchId,
      'cancel extension',
      [VR_RUNE_BRIDGE_STATES.DOCKED, VR_RUNE_BRIDGE_STATES.EXTENDING, VR_RUNE_BRIDGE_STATES.EXTENDED],
      VR_RUNE_BRIDGE_STATES.DOCKED
    );
    if (changed) setMotionBaseline(entry);
    return changed;
  }
  function setInstalled(branchId) {
    return transition(
      branchId,
      'set installed',
      [VR_RUNE_BRIDGE_STATES.EXTENDED],
      VR_RUNE_BRIDGE_STATES.BOUND
    );
  }
  function restoreInstalled(branchId) {
    const entry = getInstance(branchId);
    if (!entry || disposed) return false;
    entry.instance.visible = true;
    entry.extensionElapsed = extensionDurationSeconds;
    entry.motionRoot.position.set(0, 0, entry.extensionDistance);
    entry.state = VR_RUNE_BRIDGE_STATES.BOUND;
    return true;
  }
  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    instances.forEach((entry) => {
      if (entry.state !== VR_RUNE_BRIDGE_STATES.EXTENDING) return;
      entry.extensionElapsed = Math.min(extensionDurationSeconds, entry.extensionElapsed + delta);
      const progress = entry.extensionElapsed / extensionDurationSeconds;
      entry.motionRoot.position.z = entry.extensionDistance * smoothstep(progress);
      if (entry.extensionElapsed < extensionDurationSeconds) return;
      entry.motionRoot.position.z = entry.extensionDistance;
      entry.state = VR_RUNE_BRIDGE_STATES.EXTENDED;
    });
  }
  function reset() {
    if (disposed) return;
    instances.forEach((entry) => {
      entry.state = VR_RUNE_BRIDGE_STATES.HIDDEN;
      entry.instance.visible = false;
      setMotionBaseline(entry);
      setRevealPresentationProgress(entry.instance.userData.branchId, 1);
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    instances.forEach(({ instance, revealMaterials }) => {
      instance.removeFromParent();
      revealMaterials.forEach(({ material }) => material.dispose());
    });
    instances.clear();
  }

  return {
    getState: (branchId) => getInstance(branchId)?.state ?? null,
    setInstallationReady,
    beginExtension,
    cancelExtension,
    setInstalled,
    restoreInstalled,
    setRevealPresentationProgress,
    getStoneAnchor: (branchId) => getInstance(branchId)?.stoneAnchor ?? null,
    getStoneHoverAnchor: (branchId) => getInstance(branchId)?.hoverAnchor ?? null,
    getBridgeRoot: (branchId) => getInstance(branchId)?.bridgeRoot ?? null,
    update,
    reset,
    dispose
  };
}
