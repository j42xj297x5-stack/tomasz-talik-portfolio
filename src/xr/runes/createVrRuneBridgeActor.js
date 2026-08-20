import * as THREE from '../../vendor/three.js';

export const VR_RUNE_BRIDGE_BRANCH_IDS = Object.freeze(['earth', 'fire', 'wood', 'metal', 'water']);

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

function alignInstance(instance, nodes) {
  instance.updateMatrixWorld(true);
  const socket = positionRelativeTo(nodes.BRIDGE_PLATFORM_SOCKET, instance);
  const forward = positionRelativeTo(nodes.BRIDGE_STONE_ANCHOR, instance)
    .sub(socket)
    .normalize();
  const across = positionRelativeTo(nodes.BRIDGE_MOUNT_TOP, instance)
    .sub(positionRelativeTo(nodes.BRIDGE_MOUNT_BOTTOM, instance, new THREE.Vector3()))
    .normalize();
  const normal = new THREE.Vector3().crossVectors(across, forward).normalize();
  across.crossVectors(forward, normal).normalize();
  if (![forward, across, normal].every((axis) => Number.isFinite(axis.lengthSq()) && axis.lengthSq() > 0.999)) {
    throw new Error('[VrRuneBridgeActor] Authored bridge basis is degenerate.');
  }

  const authoredBasis = new THREE.Matrix4().makeBasis(forward, normal, across);
  instance.quaternion.setFromRotationMatrix(authoredBasis).invert();
  instance.position.copy(socket).applyQuaternion(instance.quaternion).multiplyScalar(-1);
}

export function createVrRuneBridgeActor({ assetManager, getSectorMount }) {
  if (!assetManager?.getGltf) throw new Error('[VrRuneBridgeActor] A preloaded AssetManager is required.');
  if (typeof getSectorMount !== 'function') throw new Error('[VrRuneBridgeActor] Sector mount access is required.');
  const templateScene = assetManager.getGltf('vr-rune-bridge-model')?.scene;
  if (!templateScene) throw new Error('[VrRuneBridgeActor] Preloaded bridge.glb is required.');
  requireNodes(templateScene);

  const instances = new Map();
  let disposed = false;
  try {
    VR_RUNE_BRIDGE_BRANCH_IDS.forEach((branchId) => {
      const mount = getSectorMount(branchId);
      if (!mount?.add) throw new Error(`[VrRuneBridgeActor] Missing sector mount for "${branchId}".`);
      const bridgeRoot = templateScene.getObjectByName('BRIDGE_ROOT').clone(true);
      const nodes = requireNodes(bridgeRoot);
      const instance = new THREE.Group();
      instance.name = `VrRuneBridgeInstance_${branchId.toUpperCase()}`;
      instance.userData = { ...instance.userData, branchId };
      instance.add(bridgeRoot);
      mount.add(instance);
      alignInstance(instance, nodes);
      instance.visible = false;
      instances.set(branchId, { instance, bridgeRoot, nodes, captureRadius: null });
      const captureRadius = Number(nodes.BRIDGE_STONE_CAPTURE.userData?.capture_radius_m);
      if (!Number.isFinite(captureRadius) || captureRadius <= 0) {
        throw new Error('[VrRuneBridgeActor] BRIDGE_STONE_CAPTURE requires positive authored capture_radius_m metadata.');
      }
      instances.get(branchId).captureRadius = captureRadius;
    });
  } catch (error) {
    instances.forEach(({ instance }) => instance.removeFromParent());
    throw error;
  }

  const getInstance = (branchId) => instances.get(String(branchId).toLowerCase()) ?? null;
  function setRevealed(branchId, revealed) {
    const entry = getInstance(branchId);
    if (!entry || disposed) return false;
    entry.instance.visible = Boolean(revealed);
    return true;
  }
  function reset() {
    if (disposed) return;
    instances.forEach(({ instance }) => { instance.visible = false; });
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    instances.forEach(({ instance }) => instance.removeFromParent());
    instances.clear();
  }

  return {
    setRevealed,
    isRevealed: (branchId) => getInstance(branchId)?.instance.visible === true,
    getStoneAnchor: (branchId) => getInstance(branchId)?.nodes.BRIDGE_STONE_ANCHOR ?? null,
    getStoneCapture: (branchId) => {
      const entry = getInstance(branchId);
      return entry ? { node: entry.nodes.BRIDGE_STONE_CAPTURE, radius: entry.captureRadius } : null;
    },
    getBridgeRoot: (branchId) => getInstance(branchId)?.bridgeRoot ?? null,
    reset,
    dispose
  };
}
