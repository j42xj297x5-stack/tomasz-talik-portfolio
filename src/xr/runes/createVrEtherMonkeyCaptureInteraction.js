import * as THREE from '../../vendor/three.js';

const smoothstep = (value) => value * value * (3 - 2 * value);

export function createVrEtherMonkeyCaptureInteraction({ etherRuneStoneActor, monkeyActor,
  runeStoneProgressionController, durationSeconds = 1.5, onCompleted = () => {} }) {
  if (!etherRuneStoneActor?.beginMonkeyCapture || !etherRuneStoneActor?.completeMonkeyCapture) {
    throw new TypeError('Ether actor must expose Monkey capture commands.');
  }
  if (!monkeyActor?.characterAnchor?.getWorldPosition) {
    throw new TypeError('Monkey characterAnchor is required as the capture target.');
  }
  if (!runeStoneProgressionController?.commitWaterInstallationReadinessOverride) {
    throw new TypeError('Rune progression Water readiness override owner is required.');
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new TypeError('durationSeconds must be positive.');
  }

  const startPosition = new THREE.Vector3();
  const targetPosition = new THREE.Vector3();
  const localPosition = new THREE.Vector3();
  const startQuaternion = new THREE.Quaternion();
  const targetQuaternion = new THREE.Quaternion();
  let record = null;
  let elapsedSeconds = 0;
  let disposed = false;

  function setRootWorldTransform(root, position, quaternion) {
    localPosition.copy(position);
    root.parent.worldToLocal(localPosition);
    root.position.copy(localPosition);
    const parentWorldQuaternion = root.parent.getWorldQuaternion(new THREE.Quaternion());
    root.quaternion.copy(parentWorldQuaternion.invert().multiply(quaternion));
  }
  function tryBeginSpecialHandoff(candidate) {
    if (disposed || record || candidate?.descriptor?.special !== true
      || etherRuneStoneActor.beginMonkeyCapture() !== true) return false;
    record = candidate;
    elapsedSeconds = 0;
    candidate.root.getWorldPosition(startPosition);
    candidate.root.getWorldQuaternion(startQuaternion);
    monkeyActor.characterAnchor.getWorldQuaternion(targetQuaternion);
    return true;
  }
  function update(deltaSeconds = 0) {
    if (disposed || !record) return;
    elapsedSeconds = Math.min(durationSeconds, elapsedSeconds
      + Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0));
    monkeyActor.characterAnchor.getWorldPosition(targetPosition);
    monkeyActor.characterAnchor.getWorldQuaternion(targetQuaternion);
    const progress = smoothstep(elapsedSeconds / durationSeconds);
    const position = startPosition.clone().lerp(targetPosition, progress);
    const quaternion = startQuaternion.clone().slerp(targetQuaternion, progress);
    setRootWorldTransform(record.root, position, quaternion);
    if (elapsedSeconds < durationSeconds) return;
    const completedRecord = record;
    record = null;
    if (!etherRuneStoneActor.completeMonkeyCapture()) {
      throw new Error('Ether Monkey capture completion was rejected.');
    }
    if (!runeStoneProgressionController.commitWaterInstallationReadinessOverride()) {
      throw new Error('Water installation readiness override commit was rejected.');
    }
    onCompleted(completedRecord);
  }
  function reset() { record = null; elapsedSeconds = 0; }
  function dispose() { if (disposed) return; reset(); disposed = true; }
  return { tryBeginSpecialHandoff, update, reset, dispose, isCapturing: () => record !== null };
}
