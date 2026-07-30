import * as THREE from '../vendor/three.js';

const LIGHT_COLOR = '#fffaf2';
const INTENSITIES = { idle: 0, hovered: 2.8, entryReady: 1.15, activated: 3 };

export function createVrGlyphLights({ nodes, center = new THREE.Vector3() }) {
  const worldPosition = new THREE.Vector3();
  const lightWorldPosition = new THREE.Vector3();
  let disposed = false;
  const records = nodes.map((glyphRoot, index) => {
    const anchor = new THREE.Group();
    anchor.name = `VrGlyphLightAnchor${index}`;
    const light = new THREE.PointLight(LIGHT_COLOR, 0, 5.5, 2);
    anchor.add(light);
    glyphRoot.add(anchor);
    return { glyphRoot, anchor, light, state: 'idle' };
  });
  function update({ hovered = new Set(), exhausted = new Set() } = {}) {
    if (disposed) return;
    records.forEach((record) => {
      const { glyphRoot, anchor, light } = record;
      record.state = !exhausted.has(glyphRoot) && hovered.has(glyphRoot) ? 'hovered' : 'idle';
      glyphRoot.getWorldPosition(worldPosition);
      lightWorldPosition.copy(center).lerp(worldPosition, 1.16);
      glyphRoot.worldToLocal(lightWorldPosition);
      anchor.position.copy(lightWorldPosition);
      light.intensity = INTENSITIES[record.state];
      light.visible = light.intensity > 0;
    });
  }
  function reset() { update(); }
  function dispose() {
    if (disposed) return;
    disposed = true;
    records.forEach(({ anchor, light }) => { light.removeFromParent(); anchor.removeFromParent(); });
    records.length = 0;
  }
  return { records, update, reset, dispose };
}
