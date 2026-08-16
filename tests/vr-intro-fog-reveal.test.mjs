import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroFogReveal } from '../src/xr/guidance/createVrIntroFogReveal.js';
import { VR_BACKGROUND_COLOR } from '../src/config/experienceVrSettings.js';
import { readFile } from 'node:fs/promises';

assert.equal(VR_BACKGROUND_COLOR, '#05070b');
const runtimeSource = await readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8');
assert.match(runtimeSource, /scene\.background = new THREE\.Color\(VR_BACKGROUND_COLOR\)/);
assert.match(runtimeSource, /color: VR_BACKGROUND_COLOR/);

const platform = new THREE.Group();
platform.position.set(3, 2, -4); platform.rotation.set(.4, .7, -.2);
const material = new THREE.MeshBasicMaterial();
material.customProgramCacheKey = () => 'base-material-program';
const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
platform.add(root); platform.updateWorldMatrix(true, true);
const originalCompile = material.onBeforeCompile;
const originalProgramCacheKey = material.customProgramCacheKey;
const baseProgramKey = originalProgramCacheKey.call(material);
const reveal = createVrIntroFogReveal({ center: platform, roots: [root], duration: 10 });

assert.notEqual(material.onBeforeCompile, originalCompile, 'fog is installed before the first renderable frame');
const initialFogProgramKey = material.customProgramCacheKey();
assert.notEqual(initialFogProgramKey, baseProgramKey,
  'the installed fog variant has a renderer-visible program cache key');

// MeshBasicMaterial does not require Three's conditionally declared worldPosition.
// Compile the patch against a minimal shader representing that exact code path.
const shader = {
  uniforms: {},
  vertexShader: `void main() {
    vec3 transformed = position;

    #include <worldpos_vertex>
}`,
  fragmentShader: `void main() {
    gl_FragColor = vec4(1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <dithering_fragment>
}`
};
material.onBeforeCompile(shader, {});

assert.match(shader.vertexShader, /vec4 vrFogWorldPosition = vec4\(transformed, 1\.0\);/,
  'fog declares its own world-space position from the pipeline-transformed vertex');
assert.match(shader.vertexShader, /#ifdef USE_BATCHING\s+vrFogWorldPosition = batchingMatrix \* vrFogWorldPosition;/,
  'fog applies the Three batching transform');
assert.match(shader.vertexShader, /#ifdef USE_INSTANCING\s+vrFogWorldPosition = instanceMatrix \* vrFogWorldPosition;/,
  'fog applies the Three instancing transform');
assert.match(shader.vertexShader, /vrFogWorldPosition = modelMatrix \* vrFogWorldPosition;/,
  'fog transforms its private position into world space');
assert.match(shader.vertexShader,
  /vrFogPlatformPosition = \(vrFogWorldToPlatform \* vrFogWorldPosition\)\.xyz;/,
  'platform-local position uses the fog-owned world-space value');
assert.doesNotMatch(shader.vertexShader,
  /vrFogPlatformPosition\s*=\s*\(vrFogWorldToPlatform\s*\*\s*worldPosition\)\.xyz/,
  'fog injection never depends on Three conditionally declaring worldPosition');

assert.match(shader.fragmentShader,
  /smoothstep\(vrFogRadius - 0\.35, vrFogRadius \+ 0\.35, length\(vrFogPlatformPosition\.xz\)\)/,
  'radial mask transitions from fog inside the radius to visible material outside it');
assert.ok(shader.fragmentShader.indexOf('mix(vrFogColor') < shader.fragmentShader.indexOf('#include <tonemapping_fragment>'));
assert.ok(shader.fragmentShader.indexOf('mix(vrFogColor') < shader.fragmentShader.indexOf('#include <colorspace_fragment>'));

const smoothstep = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const radialVisibility = (distance, radius = 17) => smoothstep(radius - 0.35, radius + 0.35, distance);
assert.equal(radialVisibility(10), 0, 'distance 10 is fogged');
assert.equal(radialVisibility(16), 0, 'distance 16 remains on the fog side of the feather');
assert.equal(radialVisibility(18), 1, 'distance 18 shows the original material');
assert.equal(radialVisibility(20), 1, 'distance 20 shows the original material');

assert.deepEqual(reveal.getSnapshot().worldToPlatform.elements, platform.matrixWorld.clone().invert().elements,
  'fog radial coordinates use the complete platform transform');
assert.equal(reveal.getSnapshot().radius, 20);
reveal.start();
reveal.update(5); assert.equal(reveal.getSnapshot().radius, 18.5);
reveal.update(5); assert.equal(reveal.getSnapshot().radius, 17);
reveal.update(100); assert.equal(reveal.getSnapshot().radius, 17, 'completed reveal holds its radius and shader patch');
reveal.setRadius(6); assert.equal(reveal.getSnapshot().radius, 6);
reveal.setRadius(0); assert.equal(reveal.getSnapshot().radius, 0);
reveal.skipToEnd();
assert.equal(material.onBeforeCompile, originalCompile, 'skipToEnd removes the fog shader patch');
assert.equal(material.customProgramCacheKey, originalProgramCacheKey,
  'skipToEnd restores the material program cache contract');
assert.equal(material.customProgramCacheKey(), baseProgramKey,
  'the completed P2-style state selects the original program variant');

reveal.restart();
assert.notEqual(material.customProgramCacheKey(), baseProgramKey,
  'a P0-style restart cannot reuse the cached program without fog');
assert.equal(material.customProgramCacheKey(), initialFogProgramKey,
  'reinstalling the same fog shader produces a stable cache key');
const restartedCompile = material.onBeforeCompile;
reveal.restart();
assert.notEqual(material.onBeforeCompile, restartedCompile, 'restart replaces rather than wraps the installed callback');
const restartedShader = {
  uniforms: {},
  vertexShader: 'void main() { vec3 transformed = position; #include <worldpos_vertex> }',
  fragmentShader: 'void main() { gl_FragColor = vec4(1.0); #include <tonemapping_fragment> }'
};
material.onBeforeCompile(restartedShader, {});
assert.equal(restartedShader.fragmentShader.match(/uniform float vrFogRadius/g)?.length, 1,
  'repeated restarts install exactly one fog patch');
assert.equal(material.customProgramCacheKey(), initialFogProgramKey,
  'repeated restarts keep the fog cache contract idempotent');
reveal.dispose();
assert.equal(material.onBeforeCompile, originalCompile, 'dispose restores the material lifecycle');
assert.equal(material.customProgramCacheKey, originalProgramCacheKey, 'dispose restores the original cache key callback');

const monkey = new THREE.Group();
const monkeyMaterial = new THREE.MeshBasicMaterial();
monkey.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4), monkeyMaterial));
monkey.position.set(0, 0, 18);
platform.add(monkey); platform.updateWorldMatrix(true, true);
const geometricReveal = createVrIntroFogReveal({ center: platform, roots: [monkey], revealTarget: monkey, duration: 2 });
geometricReveal.start(); geometricReveal.update(2);
const firstFinal = geometricReveal.getSnapshot().revealedRadius;
const localBounds = new THREE.Box3().setFromObject(monkey).applyMatrix4(platform.matrixWorld.clone().invert());
const localSphere = localBounds.getBoundingSphere(new THREE.Sphere());
assert.equal(firstFinal, Math.max(0, Math.hypot(localSphere.center.x, localSphere.center.z) - localSphere.radius - 0.35));
assert.ok(firstFinal < 17, 'a bound crossing the former radius derives a sufficiently deep reveal boundary');
assert.ok(Math.hypot(localSphere.center.x, localSphere.center.z) - localSphere.radius >= firstFinal + 0.35,
  'the complete conservative Monkey bound is beyond the visible side of the feather');
geometricReveal.skipToEnd(); geometricReveal.dispose(); geometricReveal.restart();
assert.equal(geometricReveal.getSnapshot().installed, true, 'restart reinstalls the shader patch after disposal');
assert.equal(geometricReveal.getSnapshot().progress, 0);
geometricReveal.start(); geometricReveal.update(1);
assert.equal(geometricReveal.getSnapshot().progress, 0.5, 'the restarted reveal progresses from zero');
assert.notEqual(geometricReveal.getSnapshot().radius, 20, 'the restarted reveal updates its radius');
geometricReveal.update(1);
assert.equal(geometricReveal.getSnapshot().revealedRadius, firstFinal,
  'the same geometry produces the same final radius in the next lifecycle');
geometricReveal.dispose();

console.log('VR intro platform-radial fog assertions passed.');
