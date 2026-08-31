import * as THREE from '../../vendor/three.js';

const BRANCH_IDS = Object.freeze(['earth', 'fire', 'wood', 'metal', 'water']);
const HALF_WEDGE_ANGLE = Math.PI / 5;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (value) => value * value * (3 - 2 * value);
const randomBetween = (minimum, maximum) => THREE.MathUtils.lerp(minimum, maximum, Math.random());
const vertexShader = `
attribute vec3 previous; attribute vec3 next; attribute float side; attribute float width;
varying float lateral;
void main() {
  vec4 currentView = modelViewMatrix * vec4(position, 1.0);
  vec2 previousView = (modelViewMatrix * vec4(previous, 1.0)).xy;
  vec2 nextView = (modelViewMatrix * vec4(next, 1.0)).xy;
  vec2 direction = normalize(nextView - previousView + vec2(0.00001, 0.0));
  currentView.xy += vec2(-direction.y, direction.x) * side * width;
  lateral = side;
  gl_Position = projectionMatrix * currentView;
}`;
const fragmentShader = `
uniform vec3 boltColor; uniform float boltOpacity; uniform float coreWidthFactor; uniform float haloOpacityFactor;
varying float lateral;
void main() {
  float distanceFromCenter = abs(lateral);
  float core = 1.0 - smoothstep(coreWidthFactor * 0.45, coreWidthFactor, distanceFromCenter);
  float halo = (1.0 - smoothstep(coreWidthFactor, 1.0, distanceFromCenter)) * haloOpacityFactor;
  float edge = 1.0 - smoothstep(0.72, 1.0, distanceFromCenter);
  vec3 energyColor = mix(boltColor, vec3(1.0), core * 0.92);
  gl_FragColor = vec4(energyColor, boltOpacity * (core + halo) * edge);
}`;

function createBoltSlot(segments, settings) {
  const fractalSegments = 2 ** Math.ceil(Math.log2(segments));
  const vertexCount = segments * 6;
  const position = new Float32Array(vertexCount * 3); const previous = new Float32Array(vertexCount * 3);
  const next = new Float32Array(vertexCount * 3); const side = new Float32Array(vertexCount); const width = new Float32Array(vertexCount);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('previous', new THREE.BufferAttribute(previous, 3));
  geometry.setAttribute('next', new THREE.BufferAttribute(next, 3));
  geometry.setAttribute('side', new THREE.BufferAttribute(side, 1));
  geometry.setAttribute('width', new THREE.BufferAttribute(width, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      boltOpacity: { value: 0 }, boltColor: { value: new THREE.Color(settings.color) },
      coreWidthFactor: { value: settings.coreWidthFactor }, haloOpacityFactor: { value: settings.haloOpacityFactor }
    },
    vertexShader, fragmentShader, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.visible = false;
  return {
    mesh, geometry, material, position, previous, next, side, width,
    points: Array.from({ length: segments + 1 }, () => new THREE.Vector3()), widths: new Float32Array(segments + 1),
    fractalPoints: Array.from({ length: fractalSegments + 1 }, () => new THREE.Vector3()),
    envelope: new THREE.Box3(), fractalSegments, active: false, age: 0, lifetime: 0, strength: 1, brightness: 1, seed: 0
  };
}

function writeVertex(slot, vertexIndex, point, before, after, side, width) {
  const offset = vertexIndex * 3;
  slot.position[offset] = point.x; slot.position[offset + 1] = point.y; slot.position[offset + 2] = point.z;
  slot.previous[offset] = before.x; slot.previous[offset + 1] = before.y; slot.previous[offset + 2] = before.z;
  slot.next[offset] = after.x; slot.next[offset + 1] = after.y; slot.next[offset + 2] = after.z;
  slot.side[vertexIndex] = side; slot.width[vertexIndex] = width;
}

function updateRibbon(slot, segments) {
  let vertex = 0;
  for (let index = 0; index < segments; index += 1) {
    const a = slot.points[index]; const b = slot.points[index + 1];
    const beforeA = slot.points[Math.max(0, index - 1)]; const afterB = slot.points[Math.min(segments, index + 2)];
    const widthA = slot.widths[index]; const widthB = slot.widths[index + 1];
    writeVertex(slot, vertex++, a, beforeA, b, -1, widthA); writeVertex(slot, vertex++, a, beforeA, b, 1, widthA);
    writeVertex(slot, vertex++, b, a, afterB, -1, widthB); writeVertex(slot, vertex++, b, a, afterB, -1, widthB);
    writeVertex(slot, vertex++, a, beforeA, b, 1, widthA); writeVertex(slot, vertex++, b, a, afterB, 1, widthB);
  }
  ['position', 'previous', 'next', 'side', 'width'].forEach((name) => { slot.geometry.getAttribute(name).needsUpdate = true; });
}

function setWidthEnvelope(slot, segments, baseWidth) {
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const envelope = t < 0.46
      ? THREE.MathUtils.lerp(0.45, 1, smoothstep(t / 0.46))
      : THREE.MathUtils.lerp(1, 0.3, smoothstep((t - 0.46) / 0.54));
    slot.widths[index] = baseWidth * envelope;
  }
}

function generateFractalPath(slot, segments, startPoint, endPoint, bounds, config, amplitudeFactor, scratch) {
  const { fractalPoints, fractalSegments } = slot; fractalPoints[0].copy(startPoint); fractalPoints[fractalSegments].copy(endPoint);
  const boltLength = startPoint.distanceTo(endPoint);
  let stride = fractalSegments;
  let amplitude = THREE.MathUtils.clamp(
    boltLength * config.tortuosityFactor,
    config.tortuosityMinMeters,
    config.tortuosityMaxMeters
  ) * amplitudeFactor;
  let level = 0;
  while (stride > 1) {
    const halfStride = stride / 2;
    for (let left = 0; left < fractalSegments; left += stride) {
      const midpoint = left + halfStride;
      const leftPoint = fractalPoints[left]; const rightPoint = fractalPoints[left + stride];
      const point = fractalPoints[midpoint].copy(leftPoint).lerp(rightPoint, 0.5);
      scratch.direction.copy(rightPoint).sub(leftPoint);
      if (scratch.direction.lengthSq() > 1e-12) {
        scratch.direction.normalize(); scratch.reference.set(0, 1, 0);
        scratch.lateral.crossVectors(scratch.reference, scratch.direction);
        if (scratch.lateral.lengthSq() < 1e-8) {
          scratch.reference.set(Math.abs(scratch.direction.x) <= Math.abs(scratch.direction.z) ? 1 : 0, 0,
            Math.abs(scratch.direction.x) <= Math.abs(scratch.direction.z) ? 0 : 1);
          scratch.lateral.crossVectors(scratch.reference, scratch.direction);
        }
        scratch.lateral.normalize(); scratch.depth.crossVectors(scratch.direction, scratch.lateral).normalize();
        const macro = level < 2;
        const lateralMagnitude = macro
          ? THREE.MathUtils.lerp(config.tortuosityMacroMinimumFraction, 1, Math.random())
          : Math.random();
        const lateralSign = Math.random() < 0.5 ? -1 : 1;
        const depthMagnitude = macro
          ? THREE.MathUtils.lerp(config.tortuosityMacroMinimumFraction, 1, Math.random())
          : Math.random();
        const depthSign = Math.random() < 0.5 ? -1 : 1;
        point.addScaledVector(scratch.lateral, lateralSign * lateralMagnitude * amplitude);
        point.addScaledVector(scratch.depth, depthSign * depthMagnitude * amplitude * config.tortuosityDepthFactor);
      }
      point.x = THREE.MathUtils.clamp(point.x, bounds.min.x, bounds.max.x);
      point.y = THREE.MathUtils.clamp(point.y, bounds.min.y, bounds.max.y);
      point.z = THREE.MathUtils.clamp(point.z, bounds.min.z, bounds.max.z);
    }
    stride = halfStride;
    amplitude *= level < 1 ? config.tortuosityMacroDecay : config.tortuosityMicroDecay;
    level += 1;
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
  const config = { ...settings }; const finiteOr = (value, fallback) => Number.isFinite(value) ? value : fallback;
  config.widthVariationMin = finiteOr(config.widthVariationMin, 0.75);
  config.widthVariationMax = Math.max(config.widthVariationMin, finiteOr(config.widthVariationMax, 1.35));
  config.brightnessVariationMin = finiteOr(config.brightnessVariationMin, 0.85);
  config.brightnessVariationMax = Math.max(config.brightnessVariationMin, finiteOr(config.brightnessVariationMax, 1.15));
  config.lifetimeVariationMin = finiteOr(config.lifetimeVariationMin, 0.85);
  config.lifetimeVariationMax = Math.max(config.lifetimeVariationMin, finiteOr(config.lifetimeVariationMax, 1.2));
  config.branchChance = finiteOr(config.branchChance, 0.55);
  config.branchWidthFactor = finiteOr(config.branchWidthFactor, 0.45);
  config.branchBrightnessFactor = finiteOr(config.branchBrightnessFactor, 0.7);
  config.branchLengthFactorMin = finiteOr(config.branchLengthFactorMin, 0.12);
  config.branchLengthFactorMax = Math.max(config.branchLengthFactorMin, finiteOr(config.branchLengthFactorMax, 0.32));
  config.surfaceLiftMeters = finiteOr(config.surfaceLiftMeters, 0.04);
  config.tortuosityFactor = finiteOr(config.tortuosityFactor, 0.14);
  config.tortuosityMinMeters = finiteOr(config.tortuosityMinMeters, 0.06);
  config.tortuosityMaxMeters = Math.max(config.tortuosityMinMeters, finiteOr(config.tortuosityMaxMeters, 0.32));
  config.tortuosityDepthFactor = finiteOr(config.tortuosityDepthFactor, 0.35);
  config.tortuosityMacroDecay = finiteOr(config.tortuosityMacroDecay, 0.58);
  config.tortuosityMicroDecay = finiteOr(config.tortuosityMicroDecay, 0.42);
  config.tortuosityMacroMinimumFraction = finiteOr(config.tortuosityMacroMinimumFraction, 0.35);
  config.coreWidthFactor = finiteOr(config.coreWidthFactor, 0.28);
  config.haloOpacityFactor = finiteOr(config.haloOpacityFactor, 0.45);
  const segments = Math.max(4, Math.floor(config.segmentsPerBolt));
  const revealProfiles = new Map(); const acquisitionProfiles = new Map(); const driveProfiles = new Map();
  const pool = Array.from({ length: Math.max(1, Math.floor(config.maxActiveBolts)) }, () => createBoltSlot(segments, config));
  const tangent = new THREE.Vector3(); const branchDirection = new THREE.Vector3(); const worldTarget = new THREE.Vector3();
  const pathScratch = {
    direction: new THREE.Vector3(), lateral: new THREE.Vector3(), depth: new THREE.Vector3(), reference: new THREE.Vector3()
  };
  let disposed = false;
  function release(slot) { slot.active = false; slot.mesh.visible = false; slot.mesh.removeFromParent(); }
  function acquireSlot() { return pool.find((candidate) => !candidate.active); }
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
  function activate(slot, profile, strength, widthFactor, brightnessFactor, lifetimeFactor) {
    setWidthEnvelope(slot, segments, config.boltWidth * strength * widthFactor);
    updateRibbon(slot, segments); slot.active = true; slot.age = 0;
    slot.lifetime = config.boltLifetimeSeconds * (strength > 1 ? 1.3 : 1) * lifetimeFactor;
    slot.strength = strength; slot.brightness = brightnessFactor; slot.seed = Math.random() * 1000;
    profile.mount.add(slot.mesh); slot.mesh.visible = true;
  }
  function spawnBranches(mainSlot, profile, strength, kind, mainLength) {
    const acquisitionFactor = kind === 'ACQUISITION' ? clamp01((strength - config.acquisitionStrengthMin) / Math.max(0.001, config.acquisitionStrengthMax - config.acquisitionStrengthMin)) : 1;
    const maximum = kind === 'ACQUISITION' ? 1 : config.maxBranchesPerBolt;
    for (let branchIndex = 0; branchIndex < maximum; branchIndex += 1) {
      if (Math.random() >= config.branchChance * acquisitionFactor) continue;
      const branchSlot = acquireSlot(); if (!branchSlot) return;
      const pointIndex = 1 + Math.floor(Math.random() * (segments - 1));
      const startPoint = branchSlot.points[0].copy(mainSlot.points[pointIndex]);
      tangent.copy(mainSlot.points[Math.min(segments, pointIndex + 1)]).sub(mainSlot.points[Math.max(0, pointIndex - 1)]).normalize();
      const sign = Math.random() < 0.5 ? -1 : 1;
      branchDirection.set(-tangent.z * sign, (Math.random() * 2 - 1) * 0.35, tangent.x * sign).normalize();
      const branchLength = mainLength * randomBetween(config.branchLengthFactorMin, config.branchLengthFactorMax);
      const endPoint = branchSlot.points[segments].copy(startPoint).addScaledVector(branchDirection, branchLength);
      branchSlot.envelope.copy(profile.bounds); branchSlot.envelope.min.y -= config.surfaceLiftMeters; branchSlot.envelope.max.y += config.surfaceLiftMeters;
      branchSlot.envelope.expandByPoint(startPoint).expandByPoint(endPoint);
      generateFractalPath(branchSlot, segments, startPoint, endPoint, branchSlot.envelope, config, 0.45, pathScratch);
      activate(branchSlot, profile, strength, config.branchWidthFactor * randomBetween(config.widthVariationMin, config.widthVariationMax), config.branchBrightnessFactor * randomBetween(config.brightnessVariationMin, config.brightnessVariationMax), randomBetween(0.55, 0.75));
    }
  }
  function spawn(profile, strength = 1, kind = 'REVEAL') {
    const slot = acquireSlot(); if (!slot) return false;
    const startPoint = slot.points[0]; const endPoint = slot.points[segments];
    slot.envelope.copy(profile.bounds); slot.envelope.min.y -= config.surfaceLiftMeters; slot.envelope.max.y += config.surfaceLiftMeters;
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
        const target = runeBridgeActor.getEnergyTargetWorldPosition(profile.branchId, worldTarget); if (!target) return false;
        worldTarget.copy(target); profile.mount.updateWorldMatrix(true, false); endPoint.copy(profile.mount.worldToLocal(worldTarget));
        slot.envelope.expandByPoint(startPoint).expandByPoint(endPoint);
      } else {
        surfacePoint(endPoint, profile.bounds, kind === 'DRIVE');
        if (kind === 'ACQUISITION') endPoint.lerp(startPoint, 0.45);
      }
    }
    const tortuosityVariation = randomBetween(0.85, 1.15);
    generateFractalPath(slot, segments, startPoint, endPoint, slot.envelope, config, tortuosityVariation, pathScratch);
    const widthVariation = randomBetween(config.widthVariationMin, config.widthVariationMax);
    const brightnessVariation = randomBetween(config.brightnessVariationMin, config.brightnessVariationMax);
    const lifetimeVariation = randomBetween(config.lifetimeVariationMin, config.lifetimeVariationMax);
    activate(slot, profile, strength, widthVariation, brightnessVariation, lifetimeVariation);
    spawnBranches(slot, profile, strength, kind, startPoint.distanceTo(endPoint));
    return true;
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
    pool.forEach((slot) => {
      if (!slot.active) return; slot.age += delta; const life = clamp01(slot.age / slot.lifetime);
      const flicker = 0.88 + 0.08 * Math.sin(slot.age * 83 + slot.seed) + 0.04 * Math.sin(slot.age * 137 + slot.seed * 1.7);
      slot.material.uniforms.boltOpacity.value = config.opacity * slot.strength * slot.brightness * Math.sin(Math.PI * life) * flicker;
      if (life >= 1) release(slot);
    });
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
