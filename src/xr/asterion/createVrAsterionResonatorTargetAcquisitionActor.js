import * as THREE from '../../vendor/three.js';
import {
  containsPointInAsterionResonatorField,
  resolveAsterionResonatorFieldShape
} from './asterionResonatorFieldShape.js';

const ACQUISITION_SECONDS_PER_RING = 2;
const DECAY_SECONDS_PER_RING = 20;
const SIGN_MEMORY_SECONDS = 60;

function createInternalTarget(id, anchor) {
  return {
    id,
    anchor,
    insideField: false,
    ringCount: 0,
    signVisible: false,
    acquisitionSeconds: 0,
    outsideSeconds: 0,
    signMemorySeconds: 0
  };
}

function exposeState(target) {
  return Object.freeze({
    id: target.id,
    insideField: target.insideField,
    ringCount: target.ringCount,
    signVisible: target.signVisible,
    pullReady: target.ringCount === 3
  });
}

function semanticSignature(target) {
  return `${Number(target.insideField)}:${target.ringCount}:${Number(target.signVisible)}`;
}

export function createVrAsterionResonatorTargetAcquisitionActor({ fieldActor, fieldFrame }) {
  if (!fieldActor || typeof fieldActor.getDescriptor !== 'function'
    || typeof fieldActor.subscribe !== 'function') {
    throw new TypeError('fieldActor must expose getDescriptor() and subscribe().');
  }
  if (!fieldFrame || typeof fieldFrame.updateWorldMatrix !== 'function') {
    throw new TypeError('fieldFrame must be a Three.js Object3D.');
  }

  const targets = new Map();
  const listeners = new Set();
  const worldPosition = new THREE.Vector3();
  const localPosition = new THREE.Vector3();
  const fieldFrameInverse = new THREE.Matrix4();
  let fieldShape = resolveAsterionResonatorFieldShape(fieldActor.getDescriptor());
  let disposed = false;

  const unsubscribeField = fieldActor.subscribe((descriptor) => {
    fieldShape = resolveAsterionResonatorFieldShape(descriptor);
  });

  function notify(target) {
    const state = exposeState(target);
    [...listeners].forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.warn('[VrAsterionResonatorTargetAcquisitionActor] Target listener failed.', error);
      }
    });
  }

  function updateInside(target, deltaSeconds) {
    target.outsideSeconds = 0;
    target.signMemorySeconds = 0;
    target.signVisible = true;
    if (target.ringCount >= 3) {
      target.acquisitionSeconds = 0;
      return;
    }

    target.acquisitionSeconds += deltaSeconds;
    while (target.acquisitionSeconds >= ACQUISITION_SECONDS_PER_RING && target.ringCount < 3) {
      target.acquisitionSeconds -= ACQUISITION_SECONDS_PER_RING;
      target.ringCount += 1;
    }
    if (target.ringCount === 3) target.acquisitionSeconds = 0;
  }

  function updateOutside(target, deltaSeconds) {
    target.acquisitionSeconds = 0;
    let remainingSeconds = deltaSeconds;

    while (target.ringCount > 0 && remainingSeconds > 0) {
      const untilDecay = DECAY_SECONDS_PER_RING - target.outsideSeconds;
      const elapsed = Math.min(remainingSeconds, untilDecay);
      target.outsideSeconds += elapsed;
      remainingSeconds -= elapsed;
      if (target.outsideSeconds >= DECAY_SECONDS_PER_RING) {
        target.outsideSeconds = 0;
        target.ringCount -= 1;
        if (target.ringCount === 0) target.signMemorySeconds = 0;
      }
    }

    if (target.ringCount > 0) {
      target.signVisible = true;
      return;
    }
    if (!target.signVisible) return;
    target.signMemorySeconds += remainingSeconds;
    if (target.signMemorySeconds >= SIGN_MEMORY_SECONDS) {
      target.signMemorySeconds = SIGN_MEMORY_SECONDS;
      target.signVisible = false;
    }
  }

  function resetTarget(target) {
    target.insideField = false;
    target.ringCount = 0;
    target.signVisible = false;
    target.acquisitionSeconds = 0;
    target.outsideSeconds = 0;
    target.signMemorySeconds = 0;
  }

  return {
    registerTarget({ id, anchor } = {}) {
      if (disposed) throw new Error('Cannot register a target after disposal.');
      if (typeof id !== 'string' || id.trim() === '') throw new TypeError('Target id must be a non-empty string.');
      if (targets.has(id)) throw new Error(`Target id is already registered: ${id}`);
      if (!anchor || typeof anchor.getWorldPosition !== 'function') {
        throw new TypeError('Target anchor must expose getWorldPosition().');
      }
      const target = createInternalTarget(id, anchor);
      targets.set(id, target);
      let registered = true;
      return () => {
        if (!registered) return;
        targets.delete(id);
        registered = false;
      };
    },
    getTargetState(id) {
      const target = targets.get(id);
      return target ? exposeState(target) : null;
    },
    isPullReady(id) {
      return targets.get(id)?.ringCount === 3;
    },
    subscribe(listener) {
      if (disposed || typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(deltaSeconds) {
      if (disposed || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
      fieldFrame.updateWorldMatrix(true, false);
      fieldFrameInverse.copy(fieldFrame.matrixWorld).invert();
      targets.forEach((target) => {
        const previousSignature = semanticSignature(target);
        target.anchor.getWorldPosition(worldPosition);
        localPosition.copy(worldPosition).applyMatrix4(fieldFrameInverse);
        const insideField = containsPointInAsterionResonatorField(fieldShape, localPosition);
        if (insideField) {
          if (!target.insideField) {
            target.insideField = true;
            target.outsideSeconds = 0;
            target.signMemorySeconds = 0;
          }
          updateInside(target, deltaSeconds);
        } else {
          if (target.insideField) {
            target.insideField = false;
            target.acquisitionSeconds = 0;
            target.outsideSeconds = 0;
            if (target.ringCount === 0) target.signMemorySeconds = 0;
          }
          updateOutside(target, deltaSeconds);
        }
        if (semanticSignature(target) !== previousSignature) notify(target);
      });
    },
    reset() {
      if (disposed) return;
      targets.forEach((target) => {
        const previousSignature = semanticSignature(target);
        resetTarget(target);
        if (semanticSignature(target) !== previousSignature) notify(target);
      });
    },
    dispose() {
      if (disposed) return;
      unsubscribeField();
      targets.clear();
      listeners.clear();
      fieldShape = null;
      disposed = true;
    }
  };
}
