export const ASTERION_METAL_CONTROL_TUNING = Object.freeze({
  branchId: 'metal',
  glyphId: 'spotify-digger',
  dominanceMarginDegrees: 1,
  dofs: Object.freeze({
    ANGLE: Object.freeze({
      gestureAxis: Object.freeze({ x: 0, y: 1, z: 0 }),
      gestureSign: 1,
      motionAxis: Object.freeze({ x: 0, y: 1, z: 0 }),
      motionSign: 1,
      gameplayDimension: 'LATERAL'
    }),
    TILT: Object.freeze({
      gestureAxis: Object.freeze({ x: 1, y: 0, z: 0 }),
      gestureSign: -1,
      motionAxis: Object.freeze({ x: 1, y: 0, z: 0 }),
      motionSign: 1,
      gameplayDimension: 'FORWARD'
    })
  }),
  expansionMeters: Object.freeze({
    LATERAL: Object.freeze([0, 8, 0, 8]),
    FORWARD: Object.freeze([0, 10, 0, 10])
  }),
  depthDomain: Object.freeze({ near: 10, far: 130 }),
  rounding: Object.freeze({
    harmonicCenterMultiplier: 1.5,
    oneOffCenterMultiplier: 0.9,
    bothOffCenterMultiplier: 0.6,
    maximumFilletFraction: 0.32
  })
});
