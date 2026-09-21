import * as THREE from '../../vendor/three.js';
import { resolveAsterionResonatorFieldShape } from './asterionResonatorFieldShape.js';

export const ASTERION_RESONATOR_FIELD_ARC_TUNING = Object.freeze({
  idleSpawnIntervalSeconds: Object.freeze({ minimum: 2.5, maximum: 3.5 }),
  targetSpawnIntervalSeconds: Object.freeze({ minimum: 0.5, maximum: 1 }),
  boltLifetimeSeconds: Object.freeze({ minimum: 0.12, maximum: 0.22 }),
  maxActiveBolts: 2,
  segmentsPerBolt: 12,
  maxBranchesPerBolt: 0,
  color: 0xa9ddff,
  boltWidth: 0.027,
  opacity: 0.48,
  coreWidthFactor: 0.2,
  haloOpacityFactor: 0.3,
  maximumDisplacementMeters: 0.55
});

const TARGET_ID = 'haiku-cosmos';
const STATE = Object.freeze({ NORMAL: 'NORMAL', IDLE: 'BALANCED_IDLE', TARGET: 'BALANCED_TARGET' });
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const randomBetween = (range) => THREE.MathUtils.lerp(range.minimum, range.maximum, Math.random());
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

function createBoltSlot(segments, tuning) {
  const vertexCount = segments * 6;
  const attributes = {
    position: new Float32Array(vertexCount * 3),
    previous: new Float32Array(vertexCount * 3),
    next: new Float32Array(vertexCount * 3),
    side: new Float32Array(vertexCount),
    width: new Float32Array(vertexCount)
  };
  const geometry = new THREE.BufferGeometry();
  Object.entries(attributes).forEach(([name, values]) => {
    const attribute = new THREE.BufferAttribute(values, name === 'side' || name === 'width' ? 1 : 3);
    if (THREE.DynamicDrawUsage !== undefined && attribute.setUsage) attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute(name, attribute);
  });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      boltColor: { value: new THREE.Color(tuning.color) }, boltOpacity: { value: 0 },
      coreWidthFactor: { value: tuning.coreWidthFactor }, haloOpacityFactor: { value: tuning.haloOpacityFactor }
    },
    vertexShader, fragmentShader, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  return {
    mesh, geometry, material, attributes,
    points: Array.from({ length: segments + 1 }, () => new THREE.Vector3()),
    widths: new Float32Array(segments + 1), active: false, age: 0, lifetime: 0, seed: 0
  };
}

function writeVertex(slot, vertexIndex, point, before, after, side, width) {
  const offset = vertexIndex * 3;
  slot.attributes.position.set([point.x, point.y, point.z], offset);
  slot.attributes.previous.set([before.x, before.y, before.z], offset);
  slot.attributes.next.set([after.x, after.y, after.z], offset);
  slot.attributes.side[vertexIndex] = side;
  slot.attributes.width[vertexIndex] = width;
}

function updateRibbon(slot, segments) {
  let vertex = 0;
  for (let index = 0; index < segments; index += 1) {
    const a = slot.points[index]; const b = slot.points[index + 1];
    const before = slot.points[Math.max(0, index - 1)];
    const after = slot.points[Math.min(segments, index + 2)];
    const widthA = slot.widths[index]; const widthB = slot.widths[index + 1];
    writeVertex(slot, vertex++, a, before, b, -1, widthA);
    writeVertex(slot, vertex++, a, before, b, 1, widthA);
    writeVertex(slot, vertex++, b, a, after, -1, widthB);
    writeVertex(slot, vertex++, b, a, after, -1, widthB);
    writeVertex(slot, vertex++, a, before, b, 1, widthA);
    writeVertex(slot, vertex++, b, a, after, 1, widthB);
  }
  Object.keys(slot.attributes).forEach((name) => { slot.geometry.getAttribute(name).needsUpdate = true; });
}

function verticalBoundsAt(shape, x) {
  const { nearTopLeft, nearTopRight, nearBottomLeft, nearBottomRight } = shape.corners;
  const lateral = clamp01((x - nearTopLeft.x) / (nearTopRight.x - nearTopLeft.x));
  return {
    minimum: THREE.MathUtils.lerp(nearBottomLeft.y, nearBottomRight.y, lateral),
    maximum: THREE.MathUtils.lerp(nearTopLeft.y, nearTopRight.y, lateral)
  };
}

export function createVrAsterionResonatorFieldArcPresentation({ parent, fieldActor,
  acquisitionActor, targetAnchor, tuning = ASTERION_RESONATOR_FIELD_ARC_TUNING }) {
  if (!parent?.add || !parent?.worldToLocal || !fieldActor?.getDescriptor
    || !acquisitionActor?.getTargetState || !targetAnchor?.getWorldPosition) {
    throw new TypeError('[AsterionResonatorFieldArcPresentation] Presentation dependencies are required.');
  }
  const owner = new THREE.Group();
  owner.name = 'VrAsterionResonatorFieldArcPresentation';
  parent.add(owner);
  const segments = Math.max(4, Math.floor(tuning.segmentsPerBolt));
  const pool = Array.from({ length: Math.min(2, Math.max(1, Math.floor(tuning.maxActiveBolts))) },
    () => createBoltSlot(segments, tuning));
  pool.forEach(({ mesh }) => owner.add(mesh));
  const targetLocalPosition = new THREE.Vector3();
  let presentationState = STATE.NORMAL;
  let spawnCountdown = 0;
  let disposed = false;

  function release(slot) {
    slot.active = false;
    slot.mesh.visible = false;
    slot.material.uniforms.boltOpacity.value = 0;
  }

  function constrainToShape(point, shape) {
    const { nearTopLeft, nearTopRight, farTopLeft } = shape.corners;
    point.x = THREE.MathUtils.clamp(point.x, nearTopLeft.x, nearTopRight.x);
    point.z = THREE.MathUtils.clamp(point.z, nearTopLeft.z, farTopLeft.z);
    const vertical = verticalBoundsAt(shape, point.x);
    point.y = THREE.MathUtils.clamp(point.y, vertical.minimum, vertical.maximum);
  }

  function generatePath(slot, shape, start, end) {
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const point = slot.points[index].copy(start).lerp(end, t);
      if (index > 0 && index < segments) {
        const envelope = Math.sin(Math.PI * t);
        point.x += (Math.random() * 2 - 1) * tuning.maximumDisplacementMeters * envelope;
        point.y += (Math.random() * 2 - 1) * tuning.maximumDisplacementMeters * envelope;
        point.z += (Math.random() * 2 - 1) * tuning.maximumDisplacementMeters * 0.45 * envelope;
        constrainToShape(point, shape);
      }
      const widthEnvelope = 0.32 + 0.68 * Math.sin(Math.PI * t);
      slot.widths[index] = tuning.boltWidth * widthEnvelope;
    }
    slot.points[0].copy(start);
    slot.points[segments].copy(end);
    updateRibbon(slot, segments);
  }

  function spawn(shape, state) {
    const slot = pool.find((candidate) => !candidate.active);
    if (!slot) return;
    const { nearTopLeft, nearTopRight, farTopLeft } = shape.corners;
    const start = slot.points[0]; const end = slot.points[segments];
    const depth = state === STATE.TARGET
      ? THREE.MathUtils.clamp(targetLocalPosition.z, nearTopLeft.z, farTopLeft.z)
      : THREE.MathUtils.lerp(nearTopLeft.z, farTopLeft.z, Math.random());
    if (state === STATE.TARGET) {
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? nearTopLeft.x : nearTopRight.x;
      const bounds = verticalBoundsAt(shape, x);
      start.set(x, THREE.MathUtils.clamp(targetLocalPosition.y, bounds.minimum, bounds.maximum), depth);
      end.copy(targetLocalPosition);
    } else {
      const leftBounds = verticalBoundsAt(shape, nearTopLeft.x);
      const rightBounds = verticalBoundsAt(shape, nearTopRight.x);
      start.set(nearTopLeft.x, THREE.MathUtils.lerp(leftBounds.minimum, leftBounds.maximum, Math.random()), depth);
      end.set(nearTopRight.x, THREE.MathUtils.lerp(rightBounds.minimum, rightBounds.maximum, Math.random()), depth);
    }
    generatePath(slot, shape, start, end);
    slot.active = true; slot.age = 0; slot.lifetime = randomBetween(tuning.boltLifetimeSeconds);
    slot.seed = Math.random() * 1000; slot.mesh.visible = true;
  }

  function reset() {
    if (disposed) return;
    pool.forEach(release);
    presentationState = STATE.NORMAL;
    spawnCountdown = 0;
  }

  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    pool.forEach((slot) => {
      if (!slot.active) return;
      slot.age += delta;
      const life = clamp01(slot.age / slot.lifetime);
      const flicker = 0.9 + 0.07 * Math.sin(slot.age * 89 + slot.seed)
        + 0.03 * Math.sin(slot.age * 149 + slot.seed * 1.7);
      slot.material.uniforms.boltOpacity.value = tuning.opacity * Math.sin(Math.PI * life) * flicker;
      if (life >= 1) release(slot);
    });
    const descriptor = fieldActor.getDescriptor();
    const targetInside = acquisitionActor.getTargetState(TARGET_ID)?.insideField === true;
    const nextState = descriptor.waterSyncLock !== true
      ? STATE.NORMAL : targetInside ? STATE.TARGET : STATE.IDLE;
    if (nextState !== presentationState) {
      presentationState = nextState;
      spawnCountdown = nextState === STATE.TARGET ? 0
        : nextState === STATE.IDLE ? randomBetween(tuning.idleSpawnIntervalSeconds) : 0;
    }
    if (presentationState === STATE.NORMAL) return;
    if (presentationState === STATE.TARGET) {
      targetAnchor.getWorldPosition(targetLocalPosition);
      parent.worldToLocal(targetLocalPosition);
    }
    const shape = resolveAsterionResonatorFieldShape(descriptor);
    if (!shape) return;
    spawnCountdown -= delta;
    if (spawnCountdown > 0) return;
    spawn(shape, presentationState);
    spawnCountdown = randomBetween(presentationState === STATE.TARGET
      ? tuning.targetSpawnIntervalSeconds : tuning.idleSpawnIntervalSeconds);
  }

  function dispose() {
    if (disposed) return;
    reset();
    owner.removeFromParent();
    pool.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
    disposed = true;
  }

  return { update, reset, dispose };
}
