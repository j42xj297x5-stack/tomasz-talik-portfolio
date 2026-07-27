import * as THREE from '../vendor/three.js';

export const MILKY_WAY_RADIUS = 80;
export const MILKY_WAY_BASE_OPACITY = 0.5;
export const MILKY_WAY_ROTATION_X = 0.18;
export const MILKY_WAY_ROTATION_Y = Math.PI / 2;
export const MILKY_WAY_ROTATION_Z = -0.22;

const ASSET_ID = 'milky-way-background';
const REVEAL_DURATION = 0.65;
const PROGRESSION_EPSILON = 0.0001;
const RENDER_ORDER = -1000;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

export function createMilkyWayBackground({ assetManager } = {}) {
  const group = new THREE.Group();
  group.name = 'MilkyWayBackground';
  group.visible = false;

  let progressionMultiplier = 0;
  let revealProgress = 0;
  let mesh = null;
  const texture = assetManager?.getTexture?.(ASSET_ID) ?? null;

  if (!texture) {
    console.warn('[milkyWayBackground] Optional Milky Way texture is unavailable; galaxy sprites will remain active.');
  } else {
    const geometry = new THREE.SphereGeometry(MILKY_WAY_RADIUS, 64, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false
    });
    material.toneMapped = false;
    material.fog = false;
    mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'MilkyWayInnerSphere';
    mesh.userData.nonInteractive = true;
    mesh.renderOrder = RENDER_ORDER;
    mesh.rotation.set(MILKY_WAY_ROTATION_X, MILKY_WAY_ROTATION_Y, MILKY_WAY_ROTATION_Z);
    group.add(mesh);
  }

  return {
    group,
    setProgressionMultiplier(value = 0) {
      const number = Number(value);
      progressionMultiplier = clamp(Number.isFinite(number) ? number : 0, 0, 1);
    },
    update(delta = 0, camera = null) {
      if (!mesh) return;
      if (camera) group.position.copy(camera.position);
      revealProgress += (progressionMultiplier - revealProgress) * Math.min(1, Math.max(0, delta) / REVEAL_DURATION);
      if (Math.abs(revealProgress - progressionMultiplier) <= PROGRESSION_EPSILON) revealProgress = progressionMultiplier;
      mesh.material.opacity = MILKY_WAY_BASE_OPACITY * revealProgress;
      group.visible = revealProgress > PROGRESSION_EPSILON || progressionMultiplier > PROGRESSION_EPSILON;
    },
    showForWarmup() {
      if (!mesh) return () => {};
      const visible = group.visible;
      const opacity = mesh.material.opacity;
      group.visible = true;
      mesh.material.opacity = MILKY_WAY_BASE_OPACITY;
      return () => {
        group.visible = visible;
        mesh.material.opacity = opacity;
      };
    },
    dispose() {
      if (!mesh) return;
      mesh.geometry.dispose();
      mesh.material.dispose();
      group.remove(mesh);
      mesh = null;
    }
  };
}
