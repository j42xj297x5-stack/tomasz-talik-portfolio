import './styles/main.css';
import { startClassic2D } from './classic2d.js';
import { audioManager } from './audio/audioManager.js';
import { createAudioControl } from './ui/audioControl.js';
import { detectVrCapability } from './xr/vrCapability.js';
import { createVrDebugPreloadGate } from './xr/debug/createVrDebugPreloadGate.js';
import { setVrDebugLaunchConfig } from './xr/debug/vrDebugLaunchConfig.js';

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
    modeText: 'Wybierz lekkie portfolio 2D, doświadczenie 3D albo osobny tryb VR dla obsługiwanych gogli.',
    classicTitle: 'Klasyczne 2D',
    classicDescription: 'Lekka, płaska, retro-symboliczna wersja portfolio z pięcioma bramami treści.',
    classicButton: 'Klasyczne 2D',
    experienceButton: 'Doświadczenie 3D',
    vrButton: 'Doświadczenie VR',
    vrChecking: 'Sprawdzanie obsługi WebXR…',
    vrUnavailable: 'Tryb immersive VR nie jest dostępny na tym urządzeniu.',
    vrSecureContext: 'VR wymaga bezpiecznego połączenia HTTPS.',
    vrLaunchStatus: 'Przygotowywanie doświadczenia VR…',
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
    modeText: 'Choose the lightweight 2D portfolio, the 3D experience, or the separate VR mode on supported headsets.',
    classicTitle: 'Classic 2D',
    classicDescription: 'A lightweight, flat, retro-symbolic version of the portfolio with five content gates.',
    classicButton: 'Classic 2D',
    experienceButton: 'Experience 3D',
    vrButton: 'Experience VR',
    vrChecking: 'Checking WebXR support…',
    vrUnavailable: 'Immersive VR is not available on this device.',
    vrSecureContext: 'VR requires a secure HTTPS connection.',
    vrLaunchStatus: 'Preparing Experience VR…',
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

function renderEntryShell(content) {
  app.innerHTML = `
    <main class="entry-shell" aria-live="polite">
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
    <p class="entry-shell__eyebrow">${copy.modeEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.modeTitle}</h1>
    <p class="entry-shell__text">${copy.modeText}</p>
    <div class="entry-shell__choices" data-entry-choices></div>
    <button class="entry-shell__back" type="button" data-entry-back lang="${backLanguage}">${backLabel}</button>
  `);

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
    <p class="entry-shell__eyebrow">${copy.modeEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.vrButton}</h1>
    <p class="entry-shell__text">${copy.vrLaunchStatus}</p>
  `);

  await import('./experienceVr.js');
}

loadStoredSelection();

if (state.language) {
  document.documentElement.lang = state.language;
  renderModeSelection();
} else {
  renderLanguageSelection();
}
