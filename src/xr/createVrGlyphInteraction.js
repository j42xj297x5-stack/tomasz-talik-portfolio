import * as THREE from '../vendor/three.js';

const LOCAL_RAY_DIRECTION = new THREE.Vector3(0, 0, -1);

export function createVrGlyphInteraction({ controllers, nodes, onEntryGlyphActivated = () => {} }) {
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const objectToGlyph = new Map();
  let entryReady = null;
  let activatedEntryGlyph = null;
  let disposed = false;
  const targets = nodes.map((glyphRoot) => {
    const raycastObjects = [];
    glyphRoot.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (object.isMesh && object.visible && materials.some((material) => material?.visible !== false)) raycastObjects.push(object);
    });
    let fallbackCollider = null;
    if (!raycastObjects.length) {
      fallbackCollider = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      fallbackCollider.name = 'VrGlyphFallbackCollider';
      glyphRoot.add(fallbackCollider);
      raycastObjects.push(fallbackCollider);
    }
    raycastObjects.forEach((object) => objectToGlyph.set(object, glyphRoot));
    return { glyphRoot, raycastObjects, fallbackCollider };
  });
  const allRaycastObjects = targets.flatMap(({ raycastObjects }) => raycastObjects);
  const listeners = controllers.map((record) => {
    const listener = () => {
      if (disposed || activatedEntryGlyph || !entryReady || record.currentHit !== entryReady) return;
      activatedEntryGlyph = entryReady;
      onEntryGlyphActivated({ node: activatedEntryGlyph, controllerIndex: record.index, handedness: record.handedness });
    };
    record.controller.addEventListener('selectstart', listener);
    return listener;
  });
  function update() {
    if (disposed) return;
    for (const record of controllers) {
      record.currentHit = null;
      if (!record.isConnected || record.currentRayLength <= 0) continue;
      record.controller.updateWorldMatrix(true, false);
      record.controller.getWorldPosition(rayOrigin);
      record.controller.getWorldQuaternion(worldQuaternion);
      rayDirection.copy(LOCAL_RAY_DIRECTION).applyQuaternion(worldQuaternion).normalize();
      raycaster.set(rayOrigin, rayDirection);
      raycaster.near = 0;
      raycaster.far = record.currentRayLength;
      const hit = raycaster.intersectObjects(allRaycastObjects, true)[0];
      let object = hit?.object;
      while (object && !objectToGlyph.has(object)) object = object.parent;
      record.currentHit = object ? objectToGlyph.get(object) ?? null : null;
    }
  }
  function setEntryReady(node) { if (!disposed && !activatedEntryGlyph) entryReady = node; }
  function reset() {
    if (disposed) return;
    controllers.forEach((record) => { record.currentHit = null; });
    entryReady = null;
    activatedEntryGlyph = null;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    controllers.forEach((record, index) => { record.controller.removeEventListener('selectstart', listeners[index]); record.currentHit = null; });
    targets.forEach(({ fallbackCollider }) => {
      if (!fallbackCollider) return;
      fallbackCollider.removeFromParent(); fallbackCollider.geometry.dispose(); fallbackCollider.material.dispose();
    });
    objectToGlyph.clear(); targets.length = 0; allRaycastObjects.length = 0;
  }
  return {
    targets, get entryReady() { return entryReady; }, get activatedEntryGlyph() { return activatedEntryGlyph; },
    get hoveredGlyphs() { return new Set(controllers.map(({ currentHit }) => currentHit).filter(Boolean)); },
    update, setEntryReady, reset, dispose
  };
}
