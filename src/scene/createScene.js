import * as THREE from '../vendor/three.js';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05070b');
  scene.fog = new THREE.Fog('#05070b', 10, 28);
  return scene;
}
