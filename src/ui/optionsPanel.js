import { normalizeExperience3dSettings, serializeExperience3dSettings, toRuntimeSettings } from '../config/experience3dSettings.js';

const STRUCTURAL_DEBOUNCE_MS = 140;

const clone = (value) => JSON.parse(JSON.stringify(value));
function merge(target, source) {
  Object.entries(source ?? {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && target[key]) merge(target[key], value);
    else target[key] = value;
  });
}

function section(title, open = false) {
  const details = document.createElement('details');
  details.className = 'options-panel__section';
  details.open = open;
  const summary = document.createElement('summary');
  summary.textContent = title;
  const body = document.createElement('div');
  body.className = 'options-panel__section-body';
  details.append(summary, body);
  return { details, body };
}

function row(parent, label, control) {
  const element = document.createElement('label');
  element.className = 'options-panel__row';
  const name = document.createElement('span');
  name.className = 'options-panel__label';
  name.textContent = label;
  const holder = document.createElement('span');
  holder.className = 'options-panel__control';
  holder.append(control);
  element.append(name, holder);
  parent.append(element);
}

export function createOptionsPanel({ runtimeState, onChange, onSettingsImported = null, atmosphereProgression, getPerformanceSnapshot = null, getTuningMode = () => false }) {
  const defaults = clone(runtimeState);
  const controls = [];
  const timers = new Map();
  let tuningMode = getTuningMode();

  const root = document.createElement('aside');
  root.className = 'options-panel';
  const toggle = document.createElement('button');
  toggle.className = 'options-panel__toggle';
  toggle.type = 'button';
  toggle.textContent = 'Scene tuning';
  const panel = document.createElement('div');
  panel.className = 'options-panel__panel';
  panel.dataset.open = 'false';
  const header = document.createElement('header');
  header.className = 'options-panel__header';
  header.innerHTML = '<h2>Experience 3D</h2><p>World composition controls</p>';
  panel.append(header);
  toggle.addEventListener('click', () => { panel.dataset.open = panel.dataset.open === 'true' ? 'false' : 'true'; });

  function emit(owner, action, value, debounce = false) {
    const send = () => onChange({ owner, action, value });
    if (!debounce) return send();
    const key = `${owner}:${action}`;
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(send, STRUCTURAL_DEBOUNCE_MS));
  }

  function checkbox(parent, label, getter, setter, owner, action) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(getter());
    input.addEventListener('change', () => { setter(input.checked); emit(owner, action, input.checked); });
    controls.push(() => { input.checked = Boolean(getter()); });
    row(parent, label, input);
  }

  function range(parent, label, getter, setter, owner, action, min, max, step, debounce = false, afterChange = null) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = getter();
    input.title = String(getter());
    input.addEventListener('input', () => {
      setter(Number(input.value));
      input.title = input.value;
      afterChange?.();
      emit(owner, action, undefined, debounce);
    });
    controls.push(() => { input.value = getter(); input.title = String(getter()); });
    row(parent, label, input);
    return input;
  }

  function readout(parent, text) {
    const output = document.createElement('p');
    output.className = 'options-panel__placeholder';
    output.textContent = text;
    parent.append(output);
    return output;
  }

  function resetButton(parent, reset, owner, action) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'options-panel__section-reset'; button.textContent = 'Reset section';
    button.addEventListener('click', () => { reset(); controls.forEach((sync) => sync()); emit(owner, action); });
    parent.append(button);
  }

  function pairedRanges(parent, config, names, labels, limits, owner, action) {
    const output = readout(parent, '');
    const syncOutput = () => { output.textContent = `${labels.title}: ${config[names.min]}–${config[names.max]}`; };
    let maxInput;
    const minInput = range(parent, labels.min, () => config[names.min], (value) => {
      config[names.min] = value;
      if (value > config[names.max]) { config[names.max] = value; if (maxInput) maxInput.value = value; }
    }, owner, action, ...limits, true, syncOutput);
    maxInput = range(parent, labels.max, () => config[names.max], (value) => {
      config[names.max] = value;
      if (value < config[names.min]) { config[names.min] = value; minInput.value = value; }
    }, owner, action, ...limits, true, syncOutput);
    syncOutput();
    controls.push(syncOutput);
  }

  const tuning = section('Tuning', true);
  checkbox(tuning.body, 'Tuning mode — show all adjustable layers', () => tuningMode, (value) => { tuningMode = value; }, 'progression', 'tuning-mode');
  readout(tuning.body, 'Tuning mode ignores world progression visibility.');
  const resetProgression = document.createElement('button');
  resetProgression.type = 'button'; resetProgression.className = 'options-panel__section-reset'; resetProgression.textContent = 'Reset progression';
  resetProgression.addEventListener('click', () => { atmosphereProgression?.resetProgression?.(); emit('progression', 'state-change'); });
  tuning.body.append(resetProgression);
  panel.append(tuning.details);

  const relicSections = [
    ['Stones', 'stoneRelics', 'stone'],
    ['Shells', 'shellRelics', 'shell'],
    ['Small Glyphs', 'smallGlyphRelics', 'small-glyph']
  ];
  relicSections.forEach(([title, key, actionPrefix]) => {
    const current = runtimeState.backgroundAtmosphere[key];
    const group = section(title);
    checkbox(group.body, 'Enabled', () => current.enabled, (v) => { current.enabled = v; }, 'atmosphere', `${actionPrefix}-runtime`);
    range(group.body, 'Count', () => current.count, (v) => { current.count = Math.round(v); }, 'atmosphere', `${actionPrefix}-rebuild`, 0, 200, 1, true);
    pairedRanges(group.body, current, { min: 'minScale', max: 'maxScale' }, { min: 'Minimum size', max: 'Maximum size', title: 'Size range' }, [0.01, 10, 0.01], 'atmosphere', `${actionPrefix}-rebuild`);
    pairedRanges(group.body, current, { min: 'shellInnerRadius', max: 'shellOuterRadius' }, { min: 'Inner radius', max: 'Outer radius', title: 'Radius range' }, [0, 40, 0.1], 'atmosphere', `${actionPrefix}-rebuild`);
    range(group.body, 'Orbit speed', () => current.orbitSpeed, (v) => { current.orbitSpeed = v; }, 'atmosphere', `${actionPrefix}-runtime`, 0, 0.15, 0.001);
    range(group.body, 'Self rotation speed', () => current.selfRotationSpeedMultiplier, (v) => { current.selfRotationSpeedMultiplier = v; }, 'atmosphere', `${actionPrefix}-runtime`, 0, 5, 0.01);
    range(group.body, 'Opacity', () => current.opacity, (v) => { current.opacity = v; }, 'atmosphere', `${actionPrefix}-runtime`, 0, 1, 0.01);
    resetButton(group.body, () => Object.assign(current, clone(defaults.backgroundAtmosphere[key])), 'atmosphere', `${actionPrefix}-rebuild`);
    panel.append(group.details);
  });

  const dust = runtimeState.backgroundAtmosphere.dust;
  const dustSection = section('Dust / Stars');
  checkbox(dustSection.body, 'Enabled', () => dust.enabled, (v) => { dust.enabled = v; }, 'atmosphere', 'dust-rebuild');
  range(dustSection.body, 'Count', () => dust.count, (v) => { dust.count = Math.round(v); }, 'atmosphere', 'dust-rebuild', 0, 10000, 100, true);
  pairedRanges(dustSection.body, dust, { min: 'innerRadius', max: 'outerRadius' }, { min: 'Inner radius', max: 'Outer radius', title: 'Radius range' }, [0, 50, 0.1], 'atmosphere', 'dust-rebuild');
  range(dustSection.body, 'Point size', () => dust.pointSize, (v) => { dust.pointSize = v; }, 'atmosphere', 'dust-runtime', 0.001, 0.3, 0.001);
  range(dustSection.body, 'Orbit speed', () => dust.rotationSpeed, (v) => { dust.rotationSpeed = v; }, 'atmosphere', 'dust-runtime', 0, 0.1, 0.001);
  range(dustSection.body, 'Opacity', () => dust.idleOpacity, (v) => { dust.idleOpacity = v; }, 'atmosphere', 'dust-runtime', 0, 1, 0.01);
  resetButton(dustSection.body, () => Object.assign(dust, clone(defaults.backgroundAtmosphere.dust)), 'atmosphere', 'dust-rebuild');
  panel.append(dustSection.details);

  const galaxy = runtimeState.galaxySprites;
  const galaxySection = section('Galaxies');
  checkbox(galaxySection.body, 'Enabled', () => galaxy.enabled, (v) => { galaxy.enabled = v; }, 'galaxies', 'runtime');
  range(galaxySection.body, 'Radius', () => galaxy.radius, (v) => { galaxy.radius = v; }, 'galaxies', 'runtime', 1, 90, 0.1);
  pairedRanges(galaxySection.body, galaxy, { min: 'minScale', max: 'maxScale' }, { min: 'Minimum size', max: 'Maximum size', title: 'Size range' }, [0.01, 16, 0.01], 'galaxies', 'rebuild');
  range(galaxySection.body, 'Orbit speed', () => galaxy.orbitSpeed, (v) => { galaxy.orbitSpeed = v; }, 'galaxies', 'runtime', -0.1, 0.1, 0.001);
  range(galaxySection.body, 'Self rotation speed', () => galaxy.selfRotationSpeed, (v) => { galaxy.selfRotationSpeed = v; }, 'galaxies', 'runtime', -1, 1, 0.001);
  range(galaxySection.body, 'Opacity', () => galaxy.opacity, (v) => { galaxy.opacity = v; }, 'galaxies', 'runtime', 0, 1, 0.01);
  resetButton(galaxySection.body, () => Object.assign(galaxy, clone(defaults.galaxySprites)), 'galaxies', 'rebuild');
  panel.append(galaxySection.details);

  const fog = runtimeState.fog;
  const fogSection = section('Fog');
  checkbox(fogSection.body, 'Enabled', () => fog.enabled, (v) => { fog.enabled = v; }, 'scene', 'fog');
  let fogFarInput;
  const fogNearInput = range(fogSection.body, 'Start distance', () => fog.near, (v) => {
    fog.near = v;
    if (fog.near >= fog.far) { fog.far = fog.near + 0.1; if (fogFarInput) fogFarInput.value = fog.far; }
  }, 'scene', 'fog', 0, 100, 0.1);
  fogFarInput = range(fogSection.body, 'End distance', () => fog.far, (v) => {
    fog.far = v;
    if (fog.far <= fog.near) { fog.near = Math.max(0, fog.far - 0.1); fogNearInput.value = fog.near; }
  }, 'scene', 'fog', 0.1, 150, 0.1);
  resetButton(fogSection.body, () => Object.assign(fog, clone(defaults.fog)), 'scene', 'fog');
  panel.append(fogSection.details);

  function celestial(title, key, owner, hasOrbitSpeed) {
    const config = runtimeState[key]; const group = section(title);
    checkbox(group.body, 'Enabled', () => config.enabled, (v) => { config.enabled = v; }, owner, 'apply');
    range(group.body, 'Orbit radius', () => config.radius, (v) => { config.radius = v; }, owner, 'apply', 1, 30, 0.1);
    if (hasOrbitSpeed) range(group.body, 'Orbit speed', () => config.angularSpeed, (v) => { config.angularSpeed = v; }, owner, 'apply', 0, 1, 0.001);
    range(group.body, 'Scale', () => config.scale, (v) => { config.scale = v; }, owner, 'apply', 0.05, 10, 0.01);
    range(group.body, 'Self rotation', () => config.selfRotationSpeed, (v) => { config.selfRotationSpeed = v; }, owner, 'apply', 0, 1, 0.001);
    range(group.body, 'Light intensity', () => config.spotlight.intensity, (v) => { config.spotlight.intensity = v; }, owner, 'apply', 0, 20, 0.1);
    range(group.body, 'Light angle', () => config.spotlight.angleDegrees, (v) => { config.spotlight.angleDegrees = v; }, owner, 'apply', 1, 120, 1);
    range(group.body, 'Fade duration', () => config.spotlight.fadeDurationSeconds, (v) => { config.spotlight.fadeDurationSeconds = v; }, owner, 'apply', 0, 10, 0.1);
    resetButton(group.body, () => Object.assign(config, clone(defaults[key])), owner, 'apply');
    panel.append(group.details);
  }
  celestial('Sun', 'sunCycle', 'sun', true);
  celestial('Moon', 'moonCycle', 'moon', false);

  const performance = section('Performance');
  const performanceText = readout(performance.body, 'Performance data is collecting…');
  panel.append(performance.details);
  const performanceTimer = setInterval(() => {
    const snapshot = getPerformanceSnapshot?.(); if (!snapshot) return;
    const r = snapshot.renderer ?? {}; const built = snapshot.builtObjects ?? {}; const visibility = snapshot.layerVisibility ?? {};
    performanceText.textContent = `FPS ${snapshot.averageFps} · avg ${snapshot.averageFrameMs}ms · p95 ${snapshot.p95FrameMs}ms\nDraw calls ${r.calls} · triangles ${r.triangles} · geometries ${r.geometries} · textures ${r.textures} · programs ${r.programs ?? 'n/a'}\nBuilt: ${JSON.stringify(built)}\nVisible: ${JSON.stringify(visibility)}`;
  }, 1250);

  const transfer = section('Import / Export');
  const exportButton = document.createElement('button');
  exportButton.type = 'button'; exportButton.className = 'options-panel__section-reset'; exportButton.textContent = 'Export scene settings';
  exportButton.addEventListener('click', () => {
    const blob = new Blob([`${JSON.stringify(serializeExperience3dSettings(runtimeState), null, 2)}\n`], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'experience3d-settings.json'; link.click(); URL.revokeObjectURL(link.href);
  });
  const importInput = document.createElement('input'); importInput.type = 'file'; importInput.accept = 'application/json'; importInput.hidden = true;
  importInput.addEventListener('change', async () => {
    const parsed = JSON.parse(await importInput.files[0].text());
    if (parsed?.schemaVersion !== 1) throw new Error('Unsupported Experience 3D settings schema.');
    merge(runtimeState, toRuntimeSettings(normalizeExperience3dSettings(parsed)));
    controls.forEach((sync) => sync());
    onChange({ owner: 'atmosphere', action: 'full-rebuild' }); onChange({ owner: 'galaxies', action: 'rebuild' }); onChange({ owner: 'scene', action: 'fog' }); onChange({ owner: 'sun', action: 'apply' }); onChange({ owner: 'moon', action: 'apply' });
    onSettingsImported?.();
    importInput.value = '';
  });
  const importButton = document.createElement('button');
  importButton.type = 'button'; importButton.className = 'options-panel__section-reset'; importButton.textContent = 'Import scene settings'; importButton.addEventListener('click', () => importInput.click());
  transfer.body.append(exportButton, importButton, importInput); panel.append(transfer.details);

  root.append(toggle, panel); document.body.append(root);
  return { destroy() { clearInterval(performanceTimer); timers.forEach(clearTimeout); root.remove(); } };
}
