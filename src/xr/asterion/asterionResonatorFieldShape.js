const DEPTH_PLANES = Object.freeze([10, 50, 90, 130]);
const SIDE_PROFILES = Object.freeze([
  Object.freeze({ lateralHalfExtent: 23, verticalHalfExtent: 7 }),
  Object.freeze({ lateralHalfExtent: 13, verticalHalfExtent: 13 }),
  Object.freeze({ lateralHalfExtent: 7, verticalHalfExtent: 23 })
]);

const FILLETS_BY_MISMATCH = Object.freeze([0.08, 0.15, 0.22]);

function createCorner(x, y, z) {
  return Object.freeze({ x, y, z });
}

export function resolveAsterionResonatorFieldShape(descriptor) {
  if (descriptor?.fullActiveCore !== true) return null;

  const { alpha, beta, gamma } = descriptor.levels;
  const zNear = DEPTH_PLANES[gamma - 1];
  const zFar = DEPTH_PLANES[gamma];
  const leftProfile = SIDE_PROFILES[alpha - 1];
  const rightProfile = SIDE_PROFILES[beta - 1];
  const leftX = -leftProfile.lateralHalfExtent;
  const rightX = rightProfile.lateralHalfExtent;
  const leftTopY = leftProfile.verticalHalfExtent;
  const leftBottomY = -leftProfile.verticalHalfExtent;
  const rightTopY = rightProfile.verticalHalfExtent;
  const rightBottomY = -rightProfile.verticalHalfExtent;
  const leftMismatch = Math.abs(alpha - gamma);
  const rightMismatch = Math.abs(beta - gamma);
  const levels = Object.freeze({ alpha, beta, gamma });
  const corners = Object.freeze({
    nearTopLeft: createCorner(leftX, leftTopY, zNear),
    nearTopRight: createCorner(rightX, rightTopY, zNear),
    nearBottomLeft: createCorner(leftX, leftBottomY, zNear),
    nearBottomRight: createCorner(rightX, rightBottomY, zNear),
    farTopLeft: createCorner(leftX, leftTopY, zFar),
    farTopRight: createCorner(rightX, rightTopY, zFar),
    farBottomLeft: createCorner(leftX, leftBottomY, zFar),
    farBottomRight: createCorner(rightX, rightBottomY, zFar)
  });
  const deformation = Object.freeze({
    leftMismatch,
    rightMismatch,
    leftFillet: FILLETS_BY_MISMATCH[leftMismatch],
    rightFillet: FILLETS_BY_MISMATCH[rightMismatch],
    leftBowSign: Math.sign(alpha - gamma),
    rightBowSign: Math.sign(beta - gamma)
  });

  return Object.freeze({
    levels,
    depthBand: descriptor.depthBand,
    corners,
    deformation
  });
}

export function containsPointInAsterionResonatorField(shape, point) {
  if (!shape || !point) return false;

  const { nearTopLeft, nearTopRight, nearBottomLeft, farTopLeft } = shape.corners;
  if (point.z < nearTopLeft.z || point.z > farTopLeft.z
    || point.x < nearTopLeft.x || point.x > nearTopRight.x) return false;

  const lateralSpan = nearTopRight.x - nearTopLeft.x;
  if (lateralSpan <= 0) return false;
  const lateralT = (point.x - nearTopLeft.x) / lateralSpan;
  const topY = nearTopLeft.y + ((nearTopRight.y - nearTopLeft.y) * lateralT);
  const bottomY = nearBottomLeft.y
    + ((shape.corners.nearBottomRight.y - nearBottomLeft.y) * lateralT);
  return point.y >= bottomY && point.y <= topY;
}
