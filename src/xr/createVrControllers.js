import * as THREE from '../vendor/three.js';

const RAY_COLOR = 0xd8e2ec;

export function createVrControllers({ renderer, playerRig, settings }) {
  if (!settings.enabled) {
    return { controllers: [], beginRayHitFrame() {}, resolveVisualRayLength() {}, setRaysEnabled() {}, reset() {}, update() {}, dispose() {} };
  }

  let disposed = false;
  let raysEnabled = false;
  const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)].map((controller, index) => {
    const grip = renderer.xr.getControllerGrip(index);
    grip.name = `VrControllerGrip${index}`;
    const holdSocket = new THREE.Object3D();
    holdSocket.name = `VrCrystalHoldSocket${index}`;
    grip.add(holdSocket);
    const maxTipLength = settings.rayLength * settings.rayTipFraction;
    const shaftLength = settings.rayLength - maxTipLength;
    const shaftGeometry = new THREE.CylinderGeometry(settings.rayDiameter / 2, settings.rayDiameter / 2,
      shaftLength, settings.rayRadialSegments, 1, true);
    const tipGeometry = new THREE.ConeGeometry(settings.rayDiameter / 2, maxTipLength, settings.rayRadialSegments, 1, true);
    const material = new THREE.MeshBasicMaterial({
      color: RAY_COLOR,
      transparent: true,
      opacity: settings.rayOpacity,
      depthWrite: false
    });
    const ray = new THREE.Group();
    const shaft = new THREE.Mesh(shaftGeometry, material);
    shaft.position.z = -shaftLength / 2;
    shaft.rotation.x = -Math.PI / 2;
    const tip = new THREE.Mesh(tipGeometry, material);
    tip.position.z = -(shaftLength + maxTipLength / 2);
    tip.rotation.x = -Math.PI / 2;
    ray.add(shaft, tip);
    ray.name = `VrControllerRay${index}`;
    ray.visible = false;
    ray.frustumCulled = false;
    controller.add(ray);

    const record = {
      index,
      controller,
      grip,
      holdSocket,
      ray,
      handedness: '',
      isConnected: false,
      isSelecting: false,
      currentHit: null,
      currentCrystalHit: null,
      currentCrystalHitDistance: null,
      nearestRayHitDistance: null,
      visualRayLength: settings.rayLength,
      get currentRayLength() {
        return settings.rayLength;
      },
      beginRayHitFrame() { this.nearestRayHitDistance = null; },
      reportRayHit(distance) {
        if (!Number.isFinite(distance) || distance < 0 || distance > settings.rayLength) return;
        this.nearestRayHitDistance = this.nearestRayHitDistance == null
          ? distance : Math.min(this.nearestRayHitDistance, distance);
      }
    };

    record.resolveVisualRayLength = () => {
      const length = Math.min(settings.rayLength, record.nearestRayHitDistance ?? settings.rayLength);
      const tipLength = Math.min(length, Math.max(settings.rayDiameter * 2, length * settings.rayTipFraction));
      const currentShaftLength = Math.max(0, length - tipLength);
      shaft.scale.y = shaftLength > 0 ? currentShaftLength / shaftLength : 0;
      shaft.position.z = -currentShaftLength / 2;
      tip.scale.y = maxTipLength > 0 ? tipLength / maxTipLength : 0;
      tip.position.z = -(currentShaftLength + tipLength / 2);
      record.visualRayLength = length;
      return length;
    };
    record.resetVisualRay = () => {
      record.beginRayHitFrame();
      record.resolveVisualRayLength();
    };

    const setSelecting = (isSelecting) => {
      record.isSelecting = isSelecting;
    };
    const connected = (event) => {
      const inputSource = event.data ?? {};
      record.handedness = inputSource.handedness ?? '';
      record.isConnected = true;
      controller.userData.xrInput = {
        handedness: record.handedness,
        targetRayMode: inputSource.targetRayMode ?? '',
        profiles: Array.isArray(inputSource.profiles) ? [...inputSource.profiles] : []
      };
      ray.visible = raysEnabled;
      setSelecting(false);
    };
    const disconnected = () => {
      ray.visible = false;
      record.handedness = '';
      record.isConnected = false;
      record.currentHit = null;
      record.currentCrystalHit = null;
      record.currentCrystalHitDistance = null;
      record.resetVisualRay();
      delete controller.userData.xrInput;
      setSelecting(false);
    };
    const selectstart = () => {
      if (record.isConnected) setSelecting(true);
    };
    const selectend = () => setSelecting(false);

    const listeners = { connected, disconnected, selectstart, selectend };
    for (const [type, listener] of Object.entries(listeners)) controller.addEventListener(type, listener);
    playerRig.add(controller);
    playerRig.add(grip);

    return { ...record, listeners, record, shaftGeometry, tipGeometry, material };
  });

  const publicControllers = controllers.map(({ record }) => record);

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const { controller, grip, holdSocket, ray, listeners, record, shaftGeometry, tipGeometry, material } of controllers) {
      for (const [type, listener] of Object.entries(listeners)) controller.removeEventListener(type, listener);
      ray.visible = false;
      shaftGeometry.dispose();
      tipGeometry.dispose();
      material.dispose();
      controller.remove(ray);
      playerRig.remove(controller);
      grip.remove(holdSocket);
      playerRig.remove(grip);
      delete controller.userData.xrInput;
      record.handedness = '';
      record.isConnected = false;
      record.isSelecting = false;
      record.currentHit = null;
      record.currentCrystalHit = null;
      record.currentCrystalHitDistance = null;
      record.resetVisualRay();
    }
  }

  function beginRayHitFrame() { publicControllers.forEach((record) => record.beginRayHitFrame()); }
  function resolveVisualRayLength() { publicControllers.forEach((record) => record.resolveVisualRayLength()); }
  function setRaysEnabled(enabled) {
    raysEnabled = Boolean(enabled);
    publicControllers.forEach((record) => { record.ray.visible = raysEnabled && record.isConnected; });
  }
  function reset() {
    setRaysEnabled(false);
    publicControllers.forEach((record) => record.resetVisualRay());
  }

  return { controllers: publicControllers, beginRayHitFrame, resolveVisualRayLength, setRaysEnabled, reset, update() {}, dispose };
}
