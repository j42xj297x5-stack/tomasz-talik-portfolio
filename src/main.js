import './styles/main.css';
import { startClassic2D } from './classic2d.js';
import { audioManager } from './audio/audioManager.js';
import { createAudioControl } from './ui/audioControl.js';
import { detectVrCapability } from './xr/vrCapability.js';
import { createVrDebugPreloadGate } from './xr/debug/createVrDebugPreloadGate.js';
import { setVrDebugLaunchConfig } from './xr/debug/vrDebugLaunchConfig.js';
import { publicPath } from './utils/publicPath.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const STORAGE_KEY = 'portfolioEntrySelection';

const COPY = {
  pl: {
    languageName: 'Polski',
    introEyebrow: 'Portfolio Tomasza Talika',
    languageTitle: 'Wybierz język',
    languageText: 'Najpierw wybierz język interfejsu wejściowego.',
    modeEyebrow: 'Tryb doświadczenia',
    modeTitle: 'Wybierz tryb',
    modeTextBefore: 'Wybierz lekkie portfolio 2D, doświadczenie 3D albo osobny tryb VR dla ',
    supportedHeadsets: 'obsługiwanych gogli',
    modeTextAfter: '.',
    vrCompatibility: {
      title: 'Orange Monkey VR — zgodność',
      intro: 'Orange Monkey VR to osobny tryb WebXR przeznaczony dla gogli obsługujących immersyjną rzeczywistość w przeglądarce.',
      minimumLabel: 'Minimum referencyjne',
      primaryItem: 'Meta Quest 3S — Snapdragon XR2 Gen 2, 8 GB RAM',
      comparableLabel: 'Sprzęt porównywalny',
      comparableItems: ['Meta Quest 3', 'PICO 4 Ultra*'],
      testedLabel: 'Przetestowano',
      testedText: 'Meta Quest 3S, w natywnej przeglądarce gogli.',
      desktopLabel: 'Tryb PC VR / streaming',
      desktopText: 'Możesz również uruchomić Orange Monkey VR przez Virtual Desktop i przeglądarkę Chrome z włączonym przyspieszeniem sprzętowym.',
      note: '* Zgodność PICO 4 Ultra nie została zweryfikowana w tym projekcie.',
      performanceNote: 'Wyższa rozdzielczość renderowania, niestandardowe ustawienia lub streaming mogą wpływać na wydajność.',
      close: 'Zamknij'
    },
    classicTitle: 'Klasyczne 2D',
    classicDescription: 'Lekka, płaska, retro-symboliczna wersja portfolio z pięcioma bramami treści.',
    classicButton: 'Klasyczne 2D',
    experienceButton: 'Doświadczenie 3D',
    vrButton: 'Orange Monkey VR',
    vrChecking: 'Sprawdzanie obsługi WebXR…',
    vrUnavailable: 'Tryb immersive VR nie jest dostępny na tym urządzeniu.',
    vrSecureContext: 'VR wymaga bezpiecznego połączenia HTTPS.',
    vrLaunchStatus: 'Przygotowywanie Orange Monkey VR…',
    placeholderBack: 'Wróć do wyboru trybu',
    launchStatus: 'Uruchamianie doświadczenia 3D…'
  },
  en: {
    languageName: 'English',
    introEyebrow: 'Tomasz Talik Portfolio',
    languageTitle: 'Choose language / Wybierz język',
    languageText: 'Select the language for this entry flow. Wybierz język interfejsu wejściowego.',
    modeEyebrow: 'Experience mode',
    modeTitle: 'Choose mode',
    modeTextBefore: 'Choose the lightweight 2D portfolio, a 3D experience, or a separate VR mode for ',
    supportedHeadsets: 'supported headsets',
    modeTextAfter: '.',
    vrCompatibility: {
      title: 'Orange Monkey VR — compatibility',
      intro: 'Orange Monkey VR is a separate WebXR mode intended for headsets that support immersive VR in the browser.',
      minimumLabel: 'Reference minimum',
      primaryItem: 'Meta Quest 3S — Snapdragon XR2 Gen 2, 8 GB RAM',
      comparableLabel: 'Comparable hardware',
      comparableItems: ['Meta Quest 3', 'PICO 4 Ultra*'],
      testedLabel: 'Tested on',
      testedText: 'Meta Quest 3S in the headset’s native browser.',
      desktopLabel: 'PC VR / streaming mode',
      desktopText: 'You can also run Orange Monkey VR through Virtual Desktop and Google Chrome with hardware acceleration enabled.',
      note: '* Compatibility with PICO 4 Ultra has not been verified for this project.',
      performanceNote: 'Higher render resolution, custom settings or streaming may affect performance.',
      close: 'Close'
    },
    classicTitle: 'Classic 2D',
    classicDescription: 'A lightweight, flat, retro-symbolic version of the portfolio with five content gates.',
    classicButton: 'Classic 2D',
    experienceButton: 'Experience 3D',
    vrButton: 'Orange Monkey VR',
    vrChecking: 'Checking WebXR support…',
    vrUnavailable: 'Immersive VR is not available on this device.',
    vrSecureContext: 'VR requires a secure HTTPS connection.',
    vrLaunchStatus: 'Preparing Orange Monkey VR…',
    placeholderBack: 'Back to mode selection',
    launchStatus: 'Starting Experience 3D…'
  }
};

const state = {
  language: null,
  mode: null,
  runtimeStarted: false
};

const audioControl = createAudioControl({ audioManager, getLanguage: () => state.language || document.documentElement.lang });
const vrCapabilityPromise = detectVrCapability();
void audioManager.preloadEntryEffects();

document.addEventListener('click', (event) => {
  const clickTarget = event.target.closest?.('button, .overlay__project-link');
  if (!clickTarget || clickTarget.closest('[data-audio-control]')) return;
  if (clickTarget.matches('button') && (clickTarget.disabled || clickTarget.getAttribute('aria-disabled') === 'true')) return;
  const caseToggle = clickTarget.closest('.overlay__case-toggle, [data-classic-case-toggle]');
  if (caseToggle) {
    void audioManager.playCaseToggle(caseToggle.getAttribute('aria-expanded') === 'true');
    return;
  }
  void audioManager.playEffect('click');
});

function loadStoredSelection() {
  try {
    const rawSelection = window.localStorage?.getItem(STORAGE_KEY);
    if (!rawSelection) return;

    const parsedSelection = JSON.parse(rawSelection);
    if (parsedSelection?.language === 'pl' || parsedSelection?.language === 'en') {
      state.language = parsedSelection.language;
    }
  } catch (error) {
    console.warn('[entry] Stored entry selection could not be read.', error);
  }
}

function saveSelection() {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({
      language: state.language,
      mode: state.mode
    }));
  } catch (error) {
    console.warn('[entry] Entry selection could not be saved.', error);
  }
}

function setLanguage(language) {
  state.language = language;
  state.mode = null;
  document.documentElement.lang = language;
  audioControl.refresh();
  saveSelection();
  renderModeSelection();
}

function renderEntryShell(content, modifier = '') {
  app.innerHTML = `
    <main class="entry-shell ${modifier}" aria-live="polite">
      <section class="entry-shell__panel" aria-labelledby="entry-title">
        <div class="entry-shell__sigil" aria-hidden="true"></div>
        ${content}
      </section>
    </main>
  `;
}

function createChoiceButton({ label, value, onClick, modifier = '', disabled = false }) {
  const button = document.createElement('button');
  button.className = `entry-choice ${modifier}`.trim();
  button.type = 'button';
  button.dataset.value = value;
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function renderLanguageSelection() {
  const copy = COPY.en;
  renderEntryShell(`
    <p class="entry-shell__eyebrow">${copy.introEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.languageTitle}</h1>
    <p class="entry-shell__text">${copy.languageText}</p>
    <div class="entry-shell__choices" data-entry-choices></div>
  `);

  const choices = app.querySelector('[data-entry-choices]');
  choices.append(
    createChoiceButton({ label: COPY.pl.languageName, value: 'pl', onClick: () => setLanguage('pl') }),
    createChoiceButton({ label: COPY.en.languageName, value: 'en', onClick: () => setLanguage('en') })
  );
}

function renderModeSelection() {
  if (!state.language) {
    renderLanguageSelection();
    return;
  }

  const copy = COPY[state.language];
  const backLanguage = state.language === 'pl' ? 'en' : 'pl';
  const backLabel = state.language === 'pl' ? 'Back to language selection' : 'Wróć do wyboru języka';
  renderEntryShell(`
    <img class="entry-shell__mode-logo" src="${publicPath('/png/orange_monkey.webp')}" alt="Orange Monkey">
    <p class="entry-shell__eyebrow">${copy.modeEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.modeTitle}</h1>
    <p class="entry-shell__text">${copy.modeTextBefore}<button class="entry-shell__inline-link" type="button" data-vr-compatibility-trigger>${copy.supportedHeadsets}</button>${copy.modeTextAfter}</p>
    <div class="entry-shell__choices" data-entry-choices></div>
    <button class="entry-shell__back" type="button" data-entry-back lang="${backLanguage}">${backLabel}</button>
  `, 'entry-shell--mode');

  const choices = app.querySelector('[data-entry-choices]');
  choices.append(
    createChoiceButton({
      label: copy.classicButton,
      value: 'classic-2d',
      onClick: () => {
        state.mode = 'classic-2d';
        saveSelection();
        renderClassic2D();
      }
    }),
    createChoiceButton({
      label: copy.experienceButton,
      value: 'experience-3d',
      modifier: 'entry-choice--primary',
      onClick: startExperience3d
    }),
    createChoiceButton({
      label: copy.vrButton,
      value: 'experience-vr',
      modifier: 'entry-choice--vr',
      disabled: true,
      onClick: startExperienceVr
    })
  );

  const vrButton = choices.querySelector('[data-value="experience-vr"]');
  const vrStatus = document.createElement('p');
  vrStatus.className = 'entry-choice__status';
  vrStatus.dataset.vrCapabilityStatus = '';
  vrStatus.textContent = copy.vrChecking;
  vrButton.insertAdjacentElement('afterend', vrStatus);
  void vrCapabilityPromise.then((capability) => {
    if (!vrButton.isConnected || state.runtimeStarted) return;
    vrButton.disabled = !capability.supported;
    vrStatus.textContent = capability.supported
      ? ''
      : capability.reason === 'insecure-context' ? copy.vrSecureContext : copy.vrUnavailable;
    vrStatus.hidden = capability.supported;
  });

  app.querySelector('[data-entry-back]').addEventListener('click', () => {
    state.language = null;
    state.mode = null;
    saveSelection();
    renderLanguageSelection();
  });

  app.querySelector('[data-vr-compatibility-trigger]').addEventListener('click', openVrCompatibility);
}

function openVrCompatibility(event) {
  const trigger = event.currentTarget;
  const copy = COPY[state.language].vrCompatibility;
  const layer = document.createElement('div');
  layer.className = 'vr-compatibility';
  layer.innerHTML = `
    <section class="vr-compatibility__card" role="dialog" aria-modal="true" aria-labelledby="vr-compatibility-title">
      <button class="vr-compatibility__close" type="button" data-vr-compatibility-close aria-label="${copy.close}">×</button>
      <img class="vr-compatibility__logo" src="${publicPath('/png/orange_monkey.webp')}" alt="">
      <h2 class="vr-compatibility__title" id="vr-compatibility-title">${copy.title}</h2>
      <p class="vr-compatibility__intro">${copy.intro}</p>
      <div class="vr-compatibility__section">
        <h3>${copy.minimumLabel}</h3>
        <p>${copy.primaryItem}</p>
        <h3>${copy.comparableLabel}</h3>
        <ul>${copy.comparableItems.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div class="vr-compatibility__section">
        <h3>${copy.testedLabel}</h3>
        <p>${copy.testedText}</p>
        <h3>${copy.desktopLabel}</h3>
        <p>${copy.desktopText}</p>
      </div>
      <p class="vr-compatibility__note">${copy.note}</p>
      <p class="vr-compatibility__note">${copy.performanceNote}</p>
      <button class="entry-choice vr-compatibility__action" type="button" data-vr-compatibility-close>${copy.close}</button>
    </section>
  `;

  function close() {
    document.removeEventListener('keydown', handleKeydown);
    layer.remove();
    trigger.focus();
  }

  function handleKeydown(keyEvent) {
    if (keyEvent.key === 'Escape') close();
  }

  layer.addEventListener('click', (clickEvent) => {
    if (clickEvent.target === layer || clickEvent.target.closest('[data-vr-compatibility-close]')) close();
  });
  document.addEventListener('keydown', handleKeydown);
  app.append(layer);
  layer.querySelector('[data-vr-compatibility-close]').focus();
}

function renderClassic2D() {
  document.documentElement.lang = state.language || 'en';
  startClassic2D({
    container: app,
    language: state.language || 'en',
    onBackToModes: renderModeSelection
  });
}

async function startExperience3d() {
  if (state.runtimeStarted) return;

  state.mode = 'experience-3d';
  state.runtimeStarted = true;
  document.documentElement.lang = state.language || 'en';
  saveSelection();

  const copy = COPY[state.language || 'en'];
  renderEntryShell(`
    <p class="entry-shell__eyebrow">${copy.modeEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.experienceButton}</h1>
    <p class="entry-shell__text">${copy.launchStatus}</p>
  `);

  void audioManager.unlock();
  audioManager.prepareExperienceAudio();
  void audioManager.preloadExperienceEffects();
  await import('./experience3d.js');
}

async function startExperienceVr() {
  if (state.runtimeStarted) return;

  const capability = await vrCapabilityPromise;
  if (!capability.supported) return;

  state.mode = 'experience-vr';
  state.runtimeStarted = true;
  document.documentElement.lang = state.language || 'en';
  saveSelection();

  const copy = COPY[state.language || 'en'];
  const debugMode = new URLSearchParams(window.location.search).has('debug');
  const launchConfig = debugMode
    ? await createVrDebugPreloadGate({ root: app, language: state.language || 'en' })
    : { debugMode: false, recording: { enabled: false, scopes: [] } };
  setVrDebugLaunchConfig(launchConfig);

  renderEntryShell(`
    <h1 class="vr-launch__brand" id="entry-title">
      <img class="vr-launch__brand-logo" src="${publicPath('/png/orange_monkey.webp')}" alt="">
      <span class="vr-launch__wordmark-main">ORANGE MONKEY</span>
      <span class="vr-launch__wordmark-vr">VR</span>
    </h1>
    <p class="vr-launch__status">${copy.vrLaunchStatus}</p>
  `, 'entry-shell--vr-launch');

  const launchOverlay = app.firstElementChild;
  launchOverlay.classList.add('vr-launch-overlay');
  document.body.append(launchOverlay);

  let minimumExposureTimer;
  const minimumExposure = new Promise((resolve) => {
    minimumExposureTimer = window.setTimeout(resolve, 2000);
  });
  let resolveStartScreenMounted;
  const startScreenMounted = new Promise((resolve) => { resolveStartScreenMounted = resolve; });
  const handleStartScreenMounted = () => resolveStartScreenMounted();
  window.addEventListener('orange-monkey-vr:start-screen-mounted', handleStartScreenMounted, { once: true });

  const runtimeImport = import('./experienceVr.js');
  try {
    await Promise.all([
      minimumExposure,
      Promise.race([
        startScreenMounted,
        runtimeImport.then(() => {
          throw new Error('Orange Monkey VR initialized without mounting its start screen.');
        })
      ])
    ]);
    launchOverlay.remove();
  } catch (error) {
    launchOverlay.remove();
    throw error;
  } finally {
    window.clearTimeout(minimumExposureTimer);
    window.removeEventListener('orange-monkey-vr:start-screen-mounted', handleStartScreenMounted);
  }

  await runtimeImport;
}

loadStoredSelection();

if (state.language) {
  document.documentElement.lang = state.language;
  renderModeSelection();
} else {
  renderLanguageSelection();
}
