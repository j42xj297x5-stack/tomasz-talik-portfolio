import * as THREE from '../vendor/three.js';

export function addLights(scene) {
  const ambient = new THREE.AmbientLight('#8aa0c2', 0.35);
  const key = new THREE.DirectionalLight('#cfd8ff', 0.8);
  key.position.set(2.5, 4, 3);

  const fill = new THREE.PointLight('#4d7cff', 0.45, 16);
  fill.position.set(-3, 2, -2);

  scene.add(ambient, key, fill);
}
