import * as THREE from '../../vendor/three.js';

const BRANCH_IDS = Object.freeze(['earth', 'fire', 'wood', 'metal', 'water']);
const HALF_WEDGE_ANGLE = Math.PI / 5;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (value) => value * value * (3 - 2 * value);
const vertexShader = `
attribute vec3 previous; attribute vec3 next; attribute float side; uniform float boltWidth;
void main() { vec4 currentView = modelViewMatrix * vec4(position, 1.0); vec2 previousView = (modelViewMatrix * vec4(previous, 1.0)).xy; vec2 nextView = (modelViewMatrix * vec4(next, 1.0)).xy; vec2 direction = normalize(nextView - previousView + vec2(0.00001, 0.0)); currentView.xy += vec2(-direction.y, direction.x) * side * boltWidth; gl_Position = projectionMatrix * currentView; }`;
const fragmentShader = `uniform vec3 boltColor; uniform float boltOpacity; void main() { gl_FragColor = vec4(boltColor, boltOpacity); }`;

function createBoltSlot(segments, settings) {
  const fractalSegments = 2 ** Math.ceil(Math.log2(segments));
  const vertexCount = segments * 6;
  const position = new Float32Array(vertexCount * 3); const previous = new Float32Array(vertexCount * 3);
  const next = new Float32Array(vertexCount * 3); const side = new Float32Array(vertexCount);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('previous', new THREE.BufferAttribute(previous, 3));
  geometry.setAttribute('next', new THREE.BufferAttribute(next, 3));
  geometry.setAttribute('side', new THREE.BufferAttribute(side, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { boltWidth: { value: settings.boltWidth }, boltOpacity: { value: 0 }, boltColor: { value: new THREE.Color(settings.color) } },
    vertexShader, fragmentShader, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.visible = false;
  return { mesh, geometry, material, position, previous, next, side,
    points: Array.from({ length: segments + 1 }, () => new THREE.Vector3()),
    fractalPoints: Array.from({ length: fractalSegments + 1 }, () => new THREE.Vector3()),
    fractalSegments, active: false, age: 0, lifetime: 0, strength: 1 };
}

function writeVertex(slot, vertexIndex, point, before, after, side) {
  const offset = vertexIndex * 3;
  slot.position.set([point.x, point.y, point.z], offset); slot.previous.set([before.x, before.y, before.z], offset);
  slot.next.set([after.x, after.y, after.z], offset); slot.side[vertexIndex] = side;
}
function updateRibbon(slot, segments) {
  let vertex = 0;
  for (let index = 0; index < segments; index += 1) {
    const a = slot.points[index]; const b = slot.points[index + 1];
    const beforeA = slot.points[Math.max(0, index - 1)]; const afterB = slot.points[Math.min(segments, index + 2)];
    writeVertex(slot, vertex++, a, beforeA, b, -1); writeVertex(slot, vertex++, a, beforeA, b, 1);
    writeVertex(slot, vertex++, b, a, afterB, -1); writeVertex(slot, vertex++, b, a, afterB, -1);
    writeVertex(slot, vertex++, a, beforeA, b, 1); writeVertex(slot, vertex++, b, a, afterB, 1);
  }
  ['position', 'previous', 'next', 'side'].forEach((name) => { slot.geometry.getAttribute(name).needsUpdate = true; });
  slot.geometry.computeBoundingSphere();
}
function generateFractalPath(slot, segments, startPoint, endPoint, bounds, displacement, verticalJitter) {
  const { fractalPoints, fractalSegments } = slot; fractalPoints[0].copy(startPoint); fractalPoints[fractalSegments].copy(endPoint);
  let stride = fractalSegments; let amplitude = displacement;
  while (stride > 1) {
    const halfStride = stride / 2;
    for (let left = 0; left < fractalSegments; left += stride) {
      const midpoint = left + halfStride;
      const point = fractalPoints[midpoint].copy(fractalPoints[left]).lerp(fractalPoints[left + stride], 0.5);
      point.x += (Math.random() * 2 - 1) * amplitude; point.y += (Math.random() * 2 - 1) * Math.min(verticalJitter, amplitude);
      point.z += (Math.random() * 2 - 1) * amplitude * 0.12;
      point.x = THREE.MathUtils.clamp(point.x, bounds.min.x, bounds.max.x);
      point.y = THREE.MathUtils.clamp(point.y, bounds.min.y, bounds.max.y);
      point.z = THREE.MathUtils.clamp(point.z, bounds.min.z, bounds.max.z);
    }
    stride = halfStride; amplitude *= 0.55;
  }
  for (let index = 0; index <= segments; index += 1) {
    const position = (index / segments) * fractalSegments; const before = Math.floor(position);
    slot.points[index].copy(fractalPoints[before]).lerp(fractalPoints[Math.min(fractalSegments, before + 1)], position - before);
  }
  slot.points[0].copy(startPoint); slot.points[segments].copy(endPoint);
}

export function createVrPlatformEnergyVfxActor({ getSectorMount, getSectorBounds, runeBridgeActor, settings }) {
  if (typeof getSectorMount !== 'function' || typeof getSectorBounds !== 'function') throw new TypeError('[VrPlatformEnergyVfxActor] Sector-local mount and bounds access are required.');
  if (!runeBridgeActor?.setRevealPresentationProgress || !runeBridgeActor?.getEnergyTargetWorldPosition) throw new TypeError('[VrPlatformEnergyVfxActor] RuneBridgeActor presentation access is required.');
  const config = { ...settings }; const segments = Math.max(4, Math.floor(config.segmentsPerBolt));
  const revealProfiles = new Map(); const acquisitionProfiles = new Map(); const driveProfiles = new Map();
  const pool = Array.from({ length: Math.max(1, Math.floor(config.maxActiveBolts)) }, () => createBoltSlot(segments, config));
  let disposed = false;
  function release(slot) { slot.active = false; slot.mesh.visible = false; slot.mesh.removeFromParent(); }
  function resolveProfile(branchId) {
    const normalized = String(branchId ?? '').toLowerCase(); if (!BRANCH_IDS.includes(normalized)) return null;
    const mount = getSectorMount(normalized); const bounds = getSectorBounds(normalized);
    return mount?.add && bounds?.min?.isVector3 && bounds?.max?.isVector3 ? { branchId: normalized, mount, bounds, spawnElapsed: 0 } : null;
  }
  function surfacePoint(target, bounds, broad = false) {
    const radialMin = Math.max(0, bounds.min.z); const radialMax = Math.max(radialMin + 0.001, bounds.max.z);
    const radial = THREE.MathUtils.lerp(radialMin, radialMax, Math.random()); const angle = (Math.random() * 2 - 1) * HALF_WEDGE_ANGLE;
    target.set(THREE.MathUtils.clamp(Math.tan(angle) * radial, bounds.min.x, bounds.max.x), bounds.max.y - config.underfloorOffsetMeters, radial);
    if (!broad) target.z = THREE.MathUtils.lerp(radialMin, radialMax, 0.25 + Math.random() * 0.5);
    return target;
  }
  function spawn(profile, strength = 1, kind = 'REVEAL') {
    const slot = pool.find((candidate) => !candidate.active); if (!slot) return false;
    const startPoint = slot.points[0]; const endPoint = slot.points[segments]; let envelope = profile.bounds;
    if (kind === 'REVEAL') {
      const travel = smoothstep(clamp01(profile.elapsed / config.revealTravelSeconds));
      const radialMin = Math.max(0, profile.bounds.min.z); const radialMax = Math.max(radialMin + 0.001, profile.bounds.max.z);
      const center = THREE.MathUtils.lerp(radialMin, radialMax, travel); const length = Math.max((radialMax - radialMin) * 0.28, 0.08);
      const angle = (Math.random() * 2 - 1) * HALF_WEDGE_ANGLE; const y = profile.bounds.max.y - config.underfloorOffsetMeters;
      startPoint.set(THREE.MathUtils.clamp(Math.tan(angle) * Math.max(radialMin, center - length), profile.bounds.min.x, profile.bounds.max.x), y, Math.max(radialMin, center - length));
      endPoint.set(THREE.MathUtils.clamp(Math.tan(angle) * Math.min(radialMax, center + length * strength), profile.bounds.min.x, profile.bounds.max.x), y, Math.min(radialMax, center + length * strength));
    } else {
      surfacePoint(startPoint, profile.bounds, kind === 'DRIVE');
      if (kind === 'BINDER') {
        const worldTarget = runeBridgeActor.getEnergyTargetWorldPosition(profile.branchId); if (!worldTarget) return false;
        profile.mount.updateWorldMatrix(true, false); endPoint.copy(profile.mount.worldToLocal(worldTarget.clone()));
        envelope = new THREE.Box3(profile.bounds.min.clone(), profile.bounds.max.clone()).expandByPoint(startPoint).expandByPoint(endPoint);
      } else {
        surfacePoint(endPoint, profile.bounds, kind === 'DRIVE');
        if (kind === 'ACQUISITION') endPoint.lerp(startPoint, 0.45);
      }
    }
    generateFractalPath(slot, segments, startPoint, endPoint, envelope, config.displacement, config.verticalJitterMeters);
    updateRibbon(slot, segments); slot.active = true; slot.age = 0; slot.lifetime = config.boltLifetimeSeconds * (strength > 1 ? 1.3 : 1); slot.strength = strength;
    slot.material.uniforms.boltWidth.value = config.boltWidth * strength; profile.mount.add(slot.mesh); slot.mesh.visible = true; return true;
  }
  function beginRuneBinderReveal(branchId) {
    const profile = resolveProfile(branchId); if (disposed || !config.enabled || !profile || revealProfiles.has(profile.branchId)) return false;
    Object.assign(profile, { elapsed: 0, spawnElapsed: config.spawnIntervalSeconds, finalPulseSpawned: false }); revealProfiles.set(profile.branchId, profile);
    runeBridgeActor.setRevealPresentationProgress(profile.branchId, 0); return true;
  }
  function setSectorAcquisitionEnergy(branchId, strength) {
    const normalized = String(branchId ?? '').toLowerCase(); const value = clamp01(Number.isFinite(strength) ? strength : 0);
    if (disposed || !config.enabled || value <= 0) { acquisitionProfiles.delete(normalized); return false; }
    const profile = acquisitionProfiles.get(normalized) ?? resolveProfile(normalized); if (!profile) return false;
    profile.strength = value; acquisitionProfiles.set(normalized, profile); return true;
  }
  function setFloorDriveEnergy(branchId, active) {
    const normalized = String(branchId ?? '').toLowerCase();
    if (disposed || !config.enabled || !active) { driveProfiles.delete(normalized); return false; }
    const profile = driveProfiles.get(normalized) ?? resolveProfile(normalized); if (!profile) return false;
    driveProfiles.set(normalized, profile); return true;
  }
  function update(deltaSeconds = 0) {
    if (disposed) return; const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    pool.forEach((slot) => { if (!slot.active) return; slot.age += delta; const life = clamp01(slot.age / slot.lifetime); slot.material.uniforms.boltOpacity.value = config.opacity * slot.strength * Math.sin(Math.PI * life); if (life >= 1) release(slot); });
    revealProfiles.forEach((profile, branchId) => {
      profile.elapsed += delta; const materializeStart = config.revealTravelSeconds; const materializeEnd = materializeStart + config.binderMaterializeSeconds;
      if (profile.elapsed >= materializeStart) runeBridgeActor.setRevealPresentationProgress(branchId, clamp01((profile.elapsed - materializeStart) / config.binderMaterializeSeconds));
      if (profile.elapsed < materializeEnd) { profile.spawnElapsed += delta; while (profile.spawnElapsed >= config.spawnIntervalSeconds) { profile.spawnElapsed -= config.spawnIntervalSeconds; spawn(profile); } }
      else if (!profile.finalPulseSpawned) { profile.finalPulseSpawned = true; spawn(profile, 1.8); }
      if (profile.elapsed >= materializeEnd + config.finalPulseSeconds + config.boltLifetimeSeconds) { runeBridgeActor.setRevealPresentationProgress(branchId, 1); revealProfiles.delete(branchId); }
    });
    acquisitionProfiles.forEach((profile) => {
      const shaped = smoothstep(profile.strength); const interval = THREE.MathUtils.lerp(config.acquisitionSpawnIntervalStartSeconds, config.acquisitionSpawnIntervalEndSeconds, shaped);
      profile.spawnElapsed += delta; while (profile.spawnElapsed >= interval) { profile.spawnElapsed -= interval; spawn(profile, THREE.MathUtils.lerp(config.acquisitionStrengthMin, config.acquisitionStrengthMax, shaped), 'ACQUISITION'); }
    });
    driveProfiles.forEach((profile) => {
      profile.spawnElapsed += delta; while (profile.spawnElapsed >= config.driveSpawnIntervalSeconds) {
        profile.spawnElapsed -= config.driveSpawnIntervalSeconds;
        const binder = Math.random() < config.driveBinderBoltChance; if (!binder || !spawn(profile, config.driveStrength, 'BINDER')) spawn(profile, config.driveStrength, 'DRIVE');
      }
    });
  }
  function reset() { if (disposed) return; revealProfiles.forEach(({ branchId }) => runeBridgeActor.setRevealPresentationProgress(branchId, 1)); revealProfiles.clear(); acquisitionProfiles.clear(); driveProfiles.clear(); pool.forEach(release); }
  function dispose() { if (disposed) return; reset(); disposed = true; pool.forEach((slot) => { slot.geometry.dispose(); slot.material.dispose(); }); }
  return { beginRuneBinderReveal, setSectorAcquisitionEnergy, setFloorDriveEnergy, update, reset, dispose };
}
