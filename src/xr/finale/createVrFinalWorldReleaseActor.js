import * as THREE from '../../vendor/three.js';

export const VR_FINAL_WORLD_RELEASE_PHASE = Object.freeze({
  IDLE: 'IDLE', RELEASE: 'RELEASE', WHITEOUT: 'WHITEOUT', COMPLETE: 'COMPLETE'
});

const RELEASE_SECONDS = 5;
const WHITEOUT_SECONDS = 5;
const TOTAL_SECONDS = RELEASE_SECONDS + WHITEOUT_SECONDS;
const RELEASE_DISTANCE = 10;
const FINAL_DISTANCE_FACTOR = 3;
const SECTORS = Object.freeze([
  { glyphId: 'ethics-life-protection', branchId: 'earth', axis: [0.18, 0.06, -0.08] },
  { glyphId: 'creative-ai', branchId: 'fire', axis: [-0.10, 0.04, 0.16] },
  { glyphId: 'ai-guide', branchId: 'wood', axis: [0.08, -0.13, 0.05] },
  { glyphId: 'spotify-digger', branchId: 'metal', axis: [-0.06, 0.15, -0.09] },
  { glyphId: 'haiku-cosmos', branchId: 'water', axis: [0.13, 0.08, 0.12] }
]);
const smoothstep = (value) => value * value * (3 - 2 * value);
const clamp01 = (value) => Math.max(0, Math.min(1, value));

function captureTransform(object) {
  return { parent: object.parent, position: object.position.clone(), quaternion: object.quaternion.clone(), scale: object.scale.clone() };
}

function restoreTransform(object, state) {
  if (object.parent !== state.parent) state.parent.add(object);
  object.position.copy(state.position); object.quaternion.copy(state.quaternion); object.scale.copy(state.scale);
}

export function createVrFinalWorldReleaseActor({
  scene, camera, progressFloor, portalObject, reliquaryObject, furnaceObject,
  monkeyVisualRoot, monkeyStoneRoot, shellObjects, smallGlyphObjects,
  platformEnergyVfxActor, audioBridge, sectorDriveAudio,
  setInteractionLocked, cancelActiveInteractions, onCompleted
}) {
  if (!scene?.add || !camera?.add || !progressFloor?.setSectorMotion
    || typeof setInteractionLocked !== 'function' || typeof onCompleted !== 'function') {
    throw new TypeError('[VrFinalWorldReleaseActor] Required presentation and lifecycle seams are unavailable.');
  }

  const whiteoutMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0,
    depthTest: false, depthWrite: false, toneMapped: false
  });
  const whiteout = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), whiteoutMaterial);
  whiteout.name = 'VrFinalWhiteoutEnclosure'; whiteout.scale.setScalar(0.5);
  whiteout.renderOrder = 100000; whiteout.visible = false; camera.add(whiteout);

  const portalGroup = new THREE.Group(); portalGroup.name = 'VrFinalPortalReliquaryMotionRoot';
  const furnaceGroup = new THREE.Group(); furnaceGroup.name = 'VrFinalFurnaceMotionRoot';
  scene.add(portalGroup, furnaceGroup);
  const groupTargets = [
    { root: portalGroup, objects: [portalObject, reliquaryObject].filter(Boolean), direction: new THREE.Vector3(-1, -0.18, 0.12).normalize(), rotation: new THREE.Vector3(0.08, -0.22, 0.12) },
    { root: furnaceGroup, objects: [furnaceObject].filter(Boolean), direction: new THREE.Vector3(0.82, 0.56, -0.12).normalize(), rotation: new THREE.Vector3(-0.12, 0.18, -0.08) }
  ];
  const fadeRoots = [monkeyVisualRoot, monkeyStoneRoot].filter(Boolean);
  const orbitObjects = [...(shellObjects ?? []), ...(smallGlyphObjects ?? [])];
  const sectorRotations = SECTORS.map(({ axis }) => new THREE.Vector3(...axis));
  const sectorQuaternion = new THREE.Quaternion();
  let elapsed = 0;
  let phase = VR_FINAL_WORLD_RELEASE_PHASE.IDLE;
  let completionSent = false;
  let captured = null;
  let fadeMaterials = [];
  let audioGeneration = 0;
  const audioSources = new Map();
  const emitterPosition = new THREE.Vector3();
  let disposed = false;

  function capture() {
    if (captured) return;
    captured = {
      sectors: new Map(SECTORS.map(({ glyphId }) => [glyphId, progressFloor.getSectorMotionTransform(glyphId)])),
      groups: groupTargets.map(({ root, objects }) => ({ motionRoot: root, rootState: captureTransform(root), objects: objects.map((object) => [object, captureTransform(object)]) })),
      orbits: orbitObjects.filter((object) => object?.visible).map((object) => [object, captureTransform(object)])
    };
    groupTargets.forEach(({ root, objects }) => {
      root.position.set(0, 0, 0); root.quaternion.identity(); root.scale.set(1, 1, 1);
      root.updateMatrixWorld(true); objects.forEach((object) => root.attach(object));
    });
    fadeMaterials = [];
    fadeRoots.forEach((root) => root.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const originals = Array.isArray(child.material) ? child.material : [child.material];
      const clones = originals.map((material) => { const clone = material.clone(); clone.transparent = true; return clone; });
      fadeMaterials.push({ child, original: child.material, clones,
        opacities: clones.map((material) => material.opacity) });
      child.material = Array.isArray(child.material) ? clones : clones[0];
    }));
  }

  function motionFactor(time) {
    if (time <= RELEASE_SECONDS) return smoothstep(clamp01(time / RELEASE_SECONDS));
    const whiteoutProgress = clamp01((time - RELEASE_SECONDS) / WHITEOUT_SECONDS);
    return 1 + (FINAL_DISTANCE_FACTOR - 1) * whiteoutProgress * whiteoutProgress;
  }

  function apply(time) {
    const factor = motionFactor(time);
    SECTORS.forEach(({ glyphId }, index) => {
      const baseline = captured.sectors.get(glyphId);
      const radial = Math.sqrt(RELEASE_DISTANCE ** 2 - 4 ** 2) * factor;
      sectorQuaternion.setFromEuler(new THREE.Euler(
        sectorRotations[index].x * factor, sectorRotations[index].y * factor, sectorRotations[index].z * factor
      ));
      progressFloor.setSectorMotion(glyphId, {
        position: baseline.position.clone().add(new THREE.Vector3(0, -4 * factor, radial)),
        quaternion: baseline.quaternion.clone().multiply(sectorQuaternion)
      });
    });
    groupTargets.forEach(({ root, direction, rotation }) => {
      root.position.copy(direction).multiplyScalar(RELEASE_DISTANCE * factor);
      root.rotation.set(rotation.x * factor, rotation.y * factor, rotation.z * factor);
    });
    captured.orbits.forEach(([object, baseline]) => {
      if (object.parent === baseline.parent) object.position.copy(baseline.position).multiplyScalar(1 + factor * 0.7);
    });
    const whiteoutProgress = clamp01((time - RELEASE_SECONDS) / WHITEOUT_SECONDS);
    whiteout.visible = whiteoutProgress > 0;
    whiteoutMaterial.opacity = whiteoutProgress;
    fadeMaterials.forEach(({ clones, opacities }) => clones.forEach((material, index) => {
      material.opacity = opacities[index] * (1 - whiteoutProgress);
    }));
    fadeRoots.forEach((root) => { root.visible = whiteoutProgress < 1; });
  }

  function startReleasePresentation() {
    const generation = ++audioGeneration;
    SECTORS.forEach(({ glyphId, branchId }) => {
      platformEnergyVfxActor?.setFloorDriveEnergy(branchId, true);
      const path = sectorDriveAudio?.[branchId];
      const anchor = progressFloor.getRuneStoneSpatialAudioAnchor(branchId);
      if (!path || !anchor || !audioBridge?.startSpatialProcessSource) return;
      void audioBridge.startSpatialProcessSource(path, 'WORLD', {
        loop: false, maxDistanceMeters: 90, refDistanceMeters: 2,
        panningModel: 'HRTF', distanceModel: 'linear', rolloffFactor: 1
      }).then((handle) => {
        if (!handle || disposed || generation !== audioGeneration || phase !== VR_FINAL_WORLD_RELEASE_PHASE.RELEASE) {
          try { handle?.stop?.(); } catch (_) { /* Optional finale audio is fail-soft. */ }
          return;
        }
        audioSources.set(glyphId, { handle, anchor });
        handle.onEnded?.(() => audioSources.delete(glyphId));
      });
    });
  }
  function stopReleasePresentation() {
    audioGeneration += 1;
    SECTORS.forEach(({ branchId }) => platformEnergyVfxActor?.setFloorDriveEnergy(branchId, false));
    audioSources.forEach(({ handle }) => { try { handle.stop?.(); } catch (_) { /* Optional finale audio is fail-soft. */ } });
    audioSources.clear();
  }
  function begin() {
    if (disposed || phase !== VR_FINAL_WORLD_RELEASE_PHASE.IDLE) return false;
    capture(); setInteractionLocked(true); cancelActiveInteractions?.();
    elapsed = 0; completionSent = false; phase = VR_FINAL_WORLD_RELEASE_PHASE.RELEASE;
    apply(0); startReleasePresentation(); return true;
  }
  function update(delta = 0) {
    if (disposed || phase === VR_FINAL_WORLD_RELEASE_PHASE.IDLE || phase === VR_FINAL_WORLD_RELEASE_PHASE.COMPLETE) return;
    const previous = elapsed; elapsed = Math.min(TOTAL_SECONDS, elapsed + Math.max(0, Number.isFinite(delta) ? delta : 0));
    if (previous < RELEASE_SECONDS && elapsed >= RELEASE_SECONDS) stopReleasePresentation();
    phase = elapsed < RELEASE_SECONDS ? VR_FINAL_WORLD_RELEASE_PHASE.RELEASE
      : elapsed < TOTAL_SECONDS ? VR_FINAL_WORLD_RELEASE_PHASE.WHITEOUT : VR_FINAL_WORLD_RELEASE_PHASE.COMPLETE;
    apply(elapsed);
    audioSources.forEach(({ handle, anchor }) => {
      anchor.updateWorldMatrix(true, false); anchor.getWorldPosition(emitterPosition);
      handle.setPosition?.(emitterPosition.x, emitterPosition.y, emitterPosition.z);
    });
    if (elapsed >= TOTAL_SECONDS && !completionSent) { completionSent = true; onCompleted(); }
  }
  function hydrateScenarioState(state) {
    if (!state || Object.keys(state).length !== 1 || state.completed !== true) {
      throw new TypeError('finale state must be exactly { completed: true }');
    }
    if (!captured) capture();
    stopReleasePresentation(); setInteractionLocked(true); elapsed = TOTAL_SECONDS;
    phase = VR_FINAL_WORLD_RELEASE_PHASE.COMPLETE; completionSent = true; apply(TOTAL_SECONDS);
  }
  function reset() {
    if (disposed) return;
    stopReleasePresentation(); setInteractionLocked(false);
    if (captured) {
      captured.sectors.forEach((transform, glyphId) => progressFloor.setSectorMotion(glyphId, transform));
      captured.groups.forEach(({ motionRoot, rootState, objects }) => {
        objects.forEach(([object, state]) => restoreTransform(object, state)); restoreTransform(motionRoot, rootState);
      });
      captured.orbits.forEach(([object, state]) => restoreTransform(object, state));
    }
    fadeMaterials.forEach(({ child, original, clones }) => { child.material = original; clones.forEach((material) => material.dispose()); });
    fadeRoots.forEach((root) => { root.visible = true; });
    fadeMaterials = []; captured = null; elapsed = 0; completionSent = false;
    phase = VR_FINAL_WORLD_RELEASE_PHASE.IDLE; whiteout.visible = false; whiteoutMaterial.opacity = 0;
  }
  function dispose() {
    if (disposed) return; reset(); disposed = true; whiteout.removeFromParent(); portalGroup.removeFromParent(); furnaceGroup.removeFromParent();
    whiteout.geometry.dispose(); whiteoutMaterial.dispose();
  }
  return { begin, update, hydrateScenarioState, reset, dispose,
    getPhase: () => phase, isInteractionLocked: () => phase !== VR_FINAL_WORLD_RELEASE_PHASE.IDLE };
}
