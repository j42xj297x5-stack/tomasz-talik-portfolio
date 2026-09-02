import * as THREE from '../vendor/three.js';

const xrHeadWorldScale = new THREE.Vector3();

function prepareXrHeadWorldMatrix({ renderer, camera, playerRig }) {
  playerRig.updateWorldMatrix(true, true);
  renderer.xr.updateCamera(camera);
  return renderer.xr.getCamera(camera).matrixWorld;
}

/**
 * Read the XR viewer position from the matrix prepared by WebXRManager.
 * Its internal ArrayCamera is detached, so getWorldPosition() could rebuild
 * matrixWorld from a local pose and discard the player-rig transform.
 */
export function getXrHeadWorldPosition({ renderer, camera, playerRig, target = new THREE.Vector3() }) {
  return target.setFromMatrixPosition(prepareXrHeadWorldMatrix({ renderer, camera, playerRig }));
}

/**
 * Read the XR viewer world pose without rebuilding the detached ArrayCamera's
 * matrixWorld. Callers provide reusable targets for allocation-free updates.
 */
export function getXrHeadWorldPose({ renderer, camera, playerRig, positionTarget, quaternionTarget }) {
  const matrixWorld = prepareXrHeadWorldMatrix({ renderer, camera, playerRig });
  matrixWorld.decompose(positionTarget, quaternionTarget, xrHeadWorldScale);
  return positionTarget;
}
