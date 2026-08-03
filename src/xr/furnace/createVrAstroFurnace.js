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

export function createVrAstroFurnace({ parent, model, animations = [], settings }) {
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
  const diagnostics = Object.freeze({
    nodeNames: Object.freeze(Object.keys(nodes)),
    clipNames: Object.freeze(Object.keys(clips)),
    missingNodes: Object.freeze(missingNodes),
    missingClips: Object.freeze(missingClips),
    capabilities
  });
  let disposed = false;

  function place() {
    if (disposed) return false;
    object.position.set(settings.position.x, settings.position.y, settings.position.z);
    object.rotation.set(
      THREE.MathUtils.degToRad(settings.rotationDegrees.x),
      THREE.MathUtils.degToRad(settings.rotationDegrees.y),
      THREE.MathUtils.degToRad(settings.rotationDegrees.z)
    );
    object.scale.setScalar(settings.scale);
    object.visible = settings.enabled && Boolean(model);
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
      capabilities: JSON.stringify(capabilities)
    });
    console.groupEnd();
  }

  place();
  return { object, model, nodes, clips, capabilities, place, update, reset, dispose, diagnostics };
}
