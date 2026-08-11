import * as THREE from '../vendor/three.js';

/**
 * Read the XR viewer position from the matrix prepared by WebXRManager.
 * Its internal ArrayCamera is detached, so getWorldPosition() could rebuild
 * matrixWorld from a local pose and discard the player-rig transform.
 */
export function getXrHeadWorldPosition({ renderer, camera, playerRig, target = new THREE.Vector3() }) {
  playerRig.updateWorldMatrix(true, true);
  renderer.xr.updateCamera(camera);
  const xrCamera = renderer.xr.getCamera(camera);
  return target.setFromMatrixPosition(xrCamera.matrixWorld);
}
