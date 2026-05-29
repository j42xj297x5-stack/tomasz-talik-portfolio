import { formatBytes } from '../assets/preloadAssets.js';
import { ATMOSPHERE_PROGRESSION_MAPPING, SUN_MOON_LIGHT_MULTIPLIERS } from '../scene/atmosphere/atmosphereProgression.js';
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

const OPTIONS_STORAGE_KEY = 'portfolio.options.runtimeState.v1';
const OPTIONS_DEFAULTS_VERSION = '2026-05-29-atmosphere-progression-json-v8';
const PRESET_SLOT_KEYS = ['portfolio.optionsPreset.1', 'portfolio.optionsPreset.2', 'portfolio.optionsPreset.3'];
const SUN_MODEL_PATH = '/glb/sun.glb';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value, fallback) {
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampedNumber(value, fallback, min, max) {
  return clamp(finiteNumber(value, fallback), min, max);
}

function clampedInteger(value, fallback, min, max) {
  return clamp(Math.round(finiteNumber(value, fallback)), min, max);
}

function timestampForFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + '-' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('-');
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toThresholdSeconds(transitionTimes = {}) {
  return {
    threshold1: finiteNumber(transitionTimes.stones, 10),
    threshold2: finiteNumber(transitionTimes.shells, 10),
    threshold3: finiteNumber(transitionTimes.smallGlyphs, 10),
    threshold4: finiteNumber(transitionTimes.stars, 10),
    threshold5: finiteNumber(transitionTimes.galaxies, 10)
  };
}

function pickRuntimeStateFromImport(parsed) {
  if (parsed?.rawDebugState?.runtimeState) return parsed.rawDebugState.runtimeState;
  if (parsed?.runtimeState) return parsed.runtimeState;
  return {
    backgroundAtmosphere: parsed?.backgroundAtmosphere ?? parsed?.layers ? {
      ...(parsed?.backgroundAtmosphere ?? {}),
      stoneRelics: parsed?.layers?.stones ?? parsed?.backgroundAtmosphere?.stoneRelics,
      shellRelics: parsed?.layers?.shells ?? parsed?.backgroundAtmosphere?.shellRelics,
      smallGlyphRelics: parsed?.layers?.smallGlyphs ?? parsed?.backgroundAtmosphere?.smallGlyphRelics,
      dust: parsed?.layers?.stars ?? parsed?.backgroundAtmosphere?.dust
    } : undefined,
    sunCycle: parsed?.sunCycle ?? parsed?.celestial?.sun,
    moonCycle: parsed?.moonCycle ?? parsed?.celestial?.moon,
    galaxySprites: parsed?.galaxySprites ?? parsed?.layers?.galaxies
  };
}

function normalizeRuntimeState(state) {
  const bg = state.backgroundAtmosphere;
  if (!state.sunCycle) state.sunCycle = {};
  if (!state.sunCycle.spotlight) state.sunCycle.spotlight = {};
  if (!bg.smallGlyphRelics) bg.smallGlyphRelics = {};
  bg.safeRadius = clamp(bg.safeRadius, 0, 15);
  bg.shellInnerRadius = clamp(bg.shellInnerRadius, 0, 30);
  bg.shellOuterRadius = Math.max(clamp(bg.shellOuterRadius, 1, 40), bg.shellInnerRadius + 0.1);

  bg.dust.count = Math.max(0, Math.round(bg.dust.count));
  bg.dust.idleOpacity = clamp(bg.dust.idleOpacity, 0, 1);
  bg.dust.pointSize = clamp(bg.dust.pointSize, 0.001, 0.3);
  bg.dust.rotationSpeed = clamp(bg.dust.rotationSpeed, 0, 0.1);

  const normalizeRelics = (relics, limits) => {
    relics.count = clamp(Math.round(relics.count), 0, 200);
    relics.minScale = clamp(relics.minScale, limits.minScaleMin, limits.minScaleMax);
    relics.maxScale = Math.max(clamp(relics.maxScale, limits.maxScaleMin, limits.maxScaleMax), relics.minScale);
    relics.shellInnerRadius = clamp(relics.shellInnerRadius, 0, 30);
    relics.shellOuterRadius = Math.max(clamp(relics.shellOuterRadius, 1, 40), relics.shellInnerRadius + 0.1);
    relics.rotationSpeedMin = clamp(relics.rotationSpeedMin, 0, limits.rotationMax);
    relics.rotationSpeedMax = Math.max(clamp(relics.rotationSpeedMax, 0, limits.rotationMax), relics.rotationSpeedMin);
    relics.orbitSpeed = clamp(relics.orbitSpeed, 0, limits.orbitMax);
    relics.opacity = clamp(relics.opacity, 0, 1);
  };

  normalizeRelics(bg.stoneRelics, { minScaleMin: 0.01, minScaleMax: 8, maxScaleMin: 0.01, maxScaleMax: 10, rotationMax: 0.5, orbitMax: 0.15 });
  normalizeRelics(bg.shellRelics, { minScaleMin: 0.01, minScaleMax: 8, maxScaleMin: 0.01, maxScaleMax: 10, rotationMax: 0.8, orbitMax: 0.2 });
  normalizeRelics(bg.smallGlyphRelics, { minScaleMin: 0.01, minScaleMax: 4, maxScaleMin: 0.01, maxScaleMax: 6, rotationMax: 0.5, orbitMax: 0.15 });

  const sun = state.sunCycle;
  sun.modelPath = typeof sun.modelPath === 'string' && sun.modelPath.trim() === SUN_MODEL_PATH ? SUN_MODEL_PATH : SUN_MODEL_PATH;
  sun.radius = clamp(sun.radius ?? 3, 1, 30);
  sun.angularSpeed = clamp(sun.angularSpeed ?? 0.08, 0, 1);
  sun.scale = clamp(sun.scale ?? 0.2, 0.05, 10);
  sun.debugScaleMultiplier = clamp(sun.debugScaleMultiplier ?? 1, 0.01, 20);
  sun.selfRotationSpeed = clamp(sun.selfRotationSpeed ?? 0, 0, 1);
  sun.lockFacing = Boolean(sun.lockFacing ?? true);
  sun.emissiveIntensity = clamp(sun.emissiveIntensity ?? 1.5, 0, 10);
  sun.debugVisible = Boolean(sun.debugVisible);
  sun.debugShowFallback = Boolean(sun.debugShowFallback);
  sun.debugForceBasicMaterial = Boolean(sun.debugForceBasicMaterial);
  sun.debugShowBounds = Boolean(sun.debugShowBounds);
  sun.direction = Number(sun.direction) >= 0 ? 1 : -1;
  sun.spotlight.intensity = clamp(sun.spotlight.intensity ?? 13.2, 0, 20);
  sun.spotlight.angleDegrees = clamp(sun.spotlight.angleDegrees ?? 90, 1, 120);
  sun.spotlight.penumbra = clamp(sun.spotlight.penumbra ?? 0.45, 0, 1);
  sun.spotlight.distance = clamp(sun.spotlight.distance ?? 20, 0, 100);

  if (!state.moonCycle) state.moonCycle = {};
  const moon = state.moonCycle;
  if (!moon.spotlight) moon.spotlight = {};
  moon.modelPath = typeof moon.modelPath === 'string' && moon.modelPath.trim().length > 0 ? moon.modelPath.trim() : '/glb/moon.glb';
  moon.radius = clamp(moon.radius ?? 3, 1, 30);
  moon.angularSpeed = clamp(moon.angularSpeed ?? 0.08, 0, 1);
  moon.scale = clamp(moon.scale ?? 0.2, 0.05, 10);
  moon.debugScaleMultiplier = clamp(moon.debugScaleMultiplier ?? 1, 0.1, 10);
  moon.selfRotationSpeed = clamp(moon.selfRotationSpeed ?? 0, 0, 1);
  moon.lockFacing = Boolean(moon.lockFacing ?? true);
  moon.direction = Number(moon.direction) >= 0 ? 1 : -1;
  moon.debugVisible = Boolean(moon.debugVisible);
  moon.debugShowFallback = Boolean(moon.debugShowFallback);
  moon.debugForceBasicMaterial = Boolean(moon.debugForceBasicMaterial);
  moon.debugShowBounds = Boolean(moon.debugShowBounds);
  moon.spotlight.enabled = Boolean(moon.spotlight.enabled ?? true);
  moon.spotlight.intensity = clamp(moon.spotlight.intensity ?? 10, 0, 20);
  moon.spotlight.angleDegrees = clamp(moon.spotlight.angleDegrees ?? 90, 1, 120);
  moon.spotlight.penumbra = clamp(moon.spotlight.penumbra ?? 0.45, 0, 1);
  moon.spotlight.distance = clamp(moon.spotlight.distance ?? 20, 0, 100);

  if (!state.galaxySprites) state.galaxySprites = {};
  const galaxy = state.galaxySprites;
  galaxy.enabled = Boolean(galaxy.enabled ?? true);
  galaxy.texturePaths = Array.isArray(galaxy.texturePaths) && galaxy.texturePaths.length > 0
    ? galaxy.texturePaths
    : ['/png/galaxy_01.png', '/png/galaxy_02.png', '/png/galaxy_03.png', '/png/galaxy_04.png', '/png/galaxy_05.png'];
  galaxy.copiesPerTextureMin = clampedInteger(galaxy.copiesPerTextureMin, 1, 0, 10);
  galaxy.copiesPerTextureMax = Math.max(galaxy.copiesPerTextureMin, clampedInteger(galaxy.copiesPerTextureMax, 3, 0, 10));
  galaxy.totalMax = clampedInteger(galaxy.totalMax, 14, 0, 30);
  galaxy.minScale = clampedNumber(galaxy.minScale, 0.65, 0.01, 12);
  galaxy.maxScale = Math.max(galaxy.minScale, clampedNumber(galaxy.maxScale, 2.8, 0.01, 16));
  galaxy.opacity = clampedNumber(galaxy.opacity, 0.42, 0, 1);
  galaxy.opacityVariance = clampedNumber(galaxy.opacityVariance, 0.18, 0, 1);
  galaxy.innerRadius = clampedNumber(galaxy.innerRadius, 11, 0, 60);
  galaxy.outerRadius = Math.max(galaxy.innerRadius + 0.1, clampedNumber(galaxy.outerRadius, 26, 0.1, 80));
  galaxy.verticalSpread = clampedNumber(galaxy.verticalSpread, 8, 0, 30);
  galaxy.safeRadius = clampedNumber(galaxy.safeRadius, 6.5, 0, 30);
  galaxy.orbitSpeedMin = clampedNumber(galaxy.orbitSpeedMin, 0.0015, 0, 0.1);
  galaxy.orbitSpeedMax = Math.max(galaxy.orbitSpeedMin, clampedNumber(galaxy.orbitSpeedMax, 0.006, 0, 0.1));
  galaxy.ownSpinSpeedMin = clampedNumber(galaxy.ownSpinSpeedMin, 0.002, 0, 0.1);
  galaxy.ownSpinSpeedMax = Math.max(galaxy.ownSpinSpeedMin, clampedNumber(galaxy.ownSpinSpeedMax, 0.012, 0, 0.1));
  galaxy.orbitSpeedMultiplier = clampedNumber(galaxy.orbitSpeedMultiplier, 1, 0, 5);
  galaxy.ownSpinSpeedMultiplier = clampedNumber(galaxy.ownSpinSpeedMultiplier, 1, 0, 5);
  galaxy.additiveBlending = Boolean(galaxy.additiveBlending ?? false);
  galaxy.alphaTest = clampedNumber(galaxy.alphaTest, 0.01, 0, 1);
  galaxy.randomSeed = finiteNumber(galaxy.randomSeed, 1337);
}


function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function createSection(title, openByDefault = true) {
  const details = document.createElement('details');
  details.className = 'options-panel__section';
  details.open = openByDefault;
  const summary = document.createElement('summary');
  summary.textContent = title;
  details.append(summary);
  const body = document.createElement('div');
  body.className = 'options-panel__section-body';
  details.append(body);
  return { details, body };
}

function addRow(sectionBody, labelText, controlBuilder) {
  const row = document.createElement('label');
  row.className = 'options-panel__row';
  const name = document.createElement('span');
  name.className = 'options-panel__label';
  name.textContent = labelText;
  row.append(name);
  const control = document.createElement('div');
  control.className = 'options-panel__control';
  controlBuilder(control);
  row.append(control);
  sectionBody.append(row);
}

export function createOptionsPanel({ runtimeState, onChange, onResetAtmosphere, atmosphereProgression, gateNodes = [], loadingDiagnostics = null }) {
  const defaults = deepClone(runtimeState);

  try {
    const stored = JSON.parse(localStorage.getItem(OPTIONS_STORAGE_KEY) ?? 'null');
    if (stored?.version === OPTIONS_DEFAULTS_VERSION && stored?.runtimeState) {
      Object.assign(runtimeState.backgroundAtmosphere, stored.runtimeState.backgroundAtmosphere ?? {});
      Object.assign(runtimeState.sunCycle, stored.runtimeState.sunCycle ?? {});
      runtimeState.sunCycle.spotlight = { ...runtimeState.sunCycle.spotlight, ...(stored.runtimeState.sunCycle?.spotlight ?? {}) };
      Object.assign(runtimeState.moonCycle, stored.runtimeState.moonCycle ?? {});
      runtimeState.moonCycle.spotlight = { ...runtimeState.moonCycle.spotlight, ...(stored.runtimeState.moonCycle?.spotlight ?? {}) };
      Object.assign(runtimeState.galaxySprites, stored.runtimeState.galaxySprites ?? {});
    }
  } catch {}

  runtimeState.backgroundAtmosphere.smallGlyphRelics = {
    ...deepClone(defaults.backgroundAtmosphere.smallGlyphRelics),
    ...(runtimeState.backgroundAtmosphere.smallGlyphRelics ?? {})
  };
  runtimeState.galaxySprites = {
    ...deepClone(defaults.galaxySprites),
    ...(runtimeState.galaxySprites ?? {})
  };

  normalizeRuntimeState(runtimeState);

  const root = document.createElement('div');
  root.className = 'options-panel';

  const button = document.createElement('button');
  button.className = 'options-panel__toggle';
  button.type = 'button';
  button.textContent = 'Options';

  const panel = document.createElement('aside');
  panel.className = 'options-panel__panel';
  panel.setAttribute('aria-hidden', 'true');

  const header = document.createElement('div');
  header.className = 'options-panel__header';
  header.innerHTML = '<h2>Options</h2><p>Runtime tuning/debug</p>';
  panel.append(header);

  const actions = document.createElement('div');
  actions.className = 'options-panel__actions';
  const resetAll = document.createElement('button');
  resetAll.type = 'button';
  resetAll.textContent = 'Reset all';
  resetAll.addEventListener('click', () => {
    Object.assign(runtimeState.backgroundAtmosphere, deepClone(defaults.backgroundAtmosphere));
    runtimeState.sunCycle = deepClone(defaults.sunCycle);
    runtimeState.moonCycle = deepClone(defaults.moonCycle);
    Object.assign(runtimeState.galaxySprites, deepClone(defaults.galaxySprites));
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'reset-all' });
    persistState();
    renderAll();
  });
  actions.append(resetAll);
  panel.append(actions);
  const presetSection = createSection('Presets', true);
  const presetStatus = document.createElement('p');
  presetStatus.className = 'options-panel__preset-status';
  presetSection.body.append(presetStatus);
  let presetStatusTimer = null;
  const setPresetStatus = (message) => {
    presetStatus.textContent = message;
    if (presetStatusTimer) clearTimeout(presetStatusTimer);
    presetStatusTimer = setTimeout(() => { presetStatus.textContent = ''; }, 3000);
  };
  const makePresetRow = (slot) => {
    const row = document.createElement('div');
    row.className = 'options-panel__preset-row';
    const label = document.createElement('span');
    label.className = 'options-panel__preset-label';
    label.textContent = `Slot ${slot}`;
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = `Save ${slot}`;
    saveButton.className = 'options-panel__preset-btn';
    saveButton.addEventListener('click', () => {
      localStorage.setItem(PRESET_SLOT_KEYS[slot - 1], JSON.stringify({ version: OPTIONS_DEFAULTS_VERSION, runtimeState: { backgroundAtmosphere: deepClone(runtimeState.backgroundAtmosphere), sunCycle: deepClone(runtimeState.sunCycle), moonCycle: deepClone(runtimeState.moonCycle), galaxySprites: deepClone(runtimeState.galaxySprites) } }));
      setPresetStatus(`Zapisano slot ${slot}`);
    });
    const loadButton = document.createElement('button');
    loadButton.type = 'button';
    loadButton.textContent = `Load ${slot}`;
    loadButton.className = 'options-panel__preset-btn';
    loadButton.addEventListener('click', () => {
      const raw = localStorage.getItem(PRESET_SLOT_KEYS[slot - 1]);
      if (!raw) {
        console.info(`[options] Slot ${slot} is empty.`);
        setPresetStatus(`Slot ${slot} jest pusty`);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed?.runtimeState?.backgroundAtmosphere) throw new Error('Invalid preset shape');
        Object.assign(runtimeState.backgroundAtmosphere, parsed.runtimeState.backgroundAtmosphere);
        Object.assign(runtimeState.sunCycle, parsed.runtimeState.sunCycle ?? defaults.sunCycle);
        Object.assign(runtimeState.moonCycle, parsed.runtimeState.moonCycle ?? defaults.moonCycle);
        Object.assign(runtimeState.galaxySprites, parsed.runtimeState.galaxySprites ?? defaults.galaxySprites);
        runtimeState.sunCycle.spotlight = { ...deepClone(defaults.sunCycle.spotlight), ...(parsed.runtimeState.sunCycle?.spotlight ?? {}) };
        runtimeState.moonCycle.spotlight = { ...deepClone(defaults.moonCycle.spotlight), ...(parsed.runtimeState.moonCycle?.spotlight ?? {}) };
        normalizeRuntimeState(runtimeState);
        onChange({ type: 'rebuild' });
        persistState();
        renderAll();
        setPresetStatus(`Wczytano slot ${slot}`);
      } catch (error) {
        console.warn(`[options] Failed to load preset slot ${slot}.`, error);
        setPresetStatus(`Błąd slotu ${slot}`);
      }
    });
    row.append(label, saveButton, loadButton);
    presetSection.body.append(row);
  };
  makePresetRow(1);
  makePresetRow(2);
  makePresetRow(3);

  const exportDebugSettings = () => {
    const progressionDebugState = atmosphereProgression?.getProgressionDebugState?.() ?? null;
    const transitionSeconds = toThresholdSeconds(progressionDebugState?.transitionTimes);
    const exportPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      source: 'portfolio-debug-panel',
      progression: {
        enabled: progressionDebugState?.progressionEnabled ?? true,
        autoProgressOnUniqueGateClose: progressionDebugState?.autoProgressOnUniqueGateClose ?? true,
        progressLevel: progressionDebugState?.progressLevel ?? 0,
        effectiveProgressLevel: progressionDebugState?.effectiveProgressLevel ?? 0,
        pendingGateId: progressionDebugState?.pendingGateId ?? null,
        visitedGateIds: progressionDebugState?.visitedGateIds ?? [],
        activeTransition: progressionDebugState ? {
          isTransitioning: progressionDebugState.isTransitioning,
          activeLayerIndex: progressionDebugState.activeTransitionLayer,
          activeLayerKey: progressionDebugState.activeTransitionLayerKey,
          transitionProgress: progressionDebugState.transitionProgress,
          layerTransitionProgress: progressionDebugState.layerTransitionProgress
        } : null,
        transitionSeconds,
        mapping: ATMOSPHERE_PROGRESSION_MAPPING,
        sunMoonLightMultiplier: progressionDebugState?.sunMoonLightMultiplier ?? 1,
        sunMoonLightMultipliers: SUN_MOON_LIGHT_MULTIPLIERS
      },
      layers: {
        stones: deepClone(runtimeState.backgroundAtmosphere.stoneRelics),
        shells: deepClone(runtimeState.backgroundAtmosphere.shellRelics),
        smallGlyphs: deepClone(runtimeState.backgroundAtmosphere.smallGlyphRelics),
        stars: deepClone(runtimeState.backgroundAtmosphere.dust),
        galaxies: deepClone(runtimeState.galaxySprites)
      },
      atmosphere: deepClone(runtimeState.backgroundAtmosphere),
      celestial: {
        sun: deepClone(runtimeState.sunCycle),
        moon: deepClone(runtimeState.moonCycle)
      },
      lights: {
        sunSpotlight: deepClone(runtimeState.sunCycle.spotlight),
        moonSpotlight: deepClone(runtimeState.moonCycle.spotlight)
      },
      camera: {},
      rawDebugState: {
        runtimeState: deepClone(runtimeState),
        progression: progressionDebugState
      }
    };

    downloadJsonFile(`portfolio-debug-settings-${timestampForFilename()}.json`, exportPayload);
    setPresetStatus('Wyeksportowano debug JSON');
  };

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.style.display = 'none';
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? '{}'));
        const importedState = pickRuntimeStateFromImport(parsed);
        if (!importedState?.backgroundAtmosphere && !importedState?.sunCycle && !importedState?.moonCycle && !importedState?.galaxySprites && !parsed?.progression) {
          throw new Error('Invalid debug settings JSON shape');
        }

        if (importedState.backgroundAtmosphere) Object.assign(runtimeState.backgroundAtmosphere, importedState.backgroundAtmosphere);
        if (importedState.sunCycle) Object.assign(runtimeState.sunCycle, importedState.sunCycle);
        if (importedState.moonCycle) Object.assign(runtimeState.moonCycle, importedState.moonCycle);
        if (importedState.galaxySprites) Object.assign(runtimeState.galaxySprites, importedState.galaxySprites);
        runtimeState.sunCycle.spotlight = { ...deepClone(defaults.sunCycle.spotlight), ...(runtimeState.sunCycle.spotlight ?? {}) };
        runtimeState.moonCycle.spotlight = { ...deepClone(defaults.moonCycle.spotlight), ...(runtimeState.moonCycle.spotlight ?? {}) };
        normalizeRuntimeState(runtimeState);
        atmosphereProgression?.importProgressionSettings?.(parsed.progression ?? parsed.rawDebugState?.progression ?? {});
        onChange({ type: 'rebuild' });
        persistState();
        renderAll();
        setPresetStatus(`Zaimportowano ${file.name}`);
      } catch (error) {
        console.warn('[options] Failed to import debug settings JSON.', error);
        setPresetStatus('Błąd importu JSON');
      }
    });
    reader.addEventListener('error', () => {
      console.warn('[options] Failed to read debug settings JSON file.', reader.error);
      setPresetStatus('Błąd odczytu JSON');
    });
    reader.readAsText(file);
  });
  presetSection.body.append(importInput);

  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.textContent = 'Eksportuj ustawienia debug JSON';
  exportButton.className = 'options-panel__section-reset';
  exportButton.addEventListener('click', exportDebugSettings);
  presetSection.body.append(exportButton);

  const importButton = document.createElement('button');
  importButton.type = 'button';
  importButton.textContent = 'Importuj ustawienia debug JSON';
  importButton.className = 'options-panel__section-reset';
  importButton.addEventListener('click', () => importInput.click());
  presetSection.body.append(importButton);

  const atmosphereSection = createSection('Atmosphere', true);
  const sunCycleSection = createSection('Sun Cycle', true);
  const moonCycleSection = createSection('Moon Cycle', true);
  const stoneSection = createSection('Stone Relics', true);
  const shellSection = createSection('Shell Relics', true);
  const smallGlyphSection = createSection('Small Glyph Relics', true);
  const galaxySection = createSection('Galaxy Sprites', true);
  const loadingSection = createSection('Loading / Assets', true);
  const debugSection = createSection('Debug Visuals', true);
  const progressionSection = createSection('Atmosphere Progression', true);
  const futureSection = createSection('Future / Reserved', false);

  const atmosphereReset = document.createElement('button');
  atmosphereReset.type = 'button';
  atmosphereReset.textContent = 'Reset atmosphere';
  atmosphereReset.className = 'options-panel__section-reset';
  atmosphereReset.addEventListener('click', () => {
    Object.assign(runtimeState.backgroundAtmosphere, deepClone(defaults.backgroundAtmosphere));
    normalizeRuntimeState(runtimeState);
    onResetAtmosphere();
    persistState();
    renderAll();
  });
  atmosphereSection.body.append(atmosphereReset);
  const sunCycleReset = document.createElement('button');
  sunCycleReset.type = 'button';
  sunCycleReset.textContent = 'Reset Sun Cycle';
  sunCycleReset.className = 'options-panel__section-reset';
  sunCycleReset.addEventListener('click', () => {
    runtimeState.sunCycle = deepClone(defaults.sunCycle);
    runtimeState.moonCycle = deepClone(defaults.moonCycle);
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'sun-cycle' });
    persistState();
    renderAll();
  });
  sunCycleSection.body.append(sunCycleReset);
  const moonCycleReset = document.createElement('button');
  moonCycleReset.type = 'button';
  moonCycleReset.textContent = 'Reset Moon Cycle';
  moonCycleReset.className = 'options-panel__section-reset';
  moonCycleReset.addEventListener('click', () => {
    runtimeState.moonCycle = deepClone(defaults.moonCycle);
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'moon-cycle' });
    persistState();
    renderAll();
  });
  moonCycleSection.body.append(moonCycleReset);

  const stoneRebuild = document.createElement('button');
  stoneRebuild.type = 'button';
  stoneRebuild.textContent = 'Rebuild Stone Relics';
  stoneRebuild.className = 'options-panel__section-reset';
  stoneRebuild.addEventListener('click', () => onChange({ type: 'stone-rebuild' }));
  stoneSection.body.append(stoneRebuild);
  const stoneReset = document.createElement('button');
  stoneReset.type = 'button';
  stoneReset.textContent = 'Reset Stone Relics';
  stoneReset.className = 'options-panel__section-reset';
  stoneReset.addEventListener('click', () => {
    bg.stoneRelics = deepClone(defaults.backgroundAtmosphere.stoneRelics);
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'stone-rebuild' });
    persistState();
    renderAll();
  });
  stoneSection.body.append(stoneReset);

  const shellRebuild = document.createElement('button');
  shellRebuild.type = 'button';
  shellRebuild.textContent = 'Rebuild Shell Relics';
  shellRebuild.className = 'options-panel__section-reset';
  shellRebuild.addEventListener('click', () => onChange({ type: 'shell-rebuild' }));
  shellSection.body.append(shellRebuild);

  const shellReset = document.createElement('button');
  shellReset.type = 'button';
  shellReset.textContent = 'Reset Shell Relics';
  shellReset.className = 'options-panel__section-reset';
  shellReset.addEventListener('click', () => {
    bg.shellRelics = deepClone(defaults.backgroundAtmosphere.shellRelics);
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'shell-rebuild' });
    persistState();
    renderAll();
  });
  shellSection.body.append(shellReset);

  const smallGlyphRebuild = document.createElement('button');
  smallGlyphRebuild.type = 'button';
  smallGlyphRebuild.textContent = 'Rebuild Small Glyph Relics';
  smallGlyphRebuild.className = 'options-panel__section-reset';
  smallGlyphRebuild.addEventListener('click', () => onChange({ type: 'small-glyph-rebuild' }));
  smallGlyphSection.body.append(smallGlyphRebuild);

  const smallGlyphReset = document.createElement('button');
  smallGlyphReset.type = 'button';
  smallGlyphReset.textContent = 'Reset Small Glyph Relics';
  smallGlyphReset.className = 'options-panel__section-reset';
  smallGlyphReset.addEventListener('click', () => {
    bg.smallGlyphRelics = deepClone(defaults.backgroundAtmosphere.smallGlyphRelics);
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'small-glyph-rebuild' });
    persistState();
    renderAll();
  });
  smallGlyphSection.body.append(smallGlyphReset);

  const galaxyRebuild = document.createElement('button');
  galaxyRebuild.type = 'button';
  galaxyRebuild.textContent = 'Rebuild Galaxy Sprites';
  galaxyRebuild.className = 'options-panel__section-reset';
  galaxyRebuild.addEventListener('click', () => onChange({ type: 'galaxy-sprites-rebuild' }));
  galaxySection.body.append(galaxyRebuild);

  const galaxyReset = document.createElement('button');
  galaxyReset.type = 'button';
  galaxyReset.textContent = 'Reset Galaxy Sprites';
  galaxyReset.className = 'options-panel__section-reset';
  galaxyReset.addEventListener('click', () => {
    Object.assign(runtimeState.galaxySprites, deepClone(defaults.galaxySprites));
    normalizeRuntimeState(runtimeState);
    onChange({ type: 'galaxy-sprites-rebuild' });
    persistState();
    renderAll();
  });
  galaxySection.body.append(galaxyReset);

  function checkbox(path, parent, labelText) {
    let input;
    addRow(parent, labelText, (el) => {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.addEventListener('change', () => {
        path.set(Boolean(input.checked));
      });
      el.append(input);
    });
    return () => {
      input.checked = path.get();
    };
  }

  function range(path, parent, labelText, min, max, step) {
    let slider;
    let number;
    const syncFromUi = (nextRaw) => {
      if (String(nextRaw).trim() === '') return;
      const next = Number(nextRaw);
      if (!Number.isFinite(next)) return;
      path.set(next);
      slider.value = String(next);
      number.value = String(next);
    };

    addRow(parent, labelText, (el) => {
      slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.addEventListener('input', () => syncFromUi(slider.value));

      number = document.createElement('input');
      number.type = 'number';
      number.min = String(min);
      number.max = String(max);
      number.step = String(step);
      number.addEventListener('change', () => syncFromUi(number.value));

      el.append(slider, number);
    });

    return () => {
      const value = path.get();
      slider.value = String(value);
      number.value = String(value);
    };
  }

  function select(path, parent, labelText, options) {
    let input;
    addRow(parent, labelText, (el) => {
      input = document.createElement('select');
      options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        input.append(option);
      });
      input.addEventListener('change', () => path.set(input.value));
      el.append(input);
    });
    return () => {
      input.value = path.get();
    };
  }

  function color(path, parent, labelText) {
    let input;
    addRow(parent, labelText, (el) => {
      input = document.createElement('input');
      input.type = 'color';
      input.addEventListener('input', () => path.set(input.value));
      el.append(input);
    });
    return () => {
      input.value = path.get();
    };
  }

  const binders = [];
  const bind = (fn) => binders.push(fn);
  const bg = runtimeState.backgroundAtmosphere;
  const sun = runtimeState.sunCycle;
  const moon = runtimeState.moonCycle;
  const galaxy = runtimeState.galaxySprites;
  const progression = atmosphereProgression?.state;

  const path = (getter, setter, type) => ({
    get: getter,
    set: (value) => {
      setter(value);
      normalizeRuntimeState(runtimeState);
      onChange({ type });
      persistState();
      renderAll();
    }
  });

  bind(checkbox(path(() => bg.enabled, (v) => { bg.enabled = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.enabled'));
  if (progression) {
    bind(checkbox(path(() => progression.progressionEnabled, (v) => { atmosphereProgression.setProgressionEnabled(v); }, 'runtime'), progressionSection.body, 'Enable atmosphere progression'));
    bind(checkbox(path(() => progression.autoProgressOnUniqueGateClose, (v) => { atmosphereProgression.setAutoProgressOnUniqueGateClose(v); }, 'runtime'), progressionSection.body, 'Auto progress after panel close'));
    bind(range(path(() => progression.progressLevel, (v) => { atmosphereProgression.setProgressLevel(v); }, 'runtime'), progressionSection.body, 'Atmosphere progress', 0, 5, 1));
    bind(range(path(() => progression.transitionTimes.stones, (v) => { progression.transitionTimes.stones = v; }, 'runtime'), progressionSection.body, 'transition time threshold 1 / stones', 0.1, 20, 0.1));
    bind(range(path(() => progression.transitionTimes.shells, (v) => { progression.transitionTimes.shells = v; }, 'runtime'), progressionSection.body, 'transition time threshold 2 / shells', 0.1, 20, 0.1));
    bind(range(path(() => progression.transitionTimes.smallGlyphs, (v) => { progression.transitionTimes.smallGlyphs = v; }, 'runtime'), progressionSection.body, 'transition time threshold 3 / small glyphs', 0.1, 20, 0.1));
    bind(range(path(() => progression.transitionTimes.stars, (v) => { progression.transitionTimes.stars = v; }, 'runtime'), progressionSection.body, 'transition time threshold 4 / stars', 0.1, 20, 0.1));
    bind(range(path(() => progression.transitionTimes.galaxies, (v) => { progression.transitionTimes.galaxies = v; }, 'runtime'), progressionSection.body, 'transition time threshold 5 / galaxies', 0.1, 20, 0.1));

    const resetProgressionButton = document.createElement('button');
    resetProgressionButton.type = 'button';
    resetProgressionButton.textContent = 'Reset atmosphere progression';
    resetProgressionButton.className = 'options-panel__section-reset';
    resetProgressionButton.addEventListener('click', () => { atmosphereProgression.resetProgression(); onChange({ type: 'runtime' }); renderAll(); });
    progressionSection.body.append(resetProgressionButton);
    const unlockProgressionButton = document.createElement('button');
    unlockProgressionButton.type = 'button';
    unlockProgressionButton.textContent = 'Unlock full atmosphere';
    unlockProgressionButton.className = 'options-panel__section-reset';
    unlockProgressionButton.addEventListener('click', () => { atmosphereProgression.unlockFullProgression(); onChange({ type: 'runtime' }); renderAll(); });
    progressionSection.body.append(unlockProgressionButton);
    const progressionDebugState = document.createElement('pre');
    progressionDebugState.className = 'options-panel__placeholder';
    const progressionDebugBinder = () => {
      const debugState = atmosphereProgression.getProgressionDebugState();
      const layerProgress = Object.entries(debugState.layerTransitionProgress ?? {})
        .map(([key, value]) => `${key}: ${Number(value).toFixed(3)}`)
        .join(', ');
      progressionDebugState.textContent = [
        'mapping:',
        'progress 0: Core only — monkey, main glyphs, sun, moon',
        'progress 1: Stones + sun/moon light 30%',
        'progress 2: Shells + sun/moon light 60%',
        'progress 3: Small glyphs + sun/moon light 100%',
        'progress 4: Stars',
        'progress 5: Galaxies',
        '',
        `progression enabled: ${debugState.progressionEnabled}`,
        `auto progress after panel close: ${debugState.autoProgressOnUniqueGateClose}`,
        `current progressLevel: ${debugState.progressLevel}`,
        `effectiveProgressLevel: ${debugState.effectiveProgressLevel}`,
        `pendingGateId: ${debugState.pendingGateId ?? 'none'}`,
        `visitedGateIds: ${debugState.visitedGateIds.length ? debugState.visitedGateIds.join(', ') : '[]'}`,
        `transition status: ${debugState.isTransitioning ? 'transitioning' : 'idle'}`,
        `active layer index: ${debugState.activeTransitionLayer ?? 'none'}`,
        `active layer key: ${debugState.activeTransitionLayerKey ?? 'none'}`,
        `transition progress: ${debugState.transitionProgress.toFixed(3)}`,
        `layer transition progress: ${layerProgress || 'none'}`,
        `sun/moon light multiplier: ${Number(debugState.sunMoonLightMultiplier).toFixed(2)}`
      ].join('\n');
    };
    binders.push(progressionDebugBinder);
    progressionSection.body.append(progressionDebugState);
    gateNodes.forEach((node) => {
      const status = document.createElement('p');
      status.className = 'options-panel__placeholder';
      const binder = () => { status.textContent = `${node.title}: ${progression.visitedGateIds.has(node.id) ? 'visited' : 'not visited'}`; };
      binders.push(binder);
      progressionSection.body.append(status);
    });
  }
  bind(checkbox(path(() => sun.enabled, (v) => { sun.enabled = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.enabled'));
  bind(range(path(() => sun.radius, (v) => { sun.radius = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.radius', 1, 30, 0.1));
  bind(range(path(() => sun.angularSpeed, (v) => { sun.angularSpeed = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.angularSpeed', 0, 1, 0.001));
  bind(select(path(() => String(sun.direction), (v) => { sun.direction = Number(v); }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.direction', [{ value: '1', label: 'Forward' }, { value: '-1', label: 'Reverse' }]));
  bind(range(path(() => sun.scale, (v) => { sun.scale = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.scale', 0.01, 20, 0.01));
  bind(range(path(() => sun.debugScaleMultiplier, (v) => { sun.debugScaleMultiplier = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.debugScaleMultiplier', 0.01, 20, 0.01));
  bind(checkbox(path(() => sun.lockFacing, (v) => { sun.lockFacing = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.lockFacing'));
  bind(range(path(() => sun.selfRotationSpeed, (v) => { sun.selfRotationSpeed = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.selfRotationSpeed', 0, 1, 0.001));
  bind(range(path(() => sun.emissiveIntensity, (v) => { sun.emissiveIntensity = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.emissiveIntensity', 0, 10, 0.1));
  bind(checkbox(path(() => sun.spotlight.enabled, (v) => { sun.spotlight.enabled = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.spotlight.enabled'));
  bind(range(path(() => sun.spotlight.intensity, (v) => { sun.spotlight.intensity = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.spotlight.intensity', 0, 20, 0.1));
  bind(range(path(() => sun.spotlight.angleDegrees, (v) => { sun.spotlight.angleDegrees = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.spotlight.angleDegrees', 1, 120, 1));
  bind(range(path(() => sun.spotlight.penumbra, (v) => { sun.spotlight.penumbra = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.spotlight.penumbra', 0, 1, 0.01));
  bind(range(path(() => sun.spotlight.distance, (v) => { sun.spotlight.distance = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.spotlight.distance', 0, 100, 1));
  bind(checkbox(path(() => sun.debugVisible, (v) => { sun.debugVisible = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.debugVisible'));
  bind(checkbox(path(() => sun.debugShowFallback, (v) => { sun.debugShowFallback = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.debugShowFallback'));
  bind(checkbox(path(() => sun.debugForceBasicMaterial, (v) => { sun.debugForceBasicMaterial = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.debugForceBasicMaterial'));
  bind(checkbox(path(() => sun.debugShowBounds, (v) => { sun.debugShowBounds = v; }, 'sun-cycle'), sunCycleSection.body, 'sunCycle.debugShowBounds'));

  bind(checkbox(path(() => moon.enabled, (v) => { moon.enabled = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.enabled'));
  bind(range(path(() => moon.radius, (v) => { moon.radius = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.radius', 1, 30, 0.1));
  bind(range(path(() => moon.angularSpeed, (v) => { moon.angularSpeed = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.angularSpeed', 0, 1, 0.001));
  bind(select(path(() => String(moon.direction), (v) => { moon.direction = Number(v); }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.direction', [{ value: '1', label: 'Forward' }, { value: '-1', label: 'Reverse' }]));
  bind(range(path(() => moon.scale, (v) => { moon.scale = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.scale', 0.05, 10, 0.05));
  bind(range(path(() => moon.debugScaleMultiplier, (v) => { moon.debugScaleMultiplier = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.debugScaleMultiplier', 0.1, 10, 0.1));
  bind(checkbox(path(() => moon.lockFacing, (v) => { moon.lockFacing = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.lockFacing'));
  bind(range(path(() => moon.selfRotationSpeed, (v) => { moon.selfRotationSpeed = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.selfRotationSpeed', 0, 1, 0.001));
  bind(checkbox(path(() => moon.spotlight.enabled, (v) => { moon.spotlight.enabled = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.spotlight.enabled'));
  bind(range(path(() => moon.spotlight.intensity, (v) => { moon.spotlight.intensity = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.spotlight.intensity', 0, 20, 0.1));
  bind(range(path(() => moon.spotlight.angleDegrees, (v) => { moon.spotlight.angleDegrees = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.spotlight.angleDegrees', 1, 120, 1));
  bind(range(path(() => moon.spotlight.penumbra, (v) => { moon.spotlight.penumbra = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.spotlight.penumbra', 0, 1, 0.01));
  bind(range(path(() => moon.spotlight.distance, (v) => { moon.spotlight.distance = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.spotlight.distance', 0, 100, 1));
  bind(checkbox(path(() => moon.debugVisible, (v) => { moon.debugVisible = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.debugVisible'));
  bind(checkbox(path(() => moon.debugShowFallback, (v) => { moon.debugShowFallback = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.debugShowFallback'));
  bind(checkbox(path(() => moon.debugForceBasicMaterial, (v) => { moon.debugForceBasicMaterial = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.debugForceBasicMaterial'));
  bind(checkbox(path(() => moon.debugShowBounds, (v) => { moon.debugShowBounds = v; }, 'moon-cycle'), moonCycleSection.body, 'moonCycle.debugShowBounds'));

  bind(checkbox(path(() => bg.debugVisible, (v) => { bg.debugVisible = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.debugVisible'));
  bind(range(path(() => bg.safeRadius, (v) => { bg.safeRadius = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.safeRadius', 0, 15, 0.1));
  bind(range(path(() => bg.shellInnerRadius, (v) => { bg.shellInnerRadius = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.shellInnerRadius', 0, 30, 0.1));
  bind(range(path(() => bg.shellOuterRadius, (v) => { bg.shellOuterRadius = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.shellOuterRadius', 1, 40, 0.1));

  bind(checkbox(path(() => bg.dust.enabled, (v) => { bg.dust.enabled = v; }, 'rebuild'), atmosphereSection.body, 'dust.enabled'));
  bind(range(path(() => bg.dust.count, (v) => { bg.dust.count = Math.round(v); }, 'rebuild'), atmosphereSection.body, 'dust.count', 0, 10000, 100));
  bind(range(path(() => bg.dust.idleOpacity, (v) => { bg.dust.idleOpacity = v; }, 'material'), atmosphereSection.body, 'dust.idleOpacity', 0, 1, 0.01));
  bind(range(path(() => bg.dust.pointSize, (v) => { bg.dust.pointSize = v; }, 'material'), atmosphereSection.body, 'dust.pointSize', 0.001, 0.3, 0.001));
  bind(range(path(() => bg.dust.rotationSpeed, (v) => { bg.dust.rotationSpeed = v; }, 'runtime'), atmosphereSection.body, 'dust.rotationSpeed', 0, 0.1, 0.001));
  bind(color(path(() => bg.dust.color, (v) => { bg.dust.color = v; }, 'material'), atmosphereSection.body, 'dust.color'));
  bind(checkbox(path(() => bg.dust.sizeAttenuation, (v) => { bg.dust.sizeAttenuation = v; }, 'material'), atmosphereSection.body, 'dust.sizeAttenuation'));
  bind(checkbox(path(() => bg.dust.depthTest, (v) => { bg.dust.depthTest = v; }, 'material'), atmosphereSection.body, 'dust.depthTest'));
  const stone = bg.stoneRelics;
  bind(checkbox(path(() => stone.enabled, (v) => { stone.enabled = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.enabled'));
  bind(range(path(() => stone.count, (v) => { stone.count = Math.round(v); }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.count', 0, 200, 1));
  bind(range(path(() => stone.minScale, (v) => { stone.minScale = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.minScale', 0.01, 8, 0.01));
  bind(range(path(() => stone.maxScale, (v) => { stone.maxScale = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.maxScale', 0.01, 10, 0.01));
  bind(range(path(() => stone.shellInnerRadius, (v) => { stone.shellInnerRadius = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.shellInnerRadius', 0, 30, 0.1));
  bind(range(path(() => stone.shellOuterRadius, (v) => { stone.shellOuterRadius = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.shellOuterRadius', 1, 40, 0.1));
  bind(range(path(() => stone.rotationSpeedMin, (v) => { stone.rotationSpeedMin = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.rotationSpeedMin', 0, 0.3, 0.001));
  bind(range(path(() => stone.rotationSpeedMax, (v) => { stone.rotationSpeedMax = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.rotationSpeedMax', 0, 0.5, 0.001));
  bind(range(path(() => stone.orbitSpeed, (v) => { stone.orbitSpeed = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.orbitSpeed', 0, 0.15, 0.001));
  bind(range(path(() => stone.opacity, (v) => { stone.opacity = v; }, 'material'), stoneSection.body, 'stoneRelics.opacity', 0, 1, 0.01));
  bind(checkbox(path(() => stone.debugVisible, (v) => { stone.debugVisible = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.debugVisible'));
  const shell = bg.shellRelics;
  bind(checkbox(path(() => shell.enabled, (v) => { shell.enabled = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.enabled'));
  bind(range(path(() => shell.count, (v) => { shell.count = Math.round(v); }, 'shell-rebuild'), shellSection.body, 'shellRelics.count', 0, 200, 1));
  bind(range(path(() => shell.minScale, (v) => { shell.minScale = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.minScale', 0.01, 8, 0.01));
  bind(range(path(() => shell.maxScale, (v) => { shell.maxScale = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.maxScale', 0.01, 10, 0.01));
  bind(range(path(() => shell.shellInnerRadius, (v) => { shell.shellInnerRadius = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.shellInnerRadius', 0, 30, 0.1));
  bind(range(path(() => shell.shellOuterRadius, (v) => { shell.shellOuterRadius = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.shellOuterRadius', 1, 40, 0.1));
  bind(range(path(() => shell.rotationSpeedMin, (v) => { shell.rotationSpeedMin = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.rotationSpeedMin', 0, 0.3, 0.001));
  bind(range(path(() => shell.rotationSpeedMax, (v) => { shell.rotationSpeedMax = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.rotationSpeedMax', 0, 0.8, 0.001));
  bind(range(path(() => shell.orbitSpeed, (v) => { shell.orbitSpeed = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.orbitSpeed', 0, 0.2, 0.001));
  bind(range(path(() => shell.opacity, (v) => { shell.opacity = v; }, 'material'), shellSection.body, 'shellRelics.opacity', 0, 1, 0.01));
  bind(checkbox(path(() => shell.debugVisible, (v) => { shell.debugVisible = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.debugVisible'));
  const smallGlyph = bg.smallGlyphRelics;
  bind(checkbox(path(() => smallGlyph.enabled, (v) => { smallGlyph.enabled = v; }, 'small-glyph-runtime'), smallGlyphSection.body, 'smallGlyphRelics.enabled'));
  bind(range(path(() => smallGlyph.count, (v) => { smallGlyph.count = Math.round(v); }, 'small-glyph-rebuild'), smallGlyphSection.body, 'smallGlyphRelics.count', 0, 200, 1));
  bind(range(path(() => smallGlyph.minScale, (v) => { smallGlyph.minScale = v; }, 'small-glyph-rebuild'), smallGlyphSection.body, 'smallGlyphRelics.minScale', 0.01, 4, 0.01));
  bind(range(path(() => smallGlyph.maxScale, (v) => { smallGlyph.maxScale = v; }, 'small-glyph-rebuild'), smallGlyphSection.body, 'smallGlyphRelics.maxScale', 0.01, 6, 0.01));
  bind(range(path(() => smallGlyph.shellInnerRadius, (v) => { smallGlyph.shellInnerRadius = v; }, 'small-glyph-rebuild'), smallGlyphSection.body, 'smallGlyphRelics.shellInnerRadius', 0, 30, 0.1));
  bind(range(path(() => smallGlyph.shellOuterRadius, (v) => { smallGlyph.shellOuterRadius = v; }, 'small-glyph-rebuild'), smallGlyphSection.body, 'smallGlyphRelics.shellOuterRadius', 1, 40, 0.1));
  bind(range(path(() => smallGlyph.rotationSpeedMin, (v) => { smallGlyph.rotationSpeedMin = v; }, 'small-glyph-runtime'), smallGlyphSection.body, 'smallGlyphRelics.rotationSpeedMin', 0, 0.3, 0.001));
  bind(range(path(() => smallGlyph.rotationSpeedMax, (v) => { smallGlyph.rotationSpeedMax = v; }, 'small-glyph-runtime'), smallGlyphSection.body, 'smallGlyphRelics.rotationSpeedMax', 0, 0.5, 0.001));
  bind(range(path(() => smallGlyph.orbitSpeed, (v) => { smallGlyph.orbitSpeed = v; }, 'small-glyph-runtime'), smallGlyphSection.body, 'smallGlyphRelics.orbitSpeed', 0, 0.15, 0.001));
  bind(range(path(() => smallGlyph.opacity, (v) => { smallGlyph.opacity = v; }, 'material'), smallGlyphSection.body, 'smallGlyphRelics.opacity', 0, 1, 0.01));
  bind(checkbox(path(() => smallGlyph.debugVisible, (v) => { smallGlyph.debugVisible = v; }, 'small-glyph-rebuild'), smallGlyphSection.body, 'smallGlyphRelics.debugVisible'));

  bind(checkbox(path(() => galaxy.enabled, (v) => { galaxy.enabled = v; }, 'galaxy-sprites-runtime'), galaxySection.body, 'galaxySprites.enabled'));
  bind(range(path(() => galaxy.totalMax, (v) => { galaxy.totalMax = Math.round(v); }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.totalMax', 0, 30, 1));
  bind(range(path(() => galaxy.copiesPerTextureMin, (v) => { galaxy.copiesPerTextureMin = Math.round(v); }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.copiesPerTextureMin', 0, 10, 1));
  bind(range(path(() => galaxy.copiesPerTextureMax, (v) => { galaxy.copiesPerTextureMax = Math.round(v); }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.copiesPerTextureMax', 0, 10, 1));
  bind(range(path(() => galaxy.minScale, (v) => { galaxy.minScale = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.minScale', 0.01, 12, 0.01));
  bind(range(path(() => galaxy.maxScale, (v) => { galaxy.maxScale = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.maxScale', 0.01, 16, 0.01));
  bind(range(path(() => galaxy.opacity, (v) => { galaxy.opacity = v; }, 'galaxy-sprites-runtime'), galaxySection.body, 'galaxySprites.opacity', 0, 1, 0.01));
  bind(range(path(() => galaxy.opacityVariance, (v) => { galaxy.opacityVariance = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.opacityVariance', 0, 1, 0.01));
  bind(range(path(() => galaxy.innerRadius, (v) => { galaxy.innerRadius = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.innerRadius', 0, 60, 0.1));
  bind(range(path(() => galaxy.outerRadius, (v) => { galaxy.outerRadius = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.outerRadius', 0.1, 80, 0.1));
  bind(range(path(() => galaxy.verticalSpread, (v) => { galaxy.verticalSpread = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.verticalSpread', 0, 30, 0.1));
  bind(range(path(() => galaxy.orbitSpeedMin, (v) => { galaxy.orbitSpeedMin = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.orbitSpeedMin', 0, 0.1, 0.0005));
  bind(range(path(() => galaxy.orbitSpeedMax, (v) => { galaxy.orbitSpeedMax = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.orbitSpeedMax', 0, 0.1, 0.0005));
  bind(range(path(() => galaxy.orbitSpeedMultiplier, (v) => { galaxy.orbitSpeedMultiplier = v; }, 'galaxy-sprites-runtime'), galaxySection.body, 'galaxySprites.orbitSpeedMultiplier', 0, 5, 0.05));
  bind(range(path(() => galaxy.ownSpinSpeedMin, (v) => { galaxy.ownSpinSpeedMin = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.ownSpinSpeedMin', 0, 0.1, 0.0005));
  bind(range(path(() => galaxy.ownSpinSpeedMax, (v) => { galaxy.ownSpinSpeedMax = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.ownSpinSpeedMax', 0, 0.1, 0.0005));
  bind(range(path(() => galaxy.ownSpinSpeedMultiplier, (v) => { galaxy.ownSpinSpeedMultiplier = v; }, 'galaxy-sprites-runtime'), galaxySection.body, 'galaxySprites.ownSpinSpeedMultiplier', 0, 5, 0.05));
  bind(checkbox(path(() => galaxy.additiveBlending, (v) => { galaxy.additiveBlending = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.additiveBlending'));
  bind(range(path(() => galaxy.alphaTest, (v) => { galaxy.alphaTest = v; }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.alphaTest', 0, 1, 0.001));
  bind(range(path(() => galaxy.randomSeed, (v) => { galaxy.randomSeed = Math.round(v); }, 'galaxy-sprites-rebuild'), galaxySection.body, 'galaxySprites.randomSeed', 1, 999999, 1));


  const loadingReadout = document.createElement('div');
  loadingReadout.className = 'options-panel__loading-readout';
  loadingSection.body.append(loadingReadout);

  function renderLoadingReadout(snapshot = loadingDiagnostics?.getSnapshot?.()) {
    if (!snapshot) {
      loadingReadout.textContent = 'No loading diagnostics available.';
      return;
    }

    const totalText = snapshot.knownTotalBytes > 0 ? formatBytes(snapshot.knownTotalBytes) : 'unknown total';
    const unknownNote = snapshot.unknownTotalAssets > 0 ? `${snapshot.unknownTotalAssets} unknown-size asset(s)` : 'all preload sizes known';
    const lastLoaded = snapshot.lastLoaded?.path ?? '—';
    const stats = snapshot.runtimeStats ?? {};
    const failedItems = snapshot.failedRecords.map((record) => `<li>${record.path}</li>`).join('');

    loadingReadout.innerHTML = `
      <p><strong>Assets:</strong> ${snapshot.completedAssets}/${snapshot.totalAssets} loaded · ${snapshot.failedAssets} failed</p>
      <p><strong>Bytes:</strong> ${formatBytes(snapshot.loadedBytes)} / ${totalText}</p>
      <p><strong>Size note:</strong> ${unknownNote}</p>
      <p><strong>Last loaded:</strong> <span>${lastLoaded}</span></p>
      <p><strong>Runtime hydrated:</strong> ${stats.runtimeLoadedAssets ?? 0} asset(s)</p>
      <p><strong>Parsed GLTF:</strong> ${stats.parsedGltfCount ?? 0}</p>
      <p><strong>Texture-loaded:</strong> ${stats.textureLoadedCount ?? 0}</p>
      <p><strong>Decoded images:</strong> ${stats.decodedImageCount ?? 0}</p>
      <p><strong>Shader compile / warm-up:</strong> ${stats.shaderCompileComplete ? 'yes' : 'no'} / ${stats.warmupFrameComplete ? 'yes' : 'no'}</p>
      <p><strong>Cache hits / misses:</strong> ${stats.cacheHits ?? 0} / ${stats.cacheMisses ?? 0}</p>
      ${snapshot.failedAssets > 0 ? `<p><strong>Failed:</strong></p><ul>${failedItems}</ul>` : ''}
    `;
  }

  if (loadingDiagnostics?.subscribe) {
    loadingDiagnostics.subscribe(renderLoadingReadout);
  } else {
    renderLoadingReadout();
  }

  bind(select(path(() => bg.debugBlendingMode, (v) => { bg.debugBlendingMode = v; }, 'material'), debugSection.body, 'debugBlendingMode', [
    { value: 'normal', label: 'Normal' },
    { value: 'additive', label: 'Additive' }
  ]));
  bind(checkbox(path(() => bg.showShellHelpers, (v) => { bg.showShellHelpers = v; }, 'helpers'), debugSection.body, 'showShellHelpers'));
  bind(checkbox(path(() => bg.showAtmosphereLogs, (v) => { bg.showAtmosphereLogs = v; }, 'runtime'), debugSection.body, 'showAtmosphereLogs'));

  const futureText = document.createElement('p');
  futureText.className = 'options-panel__placeholder';
  futureText.textContent = 'Reserved for: micro relics, mist shell, gate aura, camera tuning, labels/UI debug, lighting, motion.';
  futureSection.body.append(futureText);

  panel.append(presetSection.details, progressionSection.details, atmosphereSection.details, sunCycleSection.details, moonCycleSection.details, stoneSection.details, shellSection.details, smallGlyphSection.details, galaxySection.details, loadingSection.details, debugSection.details, futureSection.details);
  root.append(button, panel);
  document.body.append(root);

  function persistState() {
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify({
      version: OPTIONS_DEFAULTS_VERSION,
      runtimeState: { backgroundAtmosphere: deepClone(runtimeState.backgroundAtmosphere), sunCycle: deepClone(runtimeState.sunCycle), moonCycle: deepClone(runtimeState.moonCycle), galaxySprites: deepClone(runtimeState.galaxySprites) }
    }));
  }

  function renderAll() {
    binders.forEach((b) => b());
  }

  atmosphereProgression?.onStateChange(() => {
    renderAll();
  });

  let isOpen = false;
  function setOpen(next) {
    isOpen = next;
    panel.dataset.open = String(next);
    panel.setAttribute('aria-hidden', String(!next));
    button.setAttribute('aria-expanded', String(next));
  }

  button.addEventListener('click', () => setOpen(!isOpen));
  window.addEventListener('keydown', (event) => {
    if (isEditableTarget(event.target)) return;
    if (event.key === 'o' || event.key === 'O') {
      event.preventDefault();
      setOpen(!isOpen);
    }
    if (event.key === 'Escape' && isOpen) {
      setOpen(false);
    }
  });

  onChange({ type: 'rebuild' });
  persistState();
  renderAll();
  setOpen(false);

  return {
    setOpen,
    isOpen: () => isOpen,
    refresh: renderAll
  };
}
