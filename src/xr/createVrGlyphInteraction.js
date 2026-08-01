import * as THREE from '../vendor/three.js';
import { createVrTargetHalo } from './createVrTargetHalo.js';

const LOCAL_RAY_DIRECTION = new THREE.Vector3(0, 0, -1);

export function createVrGlyphInteraction({ controllers, nodes, settings = {}, haloSettings = {}, isGlyphActive = () => true, onGlyphHoldComplete = () => {} }) {
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const objectToGlyph = new Map();
  const holds = new Map();
  const holdDuration = settings.holdDurationSeconds ?? 0.5;
  const holdLostGrace = settings.holdLostGraceSeconds ?? 0.15;
  let disposed = false;
  const targets = nodes.map((glyphRoot) => {
    const raycastObjects = [];
    glyphRoot.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (object.isMesh && object.visible && materials.some((material) => material?.visible !== false)) raycastObjects.push(object);
    });
    let fallbackCollider = null;
    if (!raycastObjects.length) {
      fallbackCollider = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      fallbackCollider.name = 'VrGlyphFallbackCollider'; glyphRoot.add(fallbackCollider); raycastObjects.push(fallbackCollider);
    }
    raycastObjects.forEach((object) => objectToGlyph.set(object, glyphRoot));
    return { glyphRoot, raycastObjects, fallbackCollider, halo: createVrTargetHalo({ root: glyphRoot, settings: haloSettings }) };
  });
  const allRaycastObjects = targets.flatMap(({ raycastObjects }) => raycastObjects);
  const listeners = controllers.map((record) => {
    const start = () => {
      const node = record.currentHit;
      if (!disposed && node && isGlyphActive(node)) holds.set(record, {
        node, elapsed: 0, lostElapsed: 0, completed: false
      });
    };
    const end = () => holds.delete(record);
    record.controller.addEventListener('selectstart', start);
    record.controller.addEventListener('selectend', end);
    record.controller.addEventListener('disconnected', end);
    return { start, end };
  });
  function update(delta = 0) {
    if (disposed) return;
    for (const record of controllers) {
      record.currentHit = null;
      if (record.isConnected && record.currentRayLength > 0) {
        record.controller.updateWorldMatrix(true, false); record.controller.getWorldPosition(rayOrigin);
        record.controller.getWorldQuaternion(worldQuaternion);
        rayDirection.copy(LOCAL_RAY_DIRECTION).applyQuaternion(worldQuaternion).normalize();
        raycaster.set(rayOrigin, rayDirection); raycaster.near = 0; raycaster.far = record.currentRayLength;
        const hit = raycaster.intersectObjects(allRaycastObjects, true)[0];
        let object = hit?.object; while (object && !objectToGlyph.has(object)) object = object.parent;
        const node = object ? objectToGlyph.get(object) ?? null : null;
        record.currentHit = node && isGlyphActive(node) ? node : null;
        if (record.currentHit && hit.object.name !== 'VrGlyphFallbackCollider') record.reportRayHit?.(hit.distance);
      }
      const hold = holds.get(record);
      if (!hold) continue;
      if (!record.isConnected || !isGlyphActive(hold.node)) { holds.delete(record); continue; }
      if (record.currentHit !== hold.node) {
        if (record.currentHit) { holds.delete(record); continue; }
        hold.lostElapsed += Math.max(0, delta);
        if (hold.lostElapsed > holdLostGrace) holds.delete(record);
        continue;
      }
      hold.lostElapsed = 0;
      if (!hold.completed) {
        hold.elapsed += Math.max(0, delta);
        if (hold.elapsed >= holdDuration) {
          hold.completed = true;
          onGlyphHoldComplete({ node: hold.node, controllerIndex: record.index, handedness: record.handedness });
        }
      }
    }
    const hovered = new Set(controllers.map(({ currentHit }) => currentHit).filter(Boolean));
    targets.forEach(({ glyphRoot, halo }) => { halo.setVisible(hovered.has(glyphRoot)); halo.update(delta); });
  }
  function reset() { holds.clear(); controllers.forEach((record) => { record.currentHit = null; }); targets.forEach(({ halo }) => halo.setVisible(false)); }
  function dispose() {
    if (disposed) return; disposed = true; reset();
    controllers.forEach((record, index) => {
      record.controller.removeEventListener('selectstart', listeners[index].start);
      record.controller.removeEventListener('selectend', listeners[index].end);
      record.controller.removeEventListener('disconnected', listeners[index].end);
    });
    targets.forEach(({ fallbackCollider, halo }) => { halo.dispose(); if (fallbackCollider) { fallbackCollider.removeFromParent(); fallbackCollider.geometry.dispose(); fallbackCollider.material.dispose(); } });
    objectToGlyph.clear(); targets.length = 0; allRaycastObjects.length = 0;
  }
  return { targets, holds, get hoveredGlyphs() { return new Set(controllers.map(({ currentHit }) => currentHit).filter(Boolean)); }, update, reset, dispose };
}
