import * as THREE from '../vendor/three.js';

export function addLights(scene) {
  const ambient = new THREE.AmbientLight('#8aa0c2', 0.42);
  const key = new THREE.DirectionalLight('#cfd8ff', 0.95);
  key.position.set(2.5, 4, 3);

  const fill = new THREE.PointLight('#4d7cff', 0.52, 18);
  fill.position.set(-3.2, 2.2, -1.6);

  scene.add(ambient, key, fill);
  return Object.freeze({ ambient, key, fill });
}
