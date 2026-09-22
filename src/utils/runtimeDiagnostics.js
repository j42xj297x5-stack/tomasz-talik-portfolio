const LIVE_WINDOW_MS = 1250;
const INTERACTION_WINDOW_MS = 2000;
const MAX_WINDOW_SAMPLES = 1000;

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

function summarizeFrameIntervals(samples) {
  if (!samples.length) return null;
  const sorted = samples.slice().sort((a, b) => a - b);
  const averageFrameMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return {
    status: 'measured',
    averageFps: Number((1000 / averageFrameMs).toFixed(1)),
    averageFrameMs: Number(averageFrameMs.toFixed(2)),
    p95FrameMs: Number(sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(2)),
    maxFrameMs: Number(sorted[sorted.length - 1].toFixed(2)),
    sampleCount: samples.length
  };
}

export function createRuntimeDiagnostics({ enabled, renderer, scene, getRuntimeState, getLayerSnapshot, getGalaxyCount, getPlaqueCount, getLifecycleCounts, getFogRevealSnapshot = () => null }) {
  const counters = {}; const censuses = {};
  const programs = { warmupComplete: null, afterFirstSeconds: null, afterFirstPlaqueOpen: {}, afterFirstGlyphOpen: null, afterFirstPortalOpen: null };
  const markers = { firstRenderedGameplayFrame: null, firstMonkeyHover: null, firstGlyphHover: null, firstGlyphOpen: null, firstPortalOpen: null };
  const interactionWindows = { firstGlyphOpen: null, firstPortalOpen: null };
  const liveSamples = [];
  let lastFrameAt = null; let liveWindowStartedAt = null; let latestFrameMeasurement = null; let hud = null;
  if (enabled) {
    hud = document.createElement('aside');
    hud.setAttribute('aria-label', 'Performance diagnostics');
    Object.assign(hud.style, { position: 'fixed', left: '8px', bottom: '8px', zIndex: '10000', maxWidth: '360px', padding: '7px 9px', background: 'rgba(5,8,14,.82)', color: '#dce9ff', font: '11px/1.35 monospace', whiteSpace: 'pre-wrap', pointerEvents: 'none', borderRadius: '5px' });
    document.body.append(hud);
  }
  function count(name) { counters[name] = (counters[name] ?? 0) + 1; if (enabled) console.info(`[experience3d][counter] ${name}=${counters[name]}`); }
  function census(stage) { if (!enabled) return; censuses[stage] = sceneCensus(scene); console.info(`[experience3d][census] ${stage}`, censuses[stage]); }
  function markOnce(name, details = {}) {
    if (markers[name]) return false;
    markers[name] = { measuredAt: new Date().toISOString(), time: Math.round(performance.now()), ...details };
    return true;
  }
  function startInteractionWindow(name) {
    interactionWindows[name] = { status: 'collecting', durationMs: INTERACTION_WINDOW_MS, startedAt: performance.now(), samples: [] };
  }
  function updateInteractionWindows(now, interval) {
    Object.keys(interactionWindows).forEach((name) => {
      const window = interactionWindows[name];
      if (!window || window.status !== 'collecting') return;
      if (now - window.startedAt <= window.durationMs) {
        if (window.samples.length < MAX_WINDOW_SAMPLES) window.samples.push(interval);
        return;
      }
      const measurement = summarizeFrameIntervals(window.samples);
      interactionWindows[name] = measurement
        ? { ...measurement, durationMs: window.durationMs }
        : { status: 'unavailable', durationMs: window.durationMs, sampleCount: 0 };
    });
  }
  function snapshot(now = performance.now()) {
    const layers = getLayerSnapshot();
    const serializeWindow = (window) => {
      if (!window) return { status: 'not-yet-measured', durationMs: INTERACTION_WINDOW_MS };
      if (window.status === 'collecting') return { status: 'collecting', durationMs: window.durationMs, sampleCount: window.samples.length };
      return { ...window };
    };
    return {
      frameIntervals: latestFrameMeasurement ?? { status: 'collecting', sampleCount: liveSamples.length },
      // Retained aliases for debug consumers that predate the explicit frameIntervals contract.
      averageFps: latestFrameMeasurement?.averageFps ?? null,
      averageFrameMs: latestFrameMeasurement?.averageFrameMs ?? null,
      p95FrameMs: latestFrameMeasurement?.p95FrameMs ?? null,
      maxFrameMs: latestFrameMeasurement?.maxFrameMs ?? null,
      sampleCount: latestFrameMeasurement?.sampleCount ?? 0,
      renderer: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: programCount(renderer) },
      activeObjects: { ...layers.activeObjects, galaxies: getGalaxyCount() },
      layerVisibility: { stones: !layers.hiddenLayers.includes('stones'), shells: !layers.hiddenLayers.includes('shells'), smallGlyphs: !layers.hiddenLayers.includes('smallGlyphs'), stars: !layers.hiddenLayers.includes('stars'), galaxies: layers.galaxiesVisible },
      runtimeState: getRuntimeState(), counters: { ...counters, ...getLifecycleCounts() }, censuses: { ...censuses }, programs: { ...programs, afterFirstPlaqueOpen: { ...programs.afterFirstPlaqueOpen } },
      firstInteractions: { markers: { ...markers }, windows: { firstGlyphOpen: serializeWindow(interactionWindows.firstGlyphOpen), firstPortalOpen: serializeWindow(interactionWindows.firstPortalOpen) } },
      measurementNote: 'Frame intervals can reveal jank but do not identify CPU, GPU, shader compilation, texture upload, or audio as the cause.',
      tuningMode: Boolean(layers.tuningMode), effectiveLayerMultipliers: { ...(layers.effectiveLayerMultipliers ?? {}) }, lastPanelEvent: layers.lastPanelEvent ?? null,
      builtObjects: { ...(layers.builtObjects ?? {}), galaxies: getGalaxyCount() },
      plaqueInstances: getPlaqueCount(), fogReveal: getFogRevealSnapshot(), sampledAt: new Date().toISOString(), sampleTime: Math.round(now)
    };
  }
  function frame(now) {
    if (!markers.firstRenderedGameplayFrame) markOnce('firstRenderedGameplayFrame');
    if (lastFrameAt == null) {
      lastFrameAt = now;
      liveWindowStartedAt = now;
      return;
    }
    const interval = now - lastFrameAt;
    lastFrameAt = now;
    if (liveSamples.length < MAX_WINDOW_SAMPLES) liveSamples.push(interval);
    updateInteractionWindows(now, interval);
    if (now - liveWindowStartedAt < LIVE_WINDOW_MS) return;
    latestFrameMeasurement = summarizeFrameIntervals(liveSamples);
    liveSamples.length = 0;
    liveWindowStartedAt = now;
    const p = snapshot(now);
    if (enabled) {
      const f = p.frameIntervals; const fog = p.fogReveal;
      hud.textContent = `FPS ${f.averageFps} · avg ${f.averageFrameMs}ms · p95 ${f.p95FrameMs}ms · max ${f.maxFrameMs}ms · n ${f.sampleCount}\n` + `calls ${p.renderer.calls} · tri ${p.renderer.triangles} · geo ${p.renderer.geometries} · tex ${p.renderer.textures} · programs ${p.renderer.programs ?? 'n/a'}\n` + `built stones ${p.builtObjects.stones ?? 0} · shells ${p.builtObjects.shells ?? 0} · glyphs ${p.builtObjects.smallGlyphs ?? 0} · stars ${p.builtObjects.stars ?? 0} · galaxies ${p.builtObjects.galaxies ?? 0}\n` + `visible ${Object.entries(p.layerVisibility).filter(([, value]) => value).map(([name]) => name).join(', ') || 'none'} · tuning ${p.tuningMode ? 'on' : 'off'} · multipliers ${JSON.stringify(p.effectiveLayerMultipliers)}\n` + (fog ? `Fog reveal: ${Math.round(fog.progress * 100)}% · far ${fog.currentFar.toFixed(1)} / ${fog.targetFar} · ${fog.running ? 'running' : 'complete'}\n` : '') + `last panel ${p.lastPanelEvent ? `${p.lastPanelEvent.owner}:${p.lastPanelEvent.action}` : 'none'} · state ${p.runtimeState}`;
    }
    if (programs.afterFirstSeconds == null && now - (programs.readyAt ?? Infinity) >= 4000) programs.afterFirstSeconds = p.renderer.programs;
  }
  return {
    count, census, frame,
    markWarmupComplete() { programs.warmupComplete = programCount(renderer); },
    markInteractionReady() { programs.readyAt = performance.now(); },
    markMonkeyHover() { markOnce('firstMonkeyHover'); },
    markGlyphHover(nodeId) { markOnce('firstGlyphHover', { glyphId: nodeId ?? 'unknown' }); },
    markGlyphOpen(nodeId) {
      if (!markOnce('firstGlyphOpen', { glyphId: nodeId ?? 'unknown' })) return;
      startInteractionWindow('firstGlyphOpen');
    },
    markGlyphOpenComplete() { if (programs.afterFirstGlyphOpen == null && markers.firstGlyphOpen) programs.afterFirstGlyphOpen = programCount(renderer); },
    markPortalOpen() {
      if (!markOnce('firstPortalOpen')) return;
      startInteractionWindow('firstPortalOpen');
    },
    markPortalOpenComplete() { if (programs.afterFirstPortalOpen == null && markers.firstPortalOpen) programs.afterFirstPortalOpen = programCount(renderer); },
    markPlaqueOpen(nodeId) { if (!(nodeId in programs.afterFirstPlaqueOpen)) programs.afterFirstPlaqueOpen[nodeId] = programCount(renderer); },
    getSnapshot() { return snapshot(); }
  };
}
