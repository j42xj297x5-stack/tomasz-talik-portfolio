import * as THREE from '../../vendor/three.js';

const EPSILON = 1e-6;

export function resolveProductVolumeBounds(productVolume) {
  if (!productVolume) throw new TypeError('VR_FURNACE_PRODUCT_VOLUME is required');
  const bounds = new THREE.Box3().makeEmpty();
  const inverse = new THREE.Matrix4();
  const nodeToVolume = new THREE.Matrix4();
  productVolume.updateWorldMatrix(true, true);
  inverse.copy(productVolume.matrixWorld).invert();
  productVolume.traverse((node) => {
    if (!node.geometry) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (node.geometry.boundingBox) bounds.union(node.geometry.boundingBox.clone().applyMatrix4(
      nodeToVolume.multiplyMatrices(inverse, node.matrixWorld)
    ));
  });
  if (bounds.isEmpty()) throw new Error('VR_FURNACE_PRODUCT_VOLUME must contain bounded geometry');
  const size = bounds.getSize(new THREE.Vector3());
  if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
    throw new Error('VR_FURNACE_PRODUCT_VOLUME must define a three-dimensional volume');
  }
  return bounds;
}

export function resolveVisibleBoundsInProductVolume(root, productVolume) {
  const bounds = new THREE.Box3().makeEmpty();
  const inverse = new THREE.Matrix4();
  const nodeToVolume = new THREE.Matrix4();
  productVolume.updateWorldMatrix(true, false);
  root.updateWorldMatrix(true, true);
  inverse.copy(productVolume.matrixWorld).invert();
  root.traverse((node) => {
    if (!node.visible || !node.geometry) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (node.geometry.boundingBox) bounds.union(node.geometry.boundingBox.clone().applyMatrix4(
      nodeToVolume.multiplyMatrices(inverse, node.matrixWorld)
    ));
  });
  return bounds;
}

export function centerPresentationInProductVolume({ presentationRoot, visibleRoot = presentationRoot, productVolume, volumeBounds }) {
  const productBounds = resolveVisibleBoundsInProductVolume(visibleRoot, productVolume);
  if (productBounds.isEmpty()) throw new Error('Furnace product presentation must contain visible bounded geometry');
  const volumeCenter = volumeBounds.getCenter(new THREE.Vector3());
  const productCenter = productBounds.getCenter(new THREE.Vector3());
  presentationRoot.position.add(volumeCenter.sub(productCenter));
  presentationRoot.updateWorldMatrix(true, true);
  return resolveVisibleBoundsInProductVolume(visibleRoot, productVolume);
}

export function productBoundsFitVolume(productBounds, volumeBounds, epsilon = EPSILON) {
  return productBounds.min.x >= volumeBounds.min.x - epsilon && productBounds.max.x <= volumeBounds.max.x + epsilon
    && productBounds.min.y >= volumeBounds.min.y - epsilon && productBounds.max.y <= volumeBounds.max.y + epsilon
    && productBounds.min.z >= volumeBounds.min.z - epsilon && productBounds.max.z <= volumeBounds.max.z + epsilon;
}
