import * as THREE from '../../vendor/three.js';
import { resolveAsterionResonatorFieldShape } from './asterionResonatorFieldShape.js';

const PERIMETER_POINTS = 16;
const DEPTH_STATIONS = 5;
const RADIAL_SEGMENTS = 4;
const TUBE_RADIUS = 0.018;
const BOW_FRACTION = 0.08;
const MORPH_DURATION_SECONDS = 0.32;

const skinVertexShader = `
varying vec3 vViewNormal;
varying vec3 vViewPosition;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewNormal = normalize(normalMatrix * normal);
  vViewPosition = viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}`;

const skinFragmentShader = `
uniform vec3 color;
uniform float opacity;
varying vec3 vViewNormal;
varying vec3 vViewPosition;
void main() {
  float rim = pow(1.0 - abs(dot(normalize(vViewNormal), normalize(-vViewPosition))), 1.7);
  float strength = 0.12 + 0.88 * rim;
  gl_FragColor = vec4(color * strength, opacity * strength);
}`;

const CORNER_KEYS = Object.freeze([
  ['TopLeft', 'leftFillet'],
  ['TopRight', 'rightFillet'],
  ['BottomRight', 'rightFillet'],
  ['BottomLeft', 'leftFillet']
]);

function writeRoundedPerimeter(shape, plane, target, cornerMidpoints, nominal) {
  const corners = shape.corners;
  const topLeft = plane === 'near' ? corners.nearTopLeft : corners.farTopLeft;
  const topRight = plane === 'near' ? corners.nearTopRight : corners.farTopRight;
  const bottomRight = plane === 'near' ? corners.nearBottomRight : corners.farBottomRight;
  const bottomLeft = plane === 'near' ? corners.nearBottomLeft : corners.farBottomLeft;
  nominal[0] = topLeft.x; nominal[1] = topLeft.y; nominal[2] = topLeft.z;
  nominal[3] = topRight.x; nominal[4] = topRight.y; nominal[5] = topRight.z;
  nominal[6] = bottomRight.x; nominal[7] = bottomRight.y; nominal[8] = bottomRight.z;
  nominal[9] = bottomLeft.x; nominal[10] = bottomLeft.y; nominal[11] = bottomLeft.z;
  CORNER_KEYS.forEach(([, filletKey], cornerIndex) => {
    const previous = (cornerIndex + 3) % 4;
    const next = (cornerIndex + 1) % 4;
    const cornerOffset = cornerIndex * 3;
    const previousOffset = previous * 3;
    const nextOffset = next * 3;
    let incomingLength = 0;
    let outgoingLength = 0;
    for (let axis = 0; axis < 3; axis += 1) {
      incomingLength += (nominal[previousOffset + axis] - nominal[cornerOffset + axis]) ** 2;
      outgoingLength += (nominal[nextOffset + axis] - nominal[cornerOffset + axis]) ** 2;
    }
    const trim = shape.deformation[filletKey] * Math.min(Math.sqrt(incomingLength), Math.sqrt(outgoingLength));
    const cornerTargetOffset = cornerIndex * 12;
    for (let axis = 0; axis < 3; axis += 1) {
      const corner = nominal[cornerOffset + axis];
      const incoming = corner + (nominal[previousOffset + axis] - corner) * (trim / incomingLength ** 0.5);
      const outgoing = corner + (nominal[nextOffset + axis] - corner) * (trim / outgoingLength ** 0.5);
      for (let subdivision = 0; subdivision <= 3; subdivision += 1) {
        const t = subdivision / 3;
        const inverse = 1 - t;
        target[cornerTargetOffset + subdivision * 3 + axis] = inverse * inverse * incoming
          + 2 * inverse * t * corner + t * t * outgoing;
      }
      cornerMidpoints[cornerOffset + axis] = 0.25 * incoming + 0.5 * corner + 0.25 * outgoing;
    }
  });
}

function createTubeIndices(pathPointCounts) {
  const segmentCount = pathPointCounts.reduce((sum, count, index) => sum + count - (index < 2 ? 0 : 1), 0);
  const indices = new Uint16Array(segmentCount * RADIAL_SEGMENTS * 6);
  let vertexBase = 0;
  let indexOffset = 0;
  pathPointCounts.forEach((pointCount, pathIndex) => {
    const closed = pathIndex < 2;
    const pathSegments = closed ? pointCount : pointCount - 1;
    for (let segment = 0; segment < pathSegments; segment += 1) {
      const following = closed ? (segment + 1) % pointCount : segment + 1;
      for (let radial = 0; radial < RADIAL_SEGMENTS; radial += 1) {
        const nextRadial = (radial + 1) % RADIAL_SEGMENTS;
        const current = vertexBase + segment * RADIAL_SEGMENTS + radial;
        const currentNext = vertexBase + segment * RADIAL_SEGMENTS + nextRadial;
        const next = vertexBase + following * RADIAL_SEGMENTS + radial;
        const nextAround = vertexBase + following * RADIAL_SEGMENTS + nextRadial;
        indices.set([current, next, currentNext, currentNext, next, nextAround], indexOffset);
        indexOffset += 6;
      }
    }
    vertexBase += pointCount * RADIAL_SEGMENTS;
  });
  return indices;
}

export function createVrAsterionResonatorFieldPresentation({ parent, fieldActor }) {
  if (!parent?.add || !fieldActor?.getDescriptor || !fieldActor?.subscribe) {
    throw new Error('[AsterionResonatorFieldPresentation] Presentation dependencies are required.');
  }
  const owner = new THREE.Group();
  owner.name = 'VrAsterionResonatorFieldPresentation';
  parent.add(owner);

  const nearPerimeter = new Float32Array(PERIMETER_POINTS * 3);
  const farPerimeter = new Float32Array(PERIMETER_POINTS * 3);
  const nearNominal = new Float32Array(12);
  const farNominal = new Float32Array(12);
  const nearMidpoints = new Float32Array(12);
  const farMidpoints = new Float32Array(12);
  const skinPositions = new Float32Array(PERIMETER_POINTS * DEPTH_STATIONS * 3);
  const skinSourcePositions = new Float32Array(skinPositions.length);
  const skinTargetPositions = new Float32Array(skinPositions.length);
  const skinNormals = new Float32Array(skinPositions.length);
  const skinIndices = new Uint16Array((DEPTH_STATIONS - 1) * PERIMETER_POINTS * 6);
  let skinIndexOffset = 0;
  for (let station = 0; station < DEPTH_STATIONS - 1; station += 1) {
    for (let point = 0; point < PERIMETER_POINTS; point += 1) {
      const nextPoint = (point + 1) % PERIMETER_POINTS;
      const current = station * PERIMETER_POINTS + point;
      const next = station * PERIMETER_POINTS + nextPoint;
      const following = (station + 1) * PERIMETER_POINTS + point;
      const followingNext = (station + 1) * PERIMETER_POINTS + nextPoint;
      skinIndices.set([current, following, next, next, following, followingNext], skinIndexOffset);
      skinIndexOffset += 6;
    }
  }
  const skinGeometry = new THREE.BufferGeometry();
  const skinPositionAttribute = new THREE.BufferAttribute(skinPositions, 3);
  const skinNormalAttribute = new THREE.BufferAttribute(skinNormals, 3);
  if (THREE.DynamicDrawUsage !== undefined && skinPositionAttribute.setUsage) {
    skinPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    skinNormalAttribute.setUsage(THREE.DynamicDrawUsage);
  }
  skinGeometry.setAttribute('position', skinPositionAttribute);
  skinGeometry.setAttribute('normal', skinNormalAttribute);
  skinGeometry.setIndex(new THREE.BufferAttribute(skinIndices, 1));
  const skinMaterial = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0xffffff) }, opacity: { value: 0.055 } },
    vertexShader: skinVertexShader,
    fragmentShader: skinFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const skin = new THREE.Mesh(skinGeometry, skinMaterial);
  skin.name = 'VrAsterionResonatorFieldSkin';
  skin.frustumCulled = false;
  owner.add(skin);

  const pathPointCounts = [PERIMETER_POINTS, PERIMETER_POINTS, 5, 5, 5, 5];
  const tubePointCount = pathPointCounts.reduce((sum, count) => sum + count, 0);
  const tubeCenters = new Float32Array(tubePointCount * 3);
  const tubeSourceCenters = new Float32Array(tubeCenters.length);
  const tubeTargetCenters = new Float32Array(tubeCenters.length);
  const skeletonPositions = new Float32Array(tubePointCount * RADIAL_SEGMENTS * 3);
  const skeletonNormals = new Float32Array(skeletonPositions.length);
  const skeletonGeometry = new THREE.BufferGeometry();
  const skeletonPositionAttribute = new THREE.BufferAttribute(skeletonPositions, 3);
  const skeletonNormalAttribute = new THREE.BufferAttribute(skeletonNormals, 3);
  if (THREE.DynamicDrawUsage !== undefined && skeletonPositionAttribute.setUsage) {
    skeletonPositionAttribute.setUsage(THREE.DynamicDrawUsage);
    skeletonNormalAttribute.setUsage(THREE.DynamicDrawUsage);
  }
  skeletonGeometry.setAttribute('position', skeletonPositionAttribute);
  skeletonGeometry.setAttribute('normal', skeletonNormalAttribute);
  skeletonGeometry.setIndex(new THREE.BufferAttribute(createTubeIndices(pathPointCounts), 1));
  const skeletonMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.3,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const skeleton = new THREE.Mesh(skeletonGeometry, skeletonMaterial);
  skeleton.name = 'VrAsterionResonatorFieldSkeleton';
  skeleton.frustumCulled = false;
  owner.add(skeleton);

  function rewriteTubePath(pointOffset, pointCount, closed) {
    for (let point = 0; point < pointCount; point += 1) {
      const previous = closed ? (point + pointCount - 1) % pointCount : Math.max(0, point - 1);
      const next = closed ? (point + 1) % pointCount : Math.min(pointCount - 1, point + 1);
      const centerOffset = (pointOffset + point) * 3;
      const tangentX = tubeCenters[(pointOffset + next) * 3] - tubeCenters[(pointOffset + previous) * 3];
      const tangentY = tubeCenters[(pointOffset + next) * 3 + 1] - tubeCenters[(pointOffset + previous) * 3 + 1];
      const tangentZ = tubeCenters[(pointOffset + next) * 3 + 2] - tubeCenters[(pointOffset + previous) * 3 + 2];
      const inverseTangentLength = 1 / Math.hypot(tangentX, tangentY, tangentZ);
      const tx = tangentX * inverseTangentLength;
      const ty = tangentY * inverseTangentLength;
      const tz = tangentZ * inverseTangentLength;
      const referenceX = Math.abs(ty) > 0.9 ? 1 : 0;
      const referenceY = Math.abs(ty) > 0.9 ? 0 : 1;
      let nx = referenceY * tz;
      let ny = -referenceX * tz;
      let nz = referenceX * ty - referenceY * tx;
      const inverseNormalLength = 1 / Math.hypot(nx, ny, nz);
      nx *= inverseNormalLength; ny *= inverseNormalLength; nz *= inverseNormalLength;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;
      for (let radial = 0; radial < RADIAL_SEGMENTS; radial += 1) {
        const angle = radial * Math.PI * 2 / RADIAL_SEGMENTS;
        const rx = nx * Math.cos(angle) + bx * Math.sin(angle);
        const ry = ny * Math.cos(angle) + by * Math.sin(angle);
        const rz = nz * Math.cos(angle) + bz * Math.sin(angle);
        const vertexOffset = ((pointOffset + point) * RADIAL_SEGMENTS + radial) * 3;
        skeletonNormals[vertexOffset] = rx;
        skeletonNormals[vertexOffset + 1] = ry;
        skeletonNormals[vertexOffset + 2] = rz;
        skeletonPositions[vertexOffset] = tubeCenters[centerOffset] + rx * TUBE_RADIUS;
        skeletonPositions[vertexOffset + 1] = tubeCenters[centerOffset + 1] + ry * TUBE_RADIUS;
        skeletonPositions[vertexOffset + 2] = tubeCenters[centerOffset + 2] + rz * TUBE_RADIUS;
      }
    }
  }

  function bowOffsetAt(shape, t, z, leftBoundaryZ, rightBoundaryZ) {
    const lateralMix = Math.max(0, Math.min(1,
      (z - leftBoundaryZ) / (rightBoundaryZ - leftBoundaryZ)
    ));
    const envelope = Math.sin(Math.PI * t);
    const leftOffset = -shape.deformation.leftBowSign
      * (shape.deformation.leftMismatch / 2) * BOW_FRACTION * Math.abs(leftBoundaryZ) * envelope;
    const rightOffset = shape.deformation.rightBowSign
      * (shape.deformation.rightMismatch / 2) * BOW_FRACTION * Math.abs(rightBoundaryZ) * envelope;
    return leftOffset + (rightOffset - leftOffset) * lateralMix;
  }

  function buildTarget(shape) {
    writeRoundedPerimeter(shape, 'near', nearPerimeter, nearMidpoints, nearNominal);
    writeRoundedPerimeter(shape, 'far', farPerimeter, farMidpoints, farNominal);
    for (let station = 0; station < DEPTH_STATIONS; station += 1) {
      const t = station / (DEPTH_STATIONS - 1);
      const leftBoundaryZ = shape.corners.nearTopLeft.z
        + (shape.corners.farTopLeft.z - shape.corners.nearTopLeft.z) * t;
      const rightBoundaryZ = shape.corners.nearTopRight.z
        + (shape.corners.farTopRight.z - shape.corners.nearTopRight.z) * t;
      for (let point = 0; point < PERIMETER_POINTS; point += 1) {
        const sourceOffset = point * 3;
        const targetOffset = (station * PERIMETER_POINTS + point) * 3;
        for (let axis = 0; axis < 3; axis += 1) {
          skinTargetPositions[targetOffset + axis] = nearPerimeter[sourceOffset + axis]
            + (farPerimeter[sourceOffset + axis] - nearPerimeter[sourceOffset + axis]) * t;
        }
        skinTargetPositions[targetOffset + 2] += bowOffsetAt(
          shape, t, skinTargetPositions[targetOffset + 2], leftBoundaryZ, rightBoundaryZ
        );
      }
    }
    tubeTargetCenters.set(skinTargetPositions.subarray(0, PERIMETER_POINTS * 3), 0);
    tubeTargetCenters.set(
      skinTargetPositions.subarray((DEPTH_STATIONS - 1) * PERIMETER_POINTS * 3),
      PERIMETER_POINTS * 3
    );
    let railOffset = PERIMETER_POINTS * 2 * 3;
    for (let corner = 0; corner < 4; corner += 1) {
      for (let station = 0; station < DEPTH_STATIONS; station += 1) {
        const t = station / (DEPTH_STATIONS - 1);
        const leftBoundaryZ = shape.corners.nearTopLeft.z
          + (shape.corners.farTopLeft.z - shape.corners.nearTopLeft.z) * t;
        const rightBoundaryZ = shape.corners.nearTopRight.z
          + (shape.corners.farTopRight.z - shape.corners.nearTopRight.z) * t;
        const centerOffset = railOffset;
        for (let axis = 0; axis < 3; axis += 1) {
          const offset = corner * 3 + axis;
          tubeTargetCenters[railOffset++] = nearMidpoints[offset]
            + (farMidpoints[offset] - nearMidpoints[offset]) * t;
        }
        tubeTargetCenters[centerOffset + 2] += bowOffsetAt(
          shape, t, tubeTargetCenters[centerOffset + 2], leftBoundaryZ, rightBoundaryZ
        );
      }
    }
  }

  function uploadGeometry() {
    let pointOffset = 0;
    pathPointCounts.forEach((pointCount, pathIndex) => {
      rewriteTubePath(pointOffset, pointCount, pathIndex < 2);
      pointOffset += pointCount;
    });
    skinGeometry.attributes.position.needsUpdate = true;
    skinGeometry.computeVertexNormals();
    skinGeometry.attributes.normal.needsUpdate = true;
    skeletonGeometry.attributes.position.needsUpdate = true;
    skeletonGeometry.attributes.normal.needsUpdate = true;
  }

  let morphElapsed = 0;
  let morphActive = false;

  function present(descriptor, immediate = false) {
    const shape = resolveAsterionResonatorFieldShape(descriptor);
    if (!shape) {
      morphActive = false;
      owner.visible = false;
      return;
    }
    buildTarget(shape);
    if (!owner.visible || immediate) {
      morphActive = false;
      skinPositions.set(skinTargetPositions);
      tubeCenters.set(tubeTargetCenters);
      owner.visible = true;
      uploadGeometry();
      return;
    }
    skinSourcePositions.set(skinPositions);
    tubeSourceCenters.set(tubeCenters);
    morphElapsed = 0;
    morphActive = true;
  }

  function update(deltaSeconds) {
    if (!morphActive) return;
    morphElapsed += Math.max(0, deltaSeconds || 0);
    const p = Math.min(1, morphElapsed / MORPH_DURATION_SECONDS);
    const smooth = p * p * (3 - 2 * p);
    if (p === 1) {
      skinPositions.set(skinTargetPositions);
      tubeCenters.set(tubeTargetCenters);
    } else {
      for (let index = 0; index < skinPositions.length; index += 1) {
        skinPositions[index] = skinSourcePositions[index]
          + (skinTargetPositions[index] - skinSourcePositions[index]) * smooth;
      }
      for (let index = 0; index < tubeCenters.length; index += 1) {
        tubeCenters[index] = tubeSourceCenters[index]
          + (tubeTargetCenters[index] - tubeSourceCenters[index]) * smooth;
      }
    }
    uploadGeometry();
    if (p === 1) morphActive = false;
  }

  owner.visible = false;
  present(fieldActor.getDescriptor(), true);
  const unsubscribe = fieldActor.subscribe(present);
  function reset() {
    present(fieldActor.getDescriptor(), true);
  }
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    owner.removeFromParent();
    skinGeometry.dispose();
    skinMaterial.dispose();
    skeletonGeometry.dispose();
    skeletonMaterial.dispose();
  }
  return { object: owner, update, reset, dispose };
}
