import * as THREE from '../vendor/three.js';

export const SCENE_FOG_DEFAULTS = Object.freeze({ enabled: true, color: '#05070b', near: 10, far: 28 });

export function applySceneFog(scene, options = SCENE_FOG_DEFAULTS) {
  const near = Math.max(0, Number(options.near) || SCENE_FOG_DEFAULTS.near);
  const far = Math.max(near + 0.1, Number(options.far) || SCENE_FOG_DEFAULTS.far);
  if (!options.enabled) { scene.fog = null; return; }
  if (!scene.fog) scene.fog = new THREE.Fog(options.color ?? SCENE_FOG_DEFAULTS.color, near, far);
  scene.fog.color.set(options.color ?? SCENE_FOG_DEFAULTS.color);
  scene.fog.near = near;
  scene.fog.far = far;
}

export function createScene(fogOptions = SCENE_FOG_DEFAULTS) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05070b');
  applySceneFog(scene, fogOptions);
  return scene;
}
