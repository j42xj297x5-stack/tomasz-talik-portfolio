import * as THREE from '../../vendor/three.js';

const smoothstep = (value) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

/** Radial black fog that expands from the calibrated player position to the Monkey. */
export function createVrIntroFogReveal({ getOriginPosition, getTargetPosition, roots = [], color = '#05070b', duration = 10 }) {
  const uniforms = { center: { value: new THREE.Vector3() }, radius: { value: 0 }, color: { value: new THREE.Color(color) } };
  const patched = new Map();
  let elapsed = 0; let progress = 0; let active = false; let revealRadius = 0;

  function install() {
    for (const root of roots.filter(Boolean)) root.traverse?.((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials.filter(Boolean)) {
        if (patched.has(material)) continue;
        const previous = material.onBeforeCompile;
        patched.set(material, previous);
        material.onBeforeCompile = (shader, renderer) => {
          previous?.(shader, renderer);
          shader.uniforms.vrFogCenter = uniforms.center;
          shader.uniforms.vrFogRadius = uniforms.radius;
          shader.uniforms.vrFogColor = uniforms.color;
          shader.vertexShader = `varying vec3 vrFogWorldPosition;\n${shader.vertexShader}`
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvrFogWorldPosition = worldPosition.xyz;');
          shader.fragmentShader = `uniform vec3 vrFogCenter; uniform float vrFogRadius; uniform vec3 vrFogColor; varying vec3 vrFogWorldPosition;\n${shader.fragmentShader}`
            .replace('#include <dithering_fragment>', `float vrFogEdge = smoothstep(vrFogRadius - 0.35, vrFogRadius + 0.35, distance(vrFogWorldPosition.xz, vrFogCenter.xz));\n gl_FragColor.rgb = mix(gl_FragColor.rgb, vrFogColor, vrFogEdge);\n#include <dithering_fragment>`);
        };
        material.needsUpdate = true;
      }
    });
  }
  function uninstall() {
    for (const [material, previous] of patched) { material.onBeforeCompile = previous; material.needsUpdate = true; }
    patched.clear();
  }
  function restart() { uninstall(); elapsed = 0; progress = 0; active = false; uniforms.radius.value = 0; install(); }
  function start() {
    uniforms.center.value.copy(getOriginPosition());
    const target = getTargetPosition();
    revealRadius = Math.hypot(target.x - uniforms.center.value.x, target.z - uniforms.center.value.z);
    active = true;
  }
  function update(delta) {
    if (!active) return;
    elapsed = Math.min(duration, elapsed + Math.max(0, delta));
    const linear = duration <= 0 ? 1 : elapsed / duration;
    progress = smoothstep(linear); uniforms.radius.value = revealRadius * progress;
    if (linear >= 1) { active = false; uninstall(); }
  }
  function skipToEnd() { elapsed = duration; progress = 1; uniforms.radius.value = revealRadius; active = false; uninstall(); }
  function dispose() { uninstall(); }
  restart();
  return { restart, start, update, skipToEnd, dispose,
    getSnapshot: () => ({ progress, elapsed, duration, active, revealRadius, center: uniforms.center.value.clone() }) };
}
