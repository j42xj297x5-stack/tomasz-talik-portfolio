import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroFogReveal } from '../src/xr/guidance/createVrIntroFogReveal.js';

const platform = new THREE.Group();
platform.position.set(3, 2, -4); platform.rotation.set(.4, .7, -.2);
const material = new THREE.MeshBasicMaterial();
const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
platform.add(root); platform.updateWorldMatrix(true, true);
const originalCompile = material.onBeforeCompile;
const reveal = createVrIntroFogReveal({ center: platform, roots: [root], duration: 10 });

assert.notEqual(material.onBeforeCompile, originalCompile, 'fog is installed before the first renderable frame');

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
reveal.dispose(); assert.equal(material.onBeforeCompile, originalCompile, 'dispose restores the material lifecycle');

console.log('VR intro platform-radial fog assertions passed.');
