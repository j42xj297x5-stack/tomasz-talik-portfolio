import * as THREE from '../vendor/three.js';

const DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG = Object.freeze({
  enabled: true,
  debugVisible: false,
  debugBlendingMode: 'normal',
  debugIgnoreFog: true,
  showShellHelpers: false,
  showAtmosphereLogs: false,
  safeRadius: 3,
  shellInnerRadius: 15,
  shellOuterRadius: 25,
  dust: Object.freeze({ enabled: true, count: 6000, innerRadius: 15, outerRadius: 25, safeRadius: 3, idleOpacity: 1, rotationSpeed: 0.018, pointSize: 0.07, color: '#cfe2ff', sizeAttenuation: true, depthTest: true, depthWrite: false }),
  stoneRelics: Object.freeze({
    enabled: true, count: 30,
    models: Object.freeze(['/glb/stone_01.glb','/glb/stone_02.glb','/glb/stone_03.glb','/glb/stone_04.glb','/glb/stone_05.glb','/glb/stone_06.glb']),
    safeRadius: 3.5, shellInnerRadius: 18, shellOuterRadius: 20, minScale: 2, maxScale: 5,
    rotationSpeedMin: 0.05, rotationSpeedMax: 0.09, selfRotationSpeedMultiplier: 1, orbitSpeed: 0.003, opacity: 1, debugVisible: false
  }),
  shellRelics: Object.freeze({
    enabled: true, count: 100,
    models: Object.freeze(['/glb/shell_01.glb','/glb/shell_02.glb','/glb/shell_03.glb','/glb/shell_04.glb','/glb/shell_05.glb','/glb/shell_06.glb']),
    minScale: 0.4, maxScale: 0.7, shellInnerRadius: 10, shellOuterRadius: 13,
    rotationSpeedMin: 0.047, rotationSpeedMax: 0.486, selfRotationSpeedMultiplier: 1, orbitSpeed: 0.013, opacity: 1, debugVisible: false,
    colorPalette: Object.freeze(['#d9a441','#4db6ac','#6ec6ff','#6bcf8e','#9c7bff','#f0a6a6'])
  }),
  smallGlyphRelics: Object.freeze({
    enabled: true, count: 50,
    models: Object.freeze(['/glb/small_glyph_01.glb','/glb/small_glyph_02.glb','/glb/small_glyph_03.glb','/glb/small_glyph_04.glb','/glb/small_glyph_05.glb','/glb/small_glyph_06.glb']),
    minScale: 0.5, maxScale: 0.8, shellInnerRadius: 8, shellOuterRadius: 10,
    rotationSpeedMin: 0.01, rotationSpeedMax: 0.028, selfRotationSpeedMultiplier: 1, orbitSpeed: 0.005, opacity: 0.53, debugVisible: false
  })
});

const randomBetween = (min, max) => min + Math.random() * (max - min);
const PROGRESSION_EPSILON = 0.0001;
function randomPointInShell(innerRadius, outerRadius) { const d = new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize(); const r = Math.cbrt(Math.random()*(outerRadius**3-innerRadius**3)+innerRadius**3); return d.multiplyScalar(r); }

function resolveAtmosphereConfig(overrides = {}) { return { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG, ...overrides, dust: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.dust, ...(overrides?.dust ?? {}) }, stoneRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.stoneRelics, ...(overrides?.stoneRelics ?? {}) }, shellRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.shellRelics, ...(overrides?.shellRelics ?? {}) }, smallGlyphRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.smallGlyphRelics, ...(overrides?.smallGlyphRelics ?? {}) } }; }
function createDustField(config) { const dust=config.dust; const outer=Math.max(0,dust.outerRadius); const inner=Math.min(outer,Math.max(0,dust.innerRadius,dust.safeRadius)); const positions=new Float32Array(dust.count*3); for(let i=0;i<dust.count;i+=1){const idx=i*3;const p=randomPointInShell(inner,outer); positions[idx]=p.x;positions[idx+1]=p.y;positions[idx+2]=p.z;} const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(positions,3)); const m=new THREE.PointsMaterial(); const points=new THREE.Points(g,m); points.raycast=()=>{}; return { points, material:m }; }
function createShellDebugHelpers(config){ const g=new THREE.Group(); const mk=(r,c)=>new THREE.Mesh(new THREE.SphereGeometry(r,24,18),new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.35,depthTest:false,depthWrite:false})); g.add(mk(config.shellInnerRadius,0x66e0ff),mk(config.shellOuterRadius,0xffffff)); return g; }

async function loadModelSet({ label, models, cache, loadedFlagSetter, assetManager }) {
  models.forEach((path) => {
    const gltf = assetManager?.getGltfByPath?.(path);
    if (gltf?.scene) {
      cache.set(path, gltf.scene);
      console.info(`[backgroundAtmosphere][${label}] Using model ${path} from AssetManager cache.`);
    } else {
      console.warn(`[backgroundAtmosphere][${label}] Model ${path} was not in AssetManager cache. Relic fallback/no-relic state retained for this source.`);
    }
  });
  loadedFlagSetter();
}

function cloneRelicModel(source, opacity){ const materials=[]; const clone=source.clone(true); clone.traverse((child)=>{ if(!child.isMesh) return; const apply=(mat)=>{const m=mat.clone();m.transparent=true;m.opacity=0;m.userData={...(m.userData??{}),targetOpacity:opacity};materials.push(m);return m;}; child.material=Array.isArray(child.material)?child.material.map(apply):apply(child.material); }); return { object: clone, materials }; }
function cloneShellRelicModel(source, config, colorHex){ const materials=[]; const clone=source.clone(true); const tint=new THREE.Color(colorHex); clone.traverse((child)=>{ if(!child.isMesh) return; const apply=(mat)=>{const m=mat.clone();m.color?.multiply?.(tint);m.transparent=true;m.opacity=0;m.userData={...(m.userData??{}),targetOpacity:config.debugVisible?1:config.opacity};m.roughness=Math.min(1,Math.max(0,m.roughness ?? 0.35));m.roughness=Math.max(0.08,m.roughness*0.7);m.metalness=Math.min(0.18,Math.max(0,m.metalness ?? 0.05));m.depthWrite=false;materials.push(m);return m;}; child.material=Array.isArray(child.material)?child.material.map(apply):apply(child.material); }); return { object: clone, materials }; }

export function createBackgroundAtmosphere(configOverrides = {}, { assetManager = null, deferRelicsUntilWarm = false } = {}) {
  let config = resolveAtmosphereConfig(configOverrides);
  const root = new THREE.Group();
  const stoneRelicsGroup = new THREE.Group();
  stoneRelicsGroup.name = 'StoneRelicsGroup';
  const shellRelicsGroup = new THREE.Group();
  shellRelicsGroup.name = 'ShellRelicsGroup';
  const smallGlyphRelicsGroup = new THREE.Group();
  smallGlyphRelicsGroup.name = 'SmallGlyphRelicsGroup';
  const stoneRelicStates = [];
  const shellRelicStates = [];
  const smallGlyphRelicStates = [];
  const relicModelCache = new Map();
  const shellModelCache = new Map();
  const smallGlyphModelCache = new Map();
  let relicModelsLoaded = false;
  let shellModelsLoaded = false;
  let smallGlyphModelsLoaded = false;
  let dustField = null;
  let helperGroup = null;
  let progressionMultipliers = { stones: 1, shells: 1, smallGlyphs: 1, stars: 1, galaxies: 1 };
  let revealProgress = { stones: 0, shells: 0, smallGlyphs: 0 };
  let hasHydratedDeferredRelics = false;
  const lifecycleCounts = { atmosphereRebuilds: 0, atmosphereHydrations: 0, stoneBuilds: 0, shellBuilds: 0, smallGlyphBuilds: 0 };

  function applyDustMaterialOptions(){ if(!dustField) return; Object.assign(dustField.material,{size:config.dust.pointSize,transparent:true,opacity:config.dust.idleOpacity*(progressionMultipliers.stars ?? progressionMultipliers.starsDust ?? 1),sizeAttenuation:config.dust.sizeAttenuation,depthTest:config.dust.depthTest,depthWrite:config.dust.depthWrite,fog:config.debugIgnoreFog ? !config.debugVisible : true}); dustField.material.color.set(config.dust.color); dustField.material.blending=config.debugBlendingMode==='additive'?THREE.AdditiveBlending:THREE.NormalBlending; dustField.material.needsUpdate=true; }
  function setHelpersVisible(){ if(helperGroup) helperGroup.visible=Boolean(config.showShellHelpers||config.debugVisible); }
  async function loadRelicModels(){ if(relicModelsLoaded) return; await loadModelSet({ label: 'stoneRelics', models: config.stoneRelics.models, cache: relicModelCache, loadedFlagSetter: () => { relicModelsLoaded = true; }, assetManager }); }
  async function loadShellModels(){ if(shellModelsLoaded) return; await loadModelSet({ label: 'shellRelics', models: config.shellRelics.models, cache: shellModelCache, loadedFlagSetter: () => { shellModelsLoaded = true; }, assetManager }); }
  async function loadSmallGlyphModels(){ if(smallGlyphModelsLoaded) return; await loadModelSet({ label: 'smallGlyphRelics', models: config.smallGlyphRelics.models, cache: smallGlyphModelCache, loadedFlagSetter: () => { smallGlyphModelsLoaded = true; }, assetManager }); }
  function clearRelics(){ while(stoneRelicsGroup.children.length>0){ const c=stoneRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } stoneRelicStates.length=0; }
  function clearShellRelics(){ while(shellRelicsGroup.children.length>0){ const c=shellRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } shellRelicStates.length=0; }
  function clearSmallGlyphRelics(){ while(smallGlyphRelicsGroup.children.length>0){ const c=smallGlyphRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } smallGlyphRelicStates.length=0; }
  function setObjectReveal(state, reveal, updateMaterials){ if(updateMaterials){ state.materials.forEach((material)=>{ const opacity=(material.userData?.targetOpacity ?? 1)*reveal; if(Math.abs(material.opacity-opacity)>PROGRESSION_EPSILON) material.opacity=opacity; }); } state.object.scale.copy(state.targetScale).multiplyScalar(0.88+0.12*reveal); }
  function rebuildStoneRelics(){ lifecycleCounts.stoneBuilds += 1; clearRelics(); const s=config.stoneRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>relicModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const cloned=cloneRelicModel(relicModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s.debugVisible?1:s.opacity); const model=cloned.object; const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.8:1); const outer=Math.max(0,s.shellOuterRadius); const inner=Math.min(outer,Math.max(s.shellInnerRadius,s.safeRadius)); const pos=randomPointInShell(inner,outer); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); stoneRelicsGroup.add(model); stoneRelicStates.push({object:model,materials:cloned.materials,basePosition:pos.clone(),radialDirection:pos.clone().normalize(),targetScale:model.scale.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applyStoneMaterial(){ applyRelicMaterial(stoneRelicStates, config.stoneRelics, revealProgress.stones); }

  function rebuildShellRelics(){ lifecycleCounts.shellBuilds += 1; clearShellRelics(); const s=config.shellRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>shellModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const palette=(Array.isArray(s.colorPalette)&&s.colorPalette.length>0)?s.colorPalette:DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.shellRelics.colorPalette; const tint=palette[Math.floor(Math.random()*palette.length)]; const cloned=cloneShellRelicModel(shellModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s, tint); const model=cloned.object; const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.1:1); const outer=Math.max(0,s.shellOuterRadius); const inner=Math.min(outer,Math.max(0,s.shellInnerRadius)); const pos=randomPointInShell(inner,outer); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); shellRelicsGroup.add(model); shellRelicStates.push({object:model,materials:cloned.materials,basePosition:pos.clone(),radialDirection:pos.clone().normalize(),targetScale:model.scale.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applyShellMaterial(){ applyRelicMaterial(shellRelicStates, config.shellRelics, revealProgress.shells); }

  function rebuildSmallGlyphRelics(){ lifecycleCounts.smallGlyphBuilds += 1; clearSmallGlyphRelics(); const s=config.smallGlyphRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>smallGlyphModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const cloned=cloneRelicModel(smallGlyphModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s.debugVisible?1:s.opacity); const model=cloned.object; const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.1:1); const outer=Math.max(0,s.shellOuterRadius); const inner=Math.min(outer,Math.max(0,s.shellInnerRadius)); const pos=randomPointInShell(inner,outer); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); smallGlyphRelicsGroup.add(model); smallGlyphRelicStates.push({object:model,materials:cloned.materials,basePosition:pos.clone(),radialDirection:pos.clone().normalize(),targetScale:model.scale.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applySmallGlyphMaterial(){ applyRelicMaterial(smallGlyphRelicStates, config.smallGlyphRelics, revealProgress.smallGlyphs); }


  function applyRelicMaterial(states, layerConfig, reveal) { states.forEach((state) => { state.materials.forEach((material) => { material.userData.targetOpacity=layerConfig.debugVisible?1:layerConfig.opacity; }); setObjectReveal(state, reveal, true); }); }
  function rebuildAllRelics(){ rebuildStoneRelics(); rebuildShellRelics(); rebuildSmallGlyphRelics(); applyStoneMaterial(); applyShellMaterial(); applySmallGlyphMaterial(); }
  async function rebuild(){ lifecycleCounts.atmosphereRebuilds += 1; while(root.children.length>0) root.remove(root.children[0]); dustField=null; helperGroup=null; clearRelics(); clearShellRelics(); clearSmallGlyphRelics(); if(!config.enabled) return; if(config.dust.enabled){dustField=createDustField(config);root.add(dustField.points);applyDustMaterialOptions();} helperGroup=createShellDebugHelpers(config);root.add(helperGroup);setHelpersVisible(); root.add(stoneRelicsGroup); root.add(shellRelicsGroup); root.add(smallGlyphRelicsGroup); if(hasHydratedDeferredRelics){ rebuildAllRelics(); return; } if(!deferRelicsUntilWarm){ await hydrateDeferredRelics(); } }
  async function hydrateDeferredRelics(){ lifecycleCounts.atmosphereHydrations += 1; if(!hasHydratedDeferredRelics){ await loadRelicModels(); await loadShellModels(); await loadSmallGlyphModels(); hasHydratedDeferredRelics = true; } rebuildAllRelics(); }
  function applySettings(next={},action='full-rebuild'){
    config=resolveAtmosphereConfig({ ...config, ...next });
    if(action==='full-rebuild'){ void rebuild(); return true; }
    if(action==='dust-rebuild'){ if(dustField){ root.remove(dustField.points); dustField.material.dispose(); dustField.points.geometry.dispose(); dustField=null; } if(config.enabled&&config.dust.enabled){ dustField=createDustField(config); root.add(dustField.points); applyDustMaterialOptions(); } return true; }
    if(action==='material'){applyDustMaterialOptions();applyStoneMaterial();applyShellMaterial();applySmallGlyphMaterial();return true;}
    if(action==='dust-material'||action==='dust-runtime'){applyDustMaterialOptions();return true;}
    if(action==='helpers'){setHelpersVisible();return true;}
    if(action==='stone-runtime'){if(config.stoneRelics.enabled&&stoneRelicStates.length===0&&hasHydratedDeferredRelics)rebuildStoneRelics();applyStoneMaterial();return true;}
    if(action==='stone-rebuild'){rebuildStoneRelics();applyStoneMaterial();return true;}
    if(action==='shell-runtime'){if(config.shellRelics.enabled&&shellRelicStates.length===0&&hasHydratedDeferredRelics)rebuildShellRelics();applyShellMaterial();return true;}
    if(action==='shell-rebuild'){rebuildShellRelics();applyShellMaterial();return true;}
    if(action==='small-glyph-runtime'){if(config.smallGlyphRelics.enabled&&smallGlyphRelicStates.length===0&&hasHydratedDeferredRelics)rebuildSmallGlyphRelics();applySmallGlyphMaterial();return true;}
    if(action==='small-glyph-rebuild'){rebuildSmallGlyphRelics();applySmallGlyphMaterial();return true;}
    if(import.meta.env?.DEV)console.warn('[backgroundAtmosphere] Ignoring unknown settings action.',{action});
    return false;
  }

  function updateRelicLayer(states, group, key, layerConfig, deltaSeconds, elapsedMs, driftSpeed, driftAmount) {
    const target = progressionMultipliers[key];
    const previousReveal = revealProgress[key];
    const revealStep = Math.min(1, Math.max(0, deltaSeconds) / 0.65);
    const nextReveal = previousReveal + (target - previousReveal) * revealStep;
    revealProgress[key] = Math.abs(nextReveal - target) <= PROGRESSION_EPSILON ? target : nextReveal;
    const opacityChanged = Math.abs(revealProgress[key] - previousReveal) > PROGRESSION_EPSILON;
    const hidden = target <= PROGRESSION_EPSILON && revealProgress[key] <= PROGRESSION_EPSILON;
    group.visible = Boolean(config.enabled && layerConfig.enabled && !hidden);
    if (!group.visible) return;

    if (opacityChanged) states.forEach((state) => setObjectReveal(state, revealProgress[key], true));
    group.rotation.y += layerConfig.orbitSpeed * deltaSeconds;
    states.forEach((state, index) => {
      const spinMultiplier = layerConfig.selfRotationSpeedMultiplier ?? 1;
      state.object.rotation.x += state.spin.x * spinMultiplier * deltaSeconds;
      state.object.rotation.y += state.spin.y * spinMultiplier * deltaSeconds;
      state.object.rotation.z += state.spin.z * spinMultiplier * deltaSeconds;
      const drift = Math.sin(elapsedMs * driftSpeed + index) * driftAmount;
      state.object.position.copy(state.basePosition).addScaledVector(state.radialDirection, drift);
    });
  }

  const ready = rebuild();
  return {
    object3d: root, ready, hydrateDeferredRelics, applySettings, rebuild,
    setProgressionMultipliers(next = {}) {
      ['stones', 'shells', 'smallGlyphs', 'stars', 'galaxies'].forEach((key) => {
        const alias = key === 'smallGlyphs' ? next.miniGlyphs : key === 'stars' ? next.starsDust : undefined;
        const value = Math.min(1, Math.max(0, Number(next[key] ?? alias ?? progressionMultipliers[key]) || 0));
        if (Math.abs(value - progressionMultipliers[key]) > PROGRESSION_EPSILON) progressionMultipliers[key] = value;
      });
    },
    update(deltaSeconds = 0) {
      if (!root.parent) return;
      const elapsedMs = performance.now();
      updateRelicLayer(stoneRelicStates, stoneRelicsGroup, 'stones', config.stoneRelics, deltaSeconds, elapsedMs, 0.0002, 0.01);
      updateRelicLayer(shellRelicStates, shellRelicsGroup, 'shells', config.shellRelics, deltaSeconds, elapsedMs, 0.00017, 0.008);
      updateRelicLayer(smallGlyphRelicStates, smallGlyphRelicsGroup, 'smallGlyphs', config.smallGlyphRelics, deltaSeconds, elapsedMs, 0.00016, 0.007);
      if (dustField) {
        const targetOpacity = config.dust.idleOpacity * progressionMultipliers.stars;
        if (Math.abs(dustField.material.opacity - targetOpacity) > PROGRESSION_EPSILON) dustField.material.opacity = targetOpacity;
        dustField.points.visible = targetOpacity > PROGRESSION_EPSILON;
        if (dustField.points.visible) root.rotation.y += config.dust.rotationSpeed * deltaSeconds;
      }
    },
    getLifecycleCounts: () => ({ ...lifecycleCounts }),
    getPerformanceSnapshot() {
      return {
        progressionMultipliers: { ...progressionMultipliers },
        revealProgress: { ...revealProgress },
        builtObjects: { stones: stoneRelicStates.length, shells: shellRelicStates.length, smallGlyphs: smallGlyphRelicStates.length, stars: dustField ? config.dust.count : 0 },
        activeObjects: {
          stones: stoneRelicsGroup.visible ? stoneRelicStates.length : 0,
          shells: shellRelicsGroup.visible ? shellRelicStates.length : 0,
          smallGlyphs: smallGlyphRelicsGroup.visible ? smallGlyphRelicStates.length : 0
        },
        hiddenLayers: [
          !stoneRelicsGroup.visible && 'stones',
          !shellRelicsGroup.visible && 'shells',
          !smallGlyphRelicsGroup.visible && 'smallGlyphs',
          dustField && !dustField.points.visible && 'stars'
        ].filter(Boolean)
      };
    },
    showAllForWarmup() {
      const states = [stoneRelicsGroup, shellRelicsGroup, smallGlyphRelicsGroup, dustField?.points]
        .filter(Boolean).map((object) => ({ object, visible: object.visible }));
      states.forEach(({ object }) => { object.visible = true; });
      return () => states.forEach(({ object, visible }) => { object.visible = visible; });
    }
  };
}
