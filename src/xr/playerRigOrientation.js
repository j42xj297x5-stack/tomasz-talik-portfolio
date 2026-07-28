export function calculatePlayerRigYaw(position, lookAt) {
  const directionX = lookAt.x - position.x;
  const directionZ = lookAt.z - position.z;

  if (directionX === 0 && directionZ === 0) return 0;

  // Three.js cameras look down local -Z, so align that axis with the horizontal target direction.
  return Math.atan2(-directionX, -directionZ);
}

export function orientPlayerRig(playerRig, lookAt) {
  const yaw = calculatePlayerRigYaw(playerRig.position, lookAt);
  playerRig.rotation.set(0, yaw, 0);
}
