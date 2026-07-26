function programCount(renderer) {
  return Array.isArray(renderer.info?.programs) ? renderer.info.programs.length : null;
}

function sceneCensus(scene) {
  const geometries = new Set(); const materials = new Set(); const textures = new Set();
  const counts = { Object3D: 0, Mesh: 0, Sprite: 0, Points: 0 };
  let relicGroups = 0; let plaqueInstances = 0;
  scene.traverse((object) => {
    counts.Object3D += 1;
    if (object.isMesh) counts.Mesh += 1;
    if (object.isSprite) counts.Sprite += 1;
    if (object.isPoints) counts.Points += 1;
    if (/RelicsGroup$/.test(object.name)) relicGroups += 1;
    if (object.userData?.plaqueInstance) plaqueInstances += 1;
    if (object.geometry) geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value); });
    });
  });
  return { ...counts, uniqueGeometries: geometries.size, uniqueMaterials: materials.size, textures: textures.size, relicGroups, plaqueInstances };
}

export function createRuntimeDiagnostics({ enabled, renderer, scene, getRuntimeState, getLayerSnapshot, getGalaxyCount, getPlaqueCount, getLifecycleCounts, getFogRevealSnapshot = () => null }) {
  const counters = {}; const censuses = {};
  const programs = { warmupComplete: null, afterFirstSeconds: null, afterFirstPlaqueOpen: {} };
  const frameTimes = [];
  let lastFrameAt = null; let lastPublishAt = 0; let latest = null; let hud = null;
  if (enabled) {
    hud = document.createElement('aside');
    hud.setAttribute('aria-label', 'Performance diagnostics');
    Object.assign(hud.style, { position: 'fixed', left: '8px', bottom: '8px', zIndex: '10000', maxWidth: '360px', padding: '7px 9px', background: 'rgba(5,8,14,.82)', color: '#dce9ff', font: '11px/1.35 monospace', whiteSpace: 'pre-wrap', pointerEvents: 'none', borderRadius: '5px' });
    document.body.append(hud);
  }
  function count(name) { counters[name] = (counters[name] ?? 0) + 1; if (enabled) console.info(`[experience3d][counter] ${name}=${counters[name]}`); }
  function census(stage) { if (!enabled) return; censuses[stage] = sceneCensus(scene); console.info(`[experience3d][census] ${stage}`, censuses[stage]); }
  function snapshot(now = performance.now()) {
    const sorted = frameTimes.slice().sort((a, b) => a - b);
    const averageFrameMs = frameTimes.length ? frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length : 0;
    const layers = getLayerSnapshot();
    return {
      averageFps: averageFrameMs ? Number((1000 / averageFrameMs).toFixed(1)) : 0,
      averageFrameMs: Number(averageFrameMs.toFixed(2)),
      p95FrameMs: Number((sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0).toFixed(2)),
      renderer: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: programCount(renderer) },
      activeObjects: { ...layers.activeObjects, galaxies: getGalaxyCount() },
      layerVisibility: { stones: !layers.hiddenLayers.includes('stones'), shells: !layers.hiddenLayers.includes('shells'), smallGlyphs: !layers.hiddenLayers.includes('smallGlyphs'), stars: !layers.hiddenLayers.includes('stars'), galaxies: layers.galaxiesVisible },
      runtimeState: getRuntimeState(), counters: { ...counters, ...getLifecycleCounts() }, censuses: { ...censuses }, programs: { ...programs, afterFirstPlaqueOpen: { ...programs.afterFirstPlaqueOpen } },
      tuningMode: Boolean(layers.tuningMode), effectiveLayerMultipliers: { ...(layers.effectiveLayerMultipliers ?? {}) }, lastPanelEvent: layers.lastPanelEvent ?? null,
      builtObjects: { ...(layers.builtObjects ?? {}), galaxies: getGalaxyCount() },
      plaqueInstances: getPlaqueCount(), fogReveal: getFogRevealSnapshot(), sampledAt: new Date().toISOString(), sampleTime: Math.round(now)
    };
  }
  function frame(now) {
    if (!enabled) return;
    if (lastFrameAt != null) frameTimes.push(Math.min(1000, now - lastFrameAt));
    lastFrameAt = now;
    if (now - lastPublishAt < 1250) return;
    latest = snapshot(now); frameTimes.length = 0; lastPublishAt = now;
    const p = latest;
    const fog = p.fogReveal;
    hud.textContent = `FPS ${p.averageFps} · avg ${p.averageFrameMs}ms · p95 ${p.p95FrameMs}ms\n` + `calls ${p.renderer.calls} · tri ${p.renderer.triangles} · geo ${p.renderer.geometries} · tex ${p.renderer.textures} · programs ${p.renderer.programs ?? 'n/a'}\n` + `built stones ${p.builtObjects.stones ?? 0} · shells ${p.builtObjects.shells ?? 0} · glyphs ${p.builtObjects.smallGlyphs ?? 0} · stars ${p.builtObjects.stars ?? 0} · galaxies ${p.builtObjects.galaxies ?? 0}\n` + `visible ${Object.entries(p.layerVisibility).filter(([, value]) => value).map(([name]) => name).join(', ') || 'none'} · tuning ${p.tuningMode ? 'on' : 'off'} · multipliers ${JSON.stringify(p.effectiveLayerMultipliers)}\n` + (fog ? `Fog reveal: ${Math.round(fog.progress * 100)}% · far ${fog.currentFar.toFixed(1)} / ${fog.targetFar} · ${fog.running ? 'running' : 'complete'}\n` : '') + `last panel ${p.lastPanelEvent ? `${p.lastPanelEvent.owner}:${p.lastPanelEvent.action}` : 'none'} · state ${p.runtimeState}`;
    if (programs.afterFirstSeconds == null && now - (programs.readyAt ?? Infinity) >= 4000) programs.afterFirstSeconds = p.renderer.programs;
  }
  return { count, census, frame, markWarmupComplete() { programs.warmupComplete = programCount(renderer); }, markInteractionReady() { programs.readyAt = performance.now(); }, markPlaqueOpen(nodeId) { if (!(nodeId in programs.afterFirstPlaqueOpen)) programs.afterFirstPlaqueOpen[nodeId] = programCount(renderer); }, getSnapshot() { return latest ?? snapshot(); } };
}
