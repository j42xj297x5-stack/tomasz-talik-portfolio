import * as THREE from '../../vendor/three.js';

export function calculateAttractorCapturePosition({ masterRingWorldPosition, controllerRayDirection,
  captureForwardDistance, target = new THREE.Vector3() }) {
  return target.copy(masterRingWorldPosition).addScaledVector(controllerRayDirection, captureForwardDistance);
}

export function selectAttractorConeTarget({ candidates, origin, direction, maxDistance, halfAngleRadians }) {
  const tanHalfAngle = Math.tan(halfAngleRadians);
  const toTarget = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const hits = [];
  for (const candidate of candidates) {
    const center = candidate.getWorldCenter(new THREE.Vector3());
    toTarget.subVectors(center, origin);
    const depth = toTarget.dot(direction);
    if (depth <= 0 || depth > maxDistance + candidate.radius) continue;
    radial.copy(toTarget).addScaledVector(direction, -depth);
    const radialDistance = radial.length();
    const coneRadius = tanHalfAngle * Math.min(depth, maxDistance);
    if (radialDistance > coneRadius + candidate.radius) continue;
    hits.push({ target: candidate.target, distance: depth,
      angularScore: Math.max(0, radialDistance - candidate.radius) / Math.max(depth, 1e-6) });
  }
  hits.sort((a, b) => Math.abs(a.angularScore - b.angularScore) > 1e-6
    ? a.angularScore - b.angularScore : a.distance - b.distance);
  return hits[0] ?? null;
}

export function createVrAttractorScanCone({ parent, length, settings }) {
  const halfAngleRadians = THREE.MathUtils.degToRad(settings.halfAngleDegrees);
  const radius = Math.tan(halfAngleRadians) * length;
  const geometry = new THREE.ConeGeometry(radius, length, settings.radialSegments, 1, true);
  // ConeGeometry's apex starts at local +Y; rotate it onto the controller origin and extend toward local -Z.
  geometry.rotateX(Math.PI / 2); geometry.translate(0, 0, -length / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(settings.color) }, opacityMin: { value: settings.opacityMin },
      opacityMax: { value: settings.opacityMax }, pulse: { value: 0 } },
    vertexShader: `varying float vDepth; uniform float pulse; void main() { vec3 p=position;
      p.xy*=1.0+pulse*0.025; vDepth=clamp(-p.z/${length.toFixed(8)},0.0,1.0);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `uniform vec3 color; uniform float opacityMin; uniform float opacityMax; uniform float pulse;
      varying float vDepth; void main(){ float fade=(1.0-vDepth*0.72)*(1.0-smoothstep(0.82,1.0,vDepth));
      gl_FragColor=vec4(color,mix(opacityMin,opacityMax,pulse)*fade); }`,
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
  const object = new THREE.Mesh(geometry, material); object.name='VrAttractorScanCone'; object.visible=false;
  if (parent?.add) parent.add(object);
  let elapsed=0, disposed=false;
  function update(delta=0, visible=false) { if(disposed)return; object.visible=Boolean(visible); elapsed+=Math.max(0,delta);
    material.uniforms.pulse.value=0.5+0.5*Math.sin(elapsed*Math.PI*2/settings.pulseDuration); }
  function dispose(){if(disposed)return;disposed=true;object.removeFromParent();geometry.dispose();material.dispose();}
  return { object, geometry, material, length, halfAngleRadians, update, dispose };
}
