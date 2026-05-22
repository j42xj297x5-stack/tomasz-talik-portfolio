import * as THREE from '../vendor/three.js';

export function createCentralObject() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.2, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: '#202734', roughness: 0.85, metalness: 0.1 })
  );

  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 14, 12),
    new THREE.MeshStandardMaterial({ color: '#2e3747', roughness: 0.75, metalness: 0.12, flatShading: true })
  );
  torso.position.y = 0.68;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 12, 10),
    new THREE.MeshStandardMaterial({ color: '#3b4657', roughness: 0.7, metalness: 0.1, flatShading: true })
  );
  head.position.y = 1.45;

  group.add(base, torso, head);
  group.userData.isPlaceholder = true;

  return group;
}
