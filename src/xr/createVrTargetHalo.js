import * as THREE from '../vendor/three.js';

export function createVrTargetHalo({ root, settings = {} }) {
  const material = new THREE.MeshBasicMaterial({
    color: settings.color ?? 0xbfe9ff,
    transparent: true,
    opacity: settings.opacity ?? 0.28,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const shells = [];
  root.traverse((source) => {
    if (!source.isMesh || !source.geometry || source.userData.vrTargetHalo) return;
    const shell = new THREE.Mesh(source.geometry, material);
    shell.name = `VrTargetHalo:${source.name || 'mesh'}`;
    shell.userData.vrTargetHalo = true;
    shell.raycast = () => {};
    shell.scale.setScalar(settings.scale ?? 1.055);
    shell.visible = false;
    shell.frustumCulled = source.frustumCulled;
    source.add(shell);
    shells.push(shell);
  });
  let visible = false;
  let elapsed = 0;

  function setVisible(nextVisible) {
    visible = Boolean(nextVisible);
    shells.forEach((shell) => { shell.visible = visible; });
    if (!visible) elapsed = 0;
  }
  function update(delta = 0) {
    if (!visible) return;
    elapsed += Math.max(0, delta);
    const duration = settings.pulseDuration ?? 1.45;
    const pulse = 0.5 + 0.5 * Math.sin((elapsed / duration) * Math.PI * 2);
    material.opacity = (settings.opacity ?? 0.28) * (0.82 + pulse * 0.18);
  }
  function dispose() {
    setVisible(false);
    shells.forEach((shell) => shell.removeFromParent());
    shells.length = 0;
    material.dispose();
  }

  return { shells, material, get visible() { return visible; }, setVisible, update, dispose };
}
