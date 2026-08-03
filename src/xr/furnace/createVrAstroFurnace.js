import * as THREE from '../../vendor/three.js';

const REQUIRED_NODE_NAMES = Object.freeze([
  'ASTRO_FURNACE_ROOT', 'button_open', 'button_activate', 'button_option',
  'PIVOT_BUTTON_OPEN', 'PIVOT_BUTTON_ACTIVATE', 'PIVOT_BUTTON_OPTION',
  'PIVOT_FURNACE_LATCH_LEFT', 'PIVOT_FURNACE_LATCH_RIGHT', 'PIVOT_FURNACE_LATCH_TOP',
  'PIVOT_FURNACE_LID_Z', 'PIVOT_FURNACE_CHAMBER_Z', 'PIVOT_FURNACE_PROCESS_SPIN',
  'komora', 'pokrywa', 'zatrzask_lewy', 'zatrzask_prawy', 'zatrzask_gora', 'fire_cell',
  'VR_FURNACE_INSERT_VOLUME', 'VR_FURNACE_CONTENT_ANCHOR', 'VR_FURNACE_LIGHT_ORBIT',
  'VR_FURNACE_ESSENCE_ANCHOR'
]);

const REQUIRED_CLIP_NAMES = Object.freeze([
  'AstroFurnace_ButtonOpen_Press', 'AstroFurnace_ButtonActivate_Lock',
  'AstroFurnace_Chamber_Open_LatchLeft', 'AstroFurnace_Chamber_Open_LatchRight',
  'AstroFurnace_Chamber_Open_LatchTop', 'AstroFurnace_Chamber_Open_Lid',
  'AstroFurnace_Chamber_Open_Chamber'
]);

const hasAll = (lookup, names) => names.every((name) => Boolean(lookup[name]));
const GLTF_CHANNEL_TYPE = Object.freeze({
  position: 'translation', quaternion: 'rotation', scale: 'scale', morphTargetInfluences: 'weights'
});

export function calculateMirroredHorizontalPosition(anchorCenter, mirrorPosition, target = new THREE.Vector3()) {
  return target.set(2 * anchorCenter.x - mirrorPosition.x, anchorCenter.y, 2 * anchorCenter.z - mirrorPosition.z);
}

function isVisibleGeometry(node, root) {
  if (!node.geometry || !node.isMesh) return false;
  for (let current = node; current; current = current.parent) {
    if (!current.visible) return false;
    if (current === root) break;
  }
  return true;
}

export function createVrAstroFurnace({
  parent, model, animations = [], settings, anchorObject, mirrorObject, spawnPosition
}) {
  const object = new THREE.Group();
  object.name = 'VrAstroFurnace';
  const modelRoot = new THREE.Group();
  modelRoot.name = 'VrAstroFurnaceModelRoot';
  object.add(modelRoot);
  if (model) modelRoot.add(model);
  parent?.add(object);

  const nodes = Object.create(null);
  if (model) {
    model.traverse((node) => {
      if (node.name && !nodes[node.name]) nodes[node.name] = node;
    });
  }
  const clips = Object.create(null);
  for (const clip of animations) {
    if (clip?.name && !clips[clip.name]) clips[clip.name] = clip;
  }
  const missingNodes = REQUIRED_NODE_NAMES.filter((name) => !nodes[name]);
  const missingClips = REQUIRED_CLIP_NAMES.filter((name) => !clips[name]);
  const animationDetails = animations.map((clip) => ({
    name: clip?.name ?? '', duration: clip?.duration ?? 0,
    channels: clip?.tracks?.length ?? 0, samplers: clip?.tracks?.length ?? 0,
    nodes: [...new Set((clip?.tracks ?? []).map((track) => track.name.split('.')[0]))],
    channelTypes: [...new Set((clip?.tracks ?? []).map((track) => {
      const property = track.name.split('.').at(-1);
      return GLTF_CHANNEL_TYPE[property] ?? property;
    }))]
  }));
  const capabilities = Object.freeze({
    assetReady: Boolean(model),
    openButtonReady: hasAll(nodes, ['button_open', 'PIVOT_BUTTON_OPEN'])
      && Boolean(clips.AstroFurnace_ButtonOpen_Press),
    activateButtonReady: hasAll(nodes, ['button_activate', 'PIVOT_BUTTON_ACTIVATE'])
      && Boolean(clips.AstroFurnace_ButtonActivate_Lock),
    optionButtonReady: hasAll(nodes, ['button_option', 'PIVOT_BUTTON_OPTION']),
    chamberAnimationReady: hasAll(nodes, [
      'PIVOT_FURNACE_LATCH_LEFT', 'PIVOT_FURNACE_LATCH_RIGHT', 'PIVOT_FURNACE_LATCH_TOP',
      'PIVOT_FURNACE_LID_Z', 'PIVOT_FURNACE_CHAMBER_Z'
    ]) && hasAll(clips, REQUIRED_CLIP_NAMES.slice(2)),
    processSpinReady: Boolean(nodes.PIVOT_FURNACE_PROCESS_SPIN),
    insertionReady: hasAll(nodes, ['VR_FURNACE_INSERT_VOLUME', 'VR_FURNACE_CONTENT_ANCHOR']),
    essenceOutputReady: Boolean(nodes.VR_FURNACE_ESSENCE_ANCHOR)
  });
  const diagnostics = {
    nodeNames: Object.freeze(Object.keys(nodes)),
    clipNames: Object.freeze(Object.keys(clips)),
    missingNodes: Object.freeze(missingNodes),
    missingClips: Object.freeze(missingClips),
    capabilities, animationDetails, placementMode: settings.placementMode, appliedScale: settings.scale,
    anchorCenter: null, mirrorPosition: null, resolvedPosition: null, visibleBounds: null
  };
  let disposed = false;
  const anchorBounds = new THREE.Box3();
  const visibleBounds = new THREE.Box3();
  const geometryBounds = new THREE.Box3();
  const anchorCenter = new THREE.Vector3();
  const mirrorPosition = new THREE.Vector3();
  const resolvedWorldPosition = new THREE.Vector3();
  const target = new THREE.Vector3();

  function calculateVisibleBounds() {
    visibleBounds.makeEmpty();
    object.updateWorldMatrix(true, true);
    model?.traverse((node) => {
      if (!isVisibleGeometry(node, model)) return;
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      if (node.geometry.boundingBox) visibleBounds.union(
        geometryBounds.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld)
      );
    });
    return visibleBounds;
  }

  function place() {
    if (disposed) return false;
    object.scale.setScalar(settings.scale);
    if (settings.placementMode === 'mirror-portal' && anchorObject && mirrorObject) {
      anchorObject.updateWorldMatrix(true, true);
      mirrorObject.updateWorldMatrix(true, false);
      anchorBounds.setFromObject(anchorObject).getCenter(anchorCenter);
      mirrorObject.getWorldPosition(mirrorPosition);
      calculateMirroredHorizontalPosition(anchorCenter, mirrorPosition, resolvedWorldPosition);
      object.position.copy(resolvedWorldPosition);
      parent?.worldToLocal(object.position);
    } else {
      object.position.set(settings.position.x, settings.position.y, settings.position.z);
      anchorCenter.set(0, 0, 0);
      mirrorPosition.set(0, 0, 0);
    }
    object.position.y = 0;
    target.set(spawnPosition?.x ?? 0, object.position.y, spawnPosition?.z ?? 0);
    object.lookAt(target);
    object.rotateX(THREE.MathUtils.degToRad(settings.rotationDegrees.x));
    object.rotateY(THREE.MathUtils.degToRad(settings.rotationDegrees.y));
    object.rotateZ(THREE.MathUtils.degToRad(settings.rotationDegrees.z));
    const bounds = calculateVisibleBounds();
    if (!bounds.isEmpty()) object.position.y += settings.floorOffset - bounds.min.y;
    object.visible = settings.enabled && Boolean(model);
    calculateVisibleBounds();
    object.getWorldPosition(resolvedWorldPosition);
    diagnostics.placementMode = settings.placementMode;
    diagnostics.appliedScale = object.scale.x;
    diagnostics.anchorCenter = anchorObject ? anchorCenter.toArray() : null;
    diagnostics.mirrorPosition = mirrorObject ? mirrorPosition.toArray() : null;
    diagnostics.resolvedPosition = resolvedWorldPosition.toArray();
    diagnostics.visibleBounds = visibleBounds.isEmpty() ? null : {
      min: visibleBounds.min.toArray(), max: visibleBounds.max.toArray()
    };
    return object.visible;
  }

  function update() {}
  function reset() { return place(); }
  function dispose() {
    if (disposed) return;
    disposed = true;
    object.visible = false;
    object.removeFromParent();
  }

  place();
  if (missingNodes.length || missingClips.length) {
    console.warn('[Experience VR] Astro furnace GLB contract is incomplete.', { missingNodes, missingClips });
  }
  if (settings.debug) {
    console.groupCollapsed('[Experience VR] Astro furnace diagnostics');
    console.table({
      nodes: diagnostics.nodeNames.join(', '),
      clips: diagnostics.clipNames.join(', '),
      missingNodes: diagnostics.missingNodes.join(', '),
      missingClips: diagnostics.missingClips.join(', '),
      capabilities: JSON.stringify(capabilities),
      animationDetails: JSON.stringify(diagnostics.animationDetails), placementMode: diagnostics.placementMode,
      appliedScale: diagnostics.appliedScale, anchorCenter: JSON.stringify(diagnostics.anchorCenter),
      mirrorPosition: JSON.stringify(diagnostics.mirrorPosition), resolvedPosition: JSON.stringify(diagnostics.resolvedPosition),
      visibleBounds: JSON.stringify(diagnostics.visibleBounds)
    });
    console.groupEnd();
  }

  return { object, model, nodes, clips, capabilities, place, update, reset, dispose, diagnostics };
}
