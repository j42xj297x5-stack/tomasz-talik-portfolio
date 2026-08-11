import * as THREE from '../../vendor/three.js';

/** Renders a black, platform-local radial mask on an explicit set of roots. */
export function createVrIntroFogReveal({ center, roots = [], color = '#05070b', duration = 10,
  initialRadius = 20, revealedRadius = 17 }) {
  if (!center?.isObject3D) throw new TypeError('VR intro fog requires a platform center Object3D');
  const uniforms = {
    worldToPlatform: { value: new THREE.Matrix4() },
    radius: { value: initialRadius },
    color: { value: new THREE.Color(color) }
  };
  const patched = new Map();
  let elapsed = 0; let progress = 0; let active = false; let installed = false;

  function syncCenter() {
    center.updateWorldMatrix(true, false);
    uniforms.worldToPlatform.value.copy(center.matrixWorld).invert();
  }
  function install() {
    syncCenter();
    for (const root of roots.filter(Boolean)) root.traverse?.((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials.filter(Boolean)) {
        if (patched.has(material)) continue;
        const previous = material.onBeforeCompile;
        patched.set(material, previous);
        material.onBeforeCompile = (shader, renderer) => {
          previous?.(shader, renderer);
          shader.uniforms.vrFogWorldToPlatform = uniforms.worldToPlatform;
          shader.uniforms.vrFogRadius = uniforms.radius;
          shader.uniforms.vrFogColor = uniforms.color;
          shader.vertexShader = `uniform mat4 vrFogWorldToPlatform; varying vec3 vrFogPlatformPosition;\n${shader.vertexShader}`
            .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>

vec4 vrFogWorldPosition = vec4(transformed, 1.0);

#ifdef USE_BATCHING
  vrFogWorldPosition = batchingMatrix * vrFogWorldPosition;
#endif

#ifdef USE_INSTANCING
  vrFogWorldPosition = instanceMatrix * vrFogWorldPosition;
#endif

vrFogWorldPosition = modelMatrix * vrFogWorldPosition;
vrFogPlatformPosition = (vrFogWorldToPlatform * vrFogWorldPosition).xyz;`);
          shader.fragmentShader = `uniform float vrFogRadius; uniform vec3 vrFogColor; varying vec3 vrFogPlatformPosition;\n${shader.fragmentShader}`
            .replace('#include <dithering_fragment>', `float vrFogEdge = smoothstep(vrFogRadius - 0.35, vrFogRadius + 0.35, length(vrFogPlatformPosition.xz));\n gl_FragColor.rgb = mix(vrFogColor, gl_FragColor.rgb, vrFogEdge);\n#include <dithering_fragment>`);
        };
        material.needsUpdate = true;
      }
    });
    installed = true;
  }
  function uninstall() {
    for (const [material, previous] of patched) { material.onBeforeCompile = previous; material.needsUpdate = true; }
    patched.clear(); installed = false;
  }
  function setRadius(radius) { uniforms.radius.value = Math.max(0, radius); syncCenter(); }
  function restart() { uninstall(); elapsed = 0; progress = 0; active = false; uniforms.radius.value = initialRadius; install(); }
  function start() { elapsed = 0; progress = 0; active = true; setRadius(initialRadius); }
  function update(delta) {
    if (!installed) return;
    syncCenter();
    if (!active) return;
    elapsed = Math.min(duration, elapsed + Math.max(0, delta));
    progress = duration <= 0 ? 1 : elapsed / duration;
    setRadius(THREE.MathUtils.lerp(initialRadius, revealedRadius, progress));
    if (progress >= 1) active = false;
  }
  function skipToEnd() { elapsed = duration; progress = 1; active = false; setRadius(0); uninstall(); }
  function dispose() { active = false; uninstall(); }
  restart();
  return { restart, start, update, setRadius, skipToEnd, dispose,
    getSnapshot: () => ({ progress, elapsed, duration, active, installed, radius: uniforms.radius.value,
      initialRadius, revealedRadius, worldToPlatform: uniforms.worldToPlatform.value.clone() }) };
}
