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

  panel.append(atmosphereSection.details, debugSection.details, futureSection.details);
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
