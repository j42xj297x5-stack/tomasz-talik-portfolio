import * as THREE from '../../vendor/three.js';

const ACQUIRING = 'ACQUIRING';
const LOCKED = 'LOCKED';

const vertexShader = `
attribute vec3 previous;
attribute vec3 next;
attribute float side;
attribute float progress;
attribute float width;
varying float vProgress;
varying float vSide;
void main() {
  vec4 currentView = modelViewMatrix * vec4(position, 1.0);
  vec2 previousNdc = (projectionMatrix * modelViewMatrix * vec4(previous, 1.0)).xy;
  vec2 nextNdc = (projectionMatrix * modelViewMatrix * vec4(next, 1.0)).xy;
  vec2 tangent = normalize(nextNdc - previousNdc + vec2(0.000001, 0.0));
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec4 clip = projectionMatrix * currentView;
  clip.xy += normal * side * width * clip.w / max(0.001, -currentView.z);
  gl_Position = clip;
  vProgress = progress;
  vSide = side;
}`;

const fragmentShader = `
uniform float opacity;
uniform float rainbowStrength;
varying float vProgress;
varying float vSide;
vec3 spectral(float t) {
  return 0.58 + 0.42 * cos(6.2831853 * (t + vec3(0.00, 0.33, 0.67)));
}
void main() {
  float core = pow(max(0.0, 1.0 - abs(vSide)), 2.4);
  vec3 tint = mix(vec3(1.0), spectral(vProgress * 0.82), rainbowStrength);
  vec3 color = mix(tint, vec3(1.0), core * 0.72);
  gl_FragColor = vec4(color, opacity * (0.28 + core * 0.72));
}`;

export function createVrAsterionSectorAcquisitionPresentation({ parent, sphere, acquisitionInteraction, progressFloor, settings = {} }) {
  if (!parent?.add || !sphere?.getBeamOriginWorldPosition || !acquisitionInteraction?.getState
    || !progressFloor?.getAsterionSectorTargetWorldPosition) {
    throw new Error('[AsterionSectorAcquisitionPresentation] Presentation dependencies are required.');
  }
  const segments = Math.max(6, Math.round(settings.segments ?? 18));
  const pointCount = segments + 1;
  const positions = new Float32Array(pointCount * 2 * 3);
  const previous = new Float32Array(pointCount * 2 * 3);
  const next = new Float32Array(pointCount * 2 * 3);
  const sides = new Float32Array(pointCount * 2);
  const progresses = new Float32Array(pointCount * 2);
  const widths = new Float32Array(pointCount * 2);
  const indices = new Uint16Array(segments * 6);
  const curvePoints = Array.from({ length: pointCount }, () => new THREE.Vector3());
  for (let index = 0; index < pointCount; index += 1) {
    const t = index / segments;
    const smooth = t * t * (3 - 2 * t);
    const width = THREE.MathUtils.lerp(settings.startWidthMeters ?? 0.006, settings.endWidthMeters ?? 0.14, smooth);
    sides[index * 2] = -1; sides[index * 2 + 1] = 1;
    progresses[index * 2] = t; progresses[index * 2 + 1] = t;
    widths[index * 2] = width; widths[index * 2 + 1] = width;
    if (index < segments) {
      const offset = index * 6;
      const vertex = index * 2;
      indices.set([vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2], offset);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('previous', new THREE.BufferAttribute(previous, 3));
  geometry.setAttribute('next', new THREE.BufferAttribute(next, 3));
  geometry.setAttribute('side', new THREE.BufferAttribute(sides, 1));
  geometry.setAttribute('progress', new THREE.BufferAttribute(progresses, 1));
  geometry.setAttribute('width', new THREE.BufferAttribute(widths, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      opacity: { value: settings.opacity ?? 0.78 },
      rainbowStrength: { value: settings.rainbowStrength ?? 0.6 }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(geometry, material);
  beam.name = 'VrAsterionSectorAcquisitionBeam';
  beam.frustumCulled = false;
  beam.visible = false;
  parent.add(beam);

  const sphereCenter = new THREE.Vector3();
  const target = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const midpoint = new THREE.Vector3();
  const control = new THREE.Vector3();
  const platformNormal = new THREE.Vector3();
  let activeGlyphId = null;
  let pulseElapsed = 0;
  let disposed = false;

  function clearActiveGlow() {
    if (activeGlyphId) progressFloor.setAsterionSectorAcquisitionGlow(activeGlyphId, 0);
    activeGlyphId = null;
  }
  function hide() {
    beam.visible = false;
    clearActiveGlow();
  }
  function writePoint(array, vertexIndex, point) {
    const offset = vertexIndex * 3;
    array[offset] = point.x; array[offset + 1] = point.y; array[offset + 2] = point.z;
  }
  function updateGeometry() {
    const distance = sphereCenter.distanceTo(target);
    direction.subVectors(target, sphereCenter);
    if (direction.lengthSq() <= 1e-8) return false;
    direction.normalize();
    curvePoints[0].copy(sphereCenter).addScaledVector(direction, settings.startOffsetMeters ?? 0.20);
    platformNormal.copy(progressFloor.getPlatformWorldNormal?.() ?? direction).normalize();
    midpoint.addVectors(curvePoints[0], target).multiplyScalar(0.5);
    control.copy(midpoint).addScaledVector(platformNormal, distance * (settings.arcHeightFactor ?? 0.08));
    for (let index = 0; index < pointCount; index += 1) {
      const t = index / segments;
      const inverse = 1 - t;
      curvePoints[index].copy(curvePoints[0]).multiplyScalar(inverse * inverse)
        .addScaledVector(control, 2 * inverse * t).addScaledVector(target, t * t);
    }
    for (let index = 0; index < pointCount; index += 1) {
      const current = curvePoints[index];
      const prior = curvePoints[Math.max(0, index - 1)];
      const following = curvePoints[Math.min(segments, index + 1)];
      writePoint(positions, index * 2, current); writePoint(positions, index * 2 + 1, current);
      writePoint(previous, index * 2, prior); writePoint(previous, index * 2 + 1, prior);
      writePoint(next, index * 2, following); writePoint(next, index * 2 + 1, following);
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.previous.needsUpdate = true;
    geometry.attributes.next.needsUpdate = true;
    return true;
  }
  function update(delta = 0) {
    if (disposed || settings.enabled === false) return;
    const state = acquisitionInteraction.getState();
    const glyphId = state === ACQUIRING ? acquisitionInteraction.getCandidateGlyphId()
      : state === LOCKED ? acquisitionInteraction.getLockedGlyphId() : null;
    if (!glyphId) { hide(); return; }
    const nextTarget = progressFloor.getAsterionSectorTargetWorldPosition(glyphId);
    const nextOrigin = sphere.getBeamOriginWorldPosition();
    if (!nextTarget || !nextOrigin) { hide(); return; }
    if (activeGlyphId !== glyphId) {
      clearActiveGlow();
      activeGlyphId = glyphId;
      pulseElapsed = 0;
    }
    sphereCenter.copy(nextOrigin); target.copy(nextTarget);
    beam.visible = updateGeometry();
    pulseElapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (state === ACQUIRING) {
      const progress = THREE.MathUtils.clamp(acquisitionInteraction.getAcquisitionProgress(), 0, 1);
      const smooth = progress * progress * (3 - 2 * progress);
      const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(pulseElapsed * Math.PI * 2 * (settings.acquisitionPulseHz ?? 3)));
      progressFloor.setAsterionSectorAcquisitionGlow(glyphId, smooth * pulse * (settings.acquisitionGlowOpacity ?? 0.34));
    } else {
      const breathe = 0.96 + 0.04 * Math.sin(pulseElapsed * Math.PI);
      progressFloor.setAsterionSectorAcquisitionGlow(glyphId, breathe * (settings.lockedGlowOpacity ?? 0.42));
    }
  }
  function reset() { if (disposed) return; pulseElapsed = 0; hide(); }
  function dispose() {
    if (disposed) return;
    reset(); disposed = true; beam.removeFromParent(); geometry.dispose(); material.dispose();
  }
  return { object: beam, update, reset, dispose };
}
