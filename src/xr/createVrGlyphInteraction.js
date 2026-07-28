import * as THREE from '../vendor/three.js';

const LOCAL_RAY_DIRECTION = new THREE.Vector3(0, 0, -1);
const HOVER_COLOR = 0x72c7ff;
const ACTIVATED_COLOR = 0xffd36a;

export function findNearestGlyph(nodes, origin) {
  if (!nodes.length) return null;
  const nodePosition = new THREE.Vector3();
  let nearest = nodes[0];
  let nearestDistance = nearest.getWorldPosition(nodePosition).distanceToSquared(origin);
  for (let index = 1; index < nodes.length; index += 1) {
    const distance = nodes[index].getWorldPosition(nodePosition).distanceToSquared(origin);
    if (distance < nearestDistance) {
      nearest = nodes[index];
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function createVrGlyphInteraction({
  controllers,
  nodes,
  playerRig,
  worldRoot,
  onEntryGlyphActivated = () => {}
}) {
  worldRoot.updateMatrixWorld(true);
  playerRig.updateMatrixWorld(true);
  const spawnWorldPosition = playerRig.getWorldPosition(new THREE.Vector3());
  const entryNode = findNearestGlyph(nodes, spawnWorldPosition);
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  let state = 'idle';
  let disposed = false;

  const markerGeometry = new THREE.SphereGeometry(0.31, 20, 14);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: HOVER_COLOR,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
    depthWrite: false
  });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.name = 'VrEntryGlyphMarker';
  marker.visible = false;
  entryNode?.add(marker);

  function applyVisualState() {
    marker.visible = state !== 'idle';
    marker.material.color.setHex(state === 'activated' ? ACTIVATED_COLOR : HOVER_COLOR);
    marker.material.opacity = state === 'activated' ? 0.48 : 0.22;
    marker.scale.setScalar(state === 'activated' ? 1.16 : 1);
  }

  const selectListeners = controllers.map((record) => {
    const listener = () => {
      if (disposed || state === 'activated' || record.currentHit !== entryNode) return;
      state = 'activated';
      applyVisualState();
      onEntryGlyphActivated({
        node: entryNode,
        controllerIndex: record.index,
        handedness: record.handedness
      });
    };
    record.controller.addEventListener('selectstart', listener);
    return listener;
  });

  function update() {
    if (disposed || !entryNode) return;
    for (const record of controllers) {
      record.currentHit = null;
      if (!record.isConnected || record.currentRayLength <= 0) continue;
      record.controller.updateWorldMatrix(true, false);
      record.controller.getWorldPosition(rayOrigin);
      record.controller.getWorldQuaternion(worldQuaternion);
      rayDirection.copy(LOCAL_RAY_DIRECTION).applyQuaternion(worldQuaternion).normalize();
      raycaster.ray.origin.copy(rayOrigin);
      raycaster.ray.direction.copy(rayDirection);
      raycaster.near = 0;
      raycaster.far = record.currentRayLength;
      if (raycaster.intersectObject(entryNode, false).length > 0) record.currentHit = entryNode;
    }
    if (state !== 'activated') {
      state = controllers.some(({ currentHit }) => currentHit === entryNode) ? 'hovered' : 'idle';
      applyVisualState();
    }
  }

  function reset() {
    if (disposed) return;
    controllers.forEach((record) => { record.currentHit = null; });
    state = 'idle';
    applyVisualState();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    controllers.forEach((record, index) => {
      record.controller.removeEventListener('selectstart', selectListeners[index]);
      record.currentHit = null;
    });
    marker.removeFromParent();
    markerGeometry.dispose();
    markerMaterial.dispose();
  }

  return { entryNode, marker, get state() { return state; }, update, reset, dispose };
}
