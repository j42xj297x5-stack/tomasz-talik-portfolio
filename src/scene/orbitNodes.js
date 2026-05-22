import * as THREE from '../vendor/three.js';

export function createOrbitNodes(nodeContent) {
  const group = new THREE.Group();
  const nodes = [];
  const radius = 3.2;

  nodeContent.forEach((item, index) => {
    const angle = (Math.PI * 2 * index) / nodeContent.length;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 14),
      new THREE.MeshStandardMaterial({
        color: '#79a6ff',
        emissive: '#21365f',
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.2
      })
    );

    node.position.set(Math.cos(angle) * radius, 0.65 + Math.sin(index * 1.2) * 0.25, Math.sin(angle) * radius);
    node.userData = { ...item, orbitAngle: angle, orbitRadius: radius, yOffset: node.position.y };

    nodes.push(node);
    group.add(node);
  });

  return { group, nodes };
}

export function updateOrbitNodes(nodes, elapsed) {
  nodes.forEach((node, index) => {
    const angle = node.userData.orbitAngle + elapsed * 0.14;
    const wobble = Math.sin(elapsed * 0.9 + index * 1.8) * 0.08;

    node.position.x = Math.cos(angle) * node.userData.orbitRadius;
    node.position.z = Math.sin(angle) * node.userData.orbitRadius;
    node.position.y = node.userData.yOffset + wobble;
  });
}

export function setNodeHoverState(node, isHovered) {
  const material = node.material;
  if (isHovered) {
    material.emissive.set('#6ba7ff');
    material.emissiveIntensity = 0.95;
    material.color.set('#c8deff');
    node.scale.setScalar(1.25);
    return;
  }

  material.emissive.set('#21365f');
  material.emissiveIntensity = 0.45;
  material.color.set('#79a6ff');
  node.scale.setScalar(1);
}
