import * as THREE from '../../vendor/three.js';

function cloneMaterials(root, ownedMaterials) {
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => {
        const clone = material.clone();
        ownedMaterials.add(clone);
        return clone;
      });
      return;
    }
    object.material = object.material.clone();
    ownedMaterials.add(object.material);
  });
}

function requireObject(root, objectName, descriptor) {
  const object = root.getObjectByName(objectName);
  if (!object) {
    throw new Error(`[VrProgressFloorSectorActor] Missing required object "${objectName}" for sector "${descriptor.glyphId}" (source: ${descriptor.sourceType}).`);
  }
  return object;
}

function getBoundsRelativeTo(root, relativeTo) {
  const bounds = new THREE.Box3().makeEmpty();
  const inverseRelativeMatrix = new THREE.Matrix4().copy(relativeTo.matrixWorld).invert();
  const relativeMatrix = new THREE.Matrix4();
  const corner = new THREE.Vector3();
  root.traverse((object) => {
    if (!object.geometry) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const objectBounds = object.geometry.boundingBox;
    if (!objectBounds || objectBounds.isEmpty()) return;
    relativeMatrix.multiplyMatrices(inverseRelativeMatrix, object.matrixWorld);
    for (const x of [objectBounds.min.x, objectBounds.max.x]) {
      for (const y of [objectBounds.min.y, objectBounds.max.y]) {
        for (const z of [objectBounds.min.z, objectBounds.max.z]) {
          bounds.expandByPoint(corner.set(x, y, z).applyMatrix4(relativeMatrix));
        }
      }
    }
  });
  return bounds;
}

function getPanelMaterials(panel, fallbackColor) {
  const materials = new Set();
  panel.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    meshMaterials.forEach((material) => {
      if (!material.emissive?.isColor) material.emissive = new THREE.Color(fallbackColor);
      else if (material.emissive.getHex() === 0) material.emissive.setHex(fallbackColor);
      material.emissiveIntensity = 0;
      material.needsUpdate = true;
      materials.add(material);
    });
  });
  return [...materials];
}

export function createVrProgressFloorSectorActor({ descriptor, sourceModel, contract, emission }) {
  if (!descriptor || !sourceModel?.clone || !contract) {
    throw new Error('[VrProgressFloorSectorActor] Descriptor, source model and source contract are required.');
  }

  const object = new THREE.Group();
  object.name = `VrProgressFloorSectorActorRoot:${descriptor.glyphId}`;
  object.position.set(0, 0, 0);
  object.rotation.y = descriptor.rotationIndex * (Math.PI * 2 / 5);
  object.userData = { ...object.userData, ...descriptor };

  const authoredVisual = sourceModel.clone(true);
  authoredVisual.name = `VrProgressFloorSector:${descriptor.glyphId}`;
  authoredVisual.position.set(0, 0, 0);
  authoredVisual.visible = false;
  object.add(authoredVisual);

  const ownedMaterials = new Set();
  const panelsByOrder = new Map();
  const presentationMaterials = new Map();
  const activeOrders = new Set();
  const pulseRemaining = new Map();
  let revealed = false;
  let disposed = false;

  try {
    cloneMaterials(authoredVisual, ownedMaterials);
    requireObject(authoredVisual, contract.referenceBaseName, descriptor).visible = false;
    const presentationBodies = contract.presentationBodyNames.map((name) => requireObject(authoredVisual, name, descriptor));
    presentationBodies.forEach((body) => body.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!presentationMaterials.has(material)) {
          presentationMaterials.set(material, {
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite
          });
        }
        material.opacity = 0;
        material.transparent = true;
        material.depthWrite = false;
        material.needsUpdate = true;
      });
    }));
    contract.panelNames.forEach((name, index) => {
      const panel = requireObject(authoredVisual, name, descriptor);
      panelsByOrder.set(index + 1, {
        object: panel,
        materials: getPanelMaterials(panel, emission.fallbackColor)
      });
    });

    object.updateMatrixWorld(true);
    const presentationBounds = new THREE.Box3().makeEmpty();
    presentationBodies.forEach((body) => presentationBounds.union(getBoundsRelativeTo(body, object)));
    if (presentationBounds.isEmpty()) {
      throw new Error(`[VrProgressFloorSectorActor] Cannot derive presentation bounds for "${descriptor.glyphId}".`);
    }
    const runeInstallationFrame = new THREE.Object3D();
    runeInstallationFrame.name = `VrRuneInstallationFrame_${descriptor.branchId.toUpperCase()}`;
    runeInstallationFrame.position.set(
      0,
      (presentationBounds.min.y + presentationBounds.max.y) / 2,
      presentationBounds.max.z
    );
    runeInstallationFrame.userData = { ...runeInstallationFrame.userData, branchId: descriptor.branchId, radialAxis: '+Z' };
    object.add(runeInstallationFrame);

    function activatePanel(order) {
      if (disposed || activeOrders.has(order) || !panelsByOrder.has(order)) return false;
      if (!revealed) {
        revealed = true;
        authoredVisual.visible = true;
      }
      activeOrders.add(order);
      pulseRemaining.set(order, emission.pulseDuration);
      return true;
    }

    function update(delta = 0) {
      if (disposed) return;
      const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
      const blend = 1 - Math.exp(-emission.responseSpeed * safeDelta);
      if (revealed) presentationMaterials.forEach((authoredState, material) => {
        material.opacity += (authoredState.opacity - material.opacity) * blend;
        if (Math.abs(authoredState.opacity - material.opacity) <= 1e-4) {
          const transparentChanged = material.transparent !== authoredState.transparent;
          material.opacity = authoredState.opacity;
          material.transparent = authoredState.transparent;
          material.depthWrite = authoredState.depthWrite;
          if (transparentChanged) material.needsUpdate = true;
        }
      });
      activeOrders.forEach((order) => {
        const remaining = Math.max(0, (pulseRemaining.get(order) ?? 0) - safeDelta);
        pulseRemaining.set(order, remaining);
        const target = remaining > 0 ? emission.pulseIntensity : emission.stableIntensity;
        panelsByOrder.get(order).materials.forEach((material) => {
          material.emissiveIntensity += (target - material.emissiveIntensity) * blend;
        });
      });
    }

    function reset() {
      if (disposed) return;
      revealed = false;
      authoredVisual.visible = false;
      activeOrders.clear();
      pulseRemaining.clear();
      presentationMaterials.forEach((authoredState, material) => {
        const transparentChanged = material.transparent !== true;
        material.opacity = 0;
        material.transparent = true;
        material.depthWrite = false;
        if (transparentChanged) material.needsUpdate = true;
      });
      panelsByOrder.forEach(({ materials }) => materials.forEach((material) => { material.emissiveIntensity = 0; }));
    }

    function dispose() {
      if (disposed) return;
      disposed = true;
      object.removeFromParent();
      ownedMaterials.forEach((material) => material.dispose());
      ownedMaterials.clear();
      activeOrders.clear();
      pulseRemaining.clear();
    }

    return {
      object,
      activatePanel,
      update,
      reset,
      dispose,
      getPanelObject: (order) => panelsByOrder.get(order)?.object ?? null,
      getRuneInstallationFrame: () => runeInstallationFrame,
      isRevealed: () => revealed
    };
  } catch (error) {
    ownedMaterials.forEach((material) => material.dispose());
    throw error;
  }
}
