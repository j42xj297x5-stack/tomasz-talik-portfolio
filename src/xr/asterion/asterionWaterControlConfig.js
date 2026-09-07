export const ASTERION_WATER_CONTROL_TUNING = Object.freeze({
  branchId: 'water',
  glyphId: 'haiku-cosmos',
  dominanceMarginDegrees: 1,
  dofs: Object.freeze({
    ANGLE: Object.freeze({
      gestureAxis: Object.freeze({ x: 0, y: 0, z: 1 }),
      gestureSign: 1,
      motionAxis: Object.freeze({ x: 0, y: 0, z: 1 }),
      motionSign: -1
    }),
    TILT: Object.freeze({
      gestureAxis: Object.freeze({ x: 1, y: 0, z: 0 }),
      gestureSign: -1,
      motionAxis: Object.freeze({ x: 1, y: 0, z: 0 }),
      motionSign: 1
    })
  })
});
