import * as THREE from '../vendor/three.js';

export function hashVrPageId(id) {
  let hash = 2166136261;
  for (const character of String(id)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const unit = (hash, shift = 0) => ((hash >>> shift) & 0xff) / 255;

export function getDeterministicCrystalTransform(pageId, settings) {
  const hash = hashVrPageId(pageId);
  return {
    scale: settings.scaleMin + unit(hash) * (settings.scaleMax - settings.scaleMin),
    x: (unit(hash, 8) - 0.5) * settings.spawnWidth,
    z: (unit(hash, 16) - 0.5) * settings.spawnDepth,
    yaw: (unit(hash, 4) - 0.5) * 0.34,
    tiltX: (unit(hash, 12) - 0.5) * 0.08,
    tiltZ: (unit(hash, 20) - 0.5) * 0.08
  };
}

export function createVrCrystalCollection({ scene, assetManager, controllers, portalDisplay, settings, onConsume }) {
  const instances = [];
  const listeners = [];
  const heldByController = new Map();
  const scratch = new THREE.Vector3();
  let disposed = false;

  function nearestAvailable(controllerRecord) {
    controllerRecord.grip.updateWorldMatrix(true, false);
    controllerRecord.grip.getWorldPosition(scratch);
    let nearest = null;
    let nearestDistance = settings.grabRadius;
    for (const instance of instances) {
      if (instance.state !== 'available') continue;
      const distance = instance.object.getWorldPosition(new THREE.Vector3()).distanceTo(scratch);
      if (distance <= nearestDistance) { nearest = instance; nearestDistance = distance; }
    }
    return nearest;
  }

  function grab(controllerRecord) {
    if (disposed || heldByController.has(controllerRecord)) return null;
    const instance = nearestAvailable(controllerRecord);
    if (!instance) return null;
    instance.state = 'held';
    instance.heldBy = controllerRecord;
    heldByController.set(controllerRecord, instance);
    controllerRecord.holdSocket.add(instance.object);
    instance.object.position.set(settings.holdOffset.x, settings.holdOffset.y, settings.holdOffset.z);
    instance.object.rotation.set(0, 0, 0);
    return instance;
  }

  function release(controllerRecord) {
    const instance = heldByController.get(controllerRecord);
    if (!instance) return null;
    instance.object.updateWorldMatrix(true, false);
    const socketPosition = portalDisplay.getSocketWorldPosition(scratch);
    const inSocket = portalDisplay.object.visible
      && instance.object.getWorldPosition(new THREE.Vector3()).distanceTo(socketPosition) <= portalDisplay.insertRadius;
    heldByController.delete(controllerRecord);
    instance.heldBy = null;
    if (inSocket) {
      instance.state = 'consumed';
      instance.object.visible = false;
      instance.object.removeFromParent();
      onConsume?.(instance.page);
    } else {
      scene.attach(instance.object);
      instance.state = 'available';
    }
    return instance;
  }

  controllers.forEach((controllerRecord) => {
    const squeezeStart = () => grab(controllerRecord);
    const squeezeEnd = () => release(controllerRecord);
    controllerRecord.controller.addEventListener('squeezestart', squeezeStart);
    controllerRecord.controller.addEventListener('squeezeend', squeezeEnd);
    listeners.push({ controllerRecord, squeezeStart, squeezeEnd });
  });

  function spawn(pages, { playerPosition, portalPosition }) {
    reset();
    if (disposed || !settings.enabled) return [];
    const forward = new THREE.Vector3().subVectors(portalPosition, playerPosition);
    forward.y = 0;
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const center = new THREE.Vector3().lerpVectors(playerPosition, portalPosition, 0.52);
    center.y = 0;
    const occupied = [];
    pages.forEach((page, index) => {
      const source = assetManager.cloneGltfScene(page.crystalAssetId);
      if (!source) return;
      const object = new THREE.Group();
      object.name = `VrCrystal:${page.id}`;
      const model = source.clone(true);
      object.add(model);
      const transform = getDeterministicCrystalTransform(page.id, settings);
      model.scale.setScalar(transform.scale);
      model.rotation.set(transform.tiltX, transform.yaw, transform.tiltZ);
      model.updateMatrixWorld(true);
      let bounds = new THREE.Box3().setFromObject(model);
      const modelCenter = bounds.getCenter(new THREE.Vector3());
      model.position.x -= modelCenter.x;
      model.position.z -= modelCenter.z;
      model.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(model);
      model.position.y -= bounds.min.y;
      let x = transform.x;
      let z = transform.z;
      for (let attempt = 0; occupied.some((point) => Math.hypot(point.x - x, point.z - z) < settings.minimumSpacing) && attempt < 8; attempt += 1) {
        const angle = (hashVrPageId(page.id) * 0.00001) + attempt * 2.399;
        x = Math.max(-settings.spawnWidth / 2, Math.min(settings.spawnWidth / 2, transform.x + Math.cos(angle) * settings.minimumSpacing));
        z = Math.max(-settings.spawnDepth / 2, Math.min(settings.spawnDepth / 2, transform.z + Math.sin(angle) * settings.minimumSpacing));
      }
      occupied.push({ x, z });
      object.position.copy(center).addScaledVector(right, x).addScaledVector(forward, z + (index % 2) * 0.035);
      object.position.y = 0;
      scene.add(object);
      instances.push({ page, object, model, state: 'available', heldBy: null, initialTransform: object.matrix.clone() });
    });
    return [...instances];
  }

  function reset() {
    for (const [controllerRecord, instance] of heldByController) {
      scene.attach(instance.object);
      instance.state = 'available';
      instance.heldBy = null;
      heldByController.delete(controllerRecord);
    }
    heldByController.clear();
    for (const instance of instances) {
      instance.state = 'available';
      instance.heldBy = null;
      instance.object.visible = false;
      instance.object.removeFromParent();
    }
    instances.length = 0;
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    for (const { controllerRecord, squeezeStart, squeezeEnd } of listeners) {
      controllerRecord.controller.removeEventListener('squeezestart', squeezeStart);
      controllerRecord.controller.removeEventListener('squeezeend', squeezeEnd);
    }
    listeners.length = 0;
  }

  return { instances, heldByController, spawn, grab, release, reset, dispose };
}
