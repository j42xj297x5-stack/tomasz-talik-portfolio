import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG = Object.freeze({
  enabled: true,
  debugVisible: false,
  debugBlendingMode: 'normal',
  debugIgnoreFog: true,
  showShellHelpers: false,
  showAtmosphereLogs: false,
  safeRadius: 4,
  shellInnerRadius: 6.1,
  shellOuterRadius: 14.6,
  dust: Object.freeze({ enabled: true, count: 2650, idleOpacity: 0.85, rotationSpeed: 0.02, pointSize: 0.07, color: '#05070a', sizeAttenuation: true, depthTest: true, depthWrite: false }),
  stoneRelics: Object.freeze({
    enabled: true, count: 60,
    models: Object.freeze(['/glb/stone_01.glb','/glb/stone_02.glb','/glb/stone_03.glb','/glb/stone_04.glb','/glb/stone_05.glb','/glb/stone_06.glb']),
    safeRadius: 3.5, shellInnerRadius: 5, shellOuterRadius: 8, minScale: 1, maxScale: 2,
    rotationSpeedMin: 0.003, rotationSpeedMax: 0.018, orbitSpeed: 0.003, opacity: 0.85, debugVisible: false
  }),
  shellRelics: Object.freeze({
    enabled: true, count: 35,
    models: Object.freeze(['/glb/shell_01.glb','/glb/shell_02.glb','/glb/shell_03.glb','/glb/shell_04.glb','/glb/shell_05.glb','/glb/shell_06.glb']),
    minScale: 0.3, maxScale: 1, shellInnerRadius: 4, shellOuterRadius: 8.5,
    rotationSpeedMin: 0.075, rotationSpeedMax: 0.187, orbitSpeed: 0.022, opacity: 0.51, debugVisible: false,
    colorPalette: Object.freeze(['#d9a441','#4db6ac','#6ec6ff','#6bcf8e','#9c7bff','#f0a6a6'])
  }),
  smallGlyphRelics: Object.freeze({
    enabled: true, count: 24,
    models: Object.freeze(['/glb/small_glyph_01.glb','/glb/small_glyph_02.glb','/glb/small_glyph_03.glb','/glb/small_glyph_04.glb','/glb/small_glyph_05.glb','/glb/small_glyph_06.glb']),
    minScale: 0.3, maxScale: 1, shellInnerRadius: 4, shellOuterRadius: 8.5,
    rotationSpeedMin: 0.075, rotationSpeedMax: 0.187, orbitSpeed: 0.022, opacity: 0.75, debugVisible: false
  })
});

const randomBetween = (min, max) => min + Math.random() * (max - min);
function randomPointInShell(innerRadius, outerRadius) { const d = new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize(); const r = Math.cbrt(Math.random()*(outerRadius**3-innerRadius**3)+innerRadius**3); return d.multiplyScalar(r); }

function resolveAtmosphereConfig(overrides = {}) { return { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG, ...overrides, dust: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.dust, ...(overrides?.dust ?? {}) }, stoneRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.stoneRelics, ...(overrides?.stoneRelics ?? {}) }, shellRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.shellRelics, ...(overrides?.shellRelics ?? {}) }, smallGlyphRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.smallGlyphRelics, ...(overrides?.smallGlyphRelics ?? {}) } }; }
function createDustField(config) { const positions=new Float32Array(config.dust.count*3); for(let i=0;i<config.dust.count;i+=1){const idx=i*3;let p=randomPointInShell(config.shellInnerRadius,config.shellOuterRadius); while(p.length()<config.safeRadius){p=randomPointInShell(config.shellInnerRadius,config.shellOuterRadius);} positions[idx]=p.x;positions[idx+1]=p.y;positions[idx+2]=p.z;} const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(positions,3)); const m=new THREE.PointsMaterial(); const points=new THREE.Points(g,m); points.raycast=()=>{}; return { points, material:m }; }
function createShellDebugHelpers(config){ const g=new THREE.Group(); const mk=(r,c)=>new THREE.Mesh(new THREE.SphereGeometry(r,24,18),new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.35,depthTest:false,depthWrite:false})); g.add(mk(config.shellInnerRadius,0x66e0ff),mk(config.shellOuterRadius,0xffffff)); return g; }

async function resolveGLTFLoader(){ try{ const module=await import(VENDORED_GLTF_LOADER_PATH); return module.GLTFLoader; }catch(error){ console.warn('[backgroundAtmosphere] GLTFLoader import failed for relics.', error); return null; } }
function cloneRelicModel(source, opacity){ const clone=source.clone(true); clone.traverse((child)=>{ if(!child.isMesh) return; const apply=(mat)=>{const m=mat.clone();m.transparent=true;m.opacity=opacity;return m;}; child.material=Array.isArray(child.material)?child.material.map(apply):apply(child.material); }); return clone; }
function cloneShellRelicModel(source, config, colorHex){ const clone=source.clone(true); const tint=new THREE.Color(colorHex); clone.traverse((child)=>{ if(!child.isMesh) return; const apply=(mat)=>{const m=mat.clone();m.color?.multiply?.(tint);m.transparent=true;m.opacity=config.debugVisible?1:config.opacity;m.roughness=Math.min(1,Math.max(0,m.roughness ?? 0.35));m.roughness=Math.max(0.08,m.roughness*0.7);m.metalness=Math.min(0.18,Math.max(0,m.metalness ?? 0.05));m.depthWrite=false;return m;}; child.material=Array.isArray(child.material)?child.material.map(apply):apply(child.material); }); return clone; }

export function createBackgroundAtmosphere(configOverrides = {}) {
  let config = resolveAtmosphereConfig(configOverrides);
  const root = new THREE.Group();
  const stoneRelicsGroup = new THREE.Group();
  const shellRelicsGroup = new THREE.Group();
  const smallGlyphRelicsGroup = new THREE.Group();
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
  let progressionMultipliers = { starsDust: 1, shells: 1, miniGlyphs: 1, finalAura: 1 };

  function applyDustMaterialOptions(){ if(!dustField) return; Object.assign(dustField.material,{size:config.dust.pointSize,transparent:true,opacity:config.dust.idleOpacity*(progressionMultipliers.starsDust ?? 1),sizeAttenuation:config.dust.sizeAttenuation,depthTest:config.dust.depthTest,depthWrite:config.dust.depthWrite,fog:config.debugIgnoreFog ? !config.debugVisible : true}); dustField.material.color.set(config.dust.color); dustField.material.blending=config.debugBlendingMode==='additive'?THREE.AdditiveBlending:THREE.NormalBlending; dustField.material.needsUpdate=true; }
  function setHelpersVisible(){ if(helperGroup) helperGroup.visible=Boolean(config.showShellHelpers||config.debugVisible); }
  async function loadRelicModels(){ if(relicModelsLoaded) return; const GLTFLoader=await resolveGLTFLoader(); if(!GLTFLoader){relicModelsLoaded=true;return;} const loader=new GLTFLoader(); await Promise.all(config.stoneRelics.models.map((url)=>new Promise((resolve)=>loader.load(url,(gltf)=>{relicModelCache.set(url,gltf.scene);resolve();},undefined,(error)=>{console.warn(`[backgroundAtmosphere][stoneRelics] Failed to load model: ${url}`,error);resolve();})))); relicModelsLoaded=true; }
  async function loadShellModels(){ if(shellModelsLoaded) return; const GLTFLoader=await resolveGLTFLoader(); if(!GLTFLoader){shellModelsLoaded=true;return;} const loader=new GLTFLoader(); await Promise.all(config.shellRelics.models.map((url)=>new Promise((resolve)=>loader.load(url,(gltf)=>{shellModelCache.set(url,gltf.scene);resolve();},undefined,(error)=>{console.warn(`[backgroundAtmosphere][shellRelics] Failed to load model: ${url}`,error);resolve();})))); shellModelsLoaded=true; }
  async function loadSmallGlyphModels(){ if(smallGlyphModelsLoaded) return; const GLTFLoader=await resolveGLTFLoader(); if(!GLTFLoader){smallGlyphModelsLoaded=true;return;} const loader=new GLTFLoader(); await Promise.all(config.smallGlyphRelics.models.map((url)=>new Promise((resolve)=>loader.load(url,(gltf)=>{smallGlyphModelCache.set(url,gltf.scene);resolve();},undefined,(error)=>{console.warn(`[backgroundAtmosphere][smallGlyphRelics] Failed to load model: ${url}`,error);resolve();})))); smallGlyphModelsLoaded=true; }
  function clearRelics(){ while(stoneRelicsGroup.children.length>0){ const c=stoneRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } stoneRelicStates.length=0; }
  function clearShellRelics(){ while(shellRelicsGroup.children.length>0){ const c=shellRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } shellRelicStates.length=0; }
  function clearSmallGlyphRelics(){ while(smallGlyphRelicsGroup.children.length>0){ const c=smallGlyphRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } smallGlyphRelicStates.length=0; }
  function rebuildStoneRelics(){ clearRelics(); const s=config.stoneRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>relicModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const model=cloneRelicModel(relicModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s.debugVisible?1:s.opacity); const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.8:1); const inner=Math.max(s.shellInnerRadius,s.safeRadius+scale*8); const pos=randomPointInShell(inner,s.shellOuterRadius); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); stoneRelicsGroup.add(model); stoneRelicStates.push({object:model,basePosition:pos.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applyStoneMaterial(){ const s=config.stoneRelics; stoneRelicStates.forEach(({object})=>object.traverse((child)=>{ if(!child.isMesh) return; (Array.isArray(child.material)?child.material:[child.material]).forEach((m)=>{m.transparent=true;m.opacity=s.debugVisible?1:s.opacity;m.needsUpdate=true;}); })); stoneRelicsGroup.visible=Boolean(config.enabled&&s.enabled); }
  function rebuildShellRelics(){ clearShellRelics(); const s=config.shellRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>shellModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const palette=(Array.isArray(s.colorPalette)&&s.colorPalette.length>0)?s.colorPalette:DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.shellRelics.colorPalette; const tint=palette[Math.floor(Math.random()*palette.length)]; const model=cloneShellRelicModel(shellModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s, tint); const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.1:1); const inner=Math.max(s.shellInnerRadius,(config.safeRadius ?? 0)+scale*0.4); const pos=randomPointInShell(inner,s.shellOuterRadius); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); shellRelicsGroup.add(model); shellRelicStates.push({object:model,basePosition:pos.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applyShellMaterial(){ const s=config.shellRelics; shellRelicStates.forEach(({object})=>object.traverse((child)=>{ if(!child.isMesh) return; (Array.isArray(child.material)?child.material:[child.material]).forEach((m)=>{m.transparent=true;m.opacity=(s.debugVisible?1:s.opacity)*(progressionMultipliers.shells ?? 1);m.needsUpdate=true;}); })); shellRelicsGroup.visible=Boolean(config.enabled&&s.enabled); }
  function rebuildSmallGlyphRelics(){ clearSmallGlyphRelics(); const s=config.smallGlyphRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>smallGlyphModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const model=cloneRelicModel(smallGlyphModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s.debugVisible?1:s.opacity); const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.1:1); const inner=Math.max(s.shellInnerRadius,(config.safeRadius ?? 0)+scale*0.4); const pos=randomPointInShell(inner,s.shellOuterRadius); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); smallGlyphRelicsGroup.add(model); smallGlyphRelicStates.push({object:model,basePosition:pos.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applySmallGlyphMaterial(){ const s=config.smallGlyphRelics; smallGlyphRelicStates.forEach(({object})=>object.traverse((child)=>{ if(!child.isMesh) return; (Array.isArray(child.material)?child.material:[child.material]).forEach((m)=>{m.transparent=true;m.opacity=(s.debugVisible?1:s.opacity)*(progressionMultipliers.miniGlyphs ?? 1);m.needsUpdate=true;}); })); smallGlyphRelicsGroup.visible=Boolean(config.enabled&&s.enabled); }

  async function rebuild(){ while(root.children.length>0) root.remove(root.children[0]); dustField=null; helperGroup=null; clearRelics(); clearShellRelics(); clearSmallGlyphRelics(); if(!config.enabled) return; if(config.dust.enabled){dustField=createDustField(config);root.add(dustField.points);applyDustMaterialOptions();} helperGroup=createShellDebugHelpers(config);root.add(helperGroup);setHelpersVisible(); await loadRelicModels(); await loadShellModels(); await loadSmallGlyphModels(); root.add(stoneRelicsGroup); root.add(shellRelicsGroup); root.add(smallGlyphRelicsGroup); rebuildStoneRelics(); rebuildShellRelics(); rebuildSmallGlyphRelics(); applyStoneMaterial(); applyShellMaterial(); applySmallGlyphMaterial(); }
  function applySettings(next={},type='rebuild'){ config=resolveAtmosphereConfig({ ...config, ...next }); if(type==='material'){applyDustMaterialOptions();applyStoneMaterial();applyShellMaterial();applySmallGlyphMaterial();return;} if(type==='helpers'){setHelpersVisible();return;} if(type==='stone-runtime'){applyStoneMaterial();return;} if(type==='stone-rebuild'){rebuildStoneRelics();applyStoneMaterial();return;} if(type==='shell-runtime'){applyShellMaterial();return;} if(type==='shell-rebuild'){rebuildShellRelics();applyShellMaterial();return;} if(type==='small-glyph-runtime'){applySmallGlyphMaterial();return;} if(type==='small-glyph-rebuild'){rebuildSmallGlyphRelics();applySmallGlyphMaterial();return;} void rebuild(); }

  void rebuild();
  return { object3d: root, applySettings, rebuild, setProgressionMultipliers(next={}){ progressionMultipliers={...progressionMultipliers,...next}; applyDustMaterialOptions(); applyShellMaterial(); applySmallGlyphMaterial(); }, update(deltaSeconds = 0){ if(!root.parent) return; if(dustField) root.rotation.y += config.dust.rotationSpeed*deltaSeconds; stoneRelicsGroup.rotation.y += config.stoneRelics.orbitSpeed*deltaSeconds; shellRelicsGroup.rotation.y += config.shellRelics.orbitSpeed*deltaSeconds; smallGlyphRelicsGroup.rotation.y += config.smallGlyphRelics.orbitSpeed*deltaSeconds; stoneRelicStates.forEach((r,i)=>{r.object.rotation.x += r.spin.x*deltaSeconds; r.object.rotation.y += r.spin.y*deltaSeconds; r.object.rotation.z += r.spin.z*deltaSeconds; const drift=Math.sin(performance.now()*0.0002+i)*0.01; r.object.position.copy(r.basePosition).addScaledVector(r.basePosition.clone().normalize(),drift);}); shellRelicStates.forEach((r,i)=>{r.object.rotation.x += r.spin.x*deltaSeconds; r.object.rotation.y += r.spin.y*deltaSeconds; r.object.rotation.z += r.spin.z*deltaSeconds; const drift=Math.sin(performance.now()*0.00017+i)*0.008; r.object.position.copy(r.basePosition).addScaledVector(r.basePosition.clone().normalize(),drift);}); smallGlyphRelicStates.forEach((r,i)=>{r.object.rotation.x += r.spin.x*deltaSeconds; r.object.rotation.y += r.spin.y*deltaSeconds; r.object.rotation.z += r.spin.z*deltaSeconds; const drift=Math.sin(performance.now()*0.00016+i)*0.007; r.object.position.copy(r.basePosition).addScaledVector(r.basePosition.clone().normalize(),drift);}); } };
}
