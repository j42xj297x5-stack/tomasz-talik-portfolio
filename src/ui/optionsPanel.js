function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
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

export function createOptionsPanel({ runtimeState, onChange, onResetAtmosphere }) {
  const defaults = deepClone(runtimeState);

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
    onChange({ type: 'reset-all' });
    renderAll();
  });
  actions.append(resetAll);
  panel.append(actions);

  const atmosphereSection = createSection('Atmosphere', true);
  const stoneSection = createSection('Stone Relics', true);
  const shellSection = createSection('Shell Relics', true);
  const debugSection = createSection('Debug Visuals', true);
  const futureSection = createSection('Future / Reserved', false);

  const atmosphereReset = document.createElement('button');
  atmosphereReset.type = 'button';
  atmosphereReset.textContent = 'Reset atmosphere';
  atmosphereReset.className = 'options-panel__section-reset';
  atmosphereReset.addEventListener('click', () => {
    Object.assign(runtimeState.backgroundAtmosphere, deepClone(defaults.backgroundAtmosphere));
    onResetAtmosphere();
    renderAll();
  });
  atmosphereSection.body.append(atmosphereReset);

  const stoneRebuild = document.createElement('button');
  stoneRebuild.type = 'button';
  stoneRebuild.textContent = 'Rebuild Stone Relics';
  stoneRebuild.className = 'options-panel__section-reset';
  stoneRebuild.addEventListener('click', () => onChange({ type: 'stone-rebuild' }));
  stoneSection.body.append(stoneRebuild);
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
    onChange({ type: 'shell-rebuild' });
    renderAll();
  });
  shellSection.body.append(shellReset);

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
      const next = Number(nextRaw);
      if (Number.isNaN(next)) return;
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

  const path = (getter, setter, type) => ({
    get: getter,
    set: (value) => {
      setter(value);
      onChange({ type });
      renderAll();
    }
  });

  bind(checkbox(path(() => bg.enabled, (v) => { bg.enabled = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.enabled'));
  bind(checkbox(path(() => bg.debugVisible, (v) => { bg.debugVisible = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.debugVisible'));
  bind(range(path(() => bg.safeRadius, (v) => { bg.safeRadius = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.safeRadius', 0.5, 8, 0.1));
  bind(range(path(() => bg.shellInnerRadius, (v) => { bg.shellInnerRadius = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.shellInnerRadius', 1, 15, 0.1));
  bind(range(path(() => bg.shellOuterRadius, (v) => { bg.shellOuterRadius = v; }, 'rebuild'), atmosphereSection.body, 'backgroundAtmosphere.shellOuterRadius', 2, 20, 0.1));

  bind(checkbox(path(() => bg.dust.enabled, (v) => { bg.dust.enabled = v; }, 'rebuild'), atmosphereSection.body, 'dust.enabled'));
  bind(range(path(() => bg.dust.count, (v) => { bg.dust.count = Math.round(v); }, 'rebuild'), atmosphereSection.body, 'dust.count', 100, 4000, 50));
  bind(range(path(() => bg.dust.idleOpacity, (v) => { bg.dust.idleOpacity = v; }, 'material'), atmosphereSection.body, 'dust.idleOpacity', 0, 1, 0.01));
  bind(range(path(() => bg.dust.pointSize, (v) => { bg.dust.pointSize = v; }, 'material'), atmosphereSection.body, 'dust.pointSize', 0.005, 0.5, 0.005));
  bind(range(path(() => bg.dust.rotationSpeed, (v) => { bg.dust.rotationSpeed = v; }, 'runtime'), atmosphereSection.body, 'dust.rotationSpeed', 0, 0.08, 0.001));
  bind(color(path(() => bg.dust.color, (v) => { bg.dust.color = v; }, 'material'), atmosphereSection.body, 'dust.color'));
  bind(checkbox(path(() => bg.dust.sizeAttenuation, (v) => { bg.dust.sizeAttenuation = v; }, 'material'), atmosphereSection.body, 'dust.sizeAttenuation'));
  bind(checkbox(path(() => bg.dust.depthTest, (v) => { bg.dust.depthTest = v; }, 'material'), atmosphereSection.body, 'dust.depthTest'));
  const stone = bg.stoneRelics;
  bind(checkbox(path(() => stone.enabled, (v) => { stone.enabled = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.enabled'));
  bind(range(path(() => stone.count, (v) => { stone.count = Math.round(v); }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.count', 0, 60, 1));
  bind(range(path(() => stone.minScale, (v) => { stone.minScale = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.minScale', 0.01, 0.3, 0.005));
  bind(range(path(() => stone.maxScale, (v) => { stone.maxScale = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.maxScale', 0.02, 0.4, 0.005));
  bind(range(path(() => stone.shellInnerRadius, (v) => { stone.shellInnerRadius = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.shellInnerRadius', 1, 15, 0.1));
  bind(range(path(() => stone.shellOuterRadius, (v) => { stone.shellOuterRadius = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.shellOuterRadius', 2, 20, 0.1));
  bind(range(path(() => stone.rotationSpeedMin, (v) => { stone.rotationSpeedMin = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.rotationSpeedMin', 0, 0.06, 0.001));
  bind(range(path(() => stone.rotationSpeedMax, (v) => { stone.rotationSpeedMax = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.rotationSpeedMax', 0, 0.08, 0.001));
  bind(range(path(() => stone.orbitSpeed, (v) => { stone.orbitSpeed = v; }, 'stone-runtime'), stoneSection.body, 'stoneRelics.orbitSpeed', 0, 0.03, 0.001));
  bind(range(path(() => stone.opacity, (v) => { stone.opacity = v; }, 'material'), stoneSection.body, 'stoneRelics.opacity', 0, 1, 0.01));
  bind(checkbox(path(() => stone.debugVisible, (v) => { stone.debugVisible = v; }, 'stone-rebuild'), stoneSection.body, 'stoneRelics.debugVisible'));
  const shell = bg.shellRelics;
  bind(checkbox(path(() => shell.enabled, (v) => { shell.enabled = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.enabled'));
  bind(range(path(() => shell.count, (v) => { shell.count = Math.round(v); }, 'shell-rebuild'), shellSection.body, 'shellRelics.count', 0, 80, 1));
  bind(range(path(() => shell.minScale, (v) => { shell.minScale = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.minScale', 0.2, 8, 0.1));
  bind(range(path(() => shell.maxScale, (v) => { shell.maxScale = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.maxScale', 0.5, 10, 0.1));
  bind(range(path(() => shell.shellInnerRadius, (v) => { shell.shellInnerRadius = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.shellInnerRadius', 1, 15, 0.1));
  bind(range(path(() => shell.shellOuterRadius, (v) => { shell.shellOuterRadius = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.shellOuterRadius', 2, 20, 0.1));
  bind(range(path(() => shell.rotationSpeedMin, (v) => { shell.rotationSpeedMin = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.rotationSpeedMin', 0, 0.2, 0.001));
  bind(range(path(() => shell.rotationSpeedMax, (v) => { shell.rotationSpeedMax = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.rotationSpeedMax', 0, 0.3, 0.001));
  bind(range(path(() => shell.orbitSpeed, (v) => { shell.orbitSpeed = v; }, 'shell-runtime'), shellSection.body, 'shellRelics.orbitSpeed', 0, 0.08, 0.001));
  bind(range(path(() => shell.opacity, (v) => { shell.opacity = v; }, 'material'), shellSection.body, 'shellRelics.opacity', 0, 1, 0.01));
  bind(checkbox(path(() => shell.debugVisible, (v) => { shell.debugVisible = v; }, 'shell-rebuild'), shellSection.body, 'shellRelics.debugVisible'));


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

  panel.append(atmosphereSection.details, stoneSection.details, shellSection.details, debugSection.details, futureSection.details);
  root.append(button, panel);
  document.body.append(root);

  function renderAll() {
    binders.forEach((b) => b());
  }

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

  renderAll();
  setOpen(false);

  return {
    setOpen,
    isOpen: () => isOpen,
    refresh: renderAll
  };
}
