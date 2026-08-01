import * as THREE from '../vendor/three.js';

export function createVrTargetHalo({ root, settings = {} }) {
  const viewport = new THREE.Vector4();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      haloColor: { value: new THREE.Color(settings.color ?? 0xbfe9ff) },
      haloOpacity: { value: settings.opacity ?? 0.28 },
      thicknessPixels: { value: settings.thicknessPixels ?? 3 },
      viewportSize: { value: new THREE.Vector2(1, 1) }
    },
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float thicknessPixels;
      uniform vec2 viewportSize;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 clipPosition = projectionMatrix * viewPosition;
        vec3 viewNormal = normalize(normalMatrix * normal);
        vec4 adjacentClip = projectionMatrix * vec4(viewPosition.xyz + viewNormal, 1.0);
        vec2 direction = adjacentClip.xy / adjacentClip.w - clipPosition.xy / clipPosition.w;
        float directionLength = length(direction);
        if (directionLength > 0.00001) direction /= directionLength;
        clipPosition.xy += direction * (2.0 * thicknessPixels / viewportSize) * clipPosition.w;
        gl_Position = clipPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 haloColor;
      uniform float haloOpacity;
      void main() { gl_FragColor = vec4(haloColor, haloOpacity); }
    `
  });
  const shells = [];
  function isEffectivelyVisible(source) {
    for (let object = source; object; object = object.parent) {
      if (object.visible === false) return false;
      if (object === root) break;
    }
    return true;
  }
  root.traverse((source) => {
    const materials = Array.isArray(source.material) ? source.material : [source.material];
    if (!source.isMesh || !source.geometry || source.userData.vrTargetHalo
      || !isEffectivelyVisible(source) || !materials.some((candidate) => candidate?.visible !== false)) return;
    const shell = new THREE.Mesh(source.geometry, material);
    shell.name = `VrTargetHalo:${source.name || 'mesh'}`;
    shell.userData.vrTargetHalo = true;
    shell.raycast = () => {};
    shell.visible = false;
    shell.frustumCulled = source.frustumCulled;
    shell.onBeforeRender = (renderer) => {
      renderer.getCurrentViewport(viewport);
      material.uniforms.viewportSize.value.set(Math.max(1, viewport.z), Math.max(1, viewport.w));
    };
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
    material.uniforms.haloOpacity.value = (settings.opacity ?? 0.28) * (0.82 + pulse * 0.18);
  }
  function dispose() {
    setVisible(false);
    shells.forEach((shell) => { shell.onBeforeRender = null; shell.removeFromParent(); });
    shells.length = 0;
    material.dispose();
  }

  return { shells, material, get visible() { return visible; }, setVisible, update, dispose };
}
