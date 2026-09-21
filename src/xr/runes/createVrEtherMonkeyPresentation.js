import * as THREE from '../../vendor/three.js';

// Presentation tuning only. These values do not encode capture or progression truth.
const BEAM_COUNT = 6;
const SOURCE_HEIGHT_M = 1.10;
const SOURCE_RADIUS_M = 0.25;
const SPHERE_BULGE_RADIUS_M = 0.80;
const TOTAL_TWIST_RADIANS = Math.PI;
const WIND_ANGLE_AMPLITUDE = 0.12;
const RADIAL_WIND_AMPLITUDE_M = 0.10;
const VERTICAL_WIND_AMPLITUDE_M = 0.05;
const PULSE_DURATION_SECONDS = 2.4;
const TUBE_RADIUS_M = 0.015;
const PATH_SEGMENTS = 18;
const TUBE_RADIAL_SEGMENTS = 6;

const TAU = Math.PI * 2;
const ORBIT_RADIUS_M = 0.06;
const ORBIT_ENVELOPE_SECONDS = 1.5;
const ETHER_FAMILY_CODE = 'V';
const CAPTURED_STATE = 'CAPTURED';
const RINGS_PER_BEAM = PATH_SEGMENTS + 1;
const VERTICES_PER_BEAM = RINGS_PER_BEAM * TUBE_RADIAL_SEGMENTS;

const smoothstep = (value) => value * value * (3 - 2 * value);

export function createVrEtherMonkeyPresentation({ parent, etherRuneStoneActor, hoverAnchor,
  idleMotionSettings, color }) {
  if (!parent?.add || !parent?.worldToLocal || !hoverAnchor?.add) {
    throw new TypeError('Ether Monkey presentation requires a parent and hover anchor.');
  }
  if (!etherRuneStoneActor?.getRoot || !etherRuneStoneActor?.getState
    || !etherRuneStoneActor?.isPresentationVisible) {
    throw new TypeError('Ether Monkey presentation requires the physical Ether actor.');
  }

  const verticalAmplitude = idleMotionSettings?.verticalAmplitude ?? 0.20;
  const verticalCycleDuration = idleMotionSettings?.verticalCycleDuration ?? 4.8;
  const rotationSpeed = idleMotionSettings?.rotationSpeed ?? 0.12;
  const vertexCount = BEAM_COUNT * VERTICES_PER_BEAM;
  const indexCount = BEAM_COUNT * PATH_SEGMENTS * TUBE_RADIAL_SEGMENTS * 6;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const indices = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);
  const centerlines = new Float32Array(BEAM_COUNT * RINGS_PER_BEAM * 3);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', colorAttribute);

  let indexOffset = 0;
  for (let beam = 0; beam < BEAM_COUNT; beam += 1) {
    const beamVertexOffset = beam * VERTICES_PER_BEAM;
    for (let segment = 0; segment < PATH_SEGMENTS; segment += 1) {
      const ringStart = beamVertexOffset + segment * TUBE_RADIAL_SEGMENTS;
      const nextRingStart = ringStart + TUBE_RADIAL_SEGMENTS;
      for (let side = 0; side < TUBE_RADIAL_SEGMENTS; side += 1) {
        const nextSide = (side + 1) % TUBE_RADIAL_SEGMENTS;
        indices[indexOffset++] = ringStart + side;
        indices[indexOffset++] = nextRingStart + side;
        indices[indexOffset++] = nextRingStart + nextSide;
        indices[indexOffset++] = ringStart + side;
        indices[indexOffset++] = nextRingStart + nextSide;
        indices[indexOffset++] = ringStart + nextSide;
      }
    }
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });
  const tendrils = new THREE.Mesh(geometry, material);
  tendrils.name = 'VrEtherMonkeyEnergyTendrils';
  tendrils.visible = false;
  tendrils.frustumCulled = false;
  tendrils.raycast = () => {};
  parent.add(tendrils);

  const baseColor = new THREE.Color(color);
  const endpoint = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const reference = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const idleRotation = new THREE.Quaternion();
  const initialLocalQuaternion = new THREE.Quaternion();
  const upAxis = new THREE.Vector3(0, 1, 0);
  let elapsedSeconds = 0;
  let active = false;
  let disposed = false;

  function restorePresentationPose(root) {
    if (root?.parent !== hoverAnchor
      || etherRuneStoneActor.getState(ETHER_FAMILY_CODE) !== CAPTURED_STATE) return;
    root.position.set(0, 0, 0);
    root.quaternion.copy(initialLocalQuaternion);
  }

  function updateCenterlines() {
    const pulseAngle = TAU * elapsedSeconds / PULSE_DURATION_SECONDS;
    for (let beam = 0; beam < BEAM_COUNT; beam += 1) {
      const baseAngle = TAU * beam / BEAM_COUNT;
      const phase = baseAngle;
      for (let segment = 0; segment <= PATH_SEGMENTS; segment += 1) {
        const s = segment / PATH_SEGMENTS;
        const endpointEnvelope = Math.sin(Math.PI * s);
        const verticalWind = Math.sin(6 * Math.PI * s - pulseAngle + phase) * endpointEnvelope;
        const theta = baseAngle + TOTAL_TWIST_RADIANS * s + WIND_ANGLE_AMPLITUDE
          * Math.sin(4 * Math.PI * s - pulseAngle + phase) * endpointEnvelope;
        const radius = SOURCE_RADIUS_M * (1 - s) + SPHERE_BULGE_RADIUS_M * endpointEnvelope
          + RADIAL_WIND_AMPLITUDE_M * Math.sin(6 * Math.PI * s - pulseAngle + phase) * endpointEnvelope;
        const offset = (beam * RINGS_PER_BEAM + segment) * 3;
        centerlines[offset] = endpoint.x * s + radius * Math.cos(theta);
        centerlines[offset + 1] = SOURCE_HEIGHT_M * (1 - s) + endpoint.y * s
          + VERTICAL_WIND_AMPLITUDE_M * verticalWind;
        centerlines[offset + 2] = endpoint.z * s + radius * Math.sin(theta);
      }
    }
  }

  function updateTubeGeometry() {
    const pulseAngle = TAU * elapsedSeconds / PULSE_DURATION_SECONDS;
    for (let beam = 0; beam < BEAM_COUNT; beam += 1) {
      const phase = TAU * beam / BEAM_COUNT;
      const pulse = 0.60 + 0.25 * Math.sin(pulseAngle + phase);
      for (let segment = 0; segment <= PATH_SEGMENTS; segment += 1) {
        const centerOffset = (beam * RINGS_PER_BEAM + segment) * 3;
        const previousSegment = Math.max(0, segment - 1);
        const nextSegment = Math.min(PATH_SEGMENTS, segment + 1);
        const previousOffset = (beam * RINGS_PER_BEAM + previousSegment) * 3;
        const nextOffset = (beam * RINGS_PER_BEAM + nextSegment) * 3;
        tangent.set(centerlines[nextOffset] - centerlines[previousOffset],
          centerlines[nextOffset + 1] - centerlines[previousOffset + 1],
          centerlines[nextOffset + 2] - centerlines[previousOffset + 2]).normalize();
        reference.set(0, 1, 0);
        if (Math.abs(tangent.y) > 0.9) reference.set(1, 0, 0);
        normal.crossVectors(tangent, reference).normalize();
        binormal.crossVectors(tangent, normal).normalize();
        const s = segment / PATH_SEGMENTS;
        const longitudinal = 0.92 + 0.08 * Math.sin(TAU * s - pulseAngle + phase);
        const intensity = pulse * longitudinal;
        for (let side = 0; side < TUBE_RADIAL_SEGMENTS; side += 1) {
          const ringAngle = TAU * side / TUBE_RADIAL_SEGMENTS;
          const normalWeight = Math.cos(ringAngle) * TUBE_RADIUS_M;
          const binormalWeight = Math.sin(ringAngle) * TUBE_RADIUS_M;
          const vertexOffset = (beam * VERTICES_PER_BEAM
            + segment * TUBE_RADIAL_SEGMENTS + side) * 3;
          positions[vertexOffset] = centerlines[centerOffset]
            + normal.x * normalWeight + binormal.x * binormalWeight;
          positions[vertexOffset + 1] = centerlines[centerOffset + 1]
            + normal.y * normalWeight + binormal.y * binormalWeight;
          positions[vertexOffset + 2] = centerlines[centerOffset + 2]
            + normal.z * normalWeight + binormal.z * binormalWeight;
          colors[vertexOffset] = baseColor.r * intensity;
          colors[vertexOffset + 1] = baseColor.g * intensity;
          colors[vertexOffset + 2] = baseColor.b * intensity;
        }
      }
    }
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  }

  function update(deltaSeconds = 0) {
    if (disposed) return;
    const root = etherRuneStoneActor.getRoot(ETHER_FAMILY_CODE);
    const shouldBeActive = etherRuneStoneActor.getState(ETHER_FAMILY_CODE) === CAPTURED_STATE
      && etherRuneStoneActor.isPresentationVisible() && etherRuneStoneActor.object?.visible !== false
      && root?.visible !== false && root?.parent === hoverAnchor;
    if (!shouldBeActive) {
      if (active) restorePresentationPose(root);
      active = false;
      elapsedSeconds = 0;
      tendrils.visible = false;
      return;
    }
    if (!active) {
      active = true;
      elapsedSeconds = 0;
      initialLocalQuaternion.copy(root.quaternion);
    } else {
      elapsedSeconds += Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    }
    const envelopeProgress = Math.min(1, elapsedSeconds / ORBIT_ENVELOPE_SECONDS);
    const envelope = smoothstep(envelopeProgress);
    root.position.set(
      envelope * ORBIT_RADIUS_M * Math.cos(rotationSpeed * elapsedSeconds),
      verticalAmplitude * 0.5 * Math.sin(TAU * elapsedSeconds / verticalCycleDuration),
      envelope * ORBIT_RADIUS_M * Math.sin(rotationSpeed * elapsedSeconds)
    );
    root.quaternion.copy(initialLocalQuaternion).multiply(
      idleRotation.setFromAxisAngle(upAxis, rotationSpeed * elapsedSeconds));
    root.updateWorldMatrix(true, false);
    root.getWorldPosition(endpoint);
    parent.worldToLocal(endpoint);
    updateCenterlines();
    updateTubeGeometry();
    tendrils.visible = true;
  }

  function reset() {
    if (disposed) return;
    restorePresentationPose(etherRuneStoneActor.getRoot(ETHER_FAMILY_CODE));
    elapsedSeconds = 0;
    active = false;
    tendrils.visible = false;
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    tendrils.removeFromParent();
    geometry.dispose();
    material.dispose();
  }

  return { update, reset, dispose };
}
