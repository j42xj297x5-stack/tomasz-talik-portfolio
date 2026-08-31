import * as THREE from '../../vendor/three.js';

export const VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE = Object.freeze({
  HIDDEN: 'HIDDEN',
  REVEALING: 'REVEALING',
  REVEALED: 'REVEALED'
});

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

function isFiniteVector3(value) {
  return value != null && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function isFiniteQuaternion(value) {
  if (!isFiniteVector3(value) || !Number.isFinite(value.w)) return false;
  const length = Math.hypot(value.x, value.y, value.z, value.w);
  return Number.isFinite(length) && length > 0;
}

export function createVrProgressFloorSectorActor({ descriptor, sourceModel, contract, emission }) {
  if (!descriptor || !sourceModel?.clone || !contract) {
    throw new Error('[VrProgressFloorSectorActor] Descriptor, source model and source contract are required.');
  }

  const object = new THREE.Group();
  object.name = `VrProgressFloorSectorActorRoot:${descriptor.glyphId}`;
  object.position.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  object.rotation.y = descriptor.rotationIndex * (Math.PI * 2 / 5);
  object.userData = { ...object.userData, ...descriptor };

  const motionRoot = new THREE.Group();
  motionRoot.name = `VrProgressFloorSectorMotionRoot:${descriptor.glyphId}`;
  motionRoot.position.set(0, 0, 0);
  motionRoot.quaternion.identity();
  motionRoot.scale.set(1, 1, 1);
  object.add(motionRoot);

  const authoredVisual = sourceModel.clone(true);
  authoredVisual.name = `VrProgressFloorSector:${descriptor.glyphId}`;
  authoredVisual.position.set(0, 0, 0);
  authoredVisual.visible = false;
  motionRoot.add(authoredVisual);

  const ownedMaterials = new Set();
  const panelsByOrder = new Map();
  const presentationMaterials = new Map();
  const activeOrders = new Set();
  const pulseRemaining = new Map();
  let acquisitionOverlay = null;
  let acquisitionOverlayMaterial = null;
  let asterionTargetAnchor = null;
  let presentationState = VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE.HIDDEN;
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
    const targetBounds = getBoundsRelativeTo(panelsByOrder.get(3).object, motionRoot);
    if (targetBounds.isEmpty()) throw new Error(`[VrProgressFloorSectorActor] Cannot derive panel-3 target for "${descriptor.glyphId}".`);
    asterionTargetAnchor = new THREE.Object3D();
    asterionTargetAnchor.name = `VrAsterionSectorTargetAnchor:${descriptor.glyphId}`;
    asterionTargetAnchor.position.copy(targetBounds.getCenter(new THREE.Vector3()));
    motionRoot.add(asterionTargetAnchor);

    acquisitionOverlayMaterial = new THREE.MeshBasicMaterial({
      color: emission.fallbackColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    ownedMaterials.add(acquisitionOverlayMaterial);
    acquisitionOverlay = new THREE.Group();
    acquisitionOverlay.name = `VrAsterionSectorAcquisitionOverlay:${descriptor.glyphId}`;
    presentationBodies.forEach((body) => {
      const overlayBody = body.clone(true);
      overlayBody.traverse((child) => {
        if (!child.isMesh) return;
        child.material = acquisitionOverlayMaterial;
        child.renderOrder = 3;
      });
      acquisitionOverlay.add(overlayBody);
    });
    acquisitionOverlay.visible = false;
    motionRoot.add(acquisitionOverlay);
    const presentationBounds = new THREE.Box3().makeEmpty();
    presentationBodies.forEach((body) => presentationBounds.union(getBoundsRelativeTo(body, motionRoot)));
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
    motionRoot.add(runeInstallationFrame);
    const energyVfxMount = new THREE.Group();
    energyVfxMount.name = `VrProgressFloorSectorEnergyVfxMount:${descriptor.glyphId}`;
    motionRoot.add(energyVfxMount);

    function resetMotion() {
      if (disposed) return;
      motionRoot.position.set(0, 0, 0);
      motionRoot.quaternion.identity();
      motionRoot.scale.set(1, 1, 1);
    }

    function setMotionTransform({ position, quaternion } = {}) {
      if (disposed || !isFiniteVector3(position) || !isFiniteQuaternion(quaternion)) return false;
      const quaternionLength = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      motionRoot.position.set(position.x, position.y, position.z);
      motionRoot.quaternion.set(
        quaternion.x / quaternionLength,
        quaternion.y / quaternionLength,
        quaternion.z / quaternionLength,
        quaternion.w / quaternionLength
      );
      motionRoot.scale.set(1, 1, 1);
      return true;
    }

    function reveal() {
      if (disposed || presentationState !== VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE.HIDDEN) return false;
      presentationState = VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE.REVEALING;
      authoredVisual.visible = true;
      return true;
    }

    function activatePanel(order) {
      if (disposed || activeOrders.has(order) || !panelsByOrder.has(order)) return false;
      activeOrders.add(order);
      pulseRemaining.set(order, emission.pulseDuration);
      return true;
    }

    function update(delta = 0) {
      if (disposed) return;
      const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
      const blend = 1 - Math.exp(-emission.responseSpeed * safeDelta);
      if (presentationState === VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE.REVEALING) {
        let settled = true;
        presentationMaterials.forEach((authoredState, material) => {
          material.opacity += (authoredState.opacity - material.opacity) * blend;
          if (Math.abs(authoredState.opacity - material.opacity) > 1e-4) settled = false;
        });
        if (settled) {
          presentationMaterials.forEach((authoredState, material) => {
            const transparentChanged = material.transparent !== authoredState.transparent;
            material.opacity = authoredState.opacity;
            material.transparent = authoredState.transparent;
            material.depthWrite = authoredState.depthWrite;
            if (transparentChanged) material.needsUpdate = true;
          });
          presentationState = VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE.REVEALED;
        }
      }
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
      resetMotion();
      presentationState = VR_PROGRESS_FLOOR_SECTOR_PRESENTATION_STATE.HIDDEN;
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
      acquisitionOverlay.visible = false;
      acquisitionOverlayMaterial.opacity = 0;
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
      reveal,
      activatePanel,
      update,
      setMotionTransform,
      resetMotion,
      reset,
      dispose,
      getMotionTransform: () => ({
        position: motionRoot.position.clone(),
        quaternion: motionRoot.quaternion.clone(),
        scale: motionRoot.scale.clone()
      }),
      getMotionBounds: () => ({
        min: presentationBounds.min.clone(),
        max: presentationBounds.max.clone()
      }),
      getControlFrame: () => {
        object.updateWorldMatrix(true, false);
        return {
          position: object.getWorldPosition(new THREE.Vector3()),
          quaternion: object.getWorldQuaternion(new THREE.Quaternion())
        };
      },
      getPanelObject: (order) => panelsByOrder.get(order)?.object ?? null,
      getRuneInstallationFrame: () => runeInstallationFrame,
      getEnergyVfxMount: () => energyVfxMount,
      getEnergyVfxBounds: () => ({ min: presentationBounds.min.clone(), max: presentationBounds.max.clone() }),
      getAsterionTargetWorldPosition: () => {
        if (disposed) return null;
        asterionTargetAnchor.updateWorldMatrix(true, false);
        return asterionTargetAnchor.getWorldPosition(new THREE.Vector3());
      },
      setAsterionAcquisitionGlow: (strength) => {
        if (disposed) return false;
        const safeStrength = THREE.MathUtils.clamp(Number.isFinite(strength) ? strength : 0, 0, 1);
        acquisitionOverlayMaterial.opacity = safeStrength;
        acquisitionOverlay.visible = safeStrength > 0 && authoredVisual.visible;
        return true;
      },
      getPresentationState: () => presentationState
    };
  } catch (error) {
    ownedMaterials.forEach((material) => material.dispose());
    throw error;
  }
}
