import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG = Object.freeze({
  enabled: true,
  debugVisible: false,
  debugBlendingMode: 'normal',
  debugIgnoreFog: true,
  showShellHelpers: false,
  showAtmosphereLogs: false,
  safeRadius: 3.5,
  shellInnerRadius: 4.8,
  shellOuterRadius: 10.5,
  dust: Object.freeze({ enabled: true, count: 1000, idleOpacity: 0.12, rotationSpeed: 0.012, pointSize: 0.055, color: '#b8c6da', sizeAttenuation: true, depthTest: true, depthWrite: false }),
  stoneRelics: Object.freeze({
    enabled: true, count: 18,
    models: Object.freeze(['/glb/stone_01.glb','/glb/stone_02.glb','/glb/stone_03.glb','/glb/stone_04.glb','/glb/stone_05.glb','/glb/stone_06.glb']),
    safeRadius: 3.5, shellInnerRadius: 5.2, shellOuterRadius: 11, minScale: 0.035, maxScale: 0.12,
    rotationSpeedMin: 0.003, rotationSpeedMax: 0.018, orbitSpeed: 0.003, opacity: 0.85, debugVisible: false
  })
});

const randomBetween = (min, max) => min + Math.random() * (max - min);
function randomPointInShell(innerRadius, outerRadius) { const d = new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize(); const r = Math.cbrt(Math.random()*(outerRadius**3-innerRadius**3)+innerRadius**3); return d.multiplyScalar(r); }

function resolveAtmosphereConfig(overrides = {}) { return { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG, ...overrides, dust: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.dust, ...(overrides?.dust ?? {}) }, stoneRelics: { ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.stoneRelics, ...(overrides?.stoneRelics ?? {}) } }; }
function createDustField(config) { const positions=new Float32Array(config.dust.count*3); for(let i=0;i<config.dust.count;i+=1){const idx=i*3;let p=randomPointInShell(config.shellInnerRadius,config.shellOuterRadius); while(p.length()<config.safeRadius){p=randomPointInShell(config.shellInnerRadius,config.shellOuterRadius);} positions[idx]=p.x;positions[idx+1]=p.y;positions[idx+2]=p.z;} const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(positions,3)); const m=new THREE.PointsMaterial(); const points=new THREE.Points(g,m); points.raycast=()=>{}; return { points, material:m }; }
function createShellDebugHelpers(config){ const g=new THREE.Group(); const mk=(r,c)=>new THREE.Mesh(new THREE.SphereGeometry(r,24,18),new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.35,depthTest:false,depthWrite:false})); g.add(mk(config.shellInnerRadius,0x66e0ff),mk(config.shellOuterRadius,0xffffff)); return g; }

async function resolveGLTFLoader(){ try{ const module=await import(VENDORED_GLTF_LOADER_PATH); return module.GLTFLoader; }catch(error){ console.warn('[backgroundAtmosphere] GLTFLoader import failed for stone relics.', error); return null; } }
function cloneRelicModel(source, opacity){ const clone=source.clone(true); clone.traverse((child)=>{ if(!child.isMesh) return; const apply=(mat)=>{const m=mat.clone();m.transparent=true;m.opacity=opacity;return m;}; child.material=Array.isArray(child.material)?child.material.map(apply):apply(child.material); }); return clone; }

export function createBackgroundAtmosphere(configOverrides = {}) {
  let config = resolveAtmosphereConfig(configOverrides);
  const root = new THREE.Group();
  const stoneRelicsGroup = new THREE.Group();
  const stoneRelicStates = [];
  const relicModelCache = new Map();
  let relicModelsLoaded = false;
  let dustField = null;
  let helperGroup = null;

  function applyDustMaterialOptions(){ if(!dustField) return; Object.assign(dustField.material,{size:config.dust.pointSize,transparent:true,opacity:config.dust.idleOpacity,sizeAttenuation:config.dust.sizeAttenuation,depthTest:config.dust.depthTest,depthWrite:config.dust.depthWrite,fog:config.debugIgnoreFog ? !config.debugVisible : true}); dustField.material.color.set(config.dust.color); dustField.material.blending=config.debugBlendingMode==='additive'?THREE.AdditiveBlending:THREE.NormalBlending; dustField.material.needsUpdate=true; }
  function setHelpersVisible(){ if(helperGroup) helperGroup.visible=Boolean(config.showShellHelpers||config.debugVisible); }
  async function loadRelicModels(){ if(relicModelsLoaded) return; const GLTFLoader=await resolveGLTFLoader(); if(!GLTFLoader){relicModelsLoaded=true;return;} const loader=new GLTFLoader(); await Promise.all(config.stoneRelics.models.map((url)=>new Promise((resolve)=>loader.load(url,(gltf)=>{relicModelCache.set(url,gltf.scene);resolve();},undefined,(error)=>{console.warn(`[backgroundAtmosphere][stoneRelics] Failed to load model: ${url}`,error);resolve();})))); relicModelsLoaded=true; }
  function clearRelics(){ while(stoneRelicsGroup.children.length>0){ const c=stoneRelicsGroup.children.pop(); c.traverse?.((m)=>{ if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach((mat)=>mat?.dispose?.());}); } stoneRelicStates.length=0; }
  function rebuildStoneRelics(){ clearRelics(); const s=config.stoneRelics; if(!config.enabled||!s.enabled) return; const pool=s.models.filter((url)=>relicModelCache.has(url)); for(let i=0;i<s.count&&pool.length;i+=1){ const model=cloneRelicModel(relicModelCache.get(pool[Math.floor(Math.random()*pool.length)]), s.debugVisible?1:s.opacity); const scale=randomBetween(s.minScale,s.maxScale)*(s.debugVisible?1.8:1); const inner=Math.max(s.shellInnerRadius,s.safeRadius+scale*8); const pos=randomPointInShell(inner,s.shellOuterRadius); model.position.copy(pos); model.rotation.set(Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); model.scale.setScalar(scale); stoneRelicsGroup.add(model); stoneRelicStates.push({object:model,basePosition:pos.clone(),spin:new THREE.Vector3(randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax),randomBetween(s.rotationSpeedMin,s.rotationSpeedMax))}); } }
  function applyStoneMaterial(){ const s=config.stoneRelics; stoneRelicStates.forEach(({object})=>object.traverse((child)=>{ if(!child.isMesh) return; (Array.isArray(child.material)?child.material:[child.material]).forEach((m)=>{m.transparent=true;m.opacity=s.debugVisible?1:s.opacity;m.needsUpdate=true;}); })); stoneRelicsGroup.visible=Boolean(config.enabled&&s.enabled); }

  async function rebuild(){ while(root.children.length>0) root.remove(root.children[0]); dustField=null; helperGroup=null; clearRelics(); if(!config.enabled) return; if(config.dust.enabled){dustField=createDustField(config);root.add(dustField.points);applyDustMaterialOptions();} helperGroup=createShellDebugHelpers(config);root.add(helperGroup);setHelpersVisible(); await loadRelicModels(); root.add(stoneRelicsGroup); rebuildStoneRelics(); applyStoneMaterial(); }
  function applySettings(next={},type='rebuild'){ config=resolveAtmosphereConfig({ ...config, ...next }); if(type==='material'){applyDustMaterialOptions();applyStoneMaterial();return;} if(type==='helpers'){setHelpersVisible();return;} if(type==='stone-runtime'){applyStoneMaterial();return;} if(type==='stone-rebuild'){rebuildStoneRelics();applyStoneMaterial();return;} void rebuild(); }

  void rebuild();
  return { object3d: root, applySettings, rebuild, update(deltaSeconds = 0){ if(!root.parent) return; if(dustField) root.rotation.y += config.dust.rotationSpeed*deltaSeconds; stoneRelicsGroup.rotation.y += config.stoneRelics.orbitSpeed*deltaSeconds; stoneRelicStates.forEach((r,i)=>{r.object.rotation.x += r.spin.x*deltaSeconds; r.object.rotation.y += r.spin.y*deltaSeconds; r.object.rotation.z += r.spin.z*deltaSeconds; const drift=Math.sin(performance.now()*0.0002+i)*0.01; r.object.position.copy(r.basePosition).addScaledVector(r.basePosition.clone().normalize(),drift);}); } };
}
