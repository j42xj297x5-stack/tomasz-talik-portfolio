import * as THREE from '../../vendor/three.js';

const relativeMatrix = new THREE.Matrix4();
const desiredWorldMatrix = new THREE.Matrix4();
const desiredLocalMatrix = new THREE.Matrix4();
const inverseReferenceMatrix = new THREE.Matrix4();
const inverseParentMatrix = new THREE.Matrix4();
const offsetMatrix = new THREE.Matrix4();
const resolvedPosition = new THREE.Vector3();
const resolvedQuaternion = new THREE.Quaternion();
const discardedScale = new THREE.Vector3();

export function createVrSceneLayoutPrototype(layoutScene) {
  if (!layoutScene?.isObject3D) throw new Error('VR scene layout requires a valid glTF scene.');

  const nodesByName = new Map();
  const nodesByRole = new Map();
  layoutScene.traverse((node) => {
    if (node.name && !nodesByName.has(node.name)) nodesByName.set(node.name, node);
    const role = node.userData?.vr_layout_role;
    if (role && !nodesByRole.has(role)) nodesByRole.set(role, node);
  });
  layoutScene.updateWorldMatrix(true, true);

  function getNode(nameOrRole) {
    return nodesByName.get(nameOrRole) ?? nodesByRole.get(nameOrRole) ?? null;
  }

  function applyTransform({
    layoutNode, layoutReference, runtimeObject, runtimeReference,
    offsetPosition = null, applyRotation = true
  }) {
    const source = typeof layoutNode === 'string' ? getNode(layoutNode) : layoutNode;
    const sourceReference = typeof layoutReference === 'string' ? getNode(layoutReference) : layoutReference;
    if (!source || !sourceReference || !runtimeObject?.isObject3D || !runtimeReference?.isObject3D) return null;

    layoutScene.updateWorldMatrix(true, true);
    runtimeReference.updateWorldMatrix(true, true);
    runtimeObject.parent?.updateWorldMatrix(true, false);
    inverseReferenceMatrix.copy(sourceReference.matrixWorld).invert();
    relativeMatrix.multiplyMatrices(inverseReferenceMatrix, source.matrixWorld);
    if (offsetPosition) {
      offsetMatrix.makeTranslation(offsetPosition.x ?? 0, offsetPosition.y ?? 0, offsetPosition.z ?? 0);
      relativeMatrix.multiply(offsetMatrix);
    }
    desiredWorldMatrix.multiplyMatrices(runtimeReference.matrixWorld, relativeMatrix);
    if (runtimeObject.parent) {
      inverseParentMatrix.copy(runtimeObject.parent.matrixWorld).invert();
      desiredLocalMatrix.multiplyMatrices(inverseParentMatrix, desiredWorldMatrix);
    } else {
      desiredLocalMatrix.copy(desiredWorldMatrix);
    }
    desiredLocalMatrix.decompose(resolvedPosition, resolvedQuaternion, discardedScale);
    runtimeObject.position.copy(resolvedPosition);
    if (applyRotation) runtimeObject.quaternion.copy(resolvedQuaternion);
    runtimeObject.updateWorldMatrix(false, true);

    return {
      localPosition: runtimeObject.position.clone(),
      worldPosition: runtimeObject.getWorldPosition(new THREE.Vector3()),
      quaternion: runtimeObject.quaternion.clone()
    };
  }

  return { layoutScene, nodesByName, nodesByRole, getNode, applyTransform };
}
