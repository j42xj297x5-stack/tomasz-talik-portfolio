import * as THREE from '../../vendor/three.js';

const BRANCH_IDS = Object.freeze(['earth', 'fire', 'wood', 'metal', 'water']);
const HALF_WEDGE_ANGLE = Math.PI / 5;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (value) => value * value * (3 - 2 * value);

const vertexShader = `
attribute vec3 previous;
attribute vec3 next;
attribute float side;
uniform float boltWidth;
void main() {
  vec4 currentView = modelViewMatrix * vec4(position, 1.0);
  vec2 previousView = (modelViewMatrix * vec4(previous, 1.0)).xy;
  vec2 nextView = (modelViewMatrix * vec4(next, 1.0)).xy;
  vec2 direction = normalize(nextView - previousView + vec2(0.00001, 0.0));
  currentView.xy += vec2(-direction.y, direction.x) * side * boltWidth;
  gl_Position = projectionMatrix * currentView;
}`;
const fragmentShader = `
uniform vec3 boltColor;
uniform float boltOpacity;
void main() { gl_FragColor = vec4(boltColor, boltOpacity); }
`;

function createBoltSlot(segments, settings) {
  const vertexCount = segments * 6;
  const position = new Float32Array(vertexCount * 3);
  const previous = new Float32Array(vertexCount * 3);
  const next = new Float32Array(vertexCount * 3);
  const side = new Float32Array(vertexCount);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('previous', new THREE.BufferAttribute(previous, 3));
  geometry.setAttribute('next', new THREE.BufferAttribute(next, 3));
  geometry.setAttribute('side', new THREE.BufferAttribute(side, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      boltWidth: { value: settings.boltWidth },
      boltOpacity: { value: 0 },
      boltColor: { value: new THREE.Color(settings.color) }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  const points = Array.from({ length: segments + 1 }, () => new THREE.Vector3());
  return { mesh, geometry, material, position, previous, next, side, points, active: false, age: 0, lifetime: 0, strength: 1 };
}

function writeVertex(slot, vertexIndex, point, before, after, side) {
  const offset = vertexIndex * 3;
  slot.position.set([point.x, point.y, point.z], offset);
  slot.previous.set([before.x, before.y, before.z], offset);
  slot.next.set([after.x, after.y, after.z], offset);
  slot.side[vertexIndex] = side;
}

function updateRibbon(slot, segments) {
  let vertex = 0;
  for (let index = 0; index < segments; index += 1) {
    const a = slot.points[index];
    const b = slot.points[index + 1];
    const beforeA = slot.points[Math.max(0, index - 1)];
    const afterB = slot.points[Math.min(segments, index + 2)];
    writeVertex(slot, vertex++, a, beforeA, b, -1);
    writeVertex(slot, vertex++, a, beforeA, b, 1);
    writeVertex(slot, vertex++, b, a, afterB, -1);
    writeVertex(slot, vertex++, b, a, afterB, -1);
    writeVertex(slot, vertex++, a, beforeA, b, 1);
    writeVertex(slot, vertex++, b, a, afterB, 1);
  }
  ['position', 'previous', 'next', 'side'].forEach((name) => { slot.geometry.getAttribute(name).needsUpdate = true; });
  slot.geometry.computeBoundingSphere();
}

export function createVrPlatformEnergyVfxActor({ getSectorMount, getSectorBounds, runeBridgeActor, settings }) {
  if (typeof getSectorMount !== 'function' || typeof getSectorBounds !== 'function') {
    throw new TypeError('[VrPlatformEnergyVfxActor] Sector-local mount and bounds access are required.');
  }
  if (!runeBridgeActor?.setRevealPresentationProgress) {
    throw new TypeError('[VrPlatformEnergyVfxActor] RuneBridgeActor presentation access is required.');
  }
  const config = { ...settings };
  const segments = Math.max(4, Math.floor(config.segmentsPerBolt));
  const profiles = new Map();
  const pool = Array.from({ length: Math.max(1, Math.floor(config.maxActiveBolts)) }, () => createBoltSlot(segments, config));
  let disposed = false;

  function release(slot) {
    slot.active = false;
    slot.mesh.visible = false;
    slot.mesh.removeFromParent();
  }

  function spawn(profile, strength = 1) {
    const slot = pool.find((candidate) => !candidate.active);
    if (!slot) return false;
    const bounds = profile.bounds;
    const travel = smoothstep(clamp01(profile.elapsed / config.revealTravelSeconds));
    const radialMin = Math.max(0, bounds.min.z);
    const radialMax = Math.max(radialMin + 0.001, bounds.max.z);
    const centerRadial = radialMin + (radialMax - radialMin) * travel;
    const length = Math.max((radialMax - radialMin) * 0.28, 0.08);
    const startRadial = Math.max(radialMin, centerRadial - length);
    const endRadial = Math.min(radialMax, centerRadial + length * strength);
    const angle = (Math.random() * 2 - 1) * HALF_WEDGE_ANGLE;
    const surfaceY = bounds.max.y - config.underfloorOffsetMeters;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const radial = startRadial + (endRadial - startRadial) * t;
      const taper = Math.sin(Math.PI * t);
      slot.points[index].set(
        THREE.MathUtils.clamp(Math.tan(angle) * radial, bounds.min.x, bounds.max.x) + (Math.random() * 2 - 1) * config.displacement * taper,
        surfaceY + (Math.random() * 2 - 1) * config.verticalJitterMeters * taper,
        radial + (Math.random() * 2 - 1) * config.displacement * taper
      );
    }
    updateRibbon(slot, segments);
    slot.active = true;
    slot.age = 0;
    slot.lifetime = config.boltLifetimeSeconds * (strength > 1 ? 1.3 : 1);
    slot.strength = strength;
    slot.material.uniforms.boltWidth.value = config.boltWidth * strength;
    profile.mount.add(slot.mesh);
    slot.mesh.visible = true;
    return true;
  }

  function beginRuneBinderReveal(branchId) {
    const normalized = String(branchId ?? '').toLowerCase();
    if (disposed || !config.enabled || !BRANCH_IDS.includes(normalized) || profiles.has(normalized)) return false;
    const mount = getSectorMount(normalized);
    const bounds = getSectorBounds(normalized);
    if (!mount?.add || !bounds?.min?.isVector3 || !bounds?.max?.isVector3) return false;
    profiles.set(normalized, { branchId: normalized, mount, bounds, elapsed: 0, spawnElapsed: config.spawnIntervalSeconds, finalPulseSpawned: false });
    runeBridgeActor.setRevealPresentationProgress(normalized, 0);
    return true;
  }

  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    pool.forEach((slot) => {
      if (!slot.active) return;
      slot.age += delta;
      const life = clamp01(slot.age / slot.lifetime);
      slot.material.uniforms.boltOpacity.value = config.opacity * slot.strength * Math.sin(Math.PI * life);
      if (life >= 1) release(slot);
    });
    profiles.forEach((profile, branchId) => {
      profile.elapsed += delta;
      const materializeStart = config.revealTravelSeconds;
      const materializeEnd = materializeStart + config.binderMaterializeSeconds;
      const end = materializeEnd + config.finalPulseSeconds + config.boltLifetimeSeconds;
      if (profile.elapsed >= materializeStart) {
        runeBridgeActor.setRevealPresentationProgress(branchId, clamp01((profile.elapsed - materializeStart) / config.binderMaterializeSeconds));
      }
      if (profile.elapsed < materializeEnd) {
        profile.spawnElapsed += delta;
        while (profile.spawnElapsed >= config.spawnIntervalSeconds) {
          profile.spawnElapsed -= config.spawnIntervalSeconds;
          spawn(profile);
        }
      } else if (!profile.finalPulseSpawned) {
        profile.finalPulseSpawned = true;
        spawn(profile, 1.8);
      }
      if (profile.elapsed >= end) {
        runeBridgeActor.setRevealPresentationProgress(branchId, 1);
        profiles.delete(branchId);
      }
    });
  }

  function reset() {
    if (disposed) return;
    profiles.forEach(({ branchId }) => runeBridgeActor.setRevealPresentationProgress(branchId, 1));
    profiles.clear();
    pool.forEach(release);
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    pool.forEach((slot) => { slot.geometry.dispose(); slot.material.dispose(); });
  }

  return { beginRuneBinderReveal, update, reset, dispose };
}
