export function updateCameraDrift(camera, elapsed) {
  const driftX = Math.sin(elapsed * 0.22) * 0.45;
  const driftY = 1.85 + Math.sin(elapsed * 0.35) * 0.08;
  const driftZ = 6 + Math.cos(elapsed * 0.18) * 0.25;

  camera.position.set(driftX, driftY, driftZ);
  camera.lookAt(0, 0.8, 0);
}
