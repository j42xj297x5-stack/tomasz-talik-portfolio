import * as THREE from '../../vendor/three.js';

const DEG_TO_RAD = Math.PI / 180;
const RING_TEXTURE_SIZE = 256;

function angularWorldSize(degrees, distance) {
  return 2 * distance * Math.tan(degrees * DEG_TO_RAD * 0.5);
}

function createRingTexture(lineWidthFraction) {
  const canvas = document.createElement('canvas');
  canvas.width = RING_TEXTURE_SIZE;
  canvas.height = RING_TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  const half = RING_TEXTURE_SIZE * 0.5;
  context.strokeStyle = '#fff';
  context.lineWidth = RING_TEXTURE_SIZE * lineWidthFraction;
  context.beginPath();
  context.arc(half, half, half - context.lineWidth, 0, Math.PI * 2);
  context.stroke();
  return new THREE.CanvasTexture(canvas);
}

function createSignTexture(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!(width > 0 && height > 0)) throw new Error('Proto-Astro sign image has no decoded dimensions.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  return { texture: new THREE.CanvasTexture(canvas), aspect: width / height };
}

export function createVrAsterionResonatorTargetResponsePresentation({
  parent, acquisitionActor, getPlayerHeadWorldPosition, settings
}) {
  if (!parent?.add || !parent?.remove) throw new TypeError('parent must be a Three.js Object3D.');
  if (!acquisitionActor?.subscribe || !acquisitionActor?.getTargetState) {
    throw new TypeError('acquisitionActor must expose subscribe() and getTargetState().');
  }
  if (typeof getPlayerHeadWorldPosition !== 'function') {
    throw new TypeError('getPlayerHeadWorldPosition must be a function.');
  }

  const root = new THREE.Group();
  root.name = 'VrAsterionResonatorTargetResponsePresentation';
  parent.add(root);
  const records = new Map();
  const headPosition = new THREE.Vector3();
  const targetPosition = new THREE.Vector3();
  const ringTexture = createRingTexture(settings.ringLineWidthFraction);
  let phaseSeconds = 0;
  let disposed = false;

  function applyState(record, state) {
    if (!state) return;
    record.state = state;
    record.sign.visible = state.signVisible;
    record.rings.forEach((ring, index) => { ring.visible = index < state.ringCount; });
  }

  const unsubscribe = acquisitionActor.subscribe((state) => {
    const record = records.get(state.id);
    if (record) applyState(record, state);
  });

  function unregister(record) {
    if (!records.delete(record.id)) return;
    root.remove(record.group);
    record.sign.material.map.dispose();
    record.sign.material.dispose();
    record.rings.forEach((ring) => ring.material.dispose());
  }

  return {
    registerTarget({ id, anchor, protoAstro, signImage, color } = {}) {
      if (disposed) throw new Error('Cannot register a target after disposal.');
      if (typeof id !== 'string' || records.has(id)) throw new Error(`Invalid or duplicate target id: ${id}`);
      if (!anchor?.getWorldPosition) throw new TypeError('Target anchor must expose getWorldPosition().');
      if (!protoAstro?.descriptor?.syllable || !signImage) throw new Error(`Missing canonical Proto-Astro sign for target: ${id}`);
      const { texture, aspect } = createSignTexture(signImage);
      const group = new THREE.Group();
      group.name = `VrAsterionTargetResponse:${id}:${protoAstro.descriptor.syllable}`;
      const sign = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture, color, transparent: true, opacity: settings.signOpacity, depthTest: false, depthWrite: false
      }));
      const rings = settings.ringAngularDiametersDegrees.map(() => new THREE.Sprite(new THREE.SpriteMaterial({
        map: ringTexture, color, transparent: true, opacity: settings.ringOpacity, depthTest: false, depthWrite: false
      })));
      sign.visible = false;
      rings.forEach((ring) => { ring.visible = false; group.add(ring); });
      group.add(sign);
      root.add(group);
      const record = { id, anchor, protoAstro, group, sign, rings, signAspect: aspect, state: null };
      records.set(id, record);
      applyState(record, acquisitionActor.getTargetState(id));
      let registered = true;
      return () => { if (registered) { registered = false; unregister(record); } };
    },
    update(deltaSeconds) {
      if (disposed || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
      phaseSeconds += deltaSeconds;
      let hasVisibleTarget = false;
      records.forEach((record) => { if (record.state?.signVisible || record.state?.ringCount > 0) hasVisibleTarget = true; });
      if (!hasVisibleTarget) return;
      getPlayerHeadWorldPosition(headPosition);
      const pulseAngle = phaseSeconds / settings.pullReadyPulsePeriodSeconds * Math.PI * 2;
      const pulseUnit = (Math.sin(pulseAngle) + 1) * 0.5;
      records.forEach((record) => {
        if (!(record.state?.signVisible || record.state?.ringCount > 0)) return;
        record.anchor.getWorldPosition(targetPosition);
        const distance = Math.max(0.001, targetPosition.distanceTo(headPosition));
        record.group.position.copy(targetPosition);
        const signHeight = angularWorldSize(settings.signAngularHeightDegrees, distance);
        record.sign.position.set(0, angularWorldSize(settings.signVerticalOffsetDegrees, distance), 0);
        record.sign.scale.set(signHeight * record.signAspect, signHeight, 1);
        const pulseScale = record.state.pullReady ? 1 + settings.pullReadyPulseScaleAmplitude * Math.sin(pulseAngle) : 1;
        const ringOpacity = record.state.pullReady
          ? THREE.MathUtils.lerp(settings.pullReadyPulseOpacityMin, settings.pullReadyPulseOpacityMax, pulseUnit)
          : settings.ringOpacity;
        record.rings.forEach((ring, index) => {
          if (!ring.visible) return;
          const diameter = angularWorldSize(settings.ringAngularDiametersDegrees[index], distance) * pulseScale;
          ring.position.set(0, 0, 0);
          ring.scale.set(diameter, diameter, 1);
          ring.material.opacity = ringOpacity;
        });
      });
    },
    reset() {
      if (disposed) return;
      phaseSeconds = 0;
      records.forEach((record) => {
        record.state = null;
        record.sign.visible = false;
        record.rings.forEach((ring) => {
          ring.visible = false;
          ring.material.opacity = settings.ringOpacity;
        });
      });
    },
    dispose() {
      if (disposed) return;
      unsubscribe();
      [...records.values()].forEach(unregister);
      ringTexture.dispose();
      parent.remove(root);
      disposed = true;
    }
  };
}
