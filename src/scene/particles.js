import * as THREE from '../vendor/three.js';

export function createParticles(count = 120) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const idx = i * 3;
    positions[idx] = (Math.random() - 0.5) * 30;
    positions[idx + 1] = Math.random() * 8;
    positions[idx + 2] = (Math.random() - 0.5) * 30;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: '#8b98b3',
    size: 0.04,
    transparent: true,
    opacity: 0.55
  });

  return new THREE.Points(geometry, material);
}
