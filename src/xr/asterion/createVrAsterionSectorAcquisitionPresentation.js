import * as THREE from '../../vendor/three.js';

const ACQUIRING = 'ACQUIRING';
const LOCKED = 'LOCKED';

const tubeVertexShader = `
attribute float progress;
varying float vProgress;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vProgress = progress;
  vViewNormal = normalize(normalMatrix * normal);
  vViewPosition = viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}`;

const spectralFragmentShader = `
uniform float opacity;
uniform float rainbowStrength;
varying float vProgress;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
vec3 spectral(float t) {
  return 0.58 + 0.42 * cos(6.2831853 * (t + vec3(0.00, 0.33, 0.67)));
}
void main() {
  vec3 viewDirection = normalize(-vViewPosition);
  float rim = pow(1.0 - abs(dot(normalize(vViewNormal), viewDirection)), 1.7);
  float surfaceEnergy = 0.62 + rim * 0.38;
  vec3 tint = mix(vec3(1.0), spectral(vProgress * 0.82), rainbowStrength);
  vec3 color = mix(tint, vec3(1.0), rim * 0.55);
  gl_FragColor = vec4(color * surfaceEnergy, opacity * surfaceEnergy);
}`;

const terminalVertexShader = `
varying vec3 vViewNormal;
varying vec3 vViewPosition;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewNormal = normalize(normalMatrix * normal);
  vViewPosition = viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}`;

const terminalFragmentShader = `
uniform float opacity;
uniform float rainbowStrength;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
vec3 spectral(float t) {
  return 0.58 + 0.42 * cos(6.2831853 * (t + vec3(0.00, 0.33, 0.67)));
}
void main() {
  vec3 normal = normalize(vViewNormal);
  float rim = pow(1.0 - abs(dot(normal, normalize(-vViewPosition))), 1.5);
  vec3 tint = mix(vec3(1.0), spectral(normal.y * 0.12 + 0.72), rainbowStrength * 0.45);
  gl_FragColor = vec4(mix(tint, vec3(1.0), rim * 0.7), opacity * (0.34 + rim * 0.66));
}`;

export function createVrAsterionSectorAcquisitionPresentation({ parent, sphere, acquisitionInteraction, progressFloor, settings = {} }) {
  if (!parent?.add || !sphere?.getBeamOriginWorldPosition || !acquisitionInteraction?.getState
    || !progressFloor?.getAsterionSectorTargetWorldPosition) {
    throw new Error('[AsterionSectorAcquisitionPresentation] Presentation dependencies are required.');
  }
  const segments = Math.max(6, Math.round(settings.segments ?? 18));
  const radialSegments = Math.max(3, Math.round(settings.radialSegments ?? 8));
  const pointCount = segments + 1;
  const vertexCount = pointCount * radialSegments;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const progresses = new Float32Array(vertexCount);
  const indices = new Uint16Array(segments * radialSegments * 6);
  const curvePoints = Array.from({ length: pointCount }, () => new THREE.Vector3());
  const tangents = Array.from({ length: pointCount }, () => new THREE.Vector3());
  const frameNormals = Array.from({ length: pointCount }, () => new THREE.Vector3());
  const frameBinormals = Array.from({ length: pointCount }, () => new THREE.Vector3());
  for (let longitudinal = 0; longitudinal < pointCount; longitudinal += 1) {
    const t = longitudinal / segments;
    for (let radial = 0; radial < radialSegments; radial += 1) progresses[longitudinal * radialSegments + radial] = t;
    if (longitudinal >= segments) continue;
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const nextRadial = (radial + 1) % radialSegments;
      const current = longitudinal * radialSegments + radial;
      const currentNext = longitudinal * radialSegments + nextRadial;
      const following = (longitudinal + 1) * radialSegments + radial;
      const followingNext = (longitudinal + 1) * radialSegments + nextRadial;
      const offset = (longitudinal * radialSegments + radial) * 6;
      indices.set([current, following, currentNext, currentNext, following, followingNext], offset);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('progress', new THREE.BufferAttribute(progresses, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: settings.opacity ?? 0.78 }, rainbowStrength: { value: settings.rainbowStrength ?? 0.6 } },
    vertexShader: tubeVertexShader,
    fragmentShader: spectralFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const owner = new THREE.Group();
  owner.name = 'VrAsterionSectorAcquisitionPresentation';
  const beam = new THREE.Mesh(geometry, material);
  beam.name = 'VrAsterionSectorAcquisitionBeam';
  beam.frustumCulled = false;
  beam.visible = false;
  owner.add(beam);

  const terminalGeometry = new THREE.SphereGeometry(1, radialSegments, Math.max(4, Math.round(radialSegments * 0.75)));
  const terminalMaterial = new THREE.ShaderMaterial({
    uniforms: {
      opacity: { value: settings.terminalBloomOpacity ?? 0.35 },
      rainbowStrength: { value: settings.rainbowStrength ?? 0.6 }
    },
    vertexShader: terminalVertexShader,
    fragmentShader: terminalFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
  terminal.name = 'VrAsterionSectorAcquisitionTerminalBloom';
  terminal.frustumCulled = false;
  terminal.visible = false;
  owner.add(terminal);
  parent.add(owner);

  const sphereCenter = new THREE.Vector3();
  const target = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const midpoint = new THREE.Vector3();
  const control = new THREE.Vector3();
  const platformNormal = new THREE.Vector3();
  const canonicalAxis = new THREE.Vector3();
  const transportedNormal = new THREE.Vector3();
  const radialOffset = new THREE.Vector3();
  const worldVertex = new THREE.Vector3();
  const localVertex = new THREE.Vector3();
  const localNormal = new THREE.Vector3();
  const parentInverse = new THREE.Matrix4();
  const normalMatrix = new THREE.Matrix3();
  const transport = new THREE.Quaternion();
  let activeGlyphId = null;
  let pulseElapsed = 0;
  let disposed = false;

  function clearActiveGlow() {
    if (activeGlyphId) progressFloor.setAsterionSectorAcquisitionGlow(activeGlyphId, 0);
    activeGlyphId = null;
  }
  function hide() {
    beam.visible = false;
    terminal.visible = false;
    clearActiveGlow();
  }
  function writeVector(array, vertexIndex, vector) {
    const offset = vertexIndex * 3;
    array[offset] = vector.x; array[offset + 1] = vector.y; array[offset + 2] = vector.z;
  }
  function chooseLeastParallelAxis(tangent) {
    const x = Math.abs(tangent.x), y = Math.abs(tangent.y), z = Math.abs(tangent.z);
    if (x <= y && x <= z) return canonicalAxis.set(1, 0, 0);
    if (y <= z) return canonicalAxis.set(0, 1, 0);
    return canonicalAxis.set(0, 0, 1);
  }
  function updateGeometry() {
    const distance = sphereCenter.distanceTo(target);
    direction.subVectors(target, sphereCenter);
    if (direction.lengthSq() <= 1e-8) return false;
    curvePoints[0].copy(sphereCenter);
    platformNormal.copy(progressFloor.getPlatformWorldNormal?.() ?? direction).normalize();
    midpoint.addVectors(sphereCenter, target).multiplyScalar(0.5);
    control.copy(midpoint).addScaledVector(platformNormal, distance * (settings.arcHeightFactor ?? 0.08));
    for (let index = 0; index < pointCount; index += 1) {
      const t = index / segments;
      const inverse = 1 - t;
      curvePoints[index].copy(sphereCenter).multiplyScalar(inverse * inverse)
        .addScaledVector(control, 2 * inverse * t).addScaledVector(target, t * t);
      tangents[index].subVectors(control, sphereCenter).multiplyScalar(2 * inverse)
        .addScaledVector(direction.subVectors(target, control), 2 * t).normalize();
    }
    transportedNormal.copy(platformNormal).addScaledVector(tangents[0], -platformNormal.dot(tangents[0]));
    if (transportedNormal.lengthSq() < 1e-6) {
      transportedNormal.copy(chooseLeastParallelAxis(tangents[0]));
      transportedNormal.addScaledVector(tangents[0], -transportedNormal.dot(tangents[0]));
    }
    frameNormals[0].copy(transportedNormal).normalize();
    frameBinormals[0].crossVectors(tangents[0], frameNormals[0]).normalize();
    for (let index = 1; index < pointCount; index += 1) {
      transport.setFromUnitVectors(tangents[index - 1], tangents[index]);
      frameNormals[index].copy(frameNormals[index - 1]).applyQuaternion(transport);
      frameNormals[index].addScaledVector(tangents[index], -frameNormals[index].dot(tangents[index])).normalize();
      frameBinormals[index].crossVectors(tangents[index], frameNormals[index]).normalize();
    }
    owner.updateWorldMatrix(true, false);
    parentInverse.copy(owner.matrixWorld).invert();
    normalMatrix.getNormalMatrix(parentInverse);
    const startRadius = settings.startRadiusMeters ?? 0.0015;
    const endRadius = settings.endRadiusMeters ?? 0.065;
    for (let longitudinal = 0; longitudinal < pointCount; longitudinal += 1) {
      const t = longitudinal / segments;
      const smooth = t * t * (3 - 2 * t);
      const radius = THREE.MathUtils.lerp(startRadius, endRadius, smooth);
      for (let radial = 0; radial < radialSegments; radial += 1) {
        const angle = radial / radialSegments * Math.PI * 2;
        radialOffset.copy(frameNormals[longitudinal]).multiplyScalar(Math.cos(angle))
          .addScaledVector(frameBinormals[longitudinal], Math.sin(angle));
        const vertexIndex = longitudinal * radialSegments + radial;
        worldVertex.copy(curvePoints[longitudinal]).addScaledVector(radialOffset, radius);
        localVertex.copy(worldVertex).applyMatrix4(parentInverse);
        localNormal.copy(radialOffset).applyMatrix3(normalMatrix).normalize();
        writeVector(positions, vertexIndex, localVertex);
        writeVector(normals, vertexIndex, localNormal);
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    terminal.position.copy(target).applyMatrix4(parentInverse);
    terminal.scale.setScalar(endRadius * (settings.terminalBloomScale ?? 1.1));
    terminal.visible = true;
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
    if (!beam.visible) terminal.visible = false;
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
    reset(); disposed = true; owner.removeFromParent(); geometry.dispose(); material.dispose();
    terminalGeometry.dispose(); terminalMaterial.dispose();
  }
  return { object: owner, update, reset, dispose };
}
