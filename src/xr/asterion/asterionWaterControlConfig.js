export const ASTERION_WATER_CONTROL_TUNING = Object.freeze({
  branchId: 'water',
  glyphId: 'haiku-cosmos',
  dominanceMarginDegrees: 1,
  presentation: Object.freeze({
    hues: Object.freeze([0xffffff, 0x66ff99, 0x5aa7ff, 0xb875ff]),
    skinOpacities: Object.freeze([0.055, 0.062, 0.072, 0.088]),
    skeletonOpacities: Object.freeze([0.30, 0.34, 0.40, 0.48]),
    haloOpacities: Object.freeze([0, 0.08, 0.16, 0.26]),
    haloNormalExpansion: 0.037
  }),
  dofs: Object.freeze({
    ANGLE: Object.freeze({
      gestureAxis: Object.freeze({ x: 0, y: 0, z: 1 }),
      gestureSign: 1,
      motionAxis: Object.freeze({ x: Math.sin(Math.PI / 5), y: 0, z: Math.cos(Math.PI / 5) }),
      motionSign: 1
    }),
    TILT: Object.freeze({
      gestureAxis: Object.freeze({ x: 1, y: 0, z: 0 }),
      gestureSign: -1,
      motionAxis: Object.freeze({ x: 1, y: 0, z: 0 }),
      motionSign: 1
    })
  })
});
