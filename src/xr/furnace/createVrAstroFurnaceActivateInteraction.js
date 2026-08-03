import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { resolveChamberCylinder } from './vrAstroFurnaceChamberCylinder.js';

export const ASTRO_FURNACE_PROCESS_STATES = Object.freeze({
  IDLE: 'IDLE', PRESSING: 'PRESSING', SPINUP: 'SPINUP', STEADY: 'STEADY',
  EXTRACTION: 'EXTRACTION', COOLDOWN: 'COOLDOWN', COMPLETE: 'COMPLETE'
});

const CLIP_NAME = 'AstroFurnace_ButtonActivate_Lock';
const LOCAL_AXIS = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smooth = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

export function processRotationPulse01(angle) {
  return 0.5 * (1 - Math.cos(Number.isFinite(angle) ? angle : 0));
}

function cloneMaterials(root, owned) {
  const result = [];
  root?.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const list = Array.isArray(node.material) ? node.material : [node.material];
    const clones = list.map((material) => material?.clone?.() ?? material);
    clones.forEach((material, index) => { if (material !== list[index]) owned.add(material); });
    node.material = Array.isArray(node.material) ? clones : clones[0];
    result.push(...clones.filter(Boolean));
  });
  return result;
}

export function createVrAstroFurnaceActivateInteraction({
  furnace, controllers = [], settings = {}, processSettings = {}, haloSettings = {},
  openInteraction, canActivateInput = () => false, isModeActive = () => true, qaAllowWithoutInput = false,
  isOrdinaryRayAvailable = () => true
}) {
  const states = ASTRO_FURNACE_PROCESS_STATES;
  const button = furnace?.nodes?.button_activate;
  const buttonMeshes = [];
  button?.traverse((node) => { if (node.isMesh && node.geometry) buttonMeshes.push(node); });
  const spinPivot = furnace?.nodes?.PIVOT_FURNACE_PROCESS_SPIN;
  const buttonPivot = furnace?.nodes?.PIVOT_BUTTON_ACTIVATE;
  const fireCell = furnace?.nodes?.fire_cell;
  const chamber = furnace?.nodes?.komora;
  const chamberCylinder = resolveChamberCylinder(chamber, processSettings.processLightChamberClearance ?? 0.012);
  const lightRoot = furnace?.object;
  const lightOrbitCenter = new THREE.Vector3();
  const lightOrbitScale = new THREE.Vector3(1, 1, 1);
  const stableSpinAxis = new THREE.Vector3(0, 1, 0);
  const stableOrbitReference = new THREE.Vector3(1, 0, 0);
  const orbitRotation = new THREE.Quaternion();
  if (chamberCylinder && lightRoot) {
    chamber.updateWorldMatrix(true, false); lightRoot.updateWorldMatrix(true, false);
    lightOrbitCenter.copy(chamberCylinder.center).applyMatrix4(chamber.matrixWorld);
    lightRoot.worldToLocal(lightOrbitCenter);
    chamber.getWorldScale(lightOrbitScale); const rootScale = lightRoot.getWorldScale(new THREE.Vector3());
    lightOrbitScale.divide(rootScale);
    if (spinPivot) {
      const rootWorldQuaternion = lightRoot.getWorldQuaternion(new THREE.Quaternion());
      const spinWorldQuaternion = spinPivot.getWorldQuaternion(new THREE.Quaternion());
      stableSpinAxis.set(0, 1, 0).applyQuaternion(rootWorldQuaternion.invert().multiply(spinWorldQuaternion)).normalize();
      stableOrbitReference.set(1, 0, 0).addScaledVector(stableSpinAxis, -stableSpinAxis.x);
      if (stableOrbitReference.lengthSq() < 1e-8) stableOrbitReference.set(0, 0, 1);
      stableOrbitReference.normalize();
    }
  }
  const processLight = chamberCylinder ? new THREE.PointLight(processSettings.processLightColor ?? 0xb8f3ff, 0,
    processSettings.processLightDistance ?? 2.4, processSettings.processLightDecay ?? 2) : null;
  if (processLight) { processLight.name = 'VrAstroFurnaceProcessLight'; processLight.castShadow = false;
    processLight.visible = false; lightRoot.add(processLight); }
  const clip = furnace?.clips?.[CLIP_NAME];
  const mixer = furnace?.model ? new THREE.AnimationMixer(furnace.model) : null;
  const action = mixer && clip ? mixer.clipAction(clip) : null;
  action?.setLoop(THREE.LoopOnce, 1);
  if (action) { action.clampWhenFinished = true; action.enabled = true; }
  const capabilityReady = settings.enabled !== false && Boolean(buttonMeshes.length && buttonPivot && spinPivot && clip && action);
  if (settings.enabled !== false && !capabilityReady) {
    console.warn('[Experience VR] Astro furnace activate interaction is disabled: button geometry, pivots, or exact lock clip are missing.');
  }
  const ownedMaterials = new Set();
  const buttonMaterials = cloneMaterials(button, ownedMaterials).filter((material) => 'emissiveIntensity' in material);
  const fireMaterials = cloneMaterials(fireCell, ownedMaterials).filter((material) => 'emissiveIntensity' in material);
  const fireBases = fireMaterials.map((material) => ({
    material,
    baseEmissiveIntensity: material.emissiveIntensity,
    baseEmissive: material.emissive?.clone?.(),
    baseColor: material.color?.clone?.()
  }));
  const halo = button ? createVrTargetHalo({ root: button, settings: haloSettings }) : null;
  const baseSpinQuaternion = spinPivot?.quaternion.clone();
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const localSpin = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false]));
  const listeners = [];
  let state = states.IDLE;
  let progress = 0;
  let elapsed = 0;
  let angle = 0;
  let angularSpeed = 0;
  let cooldownStartAngle = 0;
  let cooldownTargetAngle = 0;
  let cooldownStartSpeed = 0;
  let releasing = false;
  let disposed = false;

  const setButtonEmission = (value) => buttonMaterials.forEach((material) => { material.emissiveIntensity = value; });
  function setFireEnergy(emission, whiteMix = 0) {
    const mix = clamp01(whiteMix);
    fireBases.forEach(({ material, baseEmissive, baseColor }) => {
      material.emissiveIntensity = emission;
      if (baseEmissive && material.emissive) material.emissive.copy(baseEmissive).lerp(new THREE.Color(1, 1, 1), mix);
      if (baseColor && material.color) material.color.copy(baseColor).lerp(new THREE.Color(1, 1, 1), mix * 0.18);
    });
  }
  function restoreFireMaterials() {
    fireBases.forEach(({ material, baseEmissiveIntensity, baseEmissive, baseColor }) => {
      material.emissiveIntensity = baseEmissiveIntensity;
      if (baseEmissive && material.emissive) material.emissive.copy(baseEmissive);
      if (baseColor && material.color) material.color.copy(baseColor);
    });
  }
  function applyAngle() {
    if (!spinPivot || !baseSpinQuaternion) return;
    localSpin.setFromAxisAngle(LOCAL_AXIS, angle);
    spinPivot.quaternion.copy(baseSpinQuaternion).multiply(localSpin);
  }
  function setProcessLight(intensity = 0) {
    if (!processLight || !chamberCylinder) return;
    const radius = chamberCylinder.radius * THREE.MathUtils.clamp(
      processSettings.processLightOrbitRadiusMultiplier ?? 0.82, 0, 0.99);
    const orbitRadius = radius * Math.max(Math.abs(lightOrbitScale.x), Math.abs(lightOrbitScale.z));
    orbitRotation.setFromAxisAngle(stableSpinAxis, -angle);
    processLight.position.copy(stableOrbitReference).multiplyScalar(orbitRadius).applyQuaternion(orbitRotation).add(lightOrbitCenter);
    processLight.intensity = Math.max(0, intensity); processLight.visible = processLight.intensity > 0;
    processLight.userData.lightAngle = -angle;
    orbitRotation.setFromAxisAngle(stableSpinAxis, angle);
    processLight.userData.chamberOrbitPosition = stableOrbitReference.clone().multiplyScalar(orbitRadius)
      .applyQuaternion(orbitRotation).add(lightOrbitCenter);
    processLight.userData.orbitCenter = lightOrbitCenter.clone();
    processLight.userData.orbitAxis = stableSpinAxis.clone();
  }
  function canActivate() {
    return capabilityReady && !disposed && isModeActive() && state === states.IDLE && openInteraction?.getState?.() === 'CLOSED'
      && !openInteraction?.isTransitioning?.() && (qaAllowWithoutInput || canActivateInput());
  }
  function clearHits() { hits.forEach((_, record) => hits.set(record, false)); halo?.setVisible(false); }
  function beginPress() {
    if (!canActivate()) return false;
    state = states.PRESSING; clearHits(); setButtonEmission(settings.emissionPressed ?? 5);
    action.stop(); action.reset(); action.timeScale = 1; action.clampWhenFinished = true; action.play();
    return true;
  }
  function press(record) {
    if (!hits.get(record) || !isOrdinaryRayAvailable(record)) return false;
    return beginPress();
  }
  function onFinished({ action: finishedAction }) {
    if (finishedAction !== action) return;
    if (state === states.PRESSING && !releasing) {
      state = states.SPINUP; elapsed = 0; progress = 0; angle = 0; angularSpeed = 0;
    } else if (releasing) {
      releasing = false; action.stop(); action.time = 0; state = states.IDLE;
      setButtonEmission(settings.emissionInactive ?? 0);
    }
  }
  mixer?.addEventListener('finished', onFinished);
  function releaseForOpening() {
    if (state !== states.COMPLETE || !action) return false;
    releasing = true; clearHits(); action.stop(); action.enabled = true; action.paused = false;
    action.time = action.getClip().duration; action.timeScale = -1; action.clampWhenFinished = false; action.play();
    return true;
  }
  function updateHits() {
    let anyHit = false;
    controllers.forEach((record) => {
      let intersection = null;
      if (canActivate() && furnace?.object?.visible !== false && isOrdinaryRayAvailable(record)) {
        record.controller.updateWorldMatrix(true, false);
        record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(worldQuaternion);
        direction.set(0, 0, -1).applyQuaternion(worldQuaternion).normalize();
        raycaster.set(origin, direction); raycaster.near = 0;
        raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance ?? 3, settings.rayMaxDistance ?? 3);
        intersection = raycaster.intersectObjects(buttonMeshes, false)[0] ?? null;
        if (intersection) record.reportRayHit?.(intersection.distance);
      }
      hits.set(record, Boolean(intersection)); anyHit ||= Boolean(intersection);
    });
    halo?.setVisible(anyHit && canActivate());
    if (state === states.IDLE) setButtonEmission(anyHit ? settings.emissionHover ?? 1 : settings.emissionInactive ?? 0);
  }
  function updateProcess(delta) {
    if (![states.SPINUP, states.STEADY, states.EXTRACTION, states.COOLDOWN].includes(state)) return;
    const duration = processSettings.durationSeconds ?? 18;
    const previousProgress = progress;
    elapsed = Math.min(duration, elapsed + delta); progress = clamp01(elapsed / duration);
    const spinupEnd = processSettings.spinupEnd ?? 0.14;
    const steadyEnd = processSettings.steadyEnd ?? 0.6;
    const extractionEnd = processSettings.extractionEnd ?? 0.84;
    const baseSpeed = (processSettings.direction ?? -1) * (processSettings.steadyRpm ?? 42) * TAU / 60;
    const idleEmission = processSettings.fireCellIdleEmission ?? 0.15;
    const steadyEmission = processSettings.fireCellSteadyEmission ?? 4;
    const extractionEmission = processSettings.fireCellExtractionEmission ?? 10;
    const steadyLight = processSettings.processLightSteadyIntensity ?? 18;
    const extractionLight = processSettings.processLightExtractionIntensity ?? 28;
    let emission = idleEmission;
    let lightIntensity = 0;
    let whiteMix = 0;
    if (progress < spinupEnd) {
      state = states.SPINUP; const t = smooth(progress / spinupEnd); angularSpeed = baseSpeed * t;
      emission = THREE.MathUtils.lerp(idleEmission, steadyEmission, t);
      lightIntensity = THREE.MathUtils.lerp(0, steadyLight, t);
      whiteMix = 0.45 * t;
      angle += angularSpeed * delta;
    } else if (progress < steadyEnd) {
      state = states.STEADY; angularSpeed = baseSpeed; angle += angularSpeed * delta;
      emission = steadyEmission; whiteMix = 0.45;
      lightIntensity = steadyLight;
    } else if (progress < extractionEnd) {
      state = states.EXTRACTION;
      const phaseProgress = (progress - steadyEnd) / (extractionEnd - steadyEnd);
      const t = smooth(phaseProgress / 0.3);
      angularSpeed = baseSpeed * THREE.MathUtils.lerp(1, processSettings.extractionSpeedMultiplier ?? 2, t);
      angle += angularSpeed * delta;
      emission = THREE.MathUtils.lerp(steadyEmission, extractionEmission, t);
      lightIntensity = THREE.MathUtils.lerp(steadyLight, extractionLight, t);
      whiteMix = THREE.MathUtils.lerp(0.45, 0.95, t);
    } else {
      if (previousProgress < extractionEnd || state !== states.COOLDOWN) {
        state = states.COOLDOWN; cooldownStartAngle = angle; cooldownStartSpeed = angularSpeed;
        const cooldownDuration = duration * (1 - extractionEnd);
        const naturalTarget = angle + cooldownStartSpeed * cooldownDuration * 0.5;
        cooldownTargetAngle = (processSettings.direction ?? -1) < 0
          ? Math.floor(naturalTarget / TAU) * TAU : Math.ceil(naturalTarget / TAU) * TAU;
      }
      const rawT = clamp01((progress - extractionEnd) / (1 - extractionEnd));
      const cooldownDuration = duration * (1 - extractionEnd);
      const t2 = rawT * rawT; const t3 = t2 * rawT;
      const startTangent = cooldownStartSpeed * cooldownDuration;
      angle = (2 * t3 - 3 * t2 + 1) * cooldownStartAngle
        + (t3 - 2 * t2 + rawT) * startTangent
        + (-2 * t3 + 3 * t2) * cooldownTargetAngle;
      angularSpeed = ((6 * t2 - 6 * rawT) * cooldownStartAngle
        + (3 * t2 - 4 * rawT + 1) * startTangent
        + (-6 * t2 + 6 * rawT) * cooldownTargetAngle) / cooldownDuration;
      const t = smooth(rawT);
      emission = THREE.MathUtils.lerp(extractionEmission, idleEmission, t);
      lightIntensity = THREE.MathUtils.lerp(extractionLight, 0, t);
      whiteMix = THREE.MathUtils.lerp(0.95, 0, t);
    }
    const pulse = processRotationPulse01(angle);
    const pulseMinimum = processSettings.fireCellPulseMinEmission ?? 0.05;
    const pulseMaximum = processSettings.fireCellPulseMaxEmission ?? emission;
    setFireEnergy(THREE.MathUtils.lerp(pulseMinimum, pulseMaximum, pulse), whiteMix); applyAngle(); setProcessLight(lightIntensity);
    if (progress >= 1) {
      state = states.COMPLETE; angularSpeed = 0; angle = 0;
      if (spinPivot && baseSpinQuaternion) spinPivot.quaternion.copy(baseSpinQuaternion);
      restoreFireMaterials();
      setProcessLight(0);
    }
  }
  controllers.forEach((record) => {
    const selectStart = () => press(record);
    record.controller.addEventListener('selectstart', selectStart); listeners.push({ record, selectStart });
  });
  function update(delta = 0) {
    if (disposed) return;
    const step = Math.max(0, Number.isFinite(delta) ? delta : 0);
    updateHits();
    const stateBeforeMixer = state;
    mixer?.update(step);
    updateProcess(stateBeforeMixer === states.PRESSING && state === states.SPINUP ? 0 : step);
    halo?.update(step);
  }
  function reset() {
    action?.stop(); mixer?.stopAllAction(); mixer?.setTime(0); releasing = false;
    state = states.IDLE; progress = 0; elapsed = 0; angle = 0; angularSpeed = 0;
    if (spinPivot && baseSpinQuaternion) spinPivot.quaternion.copy(baseSpinQuaternion);
    restoreFireMaterials();
    setProcessLight(0);
    clearHits(); setButtonEmission(settings.emissionInactive ?? 0);
  }
  function dispose() {
    if (disposed) return; reset(); disposed = true;
    listeners.forEach(({ record, selectStart }) => record.controller.removeEventListener('selectstart', selectStart));
    mixer?.removeEventListener('finished', onFinished); mixer?.stopAllAction(); if (clip) mixer?.uncacheClip(clip);
    halo?.dispose(); processLight?.removeFromParent(); processLight?.dispose(); ownedMaterials.forEach((material) => material.dispose?.()); ownedMaterials.clear(); hits.clear();
  }
  reset();
  return {
    mixer, action, hits, halo, processLight, chamberCylinder, capabilityReady, update, press, releaseForOpening, reset, dispose,
    hasCurrentHit: (record) => hits.get(record) === true,
    canActivate, getState: () => state, getProgress: () => progress, getPhase: () => state,
    isProcessing: () => [states.PRESSING, states.SPINUP, states.STEADY, states.EXTRACTION, states.COOLDOWN].includes(state),
    isComplete: () => state === states.COMPLETE,
    getAngularSpeed: () => angularSpeed,
    getProcessAngle: () => angle
  };
}
