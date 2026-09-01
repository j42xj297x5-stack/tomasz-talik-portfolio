const SLICES = Object.freeze([
  Object.freeze({ x: 0, width: 8.25, height: 5.5 }),
  Object.freeze({ x: 43.333333, width: 11.75, height: 8.5 }),
  Object.freeze({ x: 86.666667, width: 18.25, height: 11.5 }),
  Object.freeze({ x: 130, width: 27.75, height: 14.5 })
]);

const FILLETS_BY_MISMATCH = Object.freeze([0.08, 0.15, 0.22]);

function createCorner(x, y, z) {
  return Object.freeze({ x, y, z });
}

export function resolveAsterionResonatorFieldShape(descriptor) {
  if (descriptor?.fullActiveCore !== true) return null;

  const { alpha, beta, gamma } = descriptor.levels;
  const depthNear = SLICES[gamma - 1];
  const depthFar = SLICES[gamma];
  const leftNear = SLICES[alpha - 1];
  const leftFar = SLICES[alpha];
  const rightNear = SLICES[beta - 1];
  const rightFar = SLICES[beta];
  const leftMismatch = Math.abs(alpha - gamma);
  const rightMismatch = Math.abs(beta - gamma);
  const coherentPreset = alpha === beta && beta === gamma && alpha > 0;

  const levels = Object.freeze({ alpha, beta, gamma });
  const corners = Object.freeze({
    nearTopLeft: createCorner(depthNear.x, leftNear.height / 2, -leftNear.width / 2),
    nearTopRight: createCorner(depthNear.x, rightNear.height / 2, rightNear.width / 2),
    nearBottomLeft: createCorner(depthNear.x, -leftNear.height / 2, -leftNear.width / 2),
    nearBottomRight: createCorner(depthNear.x, -rightNear.height / 2, rightNear.width / 2),
    farTopLeft: createCorner(depthFar.x, leftFar.height / 2, -leftFar.width / 2),
    farTopRight: createCorner(depthFar.x, rightFar.height / 2, rightFar.width / 2),
    farBottomLeft: createCorner(depthFar.x, -leftFar.height / 2, -leftFar.width / 2),
    farBottomRight: createCorner(depthFar.x, -rightFar.height / 2, rightFar.width / 2)
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
    deformation,
    coherentPreset,
    largeGlyphRevealEligible: coherentPreset
  });
}
