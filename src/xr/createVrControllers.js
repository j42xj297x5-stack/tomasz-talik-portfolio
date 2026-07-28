import * as THREE from '../vendor/three.js';

const RAY_COLOR = 0xd8e2ec;

export function createVrControllers({ renderer, playerRig, settings }) {
  if (!settings.enabled) {
    return { controllers: [], update() {}, dispose() {} };
  }

  let disposed = false;
  const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)].map((controller, index) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -settings.rayLength)
    ]);
    const material = new THREE.LineBasicMaterial({
      color: RAY_COLOR,
      transparent: settings.rayOpacity < 1,
      opacity: settings.rayOpacity
    });
    const ray = new THREE.Line(geometry, material);
    ray.name = `VrControllerRay${index}`;
    ray.visible = false;
    ray.frustumCulled = false;
    controller.add(ray);

    const record = {
      index,
      controller,
      ray,
      handedness: '',
      isConnected: false,
      isSelecting: false,
      currentHit: null,
      get currentRayLength() {
        return settings.rayLength * (this.isSelecting ? settings.activeScale : settings.idleScale);
      }
    };

    const setSelecting = (isSelecting) => {
      record.isSelecting = isSelecting;
      ray.scale.z = isSelecting ? settings.activeScale : settings.idleScale;
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
      ray.visible = true;
      setSelecting(false);
    };
    const disconnected = () => {
      ray.visible = false;
      record.handedness = '';
      record.isConnected = false;
      record.currentHit = null;
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

    return { ...record, listeners, record };
  });

  const publicControllers = controllers.map(({ record }) => record);

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const { controller, ray, listeners, record } of controllers) {
      for (const [type, listener] of Object.entries(listeners)) controller.removeEventListener(type, listener);
      ray.visible = false;
      ray.geometry.dispose();
      ray.material.dispose();
      controller.remove(ray);
      playerRig.remove(controller);
      delete controller.userData.xrInput;
      record.handedness = '';
      record.isConnected = false;
      record.isSelecting = false;
      record.currentHit = null;
    }
  }

  return { controllers: publicControllers, update() {}, dispose };
}
