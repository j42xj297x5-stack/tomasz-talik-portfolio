import * as THREE from '../../vendor/three.js';

const REQUIRED_NODE_NAMES = Object.freeze([
  'ASTRO_FURNACE_ROOT', 'button_open', 'button_activate', 'button_option',
  'PIVOT_BUTTON_OPEN', 'PIVOT_BUTTON_ACTIVATE', 'PIVOT_BUTTON_OPTION',
  'PIVOT_FURNACE_LATCH_LEFT', 'PIVOT_FURNACE_LATCH_RIGHT', 'PIVOT_FURNACE_LATCH_TOP',
  'PIVOT_FURNACE_LID_Z', 'PIVOT_FURNACE_LID_PROCESS_SPIN', 'PIVOT_FURNACE_CHAMBER_Z',
  'PIVOT_FURNACE_PROCESS_SPIN', 'komora', 'pokrywa', 'pokrywa_gora',
  'zatrzask_lewy', 'zatrzask_prawy', 'zatrzask_gora', 'fire_cell',
  'VR_FURNACE_INSERT_VOLUME', 'VR_FURNACE_CONTENT_ANCHOR', 'VR_FURNACE_LIGHT_ORBIT',
  'VR_FURNACE_ESSENCE_ANCHOR', 'RUNE_RECIPE_SMALL_GLYPH_SLOT',
  'RUNE_RECIPE_SHELL_SLOT', 'VR_FURNACE_PRODUCT_VOLUME'
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
const PRODUCT_VOLUME_NODE_NAME = 'VR_FURNACE_PRODUCT_VOLUME';

function isVisibleGeometry(node, root) {
  if (!node.geometry || !node.isMesh || node.name === PRODUCT_VOLUME_NODE_NAME) return false;
  for (let current = node; current; current = current.parent) {
    if (!current.visible) return false;
    if (current === root) break;
  }
  return true;
}

export function createVrAstroFurnace({
  parent, model, animations = [], settings
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
      'PIVOT_FURNACE_LID_Z', 'PIVOT_FURNACE_CHAMBER_Z', 'pokrywa', 'pokrywa_gora'
    ]) && hasAll(clips, REQUIRED_CLIP_NAMES.slice(2)),
    processSpinReady: hasAll(nodes, ['PIVOT_FURNACE_PROCESS_SPIN', 'PIVOT_FURNACE_LID_PROCESS_SPIN']),
    insertionReady: settings.content?.enabled !== false
      && hasAll(nodes, ['VR_FURNACE_INSERT_VOLUME', 'VR_FURNACE_CONTENT_ANCHOR'])
      && (Boolean(nodes.VR_FURNACE_INSERT_VOLUME.geometry) || Number(settings.content?.volumeRadius) > 0),
    essenceOutputReady: Boolean(nodes.VR_FURNACE_ESSENCE_ANCHOR),
    runeRecipeAnchorsReady: hasAll(nodes, [
      'RUNE_RECIPE_SMALL_GLYPH_SLOT', 'RUNE_RECIPE_SHELL_SLOT', 'VR_FURNACE_INSERT_VOLUME'
    ]),
    productVolumeReady: Boolean(nodes.VR_FURNACE_PRODUCT_VOLUME)
  });
  const diagnostics = {
    nodeNames: Object.freeze(Object.keys(nodes)),
    clipNames: Object.freeze(Object.keys(clips)),
    missingNodes: Object.freeze(missingNodes),
    missingClips: Object.freeze(missingClips),
    capabilities, animationDetails, appliedScale: settings.scale,
    fixturePosition: null, resolvedPosition: null, visibleBounds: null
  };
  let disposed = false;
  const runtimeMaterialBranches = new WeakMap();
  const runtimeMaterials = new Set();
  const placementListeners = new Set();
  const visibleBounds = new THREE.Box3();
  const geometryBounds = new THREE.Box3();
  const localVisibleBounds = new THREE.Box3();
  const localGeometryBounds = new THREE.Box3();
  const objectWorldInverse = new THREE.Matrix4();
  const nodeToObject = new THREE.Matrix4();
  const authoredModelRootPosition = modelRoot.position.clone();
  const resolvedWorldPosition = new THREE.Vector3();

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

  function calculateLocalVisibleBounds() {
    localVisibleBounds.makeEmpty();
    object.updateWorldMatrix(true, true);
    objectWorldInverse.copy(object.matrixWorld).invert();
    model?.traverse((node) => {
      if (!isVisibleGeometry(node, model)) return;
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      if (node.geometry.boundingBox) localVisibleBounds.union(localGeometryBounds
        .copy(node.geometry.boundingBox)
        .applyMatrix4(nodeToObject.multiplyMatrices(objectWorldInverse, node.matrixWorld)));
    });
    return localVisibleBounds;
  }

  function place() {
    if (disposed) return false;
    modelRoot.position.copy(authoredModelRootPosition);
    object.position.set(settings.position.x, settings.position.y, settings.position.z);
    object.rotation.set(
      THREE.MathUtils.degToRad(settings.rotationDegrees.x),
      THREE.MathUtils.degToRad(settings.rotationDegrees.y),
      THREE.MathUtils.degToRad(settings.rotationDegrees.z)
    );
    object.scale.setScalar(settings.scale);
    const bounds = calculateLocalVisibleBounds();
    if (!bounds.isEmpty()) {
      const localFloorY = (settings.floorOffset - object.position.y) / settings.scale;
      modelRoot.position.y = authoredModelRootPosition.y + localFloorY - bounds.min.y;
    }
    object.visible = settings.enabled && Boolean(model);
    calculateVisibleBounds();
    object.getWorldPosition(resolvedWorldPosition);
    diagnostics.appliedScale = object.scale.x;
    diagnostics.fixturePosition = object.position.toArray();
    diagnostics.resolvedPosition = resolvedWorldPosition.toArray();
    diagnostics.visibleBounds = visibleBounds.isEmpty() ? null : {
      min: visibleBounds.min.toArray(), max: visibleBounds.max.toArray()
    };
    placementListeners.forEach((listener) => listener());
    return object.visible;
  }

  function update() {}
  function ensureRuntimeMaterials(root) {
    if (!root) return [];
    const existing = runtimeMaterialBranches.get(root);
    if (existing) return existing;
    const materials = [];
    root.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const source = Array.isArray(node.material) ? node.material : [node.material];
      const clones = source.map((material) => material?.clone?.() ?? material);
      clones.forEach((material, index) => { if (material !== source[index]) runtimeMaterials.add(material); });
      node.material = Array.isArray(node.material) ? clones : clones[0];
      materials.push(...clones.filter(Boolean));
    });
    runtimeMaterialBranches.set(root, materials);
    return materials;
  }
  ensureRuntimeMaterials(nodes[PRODUCT_VOLUME_NODE_NAME]).forEach((material) => {
    material.visible = false;
  });
  function refreshVisibleBounds() {
    const bounds = calculateVisibleBounds();
    diagnostics.visibleBounds = bounds.isEmpty() ? null : {
      min: bounds.min.toArray(), max: bounds.max.toArray()
    };
    return diagnostics.visibleBounds;
  }
  function reset() { return place(); }
  function resetBaseline() { place(); object.visible = false; }
  function hydrateScenarioState(state) {
    if (!state || typeof state.revealed !== 'boolean') throw new TypeError('furnace.revealed must be a boolean');
    object.visible = state.revealed;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    placementListeners.clear();
    runtimeMaterials.forEach((material) => material.dispose?.());
    runtimeMaterials.clear();
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
      animationDetails: JSON.stringify(diagnostics.animationDetails),
      appliedScale: diagnostics.appliedScale, fixturePosition: JSON.stringify(diagnostics.fixturePosition),
      resolvedPosition: JSON.stringify(diagnostics.resolvedPosition),
      visibleBounds: JSON.stringify(diagnostics.visibleBounds)
    });
    console.groupEnd();
  }

  return { object, model, nodes, clips, capabilities, place, update, reset, resetBaseline, hydrateScenarioState, dispose, diagnostics, refreshVisibleBounds,
    ensureRuntimeMaterials,
    subscribePlacement(listener) { placementListeners.add(listener); return () => placementListeners.delete(listener); } };
}
