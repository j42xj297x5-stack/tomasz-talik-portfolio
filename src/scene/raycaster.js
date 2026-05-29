import * as THREE from '../vendor/three.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export function pickNode(event, canvas, camera, nodes) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth || window.innerWidth || 1;
  const height = rect.height || canvas.clientHeight || window.innerHeight || 1;
  pointer.x = ((event.clientX - rect.left) / width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(nodes, false);
  return hits[0]?.object ?? null;
}
